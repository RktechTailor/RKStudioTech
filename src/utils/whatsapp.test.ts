import { describe, expect, it } from "vitest";
import { buildWhatsAppUrl } from "@/utils/whatsapp";

describe("buildWhatsAppUrl", () => {
  it("builds encoded WhatsApp URL with service and details", () => {
    const url = buildWhatsAppUrl({
      name: "Kuldeep",
      phone: "+919999999999",
      service: "tailoring",
      details: ["Design: Party", "Payment: Advance Paid"],
    });

    expect(url).toContain("https://wa.me/");
    expect(url).toContain(encodeURIComponent("Name: Kuldeep"));
    expect(url).toContain(encodeURIComponent("Service: tailoring"));
    expect(url).toContain(encodeURIComponent("Payment: Advance Paid"));
  });
});
