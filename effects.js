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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      markLoaded();
      setupScrollReveal();
    });
  } else {
    markLoaded();
    setupScrollReveal();
  }
})();
