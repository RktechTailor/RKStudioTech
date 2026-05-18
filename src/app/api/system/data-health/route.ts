import { NextRequest, NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { verifyAdminToken } from "@/utils/server/authUtils";
import { getFirebaseAdminApp } from "@/utils/server/firebaseAdmin";

const requiredOrderFields = ["token", "service", "items", "total", "phone", "createdAt"];

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    const admin = await verifyAdminToken(request);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const app = getFirebaseAdminApp();
    const db = getFirestore(app);

    const [productsSnapshot, ordersSnapshot] = await Promise.all([
      db.collection("products").limit(5).get(),
      db.collection("orders").limit(5).get(),
    ]);

    const ordersPreview = ordersSnapshot.docs.map((orderDoc) => {
      const data = orderDoc.data() as Record<string, unknown>;
      const missingFields = requiredOrderFields.filter((field) => !(field in data));

      return {
        id: orderDoc.id,
        fields: Object.keys(data),
        missingRequiredFields: missingFields,
      };
    });

    return NextResponse.json({
      success: true,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      counts: {
        products: productsSnapshot.size,
        orders: ordersSnapshot.size,
      },
      checks: {
        productsCollectionHasDocs: productsSnapshot.size > 0,
        ordersCollectionHasDocs: ordersSnapshot.size > 0,
      },
      ordersPreview,
    });
  } catch (error) {
    console.error("[data-health] error", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not inspect Firestore data health.",
      },
      { status: 500 },
    );
  }
}
