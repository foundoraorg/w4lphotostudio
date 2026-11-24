import { useCatalogue } from "../lib/catalogue";
import { WhatsApp } from "./Icons";

export function WhatsAppButton() {
  const { data } = useCatalogue();
  const { settings } = data;
  const href = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
    "Hello W4L Studios, I'd like to ask about a session.",
  )}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-ink text-accent shadow-[0_10px_30px_rgba(16,19,24,0.25)] transition-transform hover:scale-105 lg:bottom-6 lg:right-6 lg:h-12 lg:w-12"
      aria-label="Chat with the studio on WhatsApp"
    >
      <WhatsApp size={22} />
    </a>
  );
}
