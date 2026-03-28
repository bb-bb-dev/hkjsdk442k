(function () {
  function sendGoatCounterEvent(path, title) {
    if (!path || path.startsWith("/")) return;

    const referrer = window.location.pathname || "/";
    if (window.goatcounter && typeof window.goatcounter.count === "function") {
      window.goatcounter.count({
        path,
        title,
        referrer,
        event: true,
      });
      return;
    }

    const endpoint = document.querySelector("script[data-goatcounter]")?.getAttribute("data-goatcounter");
    if (!endpoint) return;

    const params = new URLSearchParams({
      p: path,
      t: title,
      r: referrer,
      e: "true",
      rnd: String(Date.now()),
    });
    const pixel = new Image();
    pixel.src = `${endpoint}?${params.toString()}`;
  }

  function getOutboundEventPath(url) {
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "apps.garmin.com") return "click-garmin-store";
    if (host === "youtube.com" || host === "youtu.be" || host.endsWith(".youtube.com")) return "click-youtube";
    return `click-outbound-${host.replace(/[^a-z0-9.-]+/g, "-")}`;
  }

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

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.hasAttribute("download")) return;

    let url;
    try {
      url = new URL(link.href, window.location.href);
    } catch {
      return;
    }

    if (!/^https?:$/.test(url.protocol)) return;
    if (url.origin === window.location.origin) return;

    const linkText = (link.getAttribute("aria-label") || link.textContent || url.hostname)
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 200);

    sendGoatCounterEvent(getOutboundEventPath(url), `${linkText} from ${window.location.pathname || "/"}`);
  });

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
