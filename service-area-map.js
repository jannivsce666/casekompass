(function () {
  const center = [48.7063332, 10.1619939]; // Am Rathaus, Schnaitheim
  const radiusMeters = 20000;

  function boundsFromCenterRadius(centerLatLng, radiusM) {
    // Approximate bounds without requiring the circle to be attached to a map.
    // Good enough for fitting a 20km service radius.
    const lat = centerLatLng[0];
    const lng = centerLatLng[1];
    const earthRadiusM = 6378137;
    const dLat = radiusM / earthRadiusM;
    const dLng = radiusM / (earthRadiusM * Math.cos((lat * Math.PI) / 180));
    const dLatDeg = (dLat * 180) / Math.PI;
    const dLngDeg = (dLng * 180) / Math.PI;
    return window.L.latLngBounds(
      [lat - dLatDeg, lng - dLngDeg],
      [lat + dLatDeg, lng + dLngDeg]
    );
  }

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
    // Avoid circle.getBounds() here because it can throw if the internal map ref isn't ready yet.
    const bounds = boundsFromCenterRadius(center, radiusMeters);
    map.fitBounds(bounds, { padding: [24, 24] });

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
