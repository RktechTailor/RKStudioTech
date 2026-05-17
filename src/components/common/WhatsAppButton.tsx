import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Fab, Tooltip } from "@mui/material";
import { RK_STUDIO } from "@/utils/constants";

export default function WhatsAppButton() {
  const href = RK_STUDIO.whatsappChatUrl;

  return (
    <Tooltip title="Chat on WhatsApp" arrow>
      <Fab
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        sx={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 1200,
          bgcolor: "#25D366",
          color: "#FFFFFF",
          "&:hover": {
            bgcolor: "#1DAE57",
          },
        }}
      >
        <WhatsAppIcon />
      </Fab>
    </Tooltip>
  );
}
