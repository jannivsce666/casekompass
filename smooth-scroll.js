(function () {
  const prefersReducedMotion =
    typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function injectTransitionStyles() {
    if (document.getElementById("page-transition-styles")) return;

    const style = document.createElement("style");
    style.id = "page-transition-styles";
    style.textContent = `
      body {
        opacity: 0;
        transition: opacity 700ms cubic-bezier(0.19, 1, 0.22, 1);
      }

      body.page-entered {
        opacity: 1;
      }

      body.page-leaving {
        opacity: 0;
      }

      @media (prefers-reduced-motion: reduce) {
        body,
        body.page-entered,
        body.page-leaving {
          transition: none !important;
          opacity: 1 !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function easeInOutQuint(t) {
    return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
  }

  function smoothScrollTo(targetY, duration) {
    const startY = window.scrollY || window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutQuint(progress);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  function setupPageFadeTransition() {
    injectTransitionStyles();

    requestAnimationFrame(() => {
      document.body.classList.add("page-entered");
      document.body.classList.remove("page-leaving");
    });

    if (prefersReducedMotion) return;

    document.addEventListener("click", function (event) {
      const link = event.target.closest("a[href]");
      if (!link) return;

      const href = String(link.getAttribute("href") || "").trim();
      if (!href || href.startsWith("#")) return;
      if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) return;
      if (link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;

      const isSameDoc =
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        Boolean(url.hash);
      if (isSameDoc) return;

      event.preventDefault();
      document.body.classList.remove("page-entered");
      document.body.classList.add("page-leaving");

      window.setTimeout(() => {
        window.location.href = url.href;
      }, 280);
    });
  }

  function getHashTarget(href) {
    if (!href) return null;
    if (!href.includes("#")) return null;

    let hash = "";
    try {
      const url = new URL(href, window.location.href);
      if (url.pathname !== window.location.pathname) return null;
      hash = url.hash;
    } catch {
      if (href.startsWith("#")) hash = href;
    }

    if (!hash || hash === "#") return null;
    const id = decodeURIComponent(hash.slice(1));
    return document.getElementById(id) || document.querySelector(hash);
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a.scrolly, a[href^='#']");
    if (!link) return;

    const target = getHashTarget(link.getAttribute("href") || "");
    if (!target) return;

    event.preventDefault();

    const nav = document.getElementById("nav");
    const navH = nav ? nav.offsetHeight : 0;
    const offset = navH + 14;
    const targetY = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - offset);

    if (prefersReducedMotion) {
      window.scrollTo(0, targetY);
    } else {
      smoothScrollTo(targetY, 1400);
    }

    const id = target.id ? `#${target.id}` : "";
    if (id) history.replaceState(null, "", id);
  });

  setupPageFadeTransition();
})();
