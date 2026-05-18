import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/services/productService";
import { getFirebaseAdminDb } from "@/utils/server/firebaseAdmin";
import {
  calculatePricingBreakdown,
  calculatePricingForLineItems,
  PricingBreakdown,
  PricingCalculationInput,
} from "@/utils/pricing";

type PricingRequestInput = {
  productId?: string;
  pricingType?: "meter" | "piece";
  quantityOrMeter?: number;
  pickupCharge?: number;
  dropCharge?: number;
  lineItems?: Array<{
    productId: string;
    quantityOrMeter: number;
  }>;
  paymentType?: "advance" | "full";
};

type PricingApiResponse = {
  success: true;
  total: number;
  breakdown: {
    basePrice: number;
    pickupCharge: number;
    dropCharge: number;
    finalPayable: number;
  };
  fallback: boolean;
  pricingBreakdown: PricingBreakdown;
};

type PricingProduct = {
  price: number;
  marketPrice?: number;
  pricingType: "meter" | "piece";
  pricePerUnit?: number;
  discountPercentage?: number;
  advancePercentage?: number;
  productType?: "fabric" | "piece";
};

const toFiniteNumber = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePricingType = (value: unknown, productType: unknown): "meter" | "piece" => {
  if (value === "meter" || value === "piece") {
    return value;
  }

  if (productType === "fabric") {
    return "meter";
  }

  return "piece";
};

const buildPricingFromProduct = (
  product: PricingProduct,
  quantityOrMeter: number,
): PricingCalculationInput => ({
  marketPrice: product.marketPrice || product.price,
  pricingType: product.pricingType,
  pricePerUnit: product.pricePerUnit || product.price,
  quantityOrMeter,
  discountPercentage: product.discountPercentage ?? 0,
  advancePercentage: product.advancePercentage ?? 20,
});

const getProductForPricing = async (productId: string): Promise<PricingProduct | null> => {
  const normalizedProductId = productId.trim();

  try {
    const adminDb = getFirebaseAdminDb();
    let productData: Record<string, unknown> | undefined;

    const productSnap = await adminDb.collection("products").doc(normalizedProductId).get();

    if (productSnap.exists) {
      productData = productSnap.data() as Record<string, unknown>;
    }

    if (!productData) {
      console.log("Trying fallback query...");

      const fallbackSnap = await adminDb
        .collection("products")
        .where("id", "==", normalizedProductId)
        .limit(1)
        .get();

      if (!fallbackSnap.empty) {
        productData = fallbackSnap.docs[0].data() as Record<string, unknown>;
      }
    }

    if (productData) {
      const price = toFiniteNumber(productData.price, 0);
      const marketPrice = toFiniteNumber(productData.marketPrice, price);
      const pricingType = normalizePricingType(productData.pricingType, productData.productType);
      const pricePerUnit = toFiniteNumber(productData.pricePerUnit, price);

      return {
        price,
        marketPrice,
        pricingType,
        pricePerUnit,
        discountPercentage: toFiniteNumber(productData.discountPercentage, 0),
        advancePercentage: toFiniteNumber(productData.advancePercentage, 20),
        productType: productData.productType === "fabric" ? "fabric" : "piece",
      };
    }
  } catch (adminLookupError) {
    console.error("product_lookup_failed", {
      productId: normalizedProductId,
      error: String(adminLookupError),
    });
  }

  const fallbackProduct = await getProductById(normalizedProductId);

  if (!fallbackProduct) {
    return null;
  }

  return {
    price: fallbackProduct.price,
    marketPrice: fallbackProduct.marketPrice,
    pricingType: fallbackProduct.pricingType,
    pricePerUnit: fallbackProduct.pricePerUnit,
    discountPercentage: fallbackProduct.discountPercentage,
    advancePercentage: fallbackProduct.advancePercentage,
    productType: fallbackProduct.productType,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PricingRequestInput;
    console.log("PRICING BODY:", body);

    const input: PricingRequestInput = {
      productId: typeof body.productId === "string" ? body.productId.trim() : undefined,
      pricingType: body.pricingType,
      quantityOrMeter: toFiniteNumber(body.quantityOrMeter, 1),
      pickupCharge: toFiniteNumber(body.pickupCharge, 0),
      dropCharge: toFiniteNumber(body.dropCharge, 0),
      lineItems: Array.isArray(body.lineItems) ? body.lineItems : undefined,
      paymentType: body.paymentType,
    };

    if (input.lineItems && input.lineItems.length > 0) {
      const linePricingInputs: PricingCalculationInput[] = [];

      for (const line of input.lineItems) {
        const product = await getProductForPricing(line.productId);

        if (!product) {
          throw new Error(`Product not found after fallback: ${line.productId}`);
        }

        linePricingInputs.push(buildPricingFromProduct(product, line.quantityOrMeter));
      }

      const pricingBreakdown = calculatePricingForLineItems(linePricingInputs);
      const total = input.paymentType === "advance"
        ? pricingBreakdown.advanceAmount
        : pricingBreakdown.finalPayable;

      const response: PricingApiResponse = {
        success: true,
        total,
        breakdown: {
          basePrice: pricingBreakdown.finalPrice,
          pickupCharge: pricingBreakdown.pickupCharge,
          dropCharge: pricingBreakdown.dropCharge,
          finalPayable: pricingBreakdown.finalPayable,
        },
        fallback: false,
        pricingBreakdown,
      };

      return NextResponse.json(response, { status: 200 });
    }

    if (!input.productId) {
      throw new Error("Missing productId");
    }

    const product = await getProductForPricing(input.productId);

    if (!product) {
      throw new Error("Product not found after fallback");
    }

    const price = product?.price ?? 0;
    const pricingBreakdown = calculatePricingBreakdown({
      ...buildPricingFromProduct(product, input.quantityOrMeter ?? 1),
      pricingType: input.pricingType ?? product.pricingType,
      pricePerUnit: price,
      pickupCharge: input.pickupCharge,
      dropCharge: input.dropCharge,
    });

    const total = input.paymentType === "advance"
      ? pricingBreakdown.advanceAmount
      : pricingBreakdown.finalPayable;

    const response: PricingApiResponse = {
      success: true,
      total,
      breakdown: {
        basePrice: pricingBreakdown.finalPrice,
        pickupCharge: pricingBreakdown.pickupCharge,
        dropCharge: pricingBreakdown.dropCharge,
        finalPayable: pricingBreakdown.finalPayable,
      },
      fallback: false,
      pricingBreakdown,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("PRICING ERROR:", error);

    const pricingBreakdown = calculatePricingBreakdown({
      marketPrice: 100,
      pricingType: "piece",
      pricePerUnit: 100,
      quantityOrMeter: 1,
      discountPercentage: 0,
      advancePercentage: 20,
    });

    const fallbackResponse: PricingApiResponse = {
      success: true,
      total: 100,
      breakdown: {
        basePrice: 100,
        pickupCharge: 0,
        dropCharge: 0,
        finalPayable: 100,
      },
      fallback: true,
      pricingBreakdown,
    };

    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
