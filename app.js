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

  const siteHeader = document.querySelector(".site-header");
  const primaryNav = siteHeader?.querySelector(".nav-links");
  if (siteHeader && primaryNav) {
    const navTrack = document.createElement("div");
    navTrack.className = "nav-links-track";
    while (primaryNav.firstChild) {
      navTrack.appendChild(primaryNav.firstChild);
    }

    const navToggle = document.createElement("button");
    navToggle.type = "button";
    navToggle.className = "nav-toggle";
    navToggle.setAttribute("aria-label", "Expand navigation");
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.append(navTrack, navToggle);

    siteHeader.classList.add("mobile-nav-ready");

    const mobileNavQuery = window.matchMedia("(max-width: 700px)");
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const touchScrollCarry = 1.8;
    let lastScrollY = window.scrollY;
    let navOpenAmount = 1;
    let mobileNavMetrics = null;
    let navAnimationTimer = 0;
    let resizeRaf = 0;
    let touchLastY = null;
    let touchManualScroll = false;

    function isMobileNav() {
      return mobileNavQuery.matches;
    }

    function getActiveNavLink() {
      return navTrack.querySelector("[aria-current='page']")
        || navTrack.querySelector(".active")
        || navTrack.querySelector("a");
    }

    function getMobileNavMetrics() {
      if (!isMobileNav()) return null;

      siteHeader.classList.add("nav-measuring");
      const previousHeight = primaryNav.style.height;
      const previousMarginTop = navTrack.style.marginTop;
      primaryNav.style.height = "auto";
      navTrack.style.marginTop = "0";

      const links = Array.from(navTrack.querySelectorAll("a"));
      const trackRect = navTrack.getBoundingClientRect();
      const rows = [];

      links.forEach((link) => {
        const rect = link.getBoundingClientRect();
        const top = Math.round((rect.top - trackRect.top) * 10) / 10;
        const bottom = rect.bottom - trackRect.top;
        let row = rows.find((item) => Math.abs(item.top - top) < 3);
        if (!row) {
          row = { top, bottom };
          rows.push(row);
        } else {
          row.bottom = Math.max(row.bottom, bottom);
        }
      });

      const activeLink = getActiveNavLink();
      const activeRect = activeLink?.getBoundingClientRect();
      const activeTop = activeRect ? Math.round((activeRect.top - trackRect.top) * 10) / 10 : 0;
      const activeRow = rows.find((row) => Math.abs(row.top - activeTop) < 3) || rows[0] || { top: 0, bottom: 30 };
      const expandedHeight = Math.ceil(Math.max(navTrack.scrollHeight, ...rows.map((row) => row.bottom), 30));
      const collapsedHeight = Math.ceil(Math.max(activeRow.bottom - activeRow.top, 30));
      const activeShift = -Math.max(0, Math.floor(activeRow.top));

      siteHeader.classList.remove("nav-measuring");
      primaryNav.style.height = previousHeight;
      navTrack.style.marginTop = previousMarginTop;
      mobileNavMetrics = {
        activeShift,
        collapsedHeight,
        expandedHeight: Math.max(expandedHeight, collapsedHeight),
      };
      return mobileNavMetrics;
    }

    function applyMobileNav(animate = false) {
      if (!isMobileNav()) {
        clearTimeout(navAnimationTimer);
        siteHeader.classList.remove("nav-expanded");
        siteHeader.classList.remove("nav-no-transition");
        siteHeader.classList.remove("nav-measuring");
        siteHeader.removeAttribute("aria-expanded");
        primaryNav.removeAttribute("aria-hidden");
        primaryNav.style.height = "";
        navTrack.style.marginTop = "";
        navToggle.removeAttribute("style");
        navToggle.setAttribute("aria-expanded", "false");
        return;
      }

      const metrics = mobileNavMetrics || getMobileNavMetrics();
      if (!metrics) return;

      if (animate) {
        siteHeader.classList.remove("nav-no-transition");
        primaryNav.getBoundingClientRect();
      } else {
        siteHeader.classList.add("nav-no-transition");
      }

      const amount = clamp(navOpenAmount, 0, 1);
      const range = metrics.expandedHeight - metrics.collapsedHeight;
      const height = metrics.collapsedHeight + (range * amount);
      const shift = metrics.activeShift * (1 - amount);
      const expanded = amount > 0.98;

      primaryNav.style.height = `${height}px`;
      navTrack.style.marginTop = `${shift}px`;
      navToggle.style.transform = `rotate(${Math.round(amount * 180)}deg)`;
      navToggle.setAttribute("aria-expanded", String(expanded));
      navToggle.setAttribute("aria-label", expanded ? "Collapse navigation" : "Expand navigation");
      siteHeader.classList.toggle("nav-expanded", expanded);
      siteHeader.setAttribute("aria-expanded", String(expanded));
      primaryNav.removeAttribute("aria-hidden");
    }

    function setMobileNavAmount(amount, animate = false) {
      navOpenAmount = clamp(amount, 0, 1);
      applyMobileNav(animate);
    }

    function animateMobileNavTo(targetAmount) {
      if (!isMobileNav()) return;
      clearTimeout(navAnimationTimer);

      const startAmount = navOpenAmount;
      const endAmount = clamp(targetAmount, 0, 1);
      const duration = 220;
      const startTime = performance.now();

      function step(now) {
        const progress = clamp((now - startTime) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setMobileNavAmount(startAmount + ((endAmount - startAmount) * eased), false);

        if (progress < 1) {
          navAnimationTimer = setTimeout(() => step(performance.now()), 16);
        } else {
          setMobileNavAmount(endAmount, false);
        }
      }

      step(startTime);
    }

    function syncMobileNav(animate = false) {
      mobileNavMetrics = null;
      applyMobileNav(animate);
    }

    navToggle.addEventListener("click", (event) => {
      if (!isMobileNav()) return;
      event.preventDefault();
      event.stopPropagation();
      lastScrollY = window.scrollY;
      animateMobileNavTo(navOpenAmount > 0.98 ? 0 : 1);
    });

    function applyMobileNavScrollDelta(deltaY) {
      if (!isMobileNav() || Math.abs(deltaY) < 0.5) {
        return { consumed: false, remainingDelta: deltaY };
      }

      const metrics = mobileNavMetrics || getMobileNavMetrics();
      if (!metrics) return { consumed: false, remainingDelta: deltaY };

      const range = Math.max(metrics.expandedHeight - metrics.collapsedHeight, 1);
      if (deltaY > 0 && navOpenAmount > 0) {
        const deltaToCollapsed = navOpenAmount * range;
        clearTimeout(navAnimationTimer);

        if (deltaY >= deltaToCollapsed) {
          setMobileNavAmount(0, false);
          return { consumed: true, remainingDelta: deltaY - deltaToCollapsed };
        }

        setMobileNavAmount(navOpenAmount - (deltaY / range), false);
        return { consumed: true, remainingDelta: 0 };
      }

      if (deltaY < 0 && navOpenAmount < 1) {
        if (window.scrollY > 1) return { consumed: false, remainingDelta: deltaY };

        const consumedDelta = Math.min(-deltaY, (1 - navOpenAmount) * range);
        clearTimeout(navAnimationTimer);
        setMobileNavAmount(navOpenAmount + (consumedDelta / range), false);
        return { consumed: consumedDelta > 0.5, remainingDelta: deltaY + consumedDelta };
      }

      return { consumed: false, remainingDelta: deltaY };
    }

    window.addEventListener("wheel", (event) => {
      const navScroll = applyMobileNavScrollDelta(event.deltaY);
      if (navScroll.consumed && Math.abs(navScroll.remainingDelta) < 0.5) {
        event.preventDefault();
      }
    }, { passive: false });

    window.addEventListener("touchstart", (event) => {
      touchLastY = event.touches[0]?.clientY ?? null;
      touchManualScroll = false;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
      if (touchLastY === null) return;

      const currentTouchY = event.touches[0]?.clientY ?? touchLastY;
      const deltaY = touchLastY - currentTouchY;
      const navScroll = applyMobileNavScrollDelta(deltaY);
      if (navScroll.consumed) {
        touchManualScroll = true;
        event.preventDefault();
        if (Math.abs(navScroll.remainingDelta) > 0.5) {
          window.scrollBy(0, navScroll.remainingDelta * touchScrollCarry);
          lastScrollY = window.scrollY;
        }
      } else if (touchManualScroll) {
        event.preventDefault();
        window.scrollBy(0, deltaY * touchScrollCarry);
        lastScrollY = window.scrollY;
      }
      touchLastY = currentTouchY;
    }, { passive: false });

    window.addEventListener("touchend", () => {
      touchLastY = null;
      touchManualScroll = false;
    }, { passive: true });

    window.addEventListener("touchcancel", () => {
      touchLastY = null;
      touchManualScroll = false;
    }, { passive: true });

    window.addEventListener("scroll", () => {
      lastScrollY = window.scrollY;
    }, { passive: true });

    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => syncMobileNav(false));
    }, { passive: true });

    mobileNavQuery.addEventListener?.("change", () => syncMobileNav(false));
    window.addEventListener("load", () => syncMobileNav(false), { once: true });
    document.fonts?.ready?.then(() => syncMobileNav(false)).catch(() => {});
    syncMobileNav();
  }

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
      boxImg.alt = "";
      boxImg.classList.remove("lightbox-transparent-shot");
      boxCap.textContent = "";
    }

    document.querySelectorAll(".shot img").forEach((img) => {
      img.addEventListener("click", () => {
        const imageSrc = img.currentSrc || img.src;
        boxImg.src = imageSrc;
        boxCap.textContent = (img.closest("figure")?.querySelector("figcaption")?.textContent || img.alt || "").trim();
        boxImg.alt = (img.alt || boxCap.textContent || "").trim();
        boxImg.classList.toggle("lightbox-transparent-shot", imageSrc.includes("sensor_ids.png"));
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

      trigger.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

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
