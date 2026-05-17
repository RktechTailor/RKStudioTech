import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProductById } from "@/services/productService";
import {
  calculatePricingBreakdown,
  calculatePricingForLineItems,
  PricingCalculationInput,
} from "@/utils/pricing";

const lineItemSchema = z.object({
  productId: z.string().min(1),
  quantityOrMeter: z.number().positive(),
});

const pricingSchema = z.object({
  service: z.enum(["tailoring", "fabric", "dupatta"]),
  productId: z.string().optional(),
  pricingType: z.enum(["meter", "piece"]).optional(),
  quantityOrMeter: z.number().positive().optional(),
  pickupCharge: z.number().min(0).optional(),
  dropCharge: z.number().min(0).optional(),
  lineItems: z.array(lineItemSchema).optional(),
  paymentType: z.enum(["advance", "full"]).optional(),
});

const getTailoringFallbackPricing = () => {
  const marketPrice = Number(process.env.NEXT_PUBLIC_TAILORING_MARKET_PRICE || 1000);
  const pricePerUnit = Number(process.env.NEXT_PUBLIC_TAILORING_PRICE_PER_UNIT || marketPrice);
  const discountPercentage = Number(process.env.NEXT_PUBLIC_TAILORING_DISCOUNT_PERCENTAGE || 5);
  const advancePercentage = Number(process.env.NEXT_PUBLIC_TAILORING_ADVANCE_PERCENTAGE || 20);

  return {
    marketPrice,
    pricingType: "piece" as const,
    pricePerUnit,
    discountPercentage,
    advancePercentage,
  };
};

const buildPricingFromProduct = (
  product: NonNullable<Awaited<ReturnType<typeof getProductById>>>,
  quantityOrMeter: number,
): PricingCalculationInput => {
  return {
    marketPrice: product.marketPrice || product.price,
    pricingType: product.pricingType,
    pricePerUnit: product.pricePerUnit || product.price,
    quantityOrMeter,
    discountPercentage: product.discountPercentage ?? 5,
    advancePercentage: product.advancePercentage ?? 20,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = pricingSchema.parse(body);

    if (input.lineItems && input.lineItems.length > 0) {
      const linePricingInputs: PricingCalculationInput[] = [];

      for (const line of input.lineItems) {
        const product = await getProductById(line.productId);

        if (!product) {
          return NextResponse.json(
            { error: `Product not found: ${line.productId}` },
            { status: 404 },
          );
        }

        linePricingInputs.push(buildPricingFromProduct(product, line.quantityOrMeter));
      }

      const combinedBreakdown = calculatePricingForLineItems(linePricingInputs);
      const payableAmount = input.paymentType === "advance"
        ? combinedBreakdown.advanceAmount
        : combinedBreakdown.finalPayable;

      console.info("[pricing] calculated_line_items", {
        items: input.lineItems.length,
        totalPrice: combinedBreakdown.totalPrice,
        discount: combinedBreakdown.discountAmount,
        finalPrice: combinedBreakdown.finalPrice,
      });

      return NextResponse.json(
        {
          success: true,
          breakdown: combinedBreakdown,
          payableAmount,
          lineItems: input.lineItems,
        },
        { status: 200 },
      );
    }

    let pricingInput: PricingCalculationInput;

    if (input.productId) {
      const product = await getProductById(input.productId);

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      pricingInput = buildPricingFromProduct(
        product,
        input.quantityOrMeter ?? 1,
      );

      pricingInput = {
        ...pricingInput,
        pickupCharge: input.pickupCharge,
        dropCharge: input.dropCharge,
      };
    } else if (input.service === "tailoring") {
      const fallback = getTailoringFallbackPricing();

      pricingInput = {
        marketPrice: fallback.marketPrice,
        pricingType: fallback.pricingType,
        pricePerUnit: fallback.pricePerUnit,
        quantityOrMeter: input.quantityOrMeter ?? 1,
        discountPercentage: fallback.discountPercentage,
        advancePercentage: fallback.advancePercentage,
        pickupCharge: input.pickupCharge,
        dropCharge: input.dropCharge,
      };
    } else {
      return NextResponse.json(
        { error: "Missing productId for product-based pricing" },
        { status: 400 },
      );
    }

    if (input.pricingType && input.pricingType !== pricingInput.pricingType) {
      return NextResponse.json(
        { error: "Invalid pricing_type for selected product" },
        { status: 400 },
      );
    }

    const breakdown = calculatePricingBreakdown(pricingInput);
    const payableAmount = input.paymentType === "advance"
      ? breakdown.advanceAmount
      : breakdown.finalPayable;

    console.info("[pricing] calculated", {
      service: input.service,
      productId: input.productId || null,
      pricingType: breakdown.pricingType,
      quantityOrMeter: breakdown.quantityOrMeter,
      totalPrice: breakdown.totalPrice,
      discount: breakdown.discountAmount,
      finalPrice: breakdown.finalPrice,
      payableAmount,
    });

    return NextResponse.json(
      {
        success: true,
        breakdown,
        payableAmount,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("[pricing] calculate_failed", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid pricing request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Unable to calculate pricing" },
      { status: 500 },
    );
  }
}
