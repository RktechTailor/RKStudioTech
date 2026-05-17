#!/usr/bin/env node

/**
 * Seed a dummy test product into Firestore.
 *
 * Usage:
 *   npm run seed:test-product
 */

import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";

const readEnvFile = () => {
  const envPath = path.resolve(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const vars = {};

  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    vars[key] = value;
  });

  return vars;
};

const envVars = readEnvFile();

const getEnv = (key) => process.env[key] || envVars[key] || "";

const initAdmin = () => {
  if (admin.apps.length) {
    return;
  }

  const projectId = getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const clientEmail = getEnv("FIREBASE_ADMIN_EMAIL");
  const privateKey = getEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase Admin env vars.");
    console.error("Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
};

const TEST_PRODUCTS = [
  {
    id: "fab-test-live-1",
    name: "Test Product - Premium Cotton Check",
    price: 1099,
    marketPrice: 1299,
    pricingType: "meter",
    pricePerUnit: 1099,
    discountPercentage: 5,
    advancePercentage: 20,
    productType: "fabric",
    type: "cotton",
    category: "fabric",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
    tag: "test",
    description: "Live Firestore dummy product for checkout and pricing flow testing.",
    inStock: true,
    discountPercent: 5,
    rating: 4.3,
  },
  {
    id: "dup-test-live-1",
    name: "Test Product - Ready Dupatta Set",
    price: 899,
    marketPrice: 1049,
    pricingType: "piece",
    pricePerUnit: 899,
    discountPercentage: 5,
    advancePercentage: 20,
    productType: "piece",
    type: "chiffon",
    category: "dupatta",
    image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=900&q=80",
    tag: "test",
    description: "Live Firestore dummy dupatta product for category and checkout testing.",
    inStock: true,
    discountPercent: 5,
    rating: 4.4,
  },
];

const seed = async () => {
  try {
    initAdmin();

    const db = admin.firestore();
    for (const product of TEST_PRODUCTS) {
      const ref = db.collection("products").doc(product.id);
      const snap = await ref.get();

      const payload = {
        ...product,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (snap.exists) {
        await ref.set(payload, { merge: true });
        console.log(`Updated existing test product: ${product.id}`);
      } else {
        await ref.set({
          ...payload,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Created test product: ${product.id}`);
      }
    }

    console.log("Done.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed test product:", error);
    process.exit(1);
  }
};

void seed();
