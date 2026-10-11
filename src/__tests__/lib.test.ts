import { describe, expect, it } from "vitest";
import { formatPaise, phoneProblem, pincodeProblem, priceRange } from "@/lib/format";
import { productHref, SNAPSHOT } from "@/lib/snapshot";
import { productEnquiryText, waLink } from "@/lib/whatsapp";

describe("money", () => {
  it("formats integer paise as rupees with Indian grouping", () => {
    expect(formatPaise(33000)).toBe("₹330");
    expect(formatPaise(12345678)).toBe("₹1,23,456.78");
  });
  it("shows a range only when prices differ", () => {
    expect(priceRange([18000, 62000, 33000])).toBe("₹180 – ₹620");
    expect(priceRange([15000])).toBe("₹150");
    expect(priceRange([])).toBe("");
  });
});

describe("phone and PIN checks mirror the server", () => {
  it.each(["9876543210", "98765 43210", "+91 98765-43210", "09876543210", "+44 7700 900123"])("accepts %s", (n) => {
    expect(phoneProblem(n)).toBeNull();
  });
  it.each(["", "12345", "5876543210", "+0123"])("rejects %j", (n) => {
    expect(phoneProblem(n)).not.toBeNull();
  });
  it("validates Indian PIN codes", () => {
    expect(pincodeProblem("534 201")).toBeNull();
    expect(pincodeProblem("034201")).not.toBeNull();
    expect(pincodeProblem("53420")).not.toBeNull();
  });
});

describe("WhatsApp links", () => {
  it("builds a wa.me link with an encoded message, only when a number is set", () => {
    const link = waLink("+91 98765 43210", productEnquiryText("Avakaya", "avakaya", "500 g"));
    expect(link).toMatch(/^https:\/\/wa\.me\/919876543210\?text=/);
    expect(decodeURIComponent(link!.split("text=")[1])).toContain("*Avakaya* (500 g)");
    expect(waLink("", "hi")).toBeNull();
  });
});

describe("product links", () => {
  it("uses the static page for snapshot products and the fallback page otherwise", () => {
    const known = SNAPSHOT.products[0]?.slug;
    if (known) expect(productHref(known)).toBe(`/products/${known}/`);
    expect(productHref("brand-new-item")).toBe("/product/?slug=brand-new-item");
  });
});
