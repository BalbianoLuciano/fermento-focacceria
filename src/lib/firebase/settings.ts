import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Settings } from "@/lib/types";

const COLLECTION = "settings";
const DOC_ID = "global";

function settingsDoc() {
  return doc(getFirebaseDb(), COLLECTION, DOC_ID);
}

export async function getSettings(): Promise<Settings | null> {
  const snap = await getDoc(settingsDoc());
  if (!snap.exists()) return null;
  return snap.data() as Settings;
}

export async function updateSettings(data: Partial<Settings>): Promise<void> {
  await setDoc(settingsDoc(), data, { merge: true });
}
