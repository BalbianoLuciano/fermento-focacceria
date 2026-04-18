/**
 * Fermento Focacceria — idempotent seed script.
 *
 * Seeds products, settings/global and sample reviews using the Firebase Admin
 * SDK (service account credentials bypass Firestore rules — only run from a
 * trusted machine). IDs are stable so re-running does not duplicate data.
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

interface ProductSeed {
  id: string;
  name: string;
  description: string;
  sizes: Array<{ name: string; price: number }>;
  order: number;
}

const PRODUCTS: ProductSeed[] = [
  {
    id: "product-naked",
    name: "Naked",
    description: "Sal y romero. La más honesta: masa madre, aceite de oliva y nada que la tape.",
    sizes: [
      { name: "Individual", price: 4000 },
      { name: "XL", price: 10000 },
    ],
    order: 1,
  },
  {
    id: "product-mediterranea",
    name: "Mediterránea",
    description: "Tomate, aceituna, romero y sal. Para los que aman el sur de Italia.",
    sizes: [
      { name: "Individual", price: 5000 },
      { name: "XL", price: 10000 },
    ],
    order: 2,
  },
  {
    id: "product-garlic-lover",
    name: "Garlic Lover",
    description: "Mix de quesos duros y ajo infusionado en aceite de oliva. Intensa, tostada, obsesiva.",
    sizes: [
      { name: "Individual", price: 6000 },
      { name: "XL", price: 10000 },
    ],
    order: 3,
  },
  {
    id: "product-mixta",
    name: "Mixta",
    description: "Cualquier combinación de los tres sabores. La indecisa por diseño.",
    sizes: [
      { name: "Individual", price: 6500 },
      { name: "XL", price: 10000 },
    ],
    order: 4,
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

async function seedProducts() {
  const db = getAdminDb();
  const batch = db.batch();

  for (const product of PRODUCTS) {
    const ref = db.collection("products").doc(product.id);
    const existing = await ref.get();
    const now = FieldValue.serverTimestamp();

    const data = {
      name: product.name,
      description: product.description,
      imageUrl: existing.exists ? existing.data()?.imageUrl ?? "" : "",
      sizes: product.sizes,
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

  console.log("Products:");
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
