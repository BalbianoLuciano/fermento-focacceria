import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  productId: string;
  productName: string;
  sizeName: string;
  unitPrice: number;
  qty: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void;
  removeItem: (productId: string, sizeName: string) => void;
  updateQty: (productId: string, sizeName: string, qty: number) => void;
  clear: () => void;
}

const isSameLine = (a: CartItem, productId: string, sizeName: string) =>
  a.productId === productId && a.sizeName === sizeName;

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const qty = item.qty ?? 1;
          const existing = state.items.find((i) =>
            isSameLine(i, item.productId, item.sizeName),
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                isSameLine(i, item.productId, item.sizeName)
                  ? { ...i, qty: i.qty + qty }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                productId: item.productId,
                productName: item.productName,
                sizeName: item.sizeName,
                unitPrice: item.unitPrice,
                qty,
              },
            ],
          };
        }),

      removeItem: (productId, sizeName) =>
        set((state) => ({
          items: state.items.filter((i) => !isSameLine(i, productId, sizeName)),
        })),

      updateQty: (productId, sizeName, qty) =>
        set((state) => {
          if (qty <= 0) {
            return {
              items: state.items.filter(
                (i) => !isSameLine(i, productId, sizeName),
              ),
            };
          }
          return {
            items: state.items.map((i) =>
              isSameLine(i, productId, sizeName) ? { ...i, qty } : i,
            ),
          };
        }),

      clear: () => set({ items: [] }),
    }),
    {
      name: "fermento-cart-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Selectors — use with useCartStore(selectTotal) to subscribe narrowly.
export const selectTotal = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

export const selectItemCount = (state: CartState) =>
  state.items.reduce((sum, i) => sum + i.qty, 0);

export const selectIsEmpty = (state: CartState) => state.items.length === 0;
