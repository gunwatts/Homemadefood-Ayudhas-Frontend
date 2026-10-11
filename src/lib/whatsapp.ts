// WhatsApp "click to chat" links. These only open WhatsApp with a pre-filled message;
// the visitor must press Send. Nothing is sent in the background.

export function waDigits(number: string | undefined | null): string {
  return (number || "").replace(/\D/g, "");
}

export function waLink(number: string | undefined | null, text: string): string | null {
  const digits = waDigits(number);
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function productEnquiryText(productName: string, slug: string, packLabel?: string): string {
  const pack = packLabel ? ` (${packLabel})` : "";
  return `Hello! I'm interested in *${productName}*${pack} from your website.\nProduct ref: ${slug}\nCould you tell me about availability and delivery to my PIN code?`;
}
