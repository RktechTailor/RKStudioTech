"use client";

import { Step, StepLabel, Stepper } from "@mui/material";

type TailoringStepperProps = {
  steps: string[];
  activeStep: number;
};

export default function TailoringStepper({ steps, activeStep }: TailoringStepperProps) {
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
      {steps.map((label) => (
        <Step key={label}>
          <StepLabel>{label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
