"use client";

import { Box, Step, StepLabel, Stepper, Typography, useMediaQuery, useTheme } from "@mui/material";

type TailoringStepperProps = {
  steps: string[];
  activeStep: number;
};

export default function TailoringStepper({ steps, activeStep }: TailoringStepperProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ mb: 3, width: "100%", maxWidth: "100%", overflowX: "hidden" }}>
      <Stepper
        activeStep={activeStep}
        alternativeLabel={!isMobile}
        sx={{
          width: "100%",
          maxWidth: "100%",
          "& .MuiStepLabel-label": {
            fontSize: { xs: "0.78rem", sm: "0.875rem" },
            whiteSpace: "normal",
          },
        }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{isMobile ? "" : label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {isMobile ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
        </Typography>
      ) : null}
    </Box>
  );
}
