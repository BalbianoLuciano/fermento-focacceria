import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

/**
 * Loads the Firebase service account credentials.
 *
 * Precedence:
 *   1. FIREBASE_SERVICE_ACCOUNT        — JSON string in the env var.
 *   2. FIREBASE_SERVICE_ACCOUNT_PATH   — filesystem path (defaults to
 *      `.firebase-service-account.json` at the repo root).
 *
 * The JSON is obtained once from Firebase Console → Project Settings →
 * Service accounts → Generate new private key. It is gitignored and must
 * never leave the developer's machine or Vercel's encrypted env storage.
 */
function loadServiceAccount(): ServiceAccount {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    return JSON.parse(inline) as ServiceAccount;
  }

  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    resolve(process.cwd(), ".firebase-service-account.json");

  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as ServiceAccount;
}

export function getAdminApp(): App {
  if (getApps().length > 0) return getApp();
  const credential = loadServiceAccount();
  return initializeApp({
    credential: cert(credential),
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
      (credential as { projectId?: string }).projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
