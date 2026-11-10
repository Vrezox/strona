"use strict";

/* ============================================================
   SCRIPT.JS — OBSŁUGA ELEMENTÓW STRONY GŁÓWNEJ
   ------------------------------------------------------------
   Plik odpowiada za:
   1. przycisk powrotu na górę strony,
   2. komunikat informacyjny o prywatności,
   3. pobieranie opinii z opinie.json i wyświetlanie karuzeli.

   Zależności: elementy o identyfikatorach i klasach z index.html
   oraz animacje i style z style.css. Nie wymaga dodatkowych bibliotek.
   ============================================================ */

/* ============================================================
   1. INICJALIZACJA PO ZAŁADOWANIU DOKUMENTU
   ============================================================ */

// Uruchamiamy obsługę interaktywnych elementów dopiero wtedy,
// gdy struktura HTML jest dostępna w drzewie DOM.
document.addEventListener("DOMContentLoaded", () => {
  initBackToTop();
  initPrivacyPopup();
  initOpinie();
});

/* ============================================================
   2. PRZYCISK „POWRÓT DO GÓRY”
   ============================================================ */

/**
 * Konfiguruje widoczność i działanie przycisku #backToTop.
 * Przycisk pojawia się po przewinięciu strony o ponad 300 px.
 * Uwzględnia systemową preferencję ograniczenia animacji.
 */
function initBackToTop() {
  const button = document.getElementById("backToTop");

  // Jeśli przycisku nie ma na danej podstronie, pomijamy inicjalizację.
  if (!button) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  /** Pokazuje lub ukrywa przycisk na podstawie pozycji przewijania. */
  function updateVisibility() {
    button.classList.toggle("show", window.scrollY > 300);
  }

  // passive: true informuje przeglądarkę, że nie blokujemy przewijania.
  window.addEventListener("scroll", updateVisibility, { passive: true });

  // Ustalamy poprawny stan również przy odświeżeniu przewiniętej strony.
  updateVisibility();

  // Kliknięcie przewija do początku strony, płynnie lub natychmiast.
  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: reducedMotion.matches ? "auto" : "smooth"
    });
  });
}

/* ============================================================
   3. KOMUNIKAT INFORMACYJNY O PRYWATNOŚCI
   ============================================================ */

/**
 * Obsługuje jednorazowe potwierdzenie przeczytania komunikatu.
 * Zapamiętuje wybór w localStorage pod kluczem privacyNoticeAccepted.
 * To komunikat informacyjny, a nie system zarządzania zgodami.
 */
function initPrivacyPopup() {
  const popup = document.getElementById("privacyPopup");
  const button = document.getElementById("privacyAccept");

  // Na podstronach bez komunikatu nie wykonujemy dalszych działań.
  if (!popup || !button) return;

  const storageKey = "privacyNoticeAccepted";
  let accepted = false;

  // localStorage bywa niedostępny np. w niektórych trybach prywatnych.
  // Dlatego jego odczyt i zapis zabezpieczamy instrukcją try/catch.
  try {
    accepted = localStorage.getItem(storageKey) === "true";
  } catch (error) {
    console.warn("Pamięć lokalna jest niedostępna.");
  }

  // Pokazujemy komunikat, dopóki użytkownik go nie potwierdził.
  if (!accepted) {
    popup.classList.add("is-visible");
  }

  // Po kliknięciu „Rozumiem” zapisujemy potwierdzenie i zamykamy panel.
  button.addEventListener("click", () => {
    try {
      localStorage.setItem(storageKey, "true");
    } catch (error) {
      console.warn("Nie udało się zapisać ustawienia.");
    }

    // Zamykamy komunikat także wtedy, gdy zapis nie był możliwy.
    popup.classList.remove("is-visible");
  });
}

/* ============================================================
   4. KARUZELA OPINII — INICJALIZACJA I POBIERANIE DANYCH
   ============================================================ */

/**
 * Pobiera opinie z pliku opinie.json, weryfikuje ich podstawowe pola,
 * sortuje od najnowszych do najstarszych i tworzy karuzelę.
 *
 * Na większych ekranach karuzela przewija się automatycznie.
 * Na urządzeniach mobilnych oraz przy prefers-reduced-motion
 * wyświetlana jest pojedyncza grupa do ręcznego przewijania.
 */
