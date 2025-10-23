// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL, // keep only if you use Realtime DB
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId is optional; include only if you use Analytics:
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
    : {}),
};

const app = initializeApp(firebaseConfig);

// If you want Analytics (optional):
// (async () => { if (await isSupported()) getAnalytics(app); })();

export const auth = getAuth(app);
export const db = getFirestore(app);

// ---- Auth helpers (always return plain user) ----
export const watchUser = (cb) =>
  onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null));

export async function signupWithName(email, password, name = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  return toUser(cred.user);
}

export async function loginEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return toUser(cred.user);
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function logout() {
  return signOut(auth);
}

function toUser(u) {
  return { uid: u.uid, email: u.email || "", name: u.displayName || "" };
}

// ---- Bookings (Firestore) ----
const bookingsCol = collection(db, "bookings");

export async function createBooking(b) {
  const res = await addDoc(bookingsCol, b);
  return { id: res.id, ...b };
}

export async function listBookingsByUser(userId) {
  const q = query(bookingsCol, where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function deleteBookingById(id) {
  await deleteDoc(doc(db, "bookings", id));
}
