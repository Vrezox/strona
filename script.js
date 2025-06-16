const backToTopBtn = document.getElementById("backToTop");

// Debounce – dla lepszej wydajności na słabszych urządzeniach
let scrollTimeout;

window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  }, 50); // debounce 50ms
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  // Nie usuwamy klasy „show” ręcznie – scroll zrobi to sam, gdy dojedziemy na górę
});
