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
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Ingredient } from "@/lib/types";

const COLLECTION = "ingredients";

function ingredientsCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

function ingredientDoc(id: string) {
  return doc(getFirebaseDb(), COLLECTION, id);
}

function mapIngredient(id: string, data: Record<string, unknown>): Ingredient {
  return { id, ...(data as Omit<Ingredient, "id">) };
}

type IngredientInput = Omit<Ingredient, "id" | "createdAt" | "updatedAt">;

export async function listIngredients(
  options: { activeOnly?: boolean } = {},
): Promise<Ingredient[]> {
  const snap = await getDocs(
    query(ingredientsCol(), orderBy("order", "asc")),
  );
  const all = snap.docs.map((d) => mapIngredient(d.id, d.data()));
  return options.activeOnly ? all.filter((i) => i.active) : all;
}

export function subscribeIngredients(
  callback: (ingredients: Ingredient[]) => void,
  options: { activeOnly?: boolean } = {},
): Unsubscribe {
  return onSnapshot(
    query(ingredientsCol(), orderBy("order", "asc")),
    (snap) => {
      const all = snap.docs.map((d) => mapIngredient(d.id, d.data()));
      callback(options.activeOnly ? all.filter((i) => i.active) : all);
    },
  );
}

export async function createIngredient(
  id: string,
  data: IngredientInput,
): Promise<void> {
  await setDoc(ingredientDoc(id), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function addIngredient(data: IngredientInput): Promise<string> {
  const ref = await addDoc(ingredientsCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateIngredient(
  id: string,
  data: Partial<IngredientInput>,
): Promise<void> {
  await updateDoc(ingredientDoc(id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteIngredient(id: string): Promise<void> {
  await deleteDoc(ingredientDoc(id));
}

export async function setIngredientActive(
  id: string,
  active: boolean,
): Promise<void> {
  await updateDoc(ingredientDoc(id), {
    active,
    updatedAt: serverTimestamp(),
  });
}
