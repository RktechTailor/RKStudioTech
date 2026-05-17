import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateTailoringOrderStatus } from "@/services/tailoringCapacityService";
import { verifyUserToken } from "@/utils/server/authUtils";

const statusSchema = z.object({
  status: z.enum([
    "pending",
    "in-progress",
    "completed",
    "cancelled",
    "rejected",
    "pending_payment",
  ]),
});

export async function PATCH(
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
    const validated = statusSchema.parse(body);

    const order = await updateTailoringOrderStatus(id, validated.status);

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating tailoring order status:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Invalid status transition")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 },
    );
  }
}
