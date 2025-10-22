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

// <-- paste your config from the Firebase Console (Web App config)
const firebaseConfig = {
  apiKey: "AIzaSyDLYt3yLKL14vuYlNaChR6NVeJAUPDVwdk",
  authDomain: "services-for-event.firebaseapp.com",
  databaseURL: "https://services-for-event-default-rtdb.firebaseio.com",
  projectId: "services-for-event",
  storageBucket: "services-for-event.firebasestorage.app",
  messagingSenderId: "959855488371",
  appId: "1:959855488371:web:0c954e56b659d793b0e906",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// ---- Auth helpers (always return plain user) ----
export const watchUser = (cb) =>
  onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null));

export async function signupWithName(email, password, name = "") {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
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
