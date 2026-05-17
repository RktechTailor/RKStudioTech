"use client";

import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Fade,
  FormControlLabel,
  FormGroup,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import LaunchIcon from "@mui/icons-material/Launch";
import { useState } from "react";

type UpdateOption = {
  id: string;
  label: string;
  href: string;
};

const ALL_OPTIONS: UpdateOption[] = [
  { id: "products",   label: "Products",    href: "/admin/products" },
  { id: "prices",     label: "Prices",      href: "/admin/products" },
  { id: "images",     label: "Images",      href: "/admin/products" },
  { id: "offers",     label: "Offers",      href: "/admin" },
  { id: "appDetails", label: "App Details", href: "/admin" },
];

const DEFAULT_CHECKLIST = ALL_OPTIONS.slice(0, 3);

const STEPS = ["Pre-Launch Check", "Update", "Launch"];

// step 1 | 2 | 3 | success
type Step1 = "1";
type Step2 = "2";
type Step3 = "3";
type StepSuccess = "success";
type FlowStep = Step1 | Step2 | Step3 | StepSuccess;

const stepToIndex: Record<FlowStep, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "success": 2,
};

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PreLaunchFlow({ open, onClose }: Props) {
  const [step, setStep] = useState<FlowStep>("1");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [completedItems, setCompletedItems] = useState<string[]>([]);

  const activeStepIndex = stepToIndex[step];

  const handleToggle = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleMarkDone = (id: string) => {
    setCompletedItems((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleReset = () => {
    setStep("1");
    setSelectedItems([]);
    setCompletedItems([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const selectedOptions = ALL_OPTIONS.filter((opt) => selectedItems.includes(opt.id));
  const checklist = selectedOptions.length > 0 ? selectedOptions : DEFAULT_CHECKLIST;
  const allCompleted =
    selectedOptions.length > 0 &&
    selectedOptions.every((opt) => completedItems.includes(opt.id));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
    >
      {step !== "success" && (
        <DialogTitle sx={{ pb: 2, pt: 3 }}>
          <Stepper activeStep={activeStepIndex} alternativeLabel>
            {STEPS.map((label, index) => (
              <Step key={label} completed={activeStepIndex > index}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </DialogTitle>
      )}

      <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, pb: 4 }}>

        {/* ── Step 1: Pre-Launch Check ── */}
        {step === "1" && (
          <Stack spacing={3} pt={1}>
            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={700}>
                Before launch, do you want to update anything?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select the sections you want to review before going live.
              </Typography>
            </Stack>

            <FormGroup>
              {ALL_OPTIONS.map((opt) => (
                <FormControlLabel
                  key={opt.id}
                  control={
                    <Checkbox
                      checked={selectedItems.includes(opt.id)}
                      onChange={() => handleToggle(opt.id)}
                      color="primary"
                    />
                  }
                  label={opt.label}
                />
              ))}
            </FormGroup>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button
                variant="contained"
                onClick={() => setStep("2")}
                disabled={selectedItems.length === 0}
                fullWidth
              >
                Yes, Update
              </Button>
              <Button
                variant="outlined"
                onClick={() => setStep("3")}
                fullWidth
              >
                Skip &amp; Launch
              </Button>
            </Stack>
          </Stack>
        )}

        {/* ── Step 2: Update Flow ── */}
        {step === "2" && (
          <Stack spacing={3} pt={1}>
            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={700}>
                Update Sections
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Click Update to open each section, then mark it done.
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {selectedOptions.map((opt) => {
                const done = completedItems.includes(opt.id);

                return (
                  <Stack
                    key={opt.id}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderRadius: 2,
                      border: "1px solid",
                      borderColor: done ? "success.main" : "divider",
                      bgcolor: done ? "rgba(46,125,50,0.06)" : "background.paper",
                      transition: "border-color 0.25s, background-color 0.25s",
                    }}
                  >
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      {done ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                      )}
                      <Typography fontWeight={done ? 600 : 400}>
                        {opt.label}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        component="a"
                        href={opt.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        endIcon={<LaunchIcon fontSize="inherit" />}
                        onClick={() => handleMarkDone(opt.id)}
                        disabled={done}
                        sx={{ minWidth: 90 }}
                      >
                        Update
                      </Button>
                      {done && (
                        <Chip label="Done" size="small" color="success" />
                      )}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>

            <Button
              variant="contained"
              onClick={() => setStep("3")}
              disabled={!allCompleted}
            >
              Continue to Launch
            </Button>
          </Stack>
        )}

        {/* ── Step 3: Launch Confirmation ── */}
        {step === "3" && (
          <Stack spacing={3} pt={1}>
            <Stack spacing={0.5}>
              <Typography variant="h6" fontWeight={700}>
                Ready to Launch?
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Review the checklist below before going live.
              </Typography>
            </Stack>

            <Stack spacing={1.2}>
              {checklist.map((item) => (
                <Stack
                  key={item.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    px: 2,
                    py: 1.2,
                    borderRadius: 2,
                    bgcolor: "rgba(46,125,50,0.06)",
                    border: "1px solid",
                    borderColor: "success.light",
                  }}
                >
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography sx={{ flexGrow: 1 }}>{item.label}</Typography>
                  <Chip label="Ready" size="small" color="success" variant="outlined" />
                </Stack>
              ))}
            </Stack>

            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<RocketLaunchIcon />}
              onClick={() => setStep("success")}
            >
              Launch Now
            </Button>
          </Stack>
        )}

        {/* ── Success Screen ── */}
        {step === "success" && (
          <Stack spacing={3} alignItems="center" py={5}>
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                bgcolor: "rgba(46,125,50,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 56, color: "success.main" }} />
            </Box>

            <Stack spacing={1} alignItems="center">
              <Typography variant="h5" fontWeight={700} textAlign="center">
                App Launched Successfully 🎉
              </Typography>
              <Typography color="text.secondary" textAlign="center" variant="body2">
                Your tailoring app is now live. Customers can start placing orders.
              </Typography>
            </Stack>

            <Button variant="contained" color="success" onClick={handleClose}>
              Back to Dashboard
            </Button>
          </Stack>
        )}

      </DialogContent>
    </Dialog>
  );
}
