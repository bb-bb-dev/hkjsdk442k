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

  const videoTriggers = Array.from(document.querySelectorAll("[data-video-modal][data-video-id]"));
  if (videoTriggers.length) {
    const modal = document.createElement("div");
    modal.id = "video-modal";
    modal.className = "video-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="video-modal-panel" role="dialog" aria-modal="true" aria-labelledby="video-modal-title">
        <button class="video-modal-close" type="button" aria-label="Close video">x</button>
        <div class="video-modal-frame">
          <iframe
            title="TubeWitch demo video"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
        <p id="video-modal-title" class="video-modal-title"></p>
      </div>
    `;
    document.body.appendChild(modal);

    const frameWrap = modal.querySelector(".video-modal-frame");
    const title = modal.querySelector(".video-modal-title");
    const close = modal.querySelector(".video-modal-close");
    let lastTrigger = null;
    let frame = null;

    function buildVideoFrame(videoId, videoTitle) {
      const nextFrame = document.createElement("iframe");
      nextFrame.title = videoTitle || "TubeWitch demo video";
      nextFrame.loading = "lazy";
      nextFrame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      nextFrame.referrerPolicy = "strict-origin-when-cross-origin";
      nextFrame.allowFullscreen = true;
      nextFrame.src = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&autoplay=1&rel=0&playsinline=1`;
      frameWrap.replaceChildren(nextFrame);
      frame = nextFrame;
    }

    function closeVideoModal() {
      if (frame?.contentWindow) {
        const stopMessage = JSON.stringify({ event: "command", func: "stopVideo", args: [] });
        const pauseMessage = JSON.stringify({ event: "command", func: "pauseVideo", args: [] });
        frame.contentWindow.postMessage(stopMessage, "*");
        frame.contentWindow.postMessage(pauseMessage, "*");
      }

      modal.hidden = true;
      document.body.style.overflow = "";
      frameWrap.replaceChildren();
      frame = null;
      title.textContent = "";
      lastTrigger?.focus();
      lastTrigger = null;
    }

    function openVideoModal(trigger) {
      const videoId = trigger.getAttribute("data-video-id");
      if (!videoId) return;

      const videoTitle =
        trigger.getAttribute("data-video-title") ||
        (trigger.textContent || "TubeWitch demo video").replace(/\s+/g, " ").trim();

      buildVideoFrame(videoId, videoTitle);
      title.textContent = videoTitle;
      lastTrigger = trigger;
      modal.hidden = false;
      document.body.style.overflow = "hidden";
      close.focus();
    }

    videoTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        event.preventDefault();
        openVideoModal(trigger);
      });
    });

    close?.addEventListener("click", closeVideoModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeVideoModal();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeVideoModal();
    });
  }
})();
