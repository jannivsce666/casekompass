(function () {
  const center = [48.7063332, 10.1619939]; // Am Rathaus, Schnaitheim
  const radiusMeters = 20000;

  function initServiceAreaMap() {
    const el = document.getElementById("service-area-map");
    if (!el) return;
    if (typeof window.L === "undefined") return;

    const map = window.L.map(el, {
      zoomControl: false,
      attributionControl: true,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      tap: false,
    });

    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const circle = window.L.circle(center, {
      radius: radiusMeters,
      color: "#2D6A6C",
      weight: 2,
      fillColor: "#4CA1A3",
      fillOpacity: 0.14,
    }).addTo(map);

    window.L.marker(center, { keyboard: false }).addTo(map);

    // Fit view to show the whole service radius with a bit of padding.
    map.fitBounds(circle.getBounds(), { padding: [24, 24] });

    // Extra hardening against interaction (mobile/trackpad quirks)
    map.on("click", (e) => {
      if (e && e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initServiceAreaMap);
  } else {
    initServiceAreaMap();
  }
})();
