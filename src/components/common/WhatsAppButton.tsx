"use client";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Fab, Tooltip } from "@mui/material";
import { RK_STUDIO } from "@/utils/constants";

export default function WhatsAppButton() {
  const href = RK_STUDIO.whatsappChatUrl;
  const hasWhatsappLink = Boolean(href);

  const handleOpenWhatsApp = () => {
    if (!hasWhatsappLink) {
      return;
    }

    window.open(href, "_blank", "noopener,noreferrer");
  };

  return (
    <Tooltip title={hasWhatsappLink ? "Chat on WhatsApp" : "Service temporarily unavailable"} arrow>
      <Fab
        onClick={handleOpenWhatsApp}
        disabled={!hasWhatsappLink}
        aria-label="Chat on WhatsApp"
        sx={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 9999,
          bgcolor: "#25D366",
          color: "#FFFFFF",
          pointerEvents: "auto",
          "&:hover": {
            bgcolor: "#1DAE57",
          },
          "&.Mui-disabled": {
            bgcolor: "#9CA3AF",
            color: "#F9FAFB",
          },
        }}
      >
        <WhatsAppIcon />
      </Fab>
    </Tooltip>
  );
}
