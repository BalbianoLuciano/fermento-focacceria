import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import type { Product } from "@/lib/types";

const COLLECTION = "products";

function productsCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

function productDoc(id: string) {
  return doc(getFirebaseDb(), COLLECTION, id);
}

function mapProduct(id: string, data: Record<string, unknown>): Product {
  return { id, ...(data as Omit<Product, "id">) };
}

export async function listProducts(options: { activeOnly?: boolean } = {}) {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")];
  if (options.activeOnly) constraints.unshift(where("active", "==", true));
  const snap = await getDocs(query(productsCol(), ...constraints));
  return snap.docs.map((d) => mapProduct(d.id, d.data()));
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(productDoc(id));
  if (!snap.exists()) return null;
  return mapProduct(snap.id, snap.data());
}

type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export async function createProduct(
  id: string,
  data: ProductInput,
): Promise<void> {
  await setDoc(productDoc(id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateProduct(
  id: string,
  data: Partial<ProductInput>,
): Promise<void> {
  await updateDoc(productDoc(id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(productDoc(id));
}

export async function setProductActive(
  id: string,
  active: boolean,
): Promise<void> {
  await updateDoc(productDoc(id), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function addProduct(data: ProductInput): Promise<string> {
  const ref = await addDoc(productsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeProducts(
  callback: (products: Product[]) => void,
  options: { activeOnly?: boolean } = {},
): Unsubscribe {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")];
  if (options.activeOnly) constraints.unshift(where("active", "==", true));
  return onSnapshot(query(productsCol(), ...constraints), (snap) =>
    callback(snap.docs.map((d) => mapProduct(d.id, d.data()))),
  );
}
