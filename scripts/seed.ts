/**
 * Fermento Focacceria — idempotent seed script.
 *
 * Seeds ingredients, products (with recipes), settings/global and sample
 * reviews using the Firebase Admin SDK (service account credentials bypass
 * Firestore rules — only run from a trusted machine). IDs are stable so
 * re-running does not duplicate data; admin edits to imageUrl / active /
 * recipe are preserved across runs.
 *
 * Usage:
 *   1. Download a service account key from Firebase Console → Project Settings
 *      → Service accounts → Generate new private key.
 *   2. Save it at the repo root as `.firebase-service-account.json` (already
 *      gitignored). Or set FIREBASE_SERVICE_ACCOUNT (inline JSON) or
 *      FIREBASE_SERVICE_ACCOUNT_PATH.
 *   3. Run: npx tsx scripts/seed.ts
 */

import "dotenv/config";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "../src/lib/firebase/admin";

type IngredientUnit = "g" | "ml" | "un";

interface IngredientSeed {
  id: string;
  name: string;
  unit: IngredientUnit;
  pricePerUnit: number;
  packageSize?: number;
  packagePrice?: number;
  order: number;
}

// Prices and packages given by the user (Corrientes, April 2026).
const INGREDIENTS: IngredientSeed[] = [
  {
    id: "ingredient-harina",
    name: "Harina 000",
    unit: "g",
    pricePerUnit: 0.85, // 850 / 1000
    packageSize: 1000,
    packagePrice: 850,
    order: 1,
  },
  {
    id: "ingredient-aceite-oliva",
    name: "Aceite de oliva",
    unit: "ml",
    pricePerUnit: 10, // 10000 / 1000
    packageSize: 1000,
    packagePrice: 10000,
    order: 2,
  },
  {
    id: "ingredient-levadura",
    name: "Levadura seca",
    unit: "g",
    pricePerUnit: 80, // 800 / 10
    packageSize: 10,
    packagePrice: 800,
    order: 3,
  },
  {
    id: "ingredient-sal",
    name: "Sal",
    unit: "g",
    pricePerUnit: 1.6, // 800 / 500
    packageSize: 500,
    packagePrice: 800,
    order: 4,
  },
  {
    id: "ingredient-cherry",
    name: "Tomate cherry",
    unit: "g",
    pricePerUnit: 6, // 6000 / 1000
    packageSize: 1000,
    packagePrice: 6000,
    order: 5,
  },
  {
    id: "ingredient-aceitunas",
    name: "Aceitunas",
    unit: "g",
    pricePerUnit: 16.33, // 2450 / 150
    packageSize: 150,
    packagePrice: 2450,
    order: 6,
  },
  {
    id: "ingredient-ajo",
    name: "Ajo",
    unit: "un", // unit = diente de ajo
    pricePerUnit: 60, // 600 / ~10 por cabeza
    packageSize: 10,
    packagePrice: 600,
    order: 7,
  },
  {
    id: "ingredient-muzzarella",
    name: "Muzzarella",
    unit: "g",
    pricePerUnit: 0.75, // 750 / 1000
    packageSize: 1000,
    packagePrice: 750,
    order: 8,
  },
  {
    id: "ingredient-sardo",
    name: "Sardo",
    unit: "g",
    pricePerUnit: 12, // 12000 / 1000
    packageSize: 1000,
    packagePrice: 12000,
    order: 9,
  },
];

// Base recipe (all individual focaccias share this).
const BASE_INDIVIDUAL = [
  { ingredientId: "ingredient-harina", quantity: 175 },
  { ingredientId: "ingredient-aceite-oliva", quantity: 17 },
  { ingredientId: "ingredient-levadura", quantity: 1 },
  { ingredientId: "ingredient-sal", quantity: 0.35 },
];

interface ProductSeed {
  id: string;
  name: string;
  description: string;
  sizes: Array<{
    name: string;
    price: number;
    recipe: Array<{ ingredientId: string; quantity: number }>;
  }>;
  order: number;
  defaultImageUrl?: string;
}

