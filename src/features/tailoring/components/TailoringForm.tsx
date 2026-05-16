"use client";

import { Alert, Box, Button, Card, CardContent, FormControl, FormControlLabel, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useMemo, useState } from "react";
import { useGlobalLoading } from "@/context/LoadingContext";
import { useAuth } from "@/hooks/useAuth";
import { saveOrderToFirestore } from "@/services/orderService";
import { sendToWhatsApp } from "@/utils/whatsapp";
import TailoringStepper from "./TailoringStepper";

type TailoringFormData = {
  category: string;
  design: string;
  bust: string;
  waist: string;
  length: string;
  optionalFabric: string;
  notes: string;
  customerName: string;
  phone: string;
};

const stepLabels = ["Category", "Design", "Measurements", "Fabric", "Summary"];

const initialData: TailoringFormData = {
  category: "",
  design: "",
  bust: "",
  waist: "",
  length: "",
  optionalFabric: "no",
  notes: "",
  customerName: "",
  phone: "",
};

export default function TailoringForm() {
  const { user } = useAuth();
  const { trackAsync } = useGlobalLoading();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<TailoringFormData>(initialData);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const isLast = activeStep === stepLabels.length - 1;

  const updateField = (field: keyof TailoringFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validationMessage = useMemo(() => {
    if (activeStep === 0 && !formData.category) return "Please select tailoring category.";
    if (activeStep === 1 && !formData.design) return "Please select design type.";
    if (activeStep === 2 && (!formData.bust || !formData.waist || !formData.length)) {
      return "Please fill all required measurements.";
    }
    if (activeStep === 3 && !formData.optionalFabric) return "Please choose optional fabric preference.";
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
      const selectedService = `${formData.category || "tailoring"} - ${formData.design || "standard"}`;

      try {
        setSubmitting(true);
        await trackAsync(
          saveOrderToFirestore({
            userId,
            service: "tailoring",
            orderDetails: {
              category: formData.category || "-",
              design: formData.design || "-",
              bust: formData.bust || "-",
              waist: formData.waist || "-",
              length: formData.length || "-",
              optionalFabric: formData.optionalFabric || "-",
              notes: formData.notes || "-",
            },
          }),
        );

        sendToWhatsApp({
          name,
          phone,
          service: "tailoring",
          details: selectedService,
        });

        setSubmitted(true);
      } catch {
        setError("Order save failed. Please check Firebase setup and try again.");
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

        {submitted ? (
          <Alert severity="success">We will contact you on WhatsApp. Serving Narnaul (123001) | Home visit available.</Alert>
        ) : (
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
                </Grid>
              </Box>
            ) : null}

            {activeStep === 3 ? (
              <FormControl>
                <FormLabel>4. Optional fabric</FormLabel>
                <RadioGroup
                  value={formData.optionalFabric}
                  onChange={(event) => updateField("optionalFabric", event.target.value)}
                >
                  <FormControlLabel value="yes" control={<Radio />} label="Yes, fabric bhi chahiye" />
                  <FormControlLabel value="no" control={<Radio />} label="No, mere paas fabric hai" />
                </RadioGroup>
                <TextField
                  sx={{ mt: 2 }}
                  label="Extra notes"
                  multiline
                  minRows={3}
                  value={formData.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </FormControl>
            ) : null}

            {activeStep === 4 ? (
              <Stack spacing={2}>
                <Typography>5. Summary</Typography>
                <Alert severity="info">
                  Category: {formData.category || "-"} | Design: {formData.design || "-"} | Measurements: Bust {formData.bust || "-"}, Waist {formData.waist || "-"}, Length {formData.length || "-"}
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
                {isLast ? "Submit" : "Next"}
              </Button>
            </Stack>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
