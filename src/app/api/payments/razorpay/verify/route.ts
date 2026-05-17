import crypto from "crypto";
import { NextResponse } from "next/server";

type VerifyPayload = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { verified: false, error: "Razorpay secret missing on server." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as VerifyPayload;
    const razorpay_order_id = (body.razorpay_order_id || "").trim();
    const razorpay_payment_id = (body.razorpay_payment_id || "").trim();
    const razorpay_signature = (body.razorpay_signature || "").trim();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          verified: false,
          error: "Missing payment verification fields: razorpay_order_id, razorpay_payment_id, razorpay_signature.",
        },
        { status: 400 },
      );
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");

    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(razorpay_signature);

    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
      return NextResponse.json(
        { verified: false, error: "Invalid payment signature." },
        { status: 400 },
      );
    }

    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json(
      { verified: false, error: "Payment verification failed." },
      { status: 500 },
    );
  }
}
