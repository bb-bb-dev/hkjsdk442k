(function () {
  const page = document.documentElement.getAttribute("data-page") || "";
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.getAttribute("data-nav") === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  const box = document.getElementById("lightbox");
  if (box) {
    const boxImg = box.querySelector("img");
    const boxCap = box.querySelector(".lightbox-caption");
    const close = box.querySelector(".lightbox-close");

    function closeBox() {
      box.hidden = true;
      document.body.style.overflow = "";
      boxImg.src = "";
      boxCap.textContent = "";
    }

    document.querySelectorAll(".shot img").forEach((img) => {
      img.addEventListener("click", () => {
        boxImg.src = img.currentSrc || img.src;
        boxCap.textContent = (img.closest("figure")?.querySelector("figcaption")?.textContent || img.alt || "").trim();
        box.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });

    close?.addEventListener("click", closeBox);
    box.addEventListener("click", (e) => {
      if (e.target === box) closeBox();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.hidden) closeBox();
    });
  }

  const infoModal = document.getElementById("info-modal");
  if (infoModal) {
    const infoClose = infoModal.querySelector(".info-modal-close");
    const infoPanels = Array.from(infoModal.querySelectorAll("[data-info-panel]"));
    let lastTrigger = null;

    function closeInfoModal() {
      infoModal.hidden = true;
      document.body.style.overflow = "";
      infoPanels.forEach((panel) => {
        panel.hidden = true;
      });
      lastTrigger?.focus();
      lastTrigger = null;
    }

    document.querySelectorAll("[data-info-trigger]").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const target = trigger.getAttribute("data-info-trigger");
        const panel = infoModal.querySelector(`[data-info-panel="${target}"]`);
        if (!panel) return;

        infoPanels.forEach((entry) => {
          entry.hidden = entry !== panel;
        });

        lastTrigger = trigger;
        infoModal.hidden = false;
        document.body.style.overflow = "hidden";
      });
    });

    infoClose?.addEventListener("click", closeInfoModal);
    infoModal.addEventListener("click", (e) => {
      if (e.target === infoModal) closeInfoModal();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !infoModal.hidden) closeInfoModal();
    });
  }
})();
