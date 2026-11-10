"use strict";

/* ==============================================================
   FAQ — BIURO RACHUNKOWE KATARZYNA JURECZKO

   Natywne elementy <details> działają bez tego skryptu.
   JavaScript dodaje jedynie zachowanie akordeonu:
   otwarcie jednego pytania zamyka inne otwarte pytania.
   ============================================================== */

document.addEventListener("DOMContentLoaded", initFaqAccordion);

/**
 * Inicjalizuje rozwijane pytania na stronie FAQ.
 * Gdy użytkownik otworzy jedno pytanie, pozostałe zostaną zamknięte.
 * Nie modyfikuje tekstu pytań ani odpowiedzi.
 * @returns {void}
 */
function initFaqAccordion() {
  const questions = [...document.querySelectorAll(".faq-item")];

  // Brak pytań — nie ma potrzeby rejestrowania zdarzeń.
  if (questions.length === 0) return;

  questions.forEach(current => {
    // Zdarzenie "toggle" zachodzi po otwarciu lub zamknięciu <details>.
    current.addEventListener("toggle", () => {
      // Przy zamknięciu pytania nie wykonujemy żadnej akcji.
      if (!current.open) return;

      // Zachowujemy otwarte pytanie i zamykamy wszystkie pozostałe.
      questions.forEach(other => {
        if (other !== current && other.open) {
          other.open = false;
        }
      });
    });
  });
}
