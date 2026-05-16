import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Fab, Tooltip } from "@mui/material";
import { RK_STUDIO } from "@/utils/constants";

export default function WhatsAppButton() {
  const href =
    `https://wa.me/${RK_STUDIO.whatsappNumber}?text=Hello%20RK%20Studio%2C%20mujhe%20silai%20%2F%20kapda%20ke%20bare%20me%20jankari%20chahiye.`;

  return (
    <Tooltip title="WhatsApp par puchhiye" arrow>
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
