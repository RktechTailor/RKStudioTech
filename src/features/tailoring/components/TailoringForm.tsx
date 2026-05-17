"use client";

import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { OrderDetails } from "@/services/orderService";
import { saveUserToFirestore, subscribeToUser } from "@/services/userService";
import { RK_STUDIO } from "@/utils/constants";
import { createPendingPaymentToken, savePendingPaymentOrder } from "@/utils/paymentSession";
import TailoringStepper from "./TailoringStepper";

type FabricSource = "" | "own" | "external" | "rkstudio";

type TailoringFormData = {
  category: string;
  design: string;
  bust: string;
  waist: string;
  length: string;
  extraMeasurement: string;
  fabricSource: FabricSource;
  fabricType: string;
  fabricColor: string;
  fabricName: string;
  fabricLink: string;
  rkStudioProductId: string;
  fabricNotes: string;
  customerName: string;
  phone: string;
};

type TailoringPickerFilters = {
  query: string;
  type: string;
  maxPrice: string;
  sortBy: string;
};

const stepLabels = ["Category", "Design", "Measurements", "Fabric Source", "Summary"];
const SAVED_FABRICS_STORAGE_KEY = "rkstudio_saved_fabric_ids";

const readSavedFabricIdsFromStorage = () => {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(SAVED_FABRICS_STORAGE_KEY);

    if (!raw) {
      return [] as string[];
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    window.localStorage.removeItem(SAVED_FABRICS_STORAGE_KEY);
    return [] as string[];
  }
};

const fabricSourceOptions: Array<{ value: Exclude<FabricSource, "">; title: string; description: string }> = [
  {
    value: "own",
    title: "I already have fabric",
    description: "Share the fabric type, color, and any stitching notes.",
  },
  {
    value: "external",
    title: "I will buy fabric myself",
    description: "Tell us which fabric you plan to buy and add a link if available.",
  },
  {
    value: "rkstudio",
    title: "I want RK Studio to provide fabric",
    description: "Choose a fabric product directly from RK Studio inventory.",
  },
];

const getFabricSourceLabel = (fabricSource: FabricSource) => {
  if (fabricSource === "own") {
    return "Own";
  }

  if (fabricSource === "external") {
    return "External Purchase";
  }

  if (fabricSource === "rkstudio") {
    return "RK Studio";
  }

  return "-";
};

const initialData: TailoringFormData = {
  category: "",
  design: "",
  bust: "",
  waist: "",
  length: "",
  extraMeasurement: "",
  fabricSource: "",
  fabricType: "",
  fabricColor: "",
  fabricName: "",
  fabricLink: "",
  rkStudioProductId: "",
  fabricNotes: "",
  customerName: "",
  phone: "",
};

