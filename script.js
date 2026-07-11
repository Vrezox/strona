const backToTopBtn = document.getElementById("backToTop");


let scrollTimeout;

window.addEventListener("scroll", () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.add("show");
    } else {
      backToTopBtn.classList.remove("show");
    }
  }, 50); 
});

backToTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
  
});

document.addEventListener("DOMContentLoaded", function () {
  const privacyPopup = document.getElementById("privacyPopup");
  const privacyAcceptButton = document.getElementById("privacyAccept");

  if (!privacyPopup || !privacyAcceptButton) {
    return;
  }

  const privacyNoticeAccepted = localStorage.getItem(
    "privacyNoticeAccepted"
  );

  if (privacyNoticeAccepted !== "true") {
    privacyPopup.classList.add("is-visible");
  }

  privacyAcceptButton.addEventListener("click", function () {
    localStorage.setItem("privacyNoticeAccepted", "true");
    privacyPopup.classList.remove("is-visible");
  });
});
