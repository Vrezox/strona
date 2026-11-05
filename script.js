
"use strict";

/* ==========================================
   INICJALIZACJA STRONY
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

  initBackToTop();
  initPrivacyPopup();
  initOpinie();

});


/* ==========================================
   PRZYCISK POWROTU NA GÓRĘ
   ========================================== */

function initBackToTop() {

  const button = document.getElementById("backToTop");

  if (!button) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  function updateVisibility() {
    button.classList.toggle("show", window.scrollY > 300);
  }

  window.addEventListener("scroll", updateVisibility, {
    passive: true
  });

  updateVisibility();

  button.addEventListener("click", () => {

    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });

  });

}


/* ==========================================
   KOMUNIKAT PRYWATNOŚCI
   ========================================== */

function initPrivacyPopup() {

  const popup = document.getElementById("privacyPopup");
  const button = document.getElementById("privacyAccept");

  if (!popup || !button) return;

  const storageKey = "privacyNoticeAccepted";

  let accepted = false;

  try {

    accepted = localStorage.getItem(storageKey) === "true";

  } catch (error) {

    console.warn("Pamięć lokalna jest niedostępna.");

  }

  if (!accepted) {
    popup.classList.add("is-visible");
  }

  button.addEventListener("click", () => {

    try {

      localStorage.setItem(storageKey, "true");

    } catch (error) {

      console.warn("Nie udało się zapisać ustawienia.");

    }

    popup.classList.remove("is-visible");

  });

}


/* ==========================================
   KARUZELA OPINII
   ========================================== */

async function initOpinie() {

  const track = document.getElementById("opinie-track");

  if (!track) return;

  const karuzela = track.closest(".opinie-karuzela");

  if (!karuzela) return;


  // Obsługa przycisku Pauza / Wznów

  const przyciskPauzy = document.getElementById("opinie-pauza");

  if (przyciskPauzy) {

    przyciskPauzy.addEventListener("click", () => {

      const zatrzymana = track.classList.toggle("is-paused");

      przyciskPauzy.setAttribute(
        "aria-pressed",
        String(zatrzymana)
      );

      const tekst = przyciskPauzy.querySelector(
        ".opinie-pauza-tekst"
      );

      const ikona = przyciskPauzy.querySelector(
        '[aria-hidden="true"]'
      );

      if (tekst) {
        tekst.textContent = zatrzymana
          ? "Wznów przewijanie"
          : "Zatrzymaj przewijanie";
      }

      if (ikona) {
        ikona.textContent = zatrzymana ? "▶" : "⏸";
      }

    });

  }


  // Sprawdzamy preferencje użytkownika i szerokość ekranu

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  const mobileView = window.matchMedia(
    "(max-width: 768px)"
  );


  try {

    // Pobieramy opinie z pliku JSON

    const response = await fetch("./opinie.json", {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać opinie.json");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Plik JSON musi zawierać tablicę.");
    }


    // Sprawdzamy poprawność danych
    // Dopuszczamy również opinie bez komentarza

    const opinie = data.filter(opinia => {

      return (
        opinia &&
        typeof opinia.autor === "string" &&
        opinia.autor.trim() !== "" &&
        typeof opinia.tresc === "string" &&
        Number.isInteger(opinia.ocena) &&
        opinia.ocena >= 1 &&
        opinia.ocena <= 5
      );

    });

// NOWE: Sortowanie opinii od najnowszej do najstarszej

opinie.sort((a, b) => {
  return (b.data || "").localeCompare(a.data || "");
});


    // Brak poprawnych opinii

    if (opinie.length === 0) {

      track.textContent = "Brak opinii do wyświetlenia.";

      return;

    }


    /* =====================================
       BUDOWANIE I ZAPĘTLANIE KARUZELI
       ===================================== */

    function zbudujKaruzele() {

      // Zatrzymujemy starą animację

      track.classList.remove("is-ready");
      track.style.removeProperty("--opinie-duration");


      // Tworzymy pierwszą grupę

      const grupa = document.createElement("div");

      grupa.className = "opinie-grupa";


      // Dodajemy oryginalne opinie

      opinie.forEach(opinia => {

        grupa.appendChild(stworzKafelek(opinia));

      });


      // Usuwamy wcześniejsze kafelki

      track.replaceChildren(grupa);


      // Na telefonach lub przy ograniczonych
      // animacjach nie tworzymy kopii

      if (mobileView.matches || reducedMotion.matches) {
        return;
      }


      // Pobieramy szerokość widocznego obszaru

      const szerokoscKaruzeli = karuzela.clientWidth;


      /* =====================================
         UZUPEŁNIANIE BRAKUJĄCYCH KAFELKÓW
         ===================================== */

      let indeks = 0;

      const maksymalnaLiczbaKopii = 100;

      while (
        grupa.getBoundingClientRect().width <
          szerokoscKaruzeli + 300 &&
        indeks < maksymalnaLiczbaKopii
      ) {

        const opinia = opinie[indeks % opinie.length];

        const kopiaKafelka = stworzKafelek(opinia);

        kopiaKafelka.classList.add("opinie-powtorka");

        kopiaKafelka.setAttribute("aria-hidden", "true");

        // Ukrywamy linki kopii przed klawiaturą

        kopiaKafelka.querySelectorAll("a").forEach(link => {
          link.tabIndex = -1;
        });

        grupa.appendChild(kopiaKafelka);

        indeks++;

      }


      /* =====================================
         KOPIA CAŁEJ GRUPY
         ===================================== */

      const kopiaGrupy = grupa.cloneNode(true);

      kopiaGrupy.setAttribute("aria-hidden", "true");

      kopiaGrupy.querySelectorAll("a").forEach(link => {
        link.tabIndex = -1;
      });

      track.appendChild(kopiaGrupy);


      /* =====================================
         AUTOMATYCZNA PRĘDKOŚĆ ANIMACJI
         ===================================== */

      // Około 60 pikseli na sekundę

      const szerokoscGrupy =
        grupa.getBoundingClientRect().width;

      const czasAnimacji = szerokoscGrupy / 25;

      track.style.setProperty(
        "--opinie-duration",
        `${czasAnimacji}s`
      );


      // Uruchamiamy przewijanie

      track.classList.add("is-ready");

    }


    // Pierwsze uruchomienie

    zbudujKaruzele();


    /* =====================================
       REAKCJA NA ZMIANĘ ROZMIARU OKNA
       ===================================== */

    let resizeTimer;

    window.addEventListener("resize", () => {

      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {

        zbudujKaruzele();

      }, 250);

    }, { passive: true });


    // Zmiana systemowych ustawień animacji

    reducedMotion.addEventListener("change", () => {
      zbudujKaruzele();
    });


  } catch (error) {

    console.error("Błąd ładowania opinii:", error);

    track.classList.remove("is-ready");

    track.textContent =
      "Nie udało się załadować opinii.";

  }

}


