import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Review } from "@/lib/types";

const COLLECTION = "reviews";

function reviewsCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

function reviewDoc(id: string) {
  return doc(getFirebaseDb(), COLLECTION, id);
}

function mapReview(id: string, data: Record<string, unknown>): Review {
  return { id, ...(data as Omit<Review, "id">) };
}

export async function listReviews(options: { activeOnly?: boolean } = {}) {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")];
  if (options.activeOnly) constraints.unshift(where("active", "==", true));
  const snap = await getDocs(query(reviewsCol(), ...constraints));
  return snap.docs.map((d) => mapReview(d.id, d.data()));
}

type ReviewInput = Omit<Review, "id" | "createdAt">;

export async function createReview(id: string, data: ReviewInput) {
  await setDoc(reviewDoc(id), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function updateReview(id: string, data: Partial<ReviewInput>) {
  await updateDoc(reviewDoc(id), data);
}

export async function deleteReview(id: string) {
  await deleteDoc(reviewDoc(id));
}

export async function addReview(data: ReviewInput): Promise<string> {
  const ref = await addDoc(reviewsCol(), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeReviews(
  callback: (reviews: Review[]) => void,
  options: { activeOnly?: boolean } = {},
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")];
  if (options.activeOnly) constraints.unshift(where("active", "==", true));
  return onSnapshot(query(reviewsCol(), ...constraints), (snap) =>
    callback(snap.docs.map((d) => mapReview(d.id, d.data()))),
  );
}
