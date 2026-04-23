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

function toDate(ts: unknown): Date | null {
  if (!ts) return null;
  const maybe = ts as { toDate?: () => Date };
  if (typeof maybe.toDate === "function") return maybe.toDate();
  return null;
}

function applyFilters(orders: Order[], filters: OrderFilters): Order[] {
  return orders.filter((order) => {
    if (filters.status && order.status !== filters.status) return false;
    if (typeof filters.paid === "boolean" && order.paid !== filters.paid) return false;
    if (filters.from || filters.to) {
      const created = toDate(order.createdAt);
      if (!created) return false;
      if (filters.from && created < filters.from) return false;
      if (filters.to && created > filters.to) return false;
    }
    return true;
  });
}

export async function listOrders(filters: OrderFilters = {}): Promise<Order[]> {
  // Server-side sort, client-side filter. Skips the composite index that
  // status/paid/createdAt range queries would need.
  const snap = await getDocs(query(ordersCol(), orderBy("createdAt", "desc")));
  const all = snap.docs.map((d) => mapOrder(d.id, d.data()));
  return applyFilters(all, filters);
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
    query(ordersCol(), orderBy("createdAt", "desc")),
    (snap) => {
      const all = snap.docs.map((d) => mapOrder(d.id, d.data()));
      callback(applyFilters(all, filters));
    },
  );
}

export type CreateOrderInput = Omit<
  Order,
  "id" | "createdAt" | "updatedAt" | "paidAt"
>;

export async function createOrder(data: CreateOrderInput): Promise<string> {
  // Firestore rejects undefined values — drop any keys that are undefined
  // before writing (mostly optional fields like notes).
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  const ref = await addDoc(ordersCol(), {
    ...cleaned,
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

export type UpdateOrderInput = Omit<
  Partial<Omit<Order, "id" | "createdAt" | "updatedAt">>,
  "deliveryDate" | "deliveryZone" | "notes"
> & {
  deliveryDate?: string | null;
  deliveryZone?: Order["deliveryZone"] | null;
  notes?: string | null;
};

/**
 * Full order edit (items, totals, customer, notes). Any key with `undefined`
 * is dropped before the write so Firestore doesn't reject it.
 */
export async function updateOrder(
  id: string,
  data: UpdateOrderInput,
): Promise<void> {
  const cleaned = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
  await updateDoc(orderDoc(id), {
    ...cleaned,
    updatedAt: serverTimestamp(),
  });
}
