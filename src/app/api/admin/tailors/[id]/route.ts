import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateTailorCapacity } from "@/services/tailoringCapacityService";
import { verifyAdminToken } from "@/utils/server/authUtils";

const updateTailorSchema = z.object({
  name: z.string().optional(),
  maxOrdersPerDay: z.number().min(1).optional(),
  stitchingCapacityPerDay: z.number().min(1).optional(),
  heavyWorkBufferDays: z.number().min(0).optional(),
  minimumHeavyDeliveryDays: z.number().min(1).optional(),
  bufferPercentage: z.number().min(0).max(90).optional(),
  pickupCharge: z.number().min(0).optional(),
  dropCharge: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  advancePercentage: z.number().min(0).max(100).optional(),
  active: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const { id: tailorId } = await context.params;
    const body = await request.json();
    const validated = updateTailorSchema.parse(body);

    await updateTailorCapacity(tailorId, validated);

    return NextResponse.json(
      {
        success: true,
        message: "Tailor capacity updated successfully",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating tailor:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Tailor not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Failed to update tailor" },
      { status: 500 },
    );
  }
}
