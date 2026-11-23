import { create } from "zustand";
import { persist } from "zustand/middleware";
import { packLineTotal } from "@/lib/packPricing";
import type { PackTier } from "@/lib/packPricing";

export interface CartItem {
  productId: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  /**
   * Optional, and it has to stay that way: this store is `persist`ed to
   * localStorage, so a shopper who filled their basket before English shipped
   * comes back with lines that have no `nameEn` at all. `pickLang` falls back
   * to French for those, which is what the cart used to show them anyway.
   */
  nameEn?: string | null;
  price: number;
  imageUrl: string | null;
  quantity: number;
  /**
   * Pack lines (0021): `productId` is then `pack:<id>` — a line KEY, never
   * sent as a product — and `packId` is what place_order receives. Tiers and
   * free shipping are a display snapshot; the server re-prices everything.
   */
  packId?: string;
  tiers?: PackTier[];
  freeShipping?: boolean;
  maxQty?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const MAX_LINE_QTY = 20;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      isOpen: false,
      addItem: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...item, quantity: Math.min(item.maxQty ?? MAX_LINE_QTY, i.quantity + quantity) }
                  : i,
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity: Math.min(item.maxQty ?? MAX_LINE_QTY, quantity) }],
            isOpen: true,
          };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity: Math.min(i.maxQty ?? MAX_LINE_QTY, quantity) }
                    : i,
                ),
        })),
      clear: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: "norlyn-cart",
      partialize: (state) => ({ items: state.items }) as CartState,
    },
  ),
);

/** A pack line's quantity tiers apply to the LINE, exactly like pack_line_total(). */
export function cartLineTotal(item: Pick<CartItem, "price" | "quantity" | "packId" | "tiers">): number {
  return item.packId ? packLineTotal(item.price, item.quantity, { tiers: item.tiers }) : item.price * item.quantity;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartLineTotal(item), 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
