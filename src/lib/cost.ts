import type { Ingredient, Product } from "@/lib/types";

export type IngredientMap = Map<string, Ingredient>;

export function buildIngredientMap(ingredients: Ingredient[]): IngredientMap {
  return new Map(ingredients.map((ing) => [ing.id, ing]));
}

/**
 * Cost of producing one unit of the given product size at current ingredient
 * prices. Returns 0 when the product or size has no recipe — that way items
 * with unknown cost simply don't contribute to the profit calculation.
 */
export function computeItemUnitCost(
  product: Product | undefined,
  sizeName: string,
  ingredientsById: IngredientMap,
): number {
  if (!product) return 0;
  const size = product.sizes.find((s) => s.name === sizeName);
  if (!size?.recipe?.length) return 0;
  let cost = 0;
  for (const line of size.recipe) {
    const ing = ingredientsById.get(line.ingredientId);
    if (!ing) continue;
    cost += ing.pricePerUnit * line.quantity;
  }
  return cost;
}

/**
 * Snapshots the cost of every cart line against the current catalog and
 * ingredient prices. Returns the per-line unit/subtotal cost plus the order
 * totalCost and profit — ready to be written to the Firestore order.
 */
export function computeOrderCosts<
  T extends { productId: string; sizeName: string; unitPrice: number; qty: number },
>(
  items: T[],
  products: Product[],
  ingredients: Ingredient[],
): {
  items: Array<
    T & {
      subtotal: number;
      unitCost: number;
      subtotalCost: number;
    }
  >;
  total: number;
  totalCost: number;
  profit: number;
} {
  const ingredientMap = buildIngredientMap(ingredients);
  const productMap = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item) => {
    const product = productMap.get(item.productId);
    const unitCost = computeItemUnitCost(product, item.sizeName, ingredientMap);
    const subtotal = item.unitPrice * item.qty;
    const subtotalCost = unitCost * item.qty;
    return { ...item, subtotal, unitCost, subtotalCost };
  });

  const total = lines.reduce((s, l) => s + l.subtotal, 0);
  const totalCost = lines.reduce((s, l) => s + l.subtotalCost, 0);
  const profit = total - totalCost;

  return { items: lines, total, totalCost, profit };
}
