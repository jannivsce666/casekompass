import {
  auth,
  db,
  deleteAccountAndData,
  loadUserProfile,
  onUserChanged,
  saveUserProfile,
  signInWithGoogle,
  signOutUser,
} from "./firebase.js";
import { onValue, ref } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

function $(id) {
  return document.getElementById(id);
}

function setText(el, value) {
  if (!el) return;
  el.textContent = value == null ? "" : String(value);
}

function show(el, isVisible) {
  if (!el) return;
  el.style.display = isVisible ? "" : "none";
}

function formatDate(ts) {
  try {
    return new Date(ts).toLocaleString("de-DE");
  } catch {
    return String(ts);
  }
}

function renderPurchases(target, purchasesObj) {
  if (!target) return;
  const entries = purchasesObj ? Object.entries(purchasesObj) : [];
  if (!entries.length) {
    target.textContent = "Noch keine Einträge.";
    return;
  }

  const sorted = entries
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  target.innerHTML = sorted
    .slice(0, 20)
    .map((p) => {
      const lines = Array.isArray(p.lines) ? p.lines : [];
      const lineText = lines
        .map((l) => `${l.name || l.id} × ${l.qty || 1}`)
        .join(", ");

      return `
        <div style="padding: 10px 0; border-top: 1px solid var(--border);">
          <strong>${formatDate(p.createdAt)}</strong><br />
          <span>${lineText || "(ohne Details)"}</span><br />
          <span>Gesamt: ${p.totalLabel || (p.total != null ? String(p.total) : "")}</span>
        </div>
      `;
    })
    .join("");
}

function renderAppointments(target, appointmentsObj) {
  if (!target) return;
  const entries = appointmentsObj ? Object.entries(appointmentsObj) : [];
  if (!entries.length) {
    target.textContent = "Noch keine Einträge.";
    return;
  }

  const sorted = entries
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  target.innerHTML = sorted
    .slice(0, 20)
    .map((a) => {
      const label = a.slotLabel || a.slotIso || "(Termin)";
      return `
        <div style="padding: 10px 0; border-top: 1px solid var(--border);">
          <strong>${label}</strong><br />
          <span>Erstellt: ${formatDate(a.createdAt)}</span><br />
          <span>Art: ${a.type || ""}</span>
        </div>
      `;
    })
    .join("");
}

async function main() {
  const btnLogin = $("btn-login");
  const btnLogout = $("btn-logout");
  const authStatus = $("auth-status");

  const profileSummary = $("profile-summary");
  const summaryEmail = $("summary-email");
  const summaryName = $("summary-name");

  const sectionProfile = $("section-profile");
  const sectionHistory = $("section-history");

  const profileForm = $("profile-form");
  const profileStatus = $("profile-status");

  const fullName = $("fullName");
  const email = $("email");
  const phone = $("phone");
  const street = $("street");
  const postalCode = $("postalCode");
  const city = $("city");
  const privacyConsent = $("privacyConsent");

  const btnDelete = $("btn-delete");

  const purchasesEl = $("purchases");
  const appointmentsEl = $("appointments");

  let currentUid = null;
  let unsubPurchases = null;
  let unsubAppointments = null;

  function setStatus(message, isError = false) {
    if (!profileStatus) return;
    profileStatus.style.display = "block";
    profileStatus.textContent = message;
    profileStatus.style.color = isError ? "#b91c1c" : "";
  }

  function clearStatus() {
    if (!profileStatus) return;
    profileStatus.style.display = "none";
    profileStatus.textContent = "";
    profileStatus.style.color = "";
  }

  async function refreshProfile(user) {
    currentUid = user ? user.uid : null;

    if (!user) {
      setText(authStatus, "Status: nicht angemeldet");
      show(btnLogin, true);
      show(btnLogout, false);
      show(profileSummary, false);
      show(sectionProfile, false);
      show(sectionHistory, false);
      if (purchasesEl) purchasesEl.textContent = "Noch keine Einträge.";
      if (appointmentsEl) appointmentsEl.textContent = "Noch keine Einträge.";
      clearStatus();
      if (unsubPurchases) unsubPurchases();
      if (unsubAppointments) unsubAppointments();
      unsubPurchases = null;
      unsubAppointments = null;
      return;
    }

    setText(authStatus, `Angemeldet: ${user.email || "(Google)"}`);
    show(btnLogin, false);
    show(btnLogout, true);
    show(profileSummary, true);
    show(sectionProfile, true);
    show(sectionHistory, true);

    setText(summaryEmail, user.email || "");

    const existing = await loadUserProfile(user.uid);

    // Prefill
    const displayName = user.displayName || "";
    if (fullName) fullName.value = (existing && existing.fullName) ? existing.fullName : displayName;
    if (email) email.value = user.email || (existing && existing.email) || "";
    if (phone) phone.value = (existing && existing.phone) || "";
    if (street) street.value = (existing && existing.street) || "";
    if (postalCode) postalCode.value = (existing && existing.postalCode) || "";
    if (city) city.value = (existing && existing.city) || "";
    if (privacyConsent) privacyConsent.checked = Boolean(existing && existing.privacyConsent === true);

    setText(summaryName, `Name: ${(existing && existing.fullName) ? existing.fullName : (displayName || "")}`);

    // Live history
    if (unsubPurchases) unsubPurchases();
    if (unsubAppointments) unsubAppointments();

    const purchasesRef = ref(db, `users/${user.uid}/purchases`);
    const appointmentsRef = ref(db, `users/${user.uid}/appointments`);

    unsubPurchases = onValue(purchasesRef, (snap) => {
      renderPurchases(purchasesEl, snap.exists() ? snap.val() : null);
    });

    unsubAppointments = onValue(appointmentsRef, (snap) => {
      renderAppointments(appointmentsEl, snap.exists() ? snap.val() : null);
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      try {
        await signInWithGoogle();
      } catch (e) {
        alert("Login fehlgeschlagen. Bitte erneut versuchen.");
      }
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      await signOutUser();
    });
  }

  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus();

      const user = auth.currentUser;
      if (!user) {
        setStatus("Bitte zuerst anmelden.", true);
        return;
      }

      if (!privacyConsent || !privacyConsent.checked) {
        setStatus("Bitte Datenschutzerklärung bestätigen.", true);
        return;
      }

      const payload = {
        fullName: fullName ? fullName.value.trim() : "",
        email: user.email || "",
        phone: phone ? phone.value.trim() : "",
        street: street ? street.value.trim() : "",
        postalCode: postalCode ? postalCode.value.trim() : "",
        city: city ? city.value.trim() : "",
        privacyConsent: true,
      };

      if (!payload.fullName || !payload.phone || !payload.street || !payload.postalCode || !payload.city) {
        setStatus("Bitte alle Pflichtfelder ausfüllen.", true);
        return;
      }

      try {
        await saveUserProfile(user.uid, payload);
        setStatus("Gespeichert.");
        setText(summaryName, `Name: ${payload.fullName}`);
      } catch {
        setStatus("Speichern fehlgeschlagen. Bitte erneut versuchen.", true);
      }
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener("click", async () => {
      const user = auth.currentUser;
      if (!user) return;

      const ok = confirm("Wirklich Konto UND alle Daten (Profil, Käufe, Termine) löschen?");
      if (!ok) return;

      try {
        await deleteAccountAndData();
        alert("Konto und Daten wurden gelöscht.");
      } catch {
        alert("Löschen fehlgeschlagen. Bitte erneut anmelden und nochmals versuchen.");
      }
    });
  }

  onUserChanged((user) => {
    void refreshProfile(user);
  });
}

void main();