const PRODUCTS: ProductSeed[] = [
  {
    id: "product-naked",
    name: "Naked",
    description:
      "Sal y romero. La más honesta: masa madre, aceite de oliva y nada que la tape.",
    sizes: [
      { name: "Individual", price: 4000, recipe: [...BASE_INDIVIDUAL] },
      { name: "XL", price: 10000, recipe: [] }, // pendiente de confirmación
    ],
    order: 1,
    defaultImageUrl: "/naked-card.jpg",
  },
  {
    id: "product-mediterranea",
    name: "Mediterránea",
    description:
      "Tomate, aceituna, romero y sal. Para los que aman el sur de Italia.",
    sizes: [
      {
        name: "Individual",
        price: 5000,
        recipe: [
          ...BASE_INDIVIDUAL,
          { ingredientId: "ingredient-cherry", quantity: 80 },
          { ingredientId: "ingredient-aceitunas", quantity: 20 },
        ],
      },
      { name: "XL", price: 10000, recipe: [] },
    ],
    order: 2,
    defaultImageUrl: "/med-card.jpg",
  },
  {
    id: "product-garlic-lover",
    name: "Garlic Lover",
    description:
      "Mix de quesos duros y ajo infusionado en aceite de oliva. Intensa, tostada, obsesiva.",
    sizes: [
      {
        name: "Individual",
        price: 6000,
        recipe: [
          ...BASE_INDIVIDUAL,
          { ingredientId: "ingredient-ajo", quantity: 4 },
          { ingredientId: "ingredient-muzzarella", quantity: 25 },
          { ingredientId: "ingredient-sardo", quantity: 25 },
        ],
      },
      { name: "XL", price: 10000, recipe: [] },
    ],
    order: 3,
    defaultImageUrl: "/garlic-card.jpg",
  },
  {
    id: "product-mixta",
    name: "Mixta",
    description:
      "Cualquier combinación de los tres sabores. La indecisa por diseño.",
    sizes: [
      {
        name: "Individual",
        price: 6500,
        recipe: [
          ...BASE_INDIVIDUAL,
          { ingredientId: "ingredient-cherry", quantity: 40 },
          { ingredientId: "ingredient-aceitunas", quantity: 10 },
          { ingredientId: "ingredient-ajo", quantity: 2 },
          { ingredientId: "ingredient-muzzarella", quantity: 12 },
          { ingredientId: "ingredient-sardo", quantity: 12 },
        ],
      },
      { name: "XL", price: 10000, recipe: [] },
    ],
    order: 4,
    defaultImageUrl: "/mixta-card.jpg",
  },
];

interface ReviewSeed {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  order: number;
}

const REVIEWS: ReviewSeed[] = [
  {
    id: "review-seed-1",
    authorName: "Sofía M.",
    rating: 5,
    text: "La mediterránea es otra cosa. Crocante afuera, aireada adentro, y ese tomate al horno 🤌",
    order: 1,
  },
  {
    id: "review-seed-2",
    authorName: "Tomás R.",
    rating: 5,
    text: "Pedí una XL para compartir y terminé comiéndome la mitad solo. Anna hace magia.",
    order: 2,
  },
  {
    id: "review-seed-3",
    authorName: "Juli D.",
    rating: 5,
    text: "Garlic Lover >>>. Ya es parte de mi rutina de los viernes.",
    order: 3,
  },
];

