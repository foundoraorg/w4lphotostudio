import { useState } from "react";
import { ExternalLink, Mail, MapPin, Phone, WhatsApp } from "../components/Icons";
import { useToast } from "../components/ui/Toast";
import { Reveal } from "../components/ui/Reveal";
import { useCatalogue } from "../lib/catalogue";
import { useDocumentTitle } from "../lib/useDocumentTitle";

export function Contact() {
  useDocumentTitle(
    "Contact — W4L Studios, Watamu",
    "Find W4L Studios on Turtle Bay Road, Watamu. Studio hours, phone, WhatsApp, email and a message form that opens in WhatsApp or your mail app.",
  );
  const { data } = useCatalogue();
  const { settings } = data;
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", contact: "", session: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Add your name.";
    if (form.contact.trim().length < 5) next.contact = "Add a phone number or an email.";
    if (form.message.trim().length < 10) next.message = "A sentence or two about the shoot helps.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const body = `Name: ${form.name}\nContact: ${form.contact}\nSession: ${form.session || "Not sure yet"}\n\n${form.message}`;

  const sendWhatsApp = () => {
    if (!validate()) {
      toast("A couple of fields need attention.", "error");
      return;
    }
    window.open(
      `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello W4L Studios,\n\n${body}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const sendEmail = () => {
    if (!validate()) {
      toast("A couple of fields need attention.", "error");
      return;
    }
    window.location.href = `mailto:${settings.email}?subject=${encodeURIComponent(
      "Studio enquiry",
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="bg-wall">
      <section className="wrap pb-10 pt-10 md:pt-16">
        <p className="kicker">Contact</p>
        <h1 className="page-title mt-3 max-w-3xl">Tell us what you're making.</h1>
        <p className="mt-5 max-w-xl font-serif text-[17px] leading-relaxed text-ink/75">
          A message here goes straight to the studio phone. If you already know the session, the booking calendar is faster —
          you can hold a date without speaking to anyone.
        </p>
      </section>

      <section className="wrap grid gap-12 pb-16 md:grid-cols-[1.05fr_0.95fr] md:gap-16 md:pb-24">
        <Reveal variant="fade" className="block">
          <form
            className="border border-line bg-page p-5 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              sendWhatsApp();
            }}
          >
            <h2 className="font-display text-[20px] uppercase tracking-[0.04em]">Send a note</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label htmlFor="contact-name" className="label">
                  Your name
                </label>
                <input
                  id="contact-name"
                  className="field"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                />
                {errors.name && <p className="mt-1 font-mono text-[11px] text-bronze">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="contact-detail" className="label">
                  Phone or email
                </label>
                <input
                  id="contact-detail"
                  className="field"
                  value={form.contact}
                  onChange={(event) => setForm({ ...form, contact: event.target.value })}
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.contact)}
                />
                {errors.contact && <p className="mt-1 font-mono text-[11px] text-bronze">{errors.contact}</p>}
              </div>
              <div>
                <label htmlFor="contact-session" className="label">
                  Session (optional)
                </label>
                <select
                  id="contact-session"
                  className="field"
                  value={form.session}
                  onChange={(event) => setForm({ ...form, session: event.target.value })}
                >
                  <option value="">Not sure yet</option>
                  {data.sessions.map((session) => (
                    <option key={session.id} value={session.title}>
                      {session.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="contact-message" className="label">
                  What do you have in mind?
                </label>
                <textarea
                  id="contact-message"
                  className="field min-h-[130px] resize-y"
                  value={form.message}
                  onChange={(event) => setForm({ ...form, message: event.target.value })}
                  placeholder="Dates, people, references, anything we should know."
                  aria-invalid={Boolean(errors.message)}
                />
                {errors.message && <p className="mt-1 font-mono text-[11px] text-bronze">{errors.message}</p>}
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button type="submit" className="btn btn-lime flex-1">
                <WhatsApp size={15} /> Send on WhatsApp
              </button>
              <button type="button" onClick={sendEmail} className="btn flex-1">
                <Mail size={15} /> Email instead
              </button>
            </div>
            <p className="mt-3 font-serif text-[12px] leading-snug text-muted">
              Nothing is stored here. Your message opens in WhatsApp or your mail app, ready to send.
            </p>
          </form>
        </Reveal>

        <div className="space-y-8">
          <div>
            <h2 className="kicker">The studio</h2>
            <address className="mt-3 not-italic">
              <p className="flex items-start gap-2 font-serif text-[17px] leading-snug">
                <MapPin size={17} className="mt-1 shrink-0 text-bronze" />
                {settings.address}
              </p>
            </address>
            <ul className="mt-4 space-y-2 font-mono text-[12px]">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-bronze" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-bronze">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-bronze" />
                <a href={`mailto:${settings.email}`} className="hover:text-bronze">
                  {settings.email}
                </a>
              </li>
            </ul>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden border border-line bg-drawer" role="img" aria-label="Map placeholder showing the studio on Turtle Bay Road, Watamu">
            <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true">
              <rect width="400" height="300" fill="#EAE3D6" />
              <g stroke="#D5CBB9" strokeWidth="1.5">
                {Array.from({ length: 9 }).map((_, index) => (
                  <line key={`h-${index}`} x1="0" y1={20 + index * 34} x2="400" y2={20 + index * 34} />
                ))}
                {Array.from({ length: 11 }).map((_, index) => (
                  <line key={`v-${index}`} x1={10 + index * 38} y1="0" x2={10 + index * 38} y2="300" />
                ))}
              </g>
              <path d="M-20 210 C 80 200, 140 230, 240 150 S 360 90, 430 120" stroke="#C7BBA6" strokeWidth="16" fill="none" />
              <path d="M-20 210 C 80 200, 140 230, 240 150 S 360 90, 430 120" stroke="#F6F1E7" strokeWidth="2" fill="none" strokeDasharray="6 8" />
              <circle cx="238" cy="152" r="26" fill="#C8F23D" opacity="0.35" />
              <circle cx="238" cy="152" r="7" fill="#29211D" />
              <circle cx="238" cy="152" r="2.5" fill="#C8F23D" />
              <text x="252" y="140" fontFamily="DM Mono, monospace" fontSize="10" fill="#29211D" letterSpacing="1.5">
                W4L STUDIOS
              </text>
              <text x="252" y="154" fontFamily="DM Mono, monospace" fontSize="9" fill="#6F665F" letterSpacing="1">
                TURTLE BAY ROAD
              </text>
              <text x="20" y="285" fontFamily="DM Mono, monospace" fontSize="9" fill="#6F665F" letterSpacing="1.5">
                WATAMU · KILIFI COUNTY
              </text>
            </svg>
          </div>
          <a
            href="https://www.openstreetmap.org/search?query=Watamu%2C%20Kilifi%20County%2C%20Kenya"
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline text-ink"
          >
            Open the map <ExternalLink size={12} />
          </a>

          <div>
            <h2 className="kicker">Hours</h2>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {settings.hours.map((entry) => (
                <li key={entry.days} className="flex items-baseline justify-between gap-4 py-2 font-serif text-[15px]">
                  <span>{entry.days}</span>
                  <span className="font-mono text-[12px] text-ink/70">{entry.time}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="kicker">Follow</h2>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {settings.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline text-ink"
                  >
                    {social.label} · {social.handle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
