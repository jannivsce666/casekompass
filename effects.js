(function () {
  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function markLoaded() {
    // Used by existing CSS animations (hero reveal).
    requestAnimationFrame(() => {
      document.documentElement.classList.add("is-loaded");
    });
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
      const delay = Math.min(idx, 6) * 70;
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
        span.textContent = ch === " " ? "\u00A0" : ch;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      markLoaded();
      setupSequentialText();
      setupScrollReveal();
      setupNavMenu();
    });
  } else {
    markLoaded();
    setupSequentialText();
    setupScrollReveal();
    setupNavMenu();
  }
})();
