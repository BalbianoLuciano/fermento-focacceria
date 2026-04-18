import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export const googleProvider = new GoogleAuthProvider();

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function signOutUser() {
  return signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export function isAdmin(user: User | null): boolean {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  if (!user?.email || !adminEmail) return false;
  return user.email.toLowerCase() === adminEmail.toLowerCase();
}
