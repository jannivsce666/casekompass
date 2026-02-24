(function () {
  var releaseDate = new Date("2026-04-01T00:00:00+02:00");
  var now = new Date();
  var comingSoonPath = "/coming-soon.html";
  var currentPath = window.location.pathname;
  var isComingSoonPage =
    currentPath === comingSoonPath ||
    currentPath === "coming-soon.html" ||
    currentPath.endsWith("/coming-soon.html");

  if (now < releaseDate) {
    if (!isComingSoonPage) {
      window.location.replace(comingSoonPath);
    }
    return;
  }

  if (isComingSoonPage) {
    window.location.replace("/");
  }
})();
