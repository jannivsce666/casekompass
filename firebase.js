import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  GoogleAuthProvider,
  deleteUser,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getDatabase,
  get,
  push,
  ref,
  remove,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBMND2wIYLxKxMRGAWbio4bYcVB9k0h7do",
  authDomain: "casekompass.firebaseapp.com",
  projectId: "casekompass",
  storageBucket: "casekompass.firebasestorage.app",
  messagingSenderId: "791049710344",
  appId: "1:791049710344:web:8d1430846ee843717b9abd",
  measurementId: "G-P8CH512TPQ",
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

const googleProvider = new GoogleAuthProvider();

export function onUserChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

function userProfileRef(uid) {
  return ref(db, `users/${uid}/profile`);
}

export async function loadUserProfile(uid) {
  const snap = await get(userProfileRef(uid));
  return snap.exists() ? snap.val() : null;
}

export async function saveUserProfile(uid, profile) {
  const payload = {
    ...profile,
    updatedAt: Date.now(),
  };
  await update(userProfileRef(uid), payload);
  return payload;
}

export async function addUserAppointment(uid, appointment) {
  const appointmentsRef = ref(db, `users/${uid}/appointments`);
  const nodeRef = push(appointmentsRef);
  const payload = { ...appointment, createdAt: Date.now() };
  await set(nodeRef, payload);
  return { id: nodeRef.key, ...payload };
}

export async function addUserPurchase(uid, purchase) {
  const purchasesRef = ref(db, `users/${uid}/purchases`);
  const nodeRef = push(purchasesRef);
  const payload = { ...purchase, createdAt: Date.now() };
  await set(nodeRef, payload);
  return { id: nodeRef.key, ...payload };
}

export async function deleteAccountAndData() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not signed in");
  await remove(ref(db, `users/${user.uid}`));
  await deleteUser(user);
}

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

function computeInitials(displayName, email) {
  const base = (displayName || "").trim() || (email || "").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  const a = (parts[0] || "?")[0] || "?";
  const b = (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return (a + b).toUpperCase();
}

function updateNavAvatar(user) {
  const avatars = Array.from(document.querySelectorAll("[data-nav-avatar]"));
  if (!avatars.length) return;

  const initials = computeInitials(user && user.displayName, user && user.email);
  const photo = user && user.photoURL ? String(user.photoURL) : "";

  const isSignedIn = Boolean(user);
  const hasPhoto = Boolean(photo);

  avatars.forEach((el) => {
    el.setAttribute("data-avatar-state", isSignedIn ? "signed-in" : "signed-out");
    el.setAttribute("data-has-photo", isSignedIn && hasPhoto ? "true" : "false");
    el.setAttribute("data-initials", isSignedIn ? initials : "");

    if (isSignedIn && hasPhoto) {
      el.style.backgroundImage = `url('${photo}')`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.backgroundRepeat = "no-repeat";
    } else {
      el.style.backgroundImage = "";
      el.style.backgroundSize = "";
      el.style.backgroundPosition = "";
      el.style.backgroundRepeat = "";
    }
  });
}

onAuthStateChanged(auth, (user) => {
  try {
    updateNavAvatar(user);
  } catch {
    // ignore
  }
});

// Bridge for legacy non-module scripts.
// (cart.js and some inline scripts are classic scripts and can't import ES modules.)
if (typeof window !== "undefined") {
  window.CasekompassFirebase = {
    auth,
    db,
    onUserChanged,
    signInWithGoogle,
    signOutUser,
    loadUserProfile,
    saveUserProfile,
    addUserAppointment,
    addUserPurchase,
    deleteAccountAndData,
  };
}
