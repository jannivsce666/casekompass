import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMND2wIYLxKxMRGAWbio4bYcVB9k0h7do",
  authDomain: "casekompass.firebaseapp.com",
  databaseURL: "https://casekompass-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "casekompass",
  storageBucket: "casekompass.firebasestorage.app",
  messagingSenderId: "791049710344",
  appId: "1:791049710344:web:8d1430846ee843717b9abd",
  measurementId: "G-P8CH512TPQ",
};

export const app = initializeApp(firebaseConfig);

async function initAnalytics() {
  try {
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    if (!(await isSupported())) return;
    getAnalytics(app);
  } catch {
    // Ignore analytics init errors (e.g., blocked cookies/trackers)
  }
}

void initAnalytics();

function setNavAvatarSignedOut() {
  const avatars = Array.from(document.querySelectorAll("[data-nav-avatar]"));
  if (!avatars.length) return;
  avatars.forEach((el) => {
    el.setAttribute("data-avatar-state", "signed-out");
    el.setAttribute("data-has-photo", "false");
    el.setAttribute("data-initials", "");
    el.style.backgroundImage = "";
    el.style.backgroundSize = "";
    el.style.backgroundPosition = "";
    el.style.backgroundRepeat = "";
  });
}

try {
  setNavAvatarSignedOut();
} catch {
  // ignore
}

// Bridge for legacy non-module scripts.
// (cart.js and some inline scripts are classic scripts and can't import ES modules.)
if (typeof window !== "undefined") {
  window.CasekompassFirebase = {
    app,
  };
}
