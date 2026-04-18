import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { GalleryImage } from "@/lib/types";

const COLLECTION = "gallery";

function galleryCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

function galleryDoc(id: string) {
  return doc(getFirebaseDb(), COLLECTION, id);
}

function mapImage(id: string, data: Record<string, unknown>): GalleryImage {
  return { id, ...(data as Omit<GalleryImage, "id">) };
}

export async function listGalleryImages(): Promise<GalleryImage[]> {
  const snap = await getDocs(query(galleryCol(), orderBy("order", "asc")));
  return snap.docs.map((d) => mapImage(d.id, d.data()));
}

type GalleryInput = Omit<GalleryImage, "id" | "createdAt">;

export async function createGalleryImage(id: string, data: GalleryInput) {
  await setDoc(galleryDoc(id), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateGalleryImage(
  id: string,
  data: Partial<GalleryInput>,
) {
  await updateDoc(galleryDoc(id), data);
}

export async function deleteGalleryImage(id: string) {
  await deleteDoc(galleryDoc(id));
}
