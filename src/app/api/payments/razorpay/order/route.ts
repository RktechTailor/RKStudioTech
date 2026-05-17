import { NextResponse } from "next/server";
import { RK_STUDIO } from "@/utils/constants";

type CreateOrderPayload = {
  amount?: number;
  receipt?: string;
};

export async function POST(request: Request) {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay configuration missing on server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as CreateOrderPayload;
    const amount = Number(body.amount || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    }

    const payload = {
      amount: Math.round(amount * 100),
      currency: RK_STUDIO.payment.currency,
      receipt: body.receipt || `rkstudio_${Date.now()}`,
      payment_capture: 1,
    };

    const authToken = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authToken}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const responseBody = (await response.json()) as { id?: string; error?: { description?: string } };

    if (!response.ok || !responseBody.id) {
      return NextResponse.json(
        { error: responseBody.error?.description || "Unable to create Razorpay order." },
        { status: 400 },
      );
    }

    return NextResponse.json({ orderId: responseBody.id });
  } catch {
    return NextResponse.json({ error: "Unable to create Razorpay order." }, { status: 500 });
  }
}
