import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmTailoringOrderAfterPayment } from "@/services/tailoringCapacityService";
import { verifyUserToken } from "@/utils/server/authUtils";

const confirmSchema = z.object({
  paymentId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const validated = confirmSchema.parse(body);

    const order = await confirmTailoringOrderAfterPayment(id, validated.paymentId);

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error confirming tailoring order:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Slots just got full")) {
      return NextResponse.json(
        { error: "Slots just got full, please try another day" },
        { status: 409 },
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to confirm order" }, { status: 500 });
  }
}