async function initOpinie() {
  const track = document.getElementById("opinie-track");

  // Jeśli na stronie nie ma toru opinii, niczego nie inicjalizujemy.
  if (!track) return;

  const karuzela = track.closest(".opinie-karuzela");
  if (!karuzela) return;

  /* ----------------------------------------------------------
     4.1. PRZYCISK PAUZA / WZNÓW
     ---------------------------------------------------------- */

  const przyciskPauzy = document.getElementById("opinie-pauza");

  if (przyciskPauzy) {
    przyciskPauzy.addEventListener("click", () => {
      // Klasa is-paused zatrzymuje animację przez regułę CSS.
      const zatrzymana = track.classList.toggle("is-paused");

      // aria-pressed opisuje stan przycisku dla czytników ekranu.
      przyciskPauzy.setAttribute("aria-pressed", String(zatrzymana));

      const tekst = przyciskPauzy.querySelector(".opinie-pauza-tekst");
      const ikona = przyciskPauzy.querySelector('[aria-hidden="true"]');

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

  /* ----------------------------------------------------------
     4.2. USTALENIE TRYBU WYŚWIETLANIA
     ---------------------------------------------------------- */

  // Ustawienia są odczytywane ponownie podczas przebudowy karuzeli.
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const mobileView = window.matchMedia("(max-width: 768px)");

  try {
    /* --------------------------------------------------------
       4.3. POBIERANIE I WALIDACJA OPINII
       -------------------------------------------------------- */

    // no-cache umożliwia sprawdzenie aktualnej wersji pliku JSON.
    const response = await fetch("./opinie.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać opinie.json");
    }

    const data = await response.json();

    // Wymagana jest tablica obiektów opisujących poszczególne opinie.
    if (!Array.isArray(data)) {
      throw new Error("Plik JSON musi zawierać tablicę.");
    }

    // Pomijamy niepoprawne wpisy. Pusta treść opinii jest dozwolona,
    // natomiast autor i ocena w zakresie 1–5 są obowiązkowe.
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

    // Daty w formacie RRRR-MM-DD sortują się leksykograficznie.
    // Wpisy bez daty trafiają za wpisy z datą.
    opinie.sort((a, b) => {
      return (b.data || "").localeCompare(a.data || "");
    });

    // Jeśli po walidacji nie ma opinii, pokazujemy informację tekstową.
    if (opinie.length === 0) {
      track.textContent = "Brak opinii do wyświetlenia.";
      return;
    }

    /* --------------------------------------------------------
   4.4. BUDOWANIE I ZAPĘTLANIE KARUZELI
   -------------------------------------------------------- */

/**
 * Przebudowuje grupę opinii dla aktualnej szerokości ekranu.
 * W trybie desktopowym powiela kafelki, aby animacja mogła
 * przewijać się w nieskończonej pętli bez pustych miejsc.
 */
function zbudujKaruzele() {
  // Wyłączamy dotychczasową animację i usuwamy jej czas trwania.
  track.classList.remove("is-ready");
  track.style.removeProperty("--opinie-duration");

  // Grupa podstawowa zawiera wszystkie prawidłowe opinie.
  const grupa = document.createElement("div");
  grupa.className = "opinie-grupa";

  opinie.forEach(opinia => {
    grupa.appendChild(stworzKafelek(opinia));
  });

  // Zamieniamy poprzednią zawartość toru na aktualną grupę.
  track.replaceChildren(grupa);

  /* --------------------------------------------------------
     FADE-OUT — WYKRYWANIE ZBYT DŁUGICH OPINII
     -------------------------------------------------------- */

  // Sprawdzamy, czy treść przekracza widoczną wysokość.
  // Gradient pojawia się tylko w zbyt długich opiniach.
  grupa.querySelectorAll(".opinie-tresc").forEach(element => {
    const czyZaDluga = element.scrollHeight > element.clientHeight + 1;

    element.classList.toggle("is-truncated", czyZaDluga);
  });

  // Na telefonach i przy ograniczeniu ruchu pozostawiamy
  // wyłącznie oryginalne opinie, bez automatycznej animacji.
  if (mobileView.matches || reducedMotion.matches) {
    return;
  }

  const szerokoscKaruzeli = karuzela.clientWidth;

      /* ------------------------------------------------------
         4.4.1. UZUPEŁNIENIE GRUPY DODATKOWYMI KAFELKAMI
         ------------------------------------------------------ */

      let indeks = 0;
      const maksymalnaLiczbaKopii = 100;

      // Przy niewielkiej liczbie opinii dodajemy kolejne kafelki,
      // aby grupa była szersza od widocznego obszaru karuzeli.
      // Limit 100 zapobiega niekontrolowanemu tworzeniu elementów.
      while (
        grupa.getBoundingClientRect().width < szerokoscKaruzeli + 300 &&
        indeks < maksymalnaLiczbaKopii
      ) {
        const opinia = opinie[indeks % opinie.length];
        const kopiaKafelka = stworzKafelek(opinia);

        // Powtórki pomijamy w odczycie technologii wspomagających.
        kopiaKafelka.classList.add("opinie-powtorka");
        kopiaKafelka.setAttribute("aria-hidden", "true");

        // Linki wewnątrz powtórek wyłączamy z nawigacji klawiaturą.
        kopiaKafelka.querySelectorAll("a").forEach(link => {
          link.tabIndex = -1;
        });

        grupa.appendChild(kopiaKafelka);
        indeks++;
      }

      /* ------------------------------------------------------
         4.4.2. DUPLIKACJA GRUPY DLA PŁYNNEJ PĘTLI
         ------------------------------------------------------ */

      // Druga, identyczna grupa pozwala na płynne zapętlanie CSS.
      const kopiaGrupy = grupa.cloneNode(true);
      kopiaGrupy.setAttribute("aria-hidden", "true");

      kopiaGrupy.querySelectorAll("a").forEach(link => {
        link.tabIndex = -1;
      });

      track.appendChild(kopiaGrupy);

      /* ------------------------------------------------------
         4.4.3. OBLICZANIE CZASU ANIMACJI
         ------------------------------------------------------ */

      // Docelowa prędkość wynosi około 25 pikseli na sekundę.
      // Szersza grupa oznacza dłuższy czas jednego przebiegu.
      const szerokoscGrupy = grupa.getBoundingClientRect().width;
      const czasAnimacji = szerokoscGrupy / 25;

      track.style.setProperty("--opinie-duration", `${czasAnimacji}s`);

      // Klasa is-ready uruchamia animację zdefiniowaną w style.css.
      track.classList.add("is-ready");
    }

    // Pierwsze renderowanie po pobraniu danych.
    zbudujKaruzele();

    /* --------------------------------------------------------
       4.5. AKTUALIZACJA PO ZMIANIE ROZMIARU OKNA
       -------------------------------------------------------- */

    let resizeTimer;

    // Opóźnienie 250 ms ogranicza liczbę przebudów podczas skalowania.
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);

      resizeTimer = setTimeout(() => {
        zbudujKaruzele();
      }, 250);
    }, { passive: true });

    // Reagujemy także na zmianę systemowego ustawienia animacji.
    reducedMotion.addEventListener("change", () => {
      zbudujKaruzele();
    });

  } catch (error) {
    // Np. brak pliku JSON, błąd sieci lub niepoprawna struktura danych.
    console.error("Błąd ładowania opinii:", error);
    track.classList.remove("is-ready");
    track.textContent = "Nie udało się załadować opinii.";
  }
}