export default function TailoringForm() {
  const router = useRouter();
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const { products, loading: productsLoading, error: productsError } = useProducts({ category: "fabric" });
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<TailoringFormData>(initialData);
  const [pickerFilters, setPickerFilters] = useState<TailoringPickerFilters>({
    query: "",
    type: "all",
    maxPrice: "5000",
    sortBy: "featured",
  });
  const [compareProductIds, setCompareProductIds] = useState<string[]>([]);
  const [savedProductIds, setSavedProductIds] = useState<string[]>([]);
  const [savedProductsReady, setSavedProductsReady] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [initialPrefilledProductId, setInitialPrefilledProductId] = useState("");
  const [prefilledProductIds, setPrefilledProductIds] = useState<string[]>([]);
  const [highlightedProductId, setHighlightedProductId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const isLast = activeStep === stepLabels.length - 1;

  const updateField = (field: keyof TailoringFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateFabricSource = (value: FabricSource) => {
    setFormData((prev) => ({
      ...prev,
      fabricSource: value,
      fabricType: "",
      fabricColor: "",
      fabricName: "",
      fabricLink: "",
      rkStudioProductId: "",
      fabricNotes: "",
    }));
    setCompareProductIds([]);
  };

  const toggleCompareProduct = (productId: string) => {
    setCompareProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      if (prev.length >= 2) {
        return [...prev.slice(1), productId];
      }

      return [...prev, productId];
    });
  };

  const toggleSavedProduct = (productId: string) => {
    setSavedProductIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }

      return [...prev, productId];
    });
  };

  useEffect(() => {
    const localSavedProductIds = readSavedFabricIdsFromStorage();

    if (!user?.uid) {
      setSavedProductIds(localSavedProductIds);
      setSavedProductsReady(true);
      return;
    }

    setSavedProductsReady(false);

    const unsubscribe = subscribeToUser(
      user.uid,
      (appUser) => {
        const nextSavedProductIds = appUser?.savedFabricIds?.length ? appUser.savedFabricIds : localSavedProductIds;
        setSavedProductIds(nextSavedProductIds);
        setSavedProductsReady(true);
      },
      () => {
        setSavedProductIds(localSavedProductIds);
        setSavedProductsReady(true);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!savedProductsReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SAVED_FABRICS_STORAGE_KEY, JSON.stringify(savedProductIds));

    if (!user?.uid) {
      return;
    }

    void saveUserToFirestore({
      uid: user.uid,
      name: user.displayName || "Customer",
      phone: user.phoneNumber || "-",
      savedFabricIds: savedProductIds,
    });
  }, [savedProductIds, savedProductsReady, user?.displayName, user?.phoneNumber, user?.uid]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setCompareProductIds((prev) => prev.filter((productId) => savedProductIds.includes(productId) || products.some((product) => product.id === productId)));
  }, [products, savedProductIds]);

  useEffect(() => {
    if (prefillApplied || typeof window === "undefined" || products.length === 0) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const selectedFabricId = params.get("fabric") || "";
    const compareIds = (params.get("compare") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .slice(0, 2);

    const validSelectedFabricId = products.some((product) => product.id === selectedFabricId) ? selectedFabricId : "";
    const validCompareIds = compareIds.filter((compareId) => products.some((product) => product.id === compareId));

    if (validSelectedFabricId || validCompareIds.length > 0) {
      setInitialPrefilledProductId(validSelectedFabricId || validCompareIds[0] || "");
      setPrefilledProductIds(Array.from(new Set([validSelectedFabricId, ...validCompareIds].filter(Boolean))));
      setFormData((prev) => ({
        ...prev,
        fabricSource: "rkstudio",
        rkStudioProductId: validSelectedFabricId || validCompareIds[0] || prev.rkStudioProductId,
      }));
      setActiveStep(3);
      setCompareProductIds(validCompareIds);
    }

    setPrefillApplied(true);
  }, [prefillApplied, products]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !prefillApplied ||
      activeStep !== 3 ||
      formData.fabricSource !== "rkstudio" ||
      !formData.rkStudioProductId
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      const selectedCard = document.getElementById(`rkstudio-fabric-card-${formData.rkStudioProductId}`);

      selectedCard?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      setHighlightedProductId(formData.rkStudioProductId);
    }, 150);

    const resetTimer = window.setTimeout(() => {
      setHighlightedProductId("");
    }, 1800);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(resetTimer);
    };
  }, [activeStep, formData.fabricSource, formData.rkStudioProductId, prefillApplied]);

  const selectedFabricProduct = useMemo(() => {
    return products.find((product) => product.id === formData.rkStudioProductId) || null;
  }, [formData.rkStudioProductId, products]);

  const compareProducts = useMemo(() => {
    return compareProductIds
      .map((productId) => products.find((product) => product.id === productId) || null)
      .filter((product): product is (typeof products)[number] => Boolean(product));
  }, [compareProductIds, products]);

  const savedProducts = useMemo(() => {
    return savedProductIds
      .map((productId) => products.find((product) => product.id === productId) || null)
      .filter((product): product is (typeof products)[number] => Boolean(product));
  }, [products, savedProductIds]);

  const isDashboardPrefilledSelection = useMemo(() => {
    return Boolean(formData.rkStudioProductId) && prefilledProductIds.includes(formData.rkStudioProductId);
  }, [formData.rkStudioProductId, prefilledProductIds]);

  const hasChangedFromPrefilledSelection = useMemo(() => {
    return Boolean(initialPrefilledProductId) && Boolean(formData.rkStudioProductId) && formData.rkStudioProductId !== initialPrefilledProductId;
  }, [formData.rkStudioProductId, initialPrefilledProductId]);

  const availableFabricTypes = useMemo(() => {
    return Array.from(new Set(products.map((product) => product.type))).sort((left, right) => left.localeCompare(right));
  }, [products]);

  const filteredFabricProducts = useMemo(() => {
    const normalizedQuery = pickerFilters.query.trim().toLowerCase();
    const maxPrice = Number(pickerFilters.maxPrice || 0);

    const filteredProducts = products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        product.name.toLowerCase().includes(normalizedQuery) ||
        product.type.toLowerCase().includes(normalizedQuery) ||
        product.tag.toLowerCase().includes(normalizedQuery);
      const matchesType = pickerFilters.type === "all" || product.type === pickerFilters.type;
      const matchesPrice = product.price <= maxPrice;

      return matchesQuery && matchesType && matchesPrice;
    });

    const sortedProducts = [...filteredProducts];

    if (pickerFilters.sortBy === "price-low") {
      sortedProducts.sort((left, right) => left.price - right.price);
    } else if (pickerFilters.sortBy === "price-high") {
      sortedProducts.sort((left, right) => right.price - left.price);
    } else if (pickerFilters.sortBy === "discount-first") {
      sortedProducts.sort((left, right) => (right.discountPercent || 0) - (left.discountPercent || 0));
    } else if (pickerFilters.sortBy === "rating-high") {
      sortedProducts.sort((left, right) => (right.rating || 0) - (left.rating || 0));
    }

    return sortedProducts;
  }, [pickerFilters.maxPrice, pickerFilters.query, pickerFilters.sortBy, pickerFilters.type, products]);

  const fabricDetails = useMemo<OrderDetails | null>(() => {
    if (formData.fabricSource === "own") {
      const details: OrderDetails = {
        fabricSource: "own",
        fabricType: formData.fabricType.trim(),
        fabricColor: formData.fabricColor.trim(),
        notes: formData.fabricNotes.trim(),
      };

      return details;
    }

    if (formData.fabricSource === "external") {
      const details: OrderDetails = {
        fabricSource: "external",
        fabricName: formData.fabricName.trim(),
        fabricLink: formData.fabricLink.trim(),
        notes: formData.fabricNotes.trim(),
      };

      return details;
    }

    if (formData.fabricSource === "rkstudio") {
      const details: OrderDetails = {
        fabricSource: "rkstudio",
        productId: selectedFabricProduct?.id || formData.rkStudioProductId,
        productName: selectedFabricProduct?.name || "",
      };

      return details;
    }

    return null;
  }, [formData.fabricColor, formData.fabricLink, formData.fabricName, formData.fabricNotes, formData.fabricSource, formData.fabricType, formData.rkStudioProductId, selectedFabricProduct]);

  const fabricSummaryLines = useMemo(() => {
    if (formData.fabricSource === "own") {
      return [
        `Fabric Source: ${getFabricSourceLabel(formData.fabricSource)}`,
        `Type: ${formData.fabricType || "-"}`,
        `Color: ${formData.fabricColor || "-"}`,
        `Notes: ${formData.fabricNotes || "-"}`,
      ];
    }

    if (formData.fabricSource === "external") {
      return [
        `Fabric Source: ${getFabricSourceLabel(formData.fabricSource)}`,
        `Fabric Name: ${formData.fabricName || "-"}`,
        `Fabric Link: ${formData.fabricLink || "-"}`,
        `Notes: ${formData.fabricNotes || "-"}`,
      ];
    }

    if (formData.fabricSource === "rkstudio") {
      return [
        `Fabric Source: ${getFabricSourceLabel(formData.fabricSource)}`,
        `Selected Fabric: ${selectedFabricProduct?.name || "-"}`,
      ];
    }

    return ["Fabric Source: -"];
  }, [formData.fabricLink, formData.fabricName, formData.fabricNotes, formData.fabricSource, formData.fabricType, formData.fabricColor, selectedFabricProduct]);

  const whatsappDetails = useMemo(() => {
    return [
      `Tailoring Category: ${formData.category || "-"}`,
      `Design: ${formData.design || "-"}`,
      `Measurements: Bust ${formData.bust || "-"}, Waist ${formData.waist || "-"}, Length ${formData.length || "-"}`,
      `Extra Measurement: ${formData.extraMeasurement || "-"}`,
      ...fabricSummaryLines,
    ];
  }, [fabricSummaryLines, formData.bust, formData.category, formData.design, formData.extraMeasurement, formData.length, formData.waist]);

  const validationMessage = useMemo(() => {
    if (activeStep === 0 && !formData.category) return "Please select tailoring category.";
    if (activeStep === 1 && !formData.design) return "Please select design type.";
    if (activeStep === 2 && (!formData.bust || !formData.waist || !formData.length)) {
      return "Please fill all required measurements.";
    }
    if (activeStep === 3 && !formData.fabricSource) return "Please choose fabric source.";
    if (activeStep === 3 && formData.fabricSource === "own" && (!formData.fabricType || !formData.fabricColor)) {
      return "Please add fabric type and color.";
    }
    if (activeStep === 3 && formData.fabricSource === "external" && !formData.fabricName) {
      return "Please add the fabric name you plan to buy.";
    }
    if (activeStep === 3 && formData.fabricSource === "rkstudio" && !formData.rkStudioProductId) {
      return "Please select an RK Studio fabric product.";
    }
    if (activeStep === 4 && (!formData.customerName || !formData.phone)) {
      return "Please add name and phone for callback.";
    }

    return "";
  }, [activeStep, formData]);

  const handleNext = async () => {
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");

    if (isLast) {
      const userId = user?.uid || `guest-${formData.phone.replace(/\D/g, "") || "anonymous"}`;
      const name = formData.customerName.trim() || user?.displayName || "Customer";
      const phone = formData.phone.trim() || user?.phoneNumber || "Not provided";

      try {
        setSubmitting(true);
        const token = createPendingPaymentToken();

        await trackAsync(
          Promise.resolve(
            savePendingPaymentOrder(token, {
              service: "tailoring",
              userId,
              customerName: name,
              customerPhone: phone,
              orderDetails: {
                category: formData.category || "-",
                design: formData.design || "-",
                measurements: {
                  bust: formData.bust || "-",
                  waist: formData.waist || "-",
                  length: formData.length || "-",
                  extraMeasurement: formData.extraMeasurement || "-",
                },
                fabricDetails: fabricDetails || {
                  fabricSource: "-",
                },
              },
              productId: selectedFabricProduct?.id || undefined,
              amount: RK_STUDIO.payment.tailoringAdvanceDefault,
              paymentType: "advance",
              whatsappDetails,
            }),
          ),
        );

        router.push(`/checkout?token=${encodeURIComponent(token)}`);
      } catch {
        setError("Unable to continue to payment. Please try again.");
      } finally {
        setSubmitting(false);
      }

      return;
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prev) => Math.max(0, prev - 1));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h4" mb={1}>
          Tailoring Order Form
        </Typography>
        <Typography color="text.secondary" mb={3}>
          Step by step details bharein, hum aapko jaldi contact karenge.
        </Typography>

        <TailoringStepper steps={stepLabels} activeStep={activeStep} />

        <Stack spacing={3}>
            {activeStep === 0 ? (
              <FormControl>
                <FormLabel>1. Category selection</FormLabel>
                <RadioGroup
                  value={formData.category}
                  onChange={(event) => updateField("category", event.target.value)}
                >
                  <FormControlLabel value="salwar-suit" control={<Radio />} label="Salwar Suit" />
                  <FormControlLabel value="blouse" control={<Radio />} label="Blouse" />
                  <FormControlLabel value="kurti" control={<Radio />} label="Kurti" />
                  <FormControlLabel value="mens-kurta" control={<Radio />} label="Mens Kurta" />
                </RadioGroup>
              </FormControl>
            ) : null}

            {activeStep === 1 ? (
              <TextField
                select
                fullWidth
                label="2. Design selection"
                value={formData.design}
                onChange={(event) => updateField("design", event.target.value)}
              >
                <MenuItem value="simple">Simple Design</MenuItem>
                <MenuItem value="party">Party Wear Design</MenuItem>
                <MenuItem value="bridal">Bridal/Festive Design</MenuItem>
              </TextField>
            ) : null}

            {activeStep === 2 ? (
              <Box>
                <Typography mb={2}>3. Measurement form (in inches)</Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Bust"
                      fullWidth
                      value={formData.bust}
                      onChange={(event) => updateField("bust", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Waist"
                      fullWidth
                      value={formData.waist}
                      onChange={(event) => updateField("waist", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      label="Length"
                      fullWidth
                      value={formData.length}
                      onChange={(event) => updateField("length", event.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Extra measurement (optional)"
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Any additional size details, notes, or custom measurements"
                      value={formData.extraMeasurement}
                      onChange={(event) => updateField("extraMeasurement", event.target.value)}
                    />
                  </Grid>
                </Grid>
              </Box>
            ) : null}

            {activeStep === 3 ? (
              <Stack spacing={2.5}>
                <FormControl>
                  <FormLabel>4. Fabric Source</FormLabel>
                  <RadioGroup
                    value={formData.fabricSource}
                    onChange={(event) => updateFabricSource(event.target.value as FabricSource)}
                  >
                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                      {fabricSourceOptions.map((option) => {
                        const selected = formData.fabricSource === option.value;

                        return (
                          <Grid key={option.value} size={{ xs: 12, md: 4 }}>
                            <Card
                              variant="outlined"
                              sx={{
                                height: "100%",
                                borderColor: selected ? "primary.main" : "divider",
                                boxShadow: selected ? (theme) => `0 0 0 1px ${theme.palette.primary.main}` : "none",
                              }}
                            >
                              <Box sx={{ p: 2 }}>
                                <FormControlLabel
                                  value={option.value}
                                  control={<Radio />}
                                  label={
                                    <Stack spacing={0.5}>
                                      <Typography fontWeight={700}>{option.title}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {option.description}
                                      </Typography>
                                    </Stack>
                                  }
                                  sx={{ alignItems: "flex-start", m: 0, width: "100%" }}
                                />
                              </Box>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </RadioGroup>
                </FormControl>

                {formData.fabricSource === "own" ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        select
                        fullWidth
                        label="Fabric type"
                        value={formData.fabricType}
                        onChange={(event) => updateField("fabricType", event.target.value)}
                      >
                        <MenuItem value="cotton">Cotton</MenuItem>
                        <MenuItem value="silk">Silk</MenuItem>
                        <MenuItem value="georgette">Georgette</MenuItem>
                        <MenuItem value="rayon">Rayon</MenuItem>
                        <MenuItem value="linen">Linen</MenuItem>
                        <MenuItem value="chiffon">Chiffon</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        label="Fabric color"
                        value={formData.fabricColor}
                        onChange={(event) => updateField("fabricColor", event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Fabric notes"
                        value={formData.fabricNotes}
                        onChange={(event) => updateField("fabricNotes", event.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : null}

                {formData.fabricSource === "external" ? (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Fabric name"
                        value={formData.fabricName}
                        onChange={(event) => updateField("fabricName", event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        type="url"
                        label="Fabric link (optional)"
                        value={formData.fabricLink}
                        onChange={(event) => updateField("fabricLink", event.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Notes"
                        value={formData.fabricNotes}
                        onChange={(event) => updateField("fabricNotes", event.target.value)}
                      />
                    </Grid>
                  </Grid>
                ) : null}

                {formData.fabricSource === "rkstudio" ? (
                  <Stack spacing={2}>
                    {productsError ? <Alert severity="warning">{productsError}</Alert> : null}
                    {productsLoading ? (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={18} />
                        <Typography color="text.secondary">Loading RK Studio fabric options...</Typography>
                      </Stack>
                    ) : null}
                    {!productsLoading && products.length > 0 ? (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Choose the fabric visually. Tap any card to select it for your tailoring order.
                        </Typography>
                        {selectedFabricProduct ? (
                          <Card
                            variant="outlined"
                            sx={{
                              position: "sticky",
                              top: { xs: 72, md: 88 },
                              zIndex: 2,
                              borderColor: "primary.main",
                              boxShadow: (theme) => `0 10px 30px ${theme.palette.primary.main}22`,
                              background: (theme) =>
                                `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.primary.light}12 100%)`,
                            }}
                          >
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ p: 2 }} alignItems={{ xs: "flex-start", sm: "center" }}>
                              <Box
                                component="img"
                                src={selectedFabricProduct.image}
                                alt={selectedFabricProduct.name}
                                sx={{ width: { xs: "100%", sm: 96 }, height: { xs: 180, sm: 96 }, objectFit: "cover", borderRadius: 2 }}
                              />
                              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.6 }}>
                                    SELECTED FABRIC
                                  </Typography>
                                  {isDashboardPrefilledSelection ? (
                                    <Chip size="small" color="secondary" label="Prefilled from dashboard" />
                                  ) : null}
                                  {hasChangedFromPrefilledSelection ? (
                                    <Chip size="small" variant="outlined" color="warning" label="Changed from prefilled selection" />
                                  ) : null}
                                </Stack>
                                {isDashboardPrefilledSelection ? (
                                  <Typography variant="caption" color="text.secondary">
                                    This fabric was loaded from your dashboard. You can keep it or change the selection below.
                                  </Typography>
                                ) : null}
                                {hasChangedFromPrefilledSelection ? (
                                  <Typography variant="caption" color="text.secondary">
                                    You changed the original dashboard selection. This new fabric will be used for the tailoring order.
                                  </Typography>
                                ) : null}
                                <Typography variant="h6">{selectedFabricProduct.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {selectedFabricProduct.type} | {selectedFabricProduct.tag}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  INR {selectedFabricProduct.price}
                                  {selectedFabricProduct.discountPercent ? ` | ${selectedFabricProduct.discountPercent}% off` : ""}
                                  {selectedFabricProduct.rating ? ` | ${selectedFabricProduct.rating.toFixed(1)} rating` : ""}
                                </Typography>
                              </Stack>
                              <Button variant="outlined" color="inherit" onClick={() => updateField("rkStudioProductId", "") }>
                                Clear selection
                              </Button>
                            </Stack>
                          </Card>
                        ) : (
                          <Alert severity="info">No fabric selected yet. Pick one card below to continue.</Alert>
                        )}
                        {compareProducts.length > 0 ? (
                          <Card variant="outlined" sx={{ borderColor: "divider" }}>
                            <Stack spacing={1.5} sx={{ p: 2 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={700}>
                                  Compare Fabrics
                                </Typography>
                                <Button size="small" color="inherit" onClick={() => setCompareProductIds([])}>
                                  Clear compare
                                </Button>
                              </Stack>
                              <Grid container spacing={2}>
                                {compareProducts.map((product) => (
                                  <Grid key={`compare-${product.id}`} size={{ xs: 12, md: 6 }}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                      <Box
                                        component="img"
                                        src={product.image}
                                        alt={product.name}
                                        sx={{ width: "100%", height: 180, objectFit: "cover" }}
                                      />
                                      <Stack spacing={0.8} sx={{ p: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={700}>{product.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {product.type} | {product.tag}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          INR {product.price}
                                          {product.discountPercent ? ` | ${product.discountPercent}% off` : ""}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Rating: {product.rating?.toFixed(1) || "-"}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                          <Button variant="contained" size="small" onClick={() => updateField("rkStudioProductId", product.id)}>
                                            Select
                                          </Button>
                                          <Button variant="outlined" size="small" onClick={() => toggleCompareProduct(product.id)}>
                                            Remove
                                          </Button>
                                        </Stack>
                                      </Stack>
                                    </Card>
                                  </Grid>
                                ))}
                                {compareProducts.length === 1 ? (
                                  <Grid size={{ xs: 12, md: 6 }}>
                                    <Card
                                      variant="outlined"
                                      sx={{
                                        height: "100%",
                                        minHeight: 180,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderStyle: "dashed",
                                      }}
                                    >
                                      <Typography color="text.secondary" textAlign="center" sx={{ px: 2 }}>
                                        Select one more fabric with Compare to view side-by-side details.
                                      </Typography>
                                    </Card>
                                  </Grid>
                                ) : null}
                              </Grid>
                            </Stack>
                          </Card>
                        ) : null}
                        {savedProducts.length > 0 ? (
                          <Card variant="outlined" sx={{ borderColor: "divider" }}>
                            <Stack spacing={1.5} sx={{ p: 2 }}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="subtitle1" fontWeight={700}>
                                  Saved For Later
                                </Typography>
                                <Button size="small" color="inherit" onClick={() => setSavedProductIds([])}>
                                  Clear saved
                                </Button>
                              </Stack>
                              <Grid container spacing={2}>
                                {savedProducts.map((product) => (
                                  <Grid key={`saved-${product.id}`} size={{ xs: 12, sm: 6, lg: 4 }}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                      <Box
                                        component="img"
                                        src={product.image}
                                        alt={product.name}
                                        sx={{ width: "100%", height: 140, objectFit: "cover" }}
                                      />
                                      <Stack spacing={0.8} sx={{ p: 1.5 }}>
                                        <Typography fontWeight={700}>{product.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          {product.type} | INR {product.price}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                          <Button variant="contained" size="small" onClick={() => updateField("rkStudioProductId", product.id)}>
                                            Select
                                          </Button>
                                          <Button variant="outlined" size="small" onClick={() => toggleSavedProduct(product.id)}>
                                            Remove
                                          </Button>
                                        </Stack>
                                      </Stack>
                                    </Card>
                                  </Grid>
                                ))}
                              </Grid>
                            </Stack>
                          </Card>
                        ) : null}
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                              fullWidth
                              label="Search fabric"
                              placeholder="Search by name, type, or tag"
                              value={pickerFilters.query}
                              onChange={(event) => setPickerFilters((prev) => ({ ...prev, query: event.target.value }))}
                            />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                              select
                              fullWidth
                              label="Type"
                              value={pickerFilters.type}
                              onChange={(event) => setPickerFilters((prev) => ({ ...prev, type: event.target.value }))}
                            >
                              <MenuItem value="all">All types</MenuItem>
                              {availableFabricTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                  {type}
                                </MenuItem>
                              ))}
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                              select
                              fullWidth
                              label="Max price"
                              value={pickerFilters.maxPrice}
                              onChange={(event) => setPickerFilters((prev) => ({ ...prev, maxPrice: event.target.value }))}
                            >
                              <MenuItem value="1000">Up to INR 1000</MenuItem>
                              <MenuItem value="1500">Up to INR 1500</MenuItem>
                              <MenuItem value="2500">Up to INR 2500</MenuItem>
                              <MenuItem value="5000">Up to INR 5000</MenuItem>
                            </TextField>
                          </Grid>
                          <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                              select
                              fullWidth
                              label="Sort by"
                              value={pickerFilters.sortBy}
                              onChange={(event) => setPickerFilters((prev) => ({ ...prev, sortBy: event.target.value }))}
                            >
                              <MenuItem value="featured">Featured</MenuItem>
                              <MenuItem value="price-low">Price: Low to High</MenuItem>
                              <MenuItem value="price-high">Price: High to Low</MenuItem>
                              <MenuItem value="discount-first">Discount First</MenuItem>
                              <MenuItem value="rating-high">Top Rated</MenuItem>
                            </TextField>
                          </Grid>
                        </Grid>
                        <Typography variant="caption" color="text.secondary">
                          Showing {filteredFabricProducts.length} fabric option{filteredFabricProducts.length === 1 ? "" : "s"}.
                        </Typography>
                        <Grid container spacing={2}>
                          {filteredFabricProducts.map((product) => {
                            const isSelected = formData.rkStudioProductId === product.id;
                            const isCompared = compareProductIds.includes(product.id);
                            const isSaved = savedProductIds.includes(product.id);
                            const isHighlighted = highlightedProductId === product.id;

                            return (
                              <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                <Card
                                  id={`rkstudio-fabric-card-${product.id}`}
                                  variant="outlined"
                                  onClick={() => updateField("rkStudioProductId", product.id)}
                                  sx={{
                                    height: "100%",
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    borderColor: isSelected ? "primary.main" : "divider",
                                    boxShadow: isHighlighted
                                      ? (theme) => `0 0 0 2px ${theme.palette.primary.main}, 0 0 0 10px ${theme.palette.primary.main}22`
                                      : isSelected
                                        ? (theme) => `0 0 0 1px ${theme.palette.primary.main}`
                                        : "none",
                                    transition: "transform 180ms ease, box-shadow 240ms ease, border-color 180ms ease",
                                    animation: isHighlighted ? "rkStudioSelectedPulse 1.2s ease-out 1" : "none",
                                    '&:hover': {
                                      transform: "translateY(-4px)",
                                      boxShadow: 4,
                                    },
                                    '@keyframes rkStudioSelectedPulse': {
                                      '0%': {
                                        boxShadow: '0 0 0 0 rgba(14, 165, 233, 0.45)',
                                      },
                                      '50%': {
                                        boxShadow: '0 0 0 10px rgba(14, 165, 233, 0.18)',
                                      },
                                      '100%': {
                                        boxShadow: '0 0 0 2px rgba(14, 165, 233, 0)',
                                      },
                                    },
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={product.image}
                                    alt={product.name}
                                    sx={{ width: "100%", height: 180, objectFit: "cover" }}
                                  />
                                  <Stack spacing={1} sx={{ p: 2 }}>
                                    <Typography fontWeight={700}>{product.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {product.type} | {product.tag}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      INR {product.price}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                      <Button
                                        variant={isSelected ? "contained" : "outlined"}
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          updateField("rkStudioProductId", product.id);
                                        }}
                                      >
                                        {isSelected ? "Selected" : "Select Fabric"}
                                      </Button>
                                      <Button
                                        variant={isCompared ? "contained" : "text"}
                                        color="secondary"
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          toggleCompareProduct(product.id);
                                        }}
                                      >
                                        {isCompared ? "Compared" : "Compare"}
                                      </Button>
                                      <Button
                                        variant={isSaved ? "contained" : "text"}
                                        size="small"
                                        color="warning"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          toggleSavedProduct(product.id);
                                        }}
                                      >
                                        {isSaved ? "Saved" : "Save"}
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>
                        {filteredFabricProducts.length === 0 ? (
                          <Alert severity="info">
                            No fabrics match your current search or filters. Try a different type or higher price range.
                          </Alert>
                        ) : null}
                      </>
                    ) : null}
                    {!productsLoading && products.length === 0 ? (
                      <Alert severity="info">No RK Studio fabric products are available right now.</Alert>
                    ) : null}
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            {activeStep === 4 ? (
              <Stack spacing={2}>
                <Typography>5. Summary</Typography>
                <Alert severity="info">
                  <Stack spacing={0.7}>
                    <Typography variant="body2">Category: {formData.category || "-"}</Typography>
                    <Typography variant="body2">Design: {formData.design || "-"}</Typography>
                    <Typography variant="body2">
                      Measurements: Bust {formData.bust || "-"}, Waist {formData.waist || "-"}, Length {formData.length || "-"}
                    </Typography>
                    <Typography variant="body2">Extra Measurement: {formData.extraMeasurement || "-"}</Typography>
                    {fabricSummaryLines.map((line) => (
                      <Typography key={line} variant="body2">
                        {line}
                      </Typography>
                    ))}
                  </Stack>
                </Alert>
                <TextField
                  label="Your name"
                  value={formData.customerName}
                  onChange={(event) => updateField("customerName", event.target.value)}
                />
                <TextField
                  label="Phone number"
                  value={formData.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
              </Stack>
            ) : null}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Stack direction="row" justifyContent="space-between">
              <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0}>
                Back
              </Button>
              <Button variant="contained" onClick={handleNext} disabled={submitting}>
                {isLast ? "Proceed to Payment" : "Next"}
              </Button>
            </Stack>
          </Stack>
      </CardContent>
    </Card>
  );
}