/* ==========================================
   TWORZENIE POJEDYNCZEGO KAFELKA
   ========================================== */

function stworzKafelek(opinia) {

  const kafelek = document.createElement("article");

  kafelek.className = "opinie-kafelek";


  /* =====================================
     GWIAZDKI
     ===================================== */

  const gwiazdki = document.createElement("div");

  gwiazdki.className = "opinie-gwiazdki";

  gwiazdki.textContent =
    "★".repeat(opinia.ocena) +
    "☆".repeat(5 - opinia.ocena);

  gwiazdki.setAttribute(
    "aria-label",
    `Ocena: ${opinia.ocena} na 5`
  );


  /* =====================================
     TREŚĆ OPINII
     ===================================== */

  let tresc = null;

if (opinia.tresc.trim() !== "") {
  tresc = document.createElement("p");
  tresc.className = "opinie-tresc";
  tresc.textContent = opinia.tresc;
}


  /* =====================================
     AUTOR
     ===================================== */

  const autor = document.createElement("h3");

  autor.className = "opinie-autor";

  autor.textContent = opinia.autor;


  // Wstawiamy podstawowe elementy

  kafelek.append(autor, gwiazdki);

if (tresc) {
  kafelek.appendChild(tresc);
}


  /* =====================================
     DATA OPINII
     ===================================== */

  if (
    typeof opinia.data === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(opinia.data)
  ) {

    const [rok, miesiac, dzien] =
      opinia.data.split("-").map(Number);

    const date = new Date(rok, miesiac - 1, dzien);

    // Sprawdzamy, czy data rzeczywiście istnieje

    if (
      date.getFullYear() === rok &&
      date.getMonth() === miesiac - 1 &&
      date.getDate() === dzien
    ) {

      const data = document.createElement("span");

      data.className = "opinie-data";

      data.textContent = new Intl.DateTimeFormat("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(date);

      kafelek.appendChild(data);

    }

  }


  /* =====================================
     LINK DO OPINII GOOGLE
     ===================================== */

  if (
    typeof opinia.link === "string" &&
    opinia.link.trim() !== ""
  ) {

    try {

      const url = new URL(opinia.link);

      if (url.protocol === "https:") {

        const link = document.createElement("a");

        link.className = "opinie-link";

        link.href = url.href;

        link.target = "_blank";

        link.rel = "noopener noreferrer";

        link.textContent = "Przeczytaj opinię w Google";

        kafelek.appendChild(link);

      }

    } catch (error) {

      console.warn("Nieprawidłowy link opinii.");

    }

  }


  return kafelek;

}