async function seedIngredients() {
  const db = getAdminDb();
  const batch = db.batch();

  for (const ing of INGREDIENTS) {
    const ref = db.collection("ingredients").doc(ing.id);
    const existing = await ref.get();
    const now = FieldValue.serverTimestamp();

    const data = {
      name: ing.name,
      unit: ing.unit,
      // Preserve admin edits to pricePerUnit across re-seeds.
      pricePerUnit: existing.exists
        ? existing.data()?.pricePerUnit ?? ing.pricePerUnit
        : ing.pricePerUnit,
      packageSize: existing.exists
        ? existing.data()?.packageSize ?? ing.packageSize
        : ing.packageSize,
      packagePrice: existing.exists
        ? existing.data()?.packagePrice ?? ing.packagePrice
        : ing.packagePrice,
      active: existing.exists ? existing.data()?.active ?? true : true,
      order: ing.order,
      updatedAt: now,
      ...(existing.exists ? {} : { createdAt: now }),
    };

    batch.set(ref, data, { merge: true });
    console.log(`  ${existing.exists ? "↻" : "+"} ${ing.name}`);
  }

  await batch.commit();
}

async function seedProducts() {
  const db = getAdminDb();
  const batch = db.batch();

  for (const product of PRODUCTS) {
    const ref = db.collection("products").doc(product.id);
    const existing = await ref.get();
    const now = FieldValue.serverTimestamp();

    // Preserve admin-edited recipes: only set the seeded recipe when the
    // existing size has no recipe, or when the product is brand new.
    const existingSizes = (existing.data()?.sizes ?? []) as Array<{
      name: string;
      recipe?: unknown[];
    }>;
    const mergedSizes = product.sizes.map((size) => {
      const prior = existingSizes.find((s) => s.name === size.name);
      const priorHasRecipe =
        prior && Array.isArray(prior.recipe) && prior.recipe.length > 0;
      return {
        name: size.name,
        price: size.price,
        recipe: priorHasRecipe ? prior.recipe : size.recipe,
      };
    });

    // Preserve admin-uploaded imageUrl; otherwise fall back to the seed default
    // (local /public asset). Empty string stays only if neither exists.
    const existingImageUrl = (existing.data()?.imageUrl as string) || "";
    const fallbackImageUrl = product.defaultImageUrl ?? "";

    const data = {
      name: product.name,
      description: product.description,
      imageUrl: existingImageUrl || fallbackImageUrl,
      sizes: mergedSizes,
      active: existing.exists ? existing.data()?.active ?? true : true,
      order: product.order,
      updatedAt: now,
      ...(existing.exists ? {} : { createdAt: now }),
    };

    batch.set(ref, data, { merge: true });
    console.log(`  ${existing.exists ? "↻" : "+"} ${product.name}`);
  }

  await batch.commit();
}

async function seedSettings() {
  const db = getAdminDb();
  const ref = db.collection("settings").doc("global");
  const existing = await ref.get();

  const whatsappNumber = (
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""
  ).replace(/\D/g, "");

  const payload = {
    whatsappNumber,
    instagramHandle: "fermentofocacceria_",
    businessName: "Fermento Focacceria",
    tagline: "Fresh from the oven",
    heroMessage: "Recién horneadas, hechas con amor",
  };

  await ref.set(payload, { merge: true });
  console.log(`  ${existing.exists ? "↻" : "+"} settings/global`);
}

async function seedReviews() {
  const db = getAdminDb();
  const batch = db.batch();

  for (const review of REVIEWS) {
    const ref = db.collection("reviews").doc(review.id);
    const existing = await ref.get();
    const payload = {
      authorName: review.authorName,
      rating: review.rating,
      text: review.text,
      active: existing.exists ? existing.data()?.active ?? true : true,
      order: review.order,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
    };
    batch.set(ref, payload, { merge: true });
    console.log(`  ${existing.exists ? "↻" : "+"} ${review.authorName}`);
  }

  await batch.commit();
}

async function main() {
  console.log("🌱 Seeding Fermento Focacceria...\n");

  console.log("Ingredients:");
  await seedIngredients();

  console.log("\nProducts (with recipes):");
  await seedProducts();

  console.log("\nSettings:");
  await seedSettings();

  console.log("\nReviews:");
  await seedReviews();

  console.log("\n✓ Seed complete.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
