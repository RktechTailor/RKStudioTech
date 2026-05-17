import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createTailor,
  getAllTailors,
} from "@/services/tailoringCapacityService";
import { verifyAdminToken, verifyUserToken } from "@/utils/server/authUtils";

const createTailorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  maxOrdersPerDay: z.number().min(1).default(10),
  stitchingCapacityPerDay: z.number().min(1).default(2),
  heavyWorkBufferDays: z.number().min(1).default(3),
  minimumHeavyDeliveryDays: z.number().min(1).default(5),
  bufferPercentage: z.number().min(0).max(90).default(0),
  pickupCharge: z.number().min(0).default(50),
  dropCharge: z.number().min(0).default(50),
  discountPercentage: z.number().min(0).max(100).default(5),
  advancePercentage: z.number().min(0).max(100).default(20),
  active: z.boolean().default(true),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const tailors = await getAllTailors();

    return NextResponse.json(
      {
        success: true,
        tailors,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error fetching tailors:", error);

    return NextResponse.json(
      { error: "Failed to fetch tailors" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validated = createTailorSchema.parse(body);

    const tailor = await createTailor(validated);

    return NextResponse.json(
      {
        success: true,
        tailor,
        message: "Tailor created successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating tailor:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create tailor" },
      { status: 500 },
    );
  }
}
