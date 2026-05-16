import { OrderServiceType } from "@/services/orderService";
import { RK_STUDIO } from "@/utils/constants";

type SendToWhatsAppInput = {
  name: string;
  phone: string;
  service: OrderServiceType;
  details: string;
};

const WHATSAPP_NUMBER = RK_STUDIO.whatsappNumber;

const buildOrderMessage = ({ name, phone, service, details }: SendToWhatsAppInput) => {
  return [
    "Hello RK Studio,",
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Service: ${service}`,
    `City: ${RK_STUDIO.city}`,
    `Details: ${details}`,
    "Please confirm my order details.",
  ].join("\n");
};

export const buildWhatsAppUrl = (input: SendToWhatsAppInput) => {
  const message = buildOrderMessage(input);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const sendToWhatsApp = (input: SendToWhatsAppInput) => {
  if (typeof window === "undefined") {
    return;
  }

  const url = buildWhatsAppUrl(input);
  window.open(url, "_blank", "noopener,noreferrer");
};

export const openWhatsAppOrder = ({
  name,
  phone,
  service,
  selectedService,
}: {
  name: string;
  phone: string;
  service: OrderServiceType;
  selectedService: string;
}) => {
  sendToWhatsApp({
    name,
    phone,
    service,
    details: selectedService,
  });
};
