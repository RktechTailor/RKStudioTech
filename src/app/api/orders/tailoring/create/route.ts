import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createTailoringOrder,
  findTailorWithLeastLoad,
} from "@/services/tailoringCapacityService";
import { verifyUserToken } from "@/utils/server/authUtils";

const productDetailsSchema = z
  .object({
    size_type: z.enum(["standard", "custom"]).optional(),
    size_value: z.string().trim().min(1).max(64).optional(),
    custom_size_notes: z.string().trim().max(500).optional(),
    pickup_drop_option: z.enum(["self_visit", "pickup_only", "drop_only", "pickup_drop"]).optional(),
    pickup_charge: z.number().min(0).optional(),
    drop_charge: z.number().min(0).optional(),
  })
  .passthrough()
  .superRefine((value, ctx) => {
    if (value.size_type === "custom" && !value.custom_size_notes?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "custom_size_notes is required when size_type is custom",
        path: ["custom_size_notes"],
      });
    }
  });

const createOrderSchema = z.object({
  tailorId: z.string().optional(), // If not provided, auto-assign
  workType: z.enum(["simple", "heavy"]),
  productDetails: productDetailsSchema.optional(),
  paymentRequired: z.boolean().optional(),
  paymentId: z.string().nullable().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await verifyUserToken(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    let tailorId = validated.tailorId;

    // Auto-assign to least loaded tailor if not specified
    if (!tailorId) {
      const tailor = await findTailorWithLeastLoad();
      tailorId = tailor.id;
    }

    const sanitizedProductDetails = validated.productDetails
      ? {
        ...validated.productDetails,
        size_value: validated.productDetails.size_value?.trim(),
        custom_size_notes: validated.productDetails.custom_size_notes?.replace(/\s+/g, " ").trim(),
        pickup_charge: Math.max(0, validated.productDetails.pickup_charge ?? 0),
        drop_charge: Math.max(0, validated.productDetails.drop_charge ?? 0),
      }
      : undefined;

    // Create order
    const order = await createTailoringOrder(
      user.uid,
      tailorId,
      validated.workType,
      sanitizedProductDetails,
      {
        paymentRequired: validated.paymentRequired,
        paymentId: validated.paymentId,
      },
    );

    return NextResponse.json(
      {
        success: true,
        order,
        message: "Order created successfully",
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating tailoring order:", error);

    if (error instanceof Error && error.message.includes("no slots")) {
      return NextResponse.json(
        { error: "Tailor has no slots available today" },
        { status: 400 },
      );
    }

    if (error instanceof Error && error.message.includes("Slots just got full")) {
      return NextResponse.json(
        { error: "Slots just got full, please try another day" },
        { status: 409 },
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
