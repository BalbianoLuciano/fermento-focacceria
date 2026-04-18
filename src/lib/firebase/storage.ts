import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebase/client";

/**
 * Uploads a file to Firebase Storage and returns its public download URL.
 * `path` is the full destination path inside the bucket (e.g.
 * "products/product-naked/cover.jpg").
 */
export async function uploadImage(file: File, path: string): Promise<string> {
  const storage = getFirebaseStorage();
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, { contentType: file.type });
  return getDownloadURL(objectRef);
}

/**
 * Deletes an object by its download URL. Silently ignores "object-not-found"
 * since callers usually want delete to be idempotent.
 */
export async function deleteImage(url: string): Promise<void> {
  const storage = getFirebaseStorage();
  const path = parseUrlToPath(url);
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (isNotFound(error)) return;
    throw error;
  }
}

function parseUrlToPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/o\/(.+)$/);
    if (!match) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "storage/object-not-found"
  );
}
