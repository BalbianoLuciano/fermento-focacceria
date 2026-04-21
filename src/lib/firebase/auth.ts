import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(getFirebaseAuth(), googleProvider);
}

export function signOutUser() {
  return signOut(getFirebaseAuth());
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

// Baseline admin list — mirrors the same hardcoded list in firestore.rules and
// storage.rules (Firebase rules can't read env vars, so the source of truth
// lives in both places). Keeps the client gate working even when Vercel is
// missing the NEXT_PUBLIC_ADMIN_EMAILS env var.
const CORE_ADMIN_EMAILS = [
  "kowalczukannaiel@gmail.com",
  "balbiano06@gmail.com",
];

function adminEmailsList(): string[] {
  const envEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(
    new Set([...CORE_ADMIN_EMAILS.map((e) => e.toLowerCase()), ...envEmails]),
  );
}

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  return adminEmailsList().includes(user.email.toLowerCase());
}
