(function () {
  function setupAvailabilityGate() {
    const hostname = String(window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
    // Only show on the real domain (keep GitHub Pages/local dev fully accessible)
    const isProductionDomain = hostname === "casekompass.de" || hostname === "www.casekompass.de";
    if (!isProductionDomain) return;

    // Site should be accessible starting March 1, 2026 (CET)
    const availableFrom = new Date("2026-03-01T00:00:00+01:00");
    const now = new Date();
    if (!(availableFrom instanceof Date) || Number.isNaN(availableFrom.getTime())) return;
    if (now.getTime() >= availableFrom.getTime()) return;

    const dateLabel = availableFrom.toLocaleDateString("de-DE", { day: "numeric", month: "long" });

    document.documentElement.classList.add("github-locked");

    const overlay = document.createElement("div");
    overlay.className = "github-gate";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "github-gate-title");
    overlay.innerHTML = `
      <div class="github-gate__card" tabindex="-1">
        <div class="github-gate__badge">Bald verf\u00fcgbar</div>
        <h1 id="github-gate-title" class="github-gate__title">Wir sind bald f\u00fcr dich da</h1>
        <p class="github-gate__text">Danke f\u00fcrs Vorbeischauen! Diese Seite ist gerade noch im Aufbau und wird ab dem <strong>${dateLabel}</strong> verf\u00fcgbar sein.</p>
        <p class="github-gate__text github-gate__muted">Bitte schau dann nochmal vorbei.</p>
      </div>
    `.trim();

    // Ensure the body exists (effects.js is loaded with defer, but keep this defensive)
    const mount = document.body || document.documentElement;
    mount.appendChild(overlay);

    // Prevent background scroll on mobile
    try {
      document.body.style.overflow = "hidden";
    } catch {
      // ignore
    }

    // Focus for accessibility (no close button by design)
    const card = overlay.querySelector(".github-gate__card");
    if (card && typeof card.focus === "function") {
      card.focus();
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function setupHeaderScrollState() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const threshold = 8;
    let ticking = false;

    const update = () => {
      ticking = false;
      header.classList.toggle("is-scrolled", window.scrollY > threshold);
    };

    // Initial state
    update();

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      },
      { passive: true }
    );
  }

  function markLoaded() {
    // Used by existing CSS animations (hero reveal).
    // Tiny delay makes the reveal readable (instead of looking like instant paint).
    window.setTimeout(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add("is-loaded");
      });
    }, 140);
  }

  function setupScrollReveal() {
    const reduce = prefersReducedMotion();

    // Target common content blocks (exclude hero to avoid double effects).
    const candidates = Array.from(
      document.querySelectorAll(
        "main .section .panel, main .section .stat, main .section .card, main .section .timeline-item"
      )
    ).filter((el) => !el.classList.contains("reveal") && !el.closest(".hero"));

    if (!candidates.length) return;

    // Add a subtle stagger within local groups (cards/stats/timelines).
    const groupCounter = new WeakMap();
    const getGroup = (el) =>
      el.closest(".cards") || el.closest(".stats") || el.closest(".timeline") || el.closest(".section") || document.body;

    candidates.forEach((el) => {
      const group = getGroup(el);
      const idx = groupCounter.get(group) || 0;
      groupCounter.set(group, idx + 1);
      const delay = Math.min(idx, 7) * 110;
      el.style.setProperty("--reveal-delay", `${delay}ms`);
    });

    // If user prefers reduced motion, show everything immediately.
    if (reduce || typeof IntersectionObserver === "undefined") {
      candidates.forEach((el) => {
        el.classList.add("reveal-scroll", "is-visible");
      });
      return;
    }

    candidates.forEach((el) => {
      el.classList.add("reveal-scroll");
    });

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    candidates.forEach((el) => io.observe(el));
  }

  function setupSequentialText() {
    const reduce = prefersReducedMotion();
    if (reduce) return;

    const els = new Set([
      ...Array.from(document.querySelectorAll("[data-seq-text]")),
      ...Array.from(document.querySelectorAll(".brand-name")),
    ]);

    els.forEach((el) => {
      if (!el || el.dataset.seqReady === "true") return;
      const raw = (el.textContent || "").trim();
      if (!raw) return;

      el.dataset.seqReady = "true";
      el.classList.add("seq-text");
      el.setAttribute("aria-label", raw);
      el.textContent = "";

      const frag = document.createDocumentFragment();
      Array.from(raw).forEach((ch, i) => {
        const span = document.createElement("span");
        span.textContent = ch;
        span.style.setProperty("--i", String(i));
        span.setAttribute("aria-hidden", "true");
        frag.appendChild(span);
      });
      el.appendChild(frag);
    });
  }

  function setupNavMenu() {
    const navs = Array.from(document.querySelectorAll("[data-nav]"));
    if (!navs.length) return;

    function setLinksInteractive(links, interactive) {
      if (!links) return;
      links.setAttribute("aria-hidden", interactive ? "false" : "true");
      links.querySelectorAll("a, button").forEach((el) => {
        if (interactive) {
          el.removeAttribute("tabindex");
        } else {
          el.setAttribute("tabindex", "-1");
        }
      });
    }

    function closeAll() {
      navs.forEach((nav) => {
        nav.setAttribute("data-open", "false");
        const btn = nav.querySelector("[data-nav-toggle]");
        if (btn) btn.setAttribute("aria-expanded", "false");

        const links = nav.querySelector("[data-nav-links]");
        setLinksInteractive(links, false);
      });
    }

    navs.forEach((nav) => {
      nav.setAttribute("data-open", "false");
      const btn = nav.querySelector("[data-nav-toggle]");
      const links = nav.querySelector("[data-nav-links]");
      if (!btn || !links) return;

      setLinksInteractive(links, false);

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const isOpen = nav.getAttribute("data-open") === "true";
        closeAll();
        const nextOpen = !isOpen;
        nav.setAttribute("data-open", nextOpen ? "true" : "false");
        btn.setAttribute("aria-expanded", nextOpen ? "true" : "false");
        setLinksInteractive(links, nextOpen);
      });

      links.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          closeAll();
        });
      });
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (!target) return;
      const inside = navs.some((nav) => nav.contains(target));
      if (!inside) closeAll();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      closeAll();
    });
  }

  function setupActiveNavLink() {
    const links = Array.from(document.querySelectorAll(".nav-links a.nav-link[href]"));
    if (!links.length) return;

    const normalizePath = (pathname) => {
      if (!pathname) return "/";
      let p = pathname;
      if (!p.startsWith("/")) p = `/${p}`;
      // Treat /index.html as /
      if (p === "/index.html") return "/";
      // Remove trailing slash (except root)
      if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
      return p;
    };

    const currentPath = normalizePath(window.location.pathname);
    const currentHash = (window.location.hash || "").toLowerCase();

    // First pass: exact match on path + hash (only if link has a hash)
    let matched = false;

    links.forEach((a) => {
      try {
        const href = a.getAttribute("href") || "";
        const url = new URL(href, window.location.origin);
        const targetPath = normalizePath(url.pathname);
        const targetHash = (url.hash || "").toLowerCase();

        const isExact =
          targetPath === currentPath &&
          ((targetHash && targetHash === currentHash) || (!targetHash && !currentHash));

        if (isExact) {
          a.setAttribute("aria-current", "page");
          matched = true;
        } else {
          a.removeAttribute("aria-current");
        }
      } catch {
        // Ignore malformed URLs
      }
    });

    if (matched) return;

    // Fallback: match only by path, but avoid treating "/#..." as the homepage when user is on "/" with no hash.
    links.forEach((a) => {
      try {
        const href = a.getAttribute("href") || "";
        const url = new URL(href, window.location.origin);
        const targetPath = normalizePath(url.pathname);
        const targetHash = (url.hash || "").toLowerCase();

        const isPathMatch = targetPath === currentPath;
        const allowFallback = !targetHash; // don't auto-activate hash links unless hash matches

        if (isPathMatch && allowFallback) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      } catch {
        // Ignore malformed URLs
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setupAvailabilityGate();
      markLoaded();
      setupSequentialText();
      setupScrollReveal();
      setupActiveNavLink();
      setupNavMenu();
      setupHeaderScrollState();
    });
  } else {
    setupAvailabilityGate();
    markLoaded();
    setupSequentialText();
    setupScrollReveal();
    setupActiveNavLink();
    setupNavMenu();
    setupHeaderScrollState();
  }
})();
