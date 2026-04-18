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
  updateDoc,
  where,
  type QueryConstraint,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { Order, OrderStatus } from "@/lib/types";

const COLLECTION = "orders";

function ordersCol() {
  return collection(getFirebaseDb(), COLLECTION);
}

function orderDoc(id: string) {
  return doc(getFirebaseDb(), COLLECTION, id);
}

function mapOrder(id: string, data: Record<string, unknown>): Order {
  return { id, ...(data as Omit<Order, "id">) };
}

export interface OrderFilters {
  status?: OrderStatus;
  paid?: boolean;
  from?: Date;
  to?: Date;
}

function buildConstraints(filters: OrderFilters = {}): QueryConstraint[] {
  const c: QueryConstraint[] = [];
  if (filters.status) c.push(where("status", "==", filters.status));
  if (typeof filters.paid === "boolean") c.push(where("paid", "==", filters.paid));
  if (filters.from) c.push(where("createdAt", ">=", filters.from));
  if (filters.to) c.push(where("createdAt", "<=", filters.to));
  c.push(orderBy("createdAt", "desc"));
  return c;
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  const snap = await getDocs(query(ordersCol(), ...buildConstraints(filters)));
  return snap.docs.map((d) => mapOrder(d.id, d.data()));
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(orderDoc(id));
  if (!snap.exists()) return null;
  return mapOrder(snap.id, snap.data());
}

export function subscribeOrders(
  filters: OrderFilters,
  callback: (orders: Order[]) => void,
): Unsubscribe {
  return onSnapshot(
    query(ordersCol(), ...buildConstraints(filters)),
    (snap) => callback(snap.docs.map((d) => mapOrder(d.id, d.data()))),
  );
}

export type CreateOrderInput = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "paidAt"
>;

export async function createOrder(data: CreateOrderInput): Promise<string> {
  const ref = await addDoc(ordersCol(), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<void> {
  await updateDoc(orderDoc(id), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function markPaid(id: string, paid: boolean): Promise<void> {
  await updateDoc(orderDoc(id), {
    paid,
    paidAt: paid ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(orderDoc(id));
}
