
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initAktualnosci();
  initPodgladAktualnosci();
});


async function initAktualnosci() {

  // Pobieramy elementy strony

  const lista = document.getElementById("aktualnosci-lista");
  const status = document.getElementById("aktualnosci-status");
  const filtry = document.querySelectorAll(".aktualnosci-filtr");

  if (!lista || !status) return;


  try {

    // Pobieramy artykuły z JSON

    const response = await fetch("./artykuly.json", {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error("Nie udało się pobrać artykuly.json");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Plik artykuly.json musi zawierać tablicę.");
    }


    // Sprawdzamy poprawność danych

    const artykuly = data.filter(artykul => {

      return (
        artykul &&
        typeof artykul.tytul === "string" &&
        artykul.tytul.trim() !== "" &&
        typeof artykul.data === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(artykul.data) &&
        typeof artykul.kategoria === "string" &&
        typeof artykul.opis === "string" &&
        typeof artykul.link === "string" &&
        artykul.link.trim() !== ""
      );

    });


    // Sortujemy od najnowszego do najstarszego

    artykuly.sort((a, b) => {
      return b.data.localeCompare(a.data);
    });


    // Funkcja wyświetlająca artykuły

    function wyswietlArtykuly(kategoria = "Wszystkie") {

      lista.replaceChildren();

      const wybrane = kategoria === "Wszystkie"
        ? artykuly
        : artykuly.filter(artykul => artykul.kategoria === kategoria);

      if (wybrane.length === 0) {
        status.textContent = "Brak artykułów w wybranej kategorii.";
        return;
      }

      status.textContent = `Liczba artykułów: ${wybrane.length}`;

      wybrane.forEach(artykul => {
        lista.appendChild(stworzKafelekArtykulu(artykul));
      });

    }


    // Obsługa przycisków filtrowania

    filtry.forEach(przycisk => {

      przycisk.addEventListener("click", () => {

        const kategoria = przycisk.dataset.kategoria;

        filtry.forEach(filtr => {
          const aktywny = filtr === przycisk;

          filtr.classList.toggle("active", aktywny);
          filtr.setAttribute("aria-pressed", String(aktywny));
        });

        wyswietlArtykuly(kategoria);

      });

    });


    // Pierwsze wyświetlenie

    wyswietlArtykuly();

  } catch (error) {

    console.error("Błąd ładowania aktualności:", error);
    status.textContent = "Nie udało się załadować artykułów.";

  }

}


// Tworzenie pojedynczego kafelka

function stworzKafelekArtykulu(artykul) {

  const kafelek = document.createElement("article");
  kafelek.className = "aktualnosci-kafelek";


  // Kategoria

  const kategoria = document.createElement("span");
  kategoria.className = "aktualnosci-kafelek-kategoria";
  kategoria.textContent = artykul.kategoria;


  // Tytuł

  const tytul = document.createElement("h2");
  tytul.textContent = artykul.tytul;


  // Data

  const data = document.createElement("time");
  data.className = "aktualnosci-kafelek-data";
  data.dateTime = artykul.data;

  const [rok, miesiac, dzien] = artykul.data.split("-").map(Number);
  const dataObiekt = new Date(rok, miesiac - 1, dzien);

  data.textContent = new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(dataObiekt);


  // Opis

  const opis = document.createElement("p");
  opis.className = "aktualnosci-kafelek-opis";
  opis.textContent = artykul.opis;


  // Link

  const link = document.createElement("a");
  link.className = "aktualnosci-kafelek-link";
  link.href = artykul.link;
  link.textContent = "Czytaj więcej";


  // Składamy kafelek

  kafelek.append(kategoria, tytul, data, opis, link);

  return kafelek;

}



// =========================================
// TRZY NAJNOWSZE ARTYKUŁY NA STRONIE GŁÓWNEJ
// =========================================

async function initPodgladAktualnosci() {

  const podglad = document.getElementById(
    "aktualnosci-podglad"
  );

  // Nie jesteśmy na stronie głównej
  if (!podglad) return;

  try {

    // Pobieramy ten sam JSON co w archiwum
    const response = await fetch(
      "./aktualnosci/artykuly.json",
      { cache: "no-cache" }
    );

    if (!response.ok) {
      throw new Error("Nie udało się pobrać artykułów.");
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Niepoprawny format artykuly.json");
    }

    // Sprawdzamy poprawność danych
    const artykuly = data.filter(artykul =>
      artykul &&
      typeof artykul.tytul === "string" &&
      artykul.tytul.trim() !== "" &&
      typeof artykul.data === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(artykul.data) &&
      typeof artykul.kategoria === "string" &&
      typeof artykul.opis === "string" &&
      typeof artykul.link === "string" &&
      artykul.link.trim() !== ""
    );

    // Najnowsze na początku
    artykuly.sort((a, b) =>
      b.data.localeCompare(a.data)
    );

    // Maksymalnie trzy wpisy
    const najnowsze = artykuly.slice(0, 3);

    podglad.replaceChildren();

    if (najnowsze.length === 0) {
      podglad.textContent = "Brak aktualności.";
      return;
    }

    najnowsze.forEach(artykul => {

      // Korzystamy z istniejącej funkcji kafelka
      const kafelek = stworzKafelekArtykulu(artykul);

      // Poprawiamy ścieżkę linku dla strony głównej
      const link = kafelek.querySelector(
        ".aktualnosci-kafelek-link"
      );

      if (link) {
        link.href = "aktualnosci/" + artykul.link;
      }

      podglad.appendChild(kafelek);

    });

  } catch (error) {

    console.error(
      "Błąd ładowania podglądu aktualności:",
      error
    );

    podglad.textContent =
      "Nie udało się załadować aktualności.";

  }

}