/* ============================================================
   5. TWORZENIE POJEDYNCZEGO KAFELKA OPINII
   ============================================================ */

/**
 * Tworzy element <article> z danymi pojedynczej opinii.
 *
 * @param {Object} opinia - Obiekt opinii z pliku opinie.json.
 * @param {string} opinia.autor - Imię lub nazwa autora.
 * @param {string} opinia.tresc - Treść komentarza (może być pusta).
 * @param {number} opinia.ocena - Ocena w skali 1–5.
 * @param {string} [opinia.data] - Opcjonalna data w formacie RRRR-MM-DD.
 * @param {string} [opinia.link] - Opcjonalny adres HTTPS opinii.
 * @returns {HTMLElement} Gotowy kafelek opinii.
 */
function stworzKafelek(opinia) {
  const kafelek = document.createElement("article");
  kafelek.className = "opinie-kafelek";

  /* ----------------------------------------------------------
     5.1. OCENA W POSTACI GWIAZDEK
     ---------------------------------------------------------- */

  const gwiazdki = document.createElement("div");
  gwiazdki.className = "opinie-gwiazdki";

  // Przykład: ocena 4 daje ciąg „★★★★☆”.
  gwiazdki.textContent =
    "★".repeat(opinia.ocena) + "☆".repeat(5 - opinia.ocena);

  // Etykieta słowna pomaga odczytać ocenę czytnikom ekranu.
  gwiazdki.setAttribute("aria-label", `Ocena: ${opinia.ocena} na 5`);

  /* ----------------------------------------------------------
     5.2. TREŚĆ KOMENTARZA — OPCJONALNA
     ---------------------------------------------------------- */

  let tresc = null;

  // Opinie zawierające tylko ocenę i autora są również wyświetlane.
  if (opinia.tresc.trim() !== "") {
    tresc = document.createElement("p");
    tresc.className = "opinie-tresc";
    tresc.textContent = opinia.tresc;
  }

  /* ----------------------------------------------------------
     5.3. AUTOR I PODSTAWOWE ELEMENTY KAFELKA
     ---------------------------------------------------------- */

  const autor = document.createElement("h3");
  autor.className = "opinie-autor";
  autor.textContent = opinia.autor;

  // Zachowujemy kolejność: autor, gwiazdki, opcjonalny komentarz.
  kafelek.append(autor, gwiazdki);

  if (tresc) {
    kafelek.appendChild(tresc);
  }

  /* ----------------------------------------------------------
     5.4. DATA OPINII — OPCJONALNA
     ---------------------------------------------------------- */

  // Najpierw sprawdzamy format, a następnie faktyczne istnienie daty.
  if (
    typeof opinia.data === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(opinia.data)
  ) {
    const [rok, miesiac, dzien] = opinia.data.split("-").map(Number);
    const date = new Date(rok, miesiac - 1, dzien);

    // Zapobiega np. wyświetleniu nieistniejącego 31 lutego.
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

  /* ----------------------------------------------------------
     5.5. ZEWNĘTRZNY LINK DO OPINII
     ---------------------------------------------------------- */

  if (typeof opinia.link === "string" && opinia.link.trim() !== "") {
    try {
      const url = new URL(opinia.link);

      // Akceptujemy adresy HTTPS. Otwieramy je w nowej karcie.
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
      // Nieprawidłowy adres nie blokuje utworzenia całego kafelka.
      console.warn("Nieprawidłowy link opinii.");
    }
  }

  return kafelek;
}
