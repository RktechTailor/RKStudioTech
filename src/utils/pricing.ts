export type PricingType = "meter" | "piece";

export type PricingCalculationInput = {
  marketPrice: number;
  pricingType: PricingType;
  pricePerUnit: number;
  quantityOrMeter: number;
  discountPercentage?: number;
  advancePercentage?: number;
  pickupCharge?: number;
  dropCharge?: number;
};

export type PricingBreakdown = {
  marketPrice: number;
  pricingType: PricingType;
  pricePerUnit: number;
  quantityOrMeter: number;
  totalPrice: number;
  discountPercentage: number;
  discountAmount: number;
  finalPrice: number;
  pickupCharge: number;
  dropCharge: number;
  pickupDropCharge: number;
  finalPayable: number;
  advancePercentage: number;
  advanceAmount: number;
  remainingAmount: number;
  savingsText: string;
};

const roundCurrency = (value: number) => {
  return Math.round(Math.max(0, value));
};

const clampPercent = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, value));
};

const clampQuantity = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  return value;
};

export const calculatePricingBreakdown = (
  input: PricingCalculationInput,
): PricingBreakdown => {
  const pricingType: PricingType = input.pricingType === "piece" ? "piece" : "meter";
  const quantityOrMeter = clampQuantity(input.quantityOrMeter);
  const pricePerUnit = roundCurrency(input.pricePerUnit);
  const marketPrice = roundCurrency(input.marketPrice);
  const discountPercentage = clampPercent(input.discountPercentage ?? 5, 5);
  const advancePercentage = clampPercent(input.advancePercentage ?? 20, 20);
  const pickupCharge = roundCurrency(input.pickupCharge ?? 0);
  const dropCharge = roundCurrency(input.dropCharge ?? 0);

  const totalPrice = roundCurrency(pricePerUnit * quantityOrMeter);
  const discountAmount = roundCurrency((totalPrice * discountPercentage) / 100);
  const finalPrice = roundCurrency(totalPrice - discountAmount);
  const pickupDropCharge = roundCurrency(pickupCharge + dropCharge);
  const finalPayable = roundCurrency(finalPrice + pickupDropCharge);
  const advanceAmount = roundCurrency((finalPayable * advancePercentage) / 100);
  const remainingAmount = roundCurrency(finalPayable - advanceAmount);

  return {
    marketPrice,
    pricingType,
    pricePerUnit,
    quantityOrMeter,
    totalPrice,
    discountPercentage,
    discountAmount,
    finalPrice,
    pickupCharge,
    dropCharge,
    pickupDropCharge,
    finalPayable,
    advancePercentage,
    advanceAmount,
    remainingAmount,
    savingsText: `You saved INR ${discountAmount}`,
  };
};

export const calculatePricingForLineItems = (
  lineItems: PricingCalculationInput[],
): PricingBreakdown => {
  const lines = lineItems.map((line) => calculatePricingBreakdown(line));

  const marketPrice = roundCurrency(lines.reduce((sum, line) => sum + line.marketPrice, 0));
  const totalPrice = roundCurrency(lines.reduce((sum, line) => sum + line.totalPrice, 0));
  const discountAmount = roundCurrency(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const finalPrice = roundCurrency(lines.reduce((sum, line) => sum + line.finalPrice, 0));
  const pickupCharge = roundCurrency(lines.reduce((sum, line) => sum + line.pickupCharge, 0));
  const dropCharge = roundCurrency(lines.reduce((sum, line) => sum + line.dropCharge, 0));
  const pickupDropCharge = roundCurrency(lines.reduce((sum, line) => sum + line.pickupDropCharge, 0));
  const finalPayable = roundCurrency(lines.reduce((sum, line) => sum + line.finalPayable, 0));
  const advanceAmount = roundCurrency(lines.reduce((sum, line) => sum + line.advanceAmount, 0));
  const remainingAmount = roundCurrency(lines.reduce((sum, line) => sum + line.remainingAmount, 0));

  const discountPercentage = totalPrice > 0
    ? clampPercent((discountAmount / totalPrice) * 100, 5)
    : 0;

  const advancePercentage = finalPrice > 0
    ? clampPercent((advanceAmount / finalPrice) * 100, 20)
    : 0;

  return {
    marketPrice,
    pricingType: "piece",
    pricePerUnit: 0,
    quantityOrMeter: lineItems.length,
    totalPrice,
    discountPercentage,
    discountAmount,
    finalPrice,
    pickupCharge,
    dropCharge,
    pickupDropCharge,
    finalPayable,
    advancePercentage,
    advanceAmount,
    remainingAmount,
    savingsText: `You saved INR ${discountAmount}`,
  };
};
