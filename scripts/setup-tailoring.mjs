#!/usr/bin/env node

/**
 * Tailoring System Setup Script
 *
 * This script initializes the tailoring system with:
 * 1. Default tailor profiles
 * 2. Sample data for testing
 *
 * Usage: node scripts/setup-tailoring.mjs
 */

import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
  const [key, value] = line.split("=");
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath && !process.env.FIREBASE_ADMIN_EMAIL) {
  console.error("❌ Firebase Admin credentials not found in environment");
  console.error(
    "Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_ADMIN_EMAIL in .env.local",
  );
  process.exit(1);
}

let cert: any;

if (serviceAccountPath) {
  cert = JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"));
} else {
  cert = {
    projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: envVars.FIREBASE_ADMIN_EMAIL,
    privateKey: envVars.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

admin.initializeApp({
  credential: admin.credential.cert(cert),
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});

const db = admin.firestore();

// Sample tailors to create
const DEFAULT_TAILORS = [
  {
    name: "Rajesh Kumar",
    email: "rajesh@rkstudio.com",
    phone: "+919876543210",
    maxOrdersPerDay: 10,
    stitchingCapacityPerDay: 2,
    heavyWorkBufferDays: 3,
    minimumHeavyDeliveryDays: 5,
    active: true,
  },
  {
    name: "Priya Singh",
    email: "priya@rkstudio.com",
    phone: "+919876543211",
    maxOrdersPerDay: 8,
    stitchingCapacityPerDay: 2,
    heavyWorkBufferDays: 2,
    minimumHeavyDeliveryDays: 4,
    active: true,
  },
  {
    name: "Amit Patel",
    email: "amit@rkstudio.com",
    phone: "+919876543212",
    maxOrdersPerDay: 12,
    stitchingCapacityPerDay: 3,
    heavyWorkBufferDays: 3,
    minimumHeavyDeliveryDays: 5,
    active: true,
  },
];

async function setupTailoringSystem() {
  try {
    console.log("🚀 Initializing Tailoring System...\n");

    // Check if tailors already exist
    const existingTailors = await db.collection("tailors").limit(1).get();

    if (!existingTailors.empty) {
      console.log("✓ Tailors collection already has data");
      console.log("✓ Skipping initialization (to avoid duplicates)");
      console.log("\nTo reset, delete the 'tailors' collection in Firestore manually.");
      process.exit(0);
    }

    // Create default tailors
    console.log("📝 Creating default tailors...\n");

    let createdCount = 0;

    for (const tailor of DEFAULT_TAILORS) {
      await db.collection("tailors").add({
        ...tailor,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✓ Created: ${tailor.name}`);
      createdCount++;
    }

    console.log(`\n✅ Setup Complete!`);
    console.log(`   - ${createdCount} tailors created`);
    console.log(
      "\nNext steps:",
    );
    console.log(
      "1. Set admin role for your user (using Firebase Admin SDK)",
    );
    console.log("2. Access admin dashboard at /admin/tailoring");
    console.log("3. Create orders at /tailoring/order");

    process.exit(0);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run setup
setupTailoringSystem();
