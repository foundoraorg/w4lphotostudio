import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useCatalogue } from "../lib/catalogue";
import { ArrowRight, ExternalLink, Mail, MapPin, Phone } from "./Icons";
import { Lockup } from "./Lockup";
import { useToast } from "./ui/Toast";

export function Footer() {
  const { data, sessions } = useCatalogue();
  const { settings } = data;
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes("@")) {
      toast("Add a valid email to join the letter.", "error");
      return;
    }
    setEmail("");
    toast("You're on the list. The next letter goes out on the first of the month.", "success");
  };

  return (
    <footer className="on-dark bg-night text-wall">
      <div className="wrap py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1.2fr]">
          <div>
            <Lockup dark size="lg" />
            <p className="mt-6 max-w-xs font-serif text-[15px] leading-relaxed text-wall/65">
              A photography studio on the Kenyan coast, making calm, editorial work for people and brands.
            </p>
            <p className="mt-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-wall/50">
              <span aria-hidden="true" className="inline-block h-[5px] w-[5px] rounded-full bg-accent" />
              {settings.tagline}
            </p>
          </div>

          <nav aria-label="Footer sessions">
            <h2 className="kicker !text-accent">Sessions</h2>
            <ul className="mt-4 space-y-2">
              {sessions.slice(0, 5).map((session) => (
                <li key={session.id}>
                  <Link to={`/sessions/${session.slug}`} className="font-serif text-[15px] text-wall/75 transition-colors hover:text-accent">
                    {session.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/sessions" className="font-mono text-[11px] uppercase tracking-[0.14em] text-wall/50 hover:text-accent">
                  All nine sessions →
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Footer studio">
            <h2 className="kicker !text-accent">Studio</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/index" className="font-serif text-[15px] text-wall/75 hover:text-accent">
                  Index
                </Link>
              </li>
              <li>
                <Link to="/studio" className="font-serif text-[15px] text-wall/75 hover:text-accent">
                  About the studio
                </Link>
              </li>
              <li>
                <Link to="/estimate" className="font-serif text-[15px] text-wall/75 hover:text-accent">
                  Build an estimate
                </Link>
              </li>
              <li>
                <Link to="/contact" className="font-serif text-[15px] text-wall/75 hover:text-accent">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/admin" className="font-serif text-[15px] text-wall/75 hover:text-accent">
                  Studio admin
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="kicker !text-accent">The letter</h2>
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-wall/65">
              New work, open dates and studio notes. One email a month, nothing else.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex items-stretch border border-wall/25">
              <label htmlFor="newsletter" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                className="min-h-[44px] w-full bg-transparent px-3 font-serif text-[15px] text-wall placeholder:text-wall/40 focus:outline-none"
                autoComplete="email"
              />
              <button
                type="submit"
                className="flex w-12 shrink-0 items-center justify-center bg-accent text-ink"
                aria-label="Subscribe to the newsletter"
              >
                <ArrowRight size={18} />
              </button>
            </form>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-wall/35">Interface only · no email stored</p>

            <ul className="mt-6 space-y-2 font-mono text-[11px] tracking-[0.06em] text-wall/65">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="shrink-0 text-accent" />
                <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-accent">
                  {settings.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="shrink-0 text-accent" />
                <a href={`mailto:${settings.email}`} className="hover:text-accent">
                  {settings.email}
                </a>
              </li>
            </ul>

            <ul className="mt-5 flex flex-wrap gap-4">
              {settings.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-wall/50 hover:text-accent"
                  >
                    {social.label}
                    <ExternalLink size={11} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-wall/15 pb-12 pr-24 pt-6 sm:flex-row sm:items-center sm:justify-between lg:pb-0 lg:pr-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wall/40">
            © {new Date().getFullYear()} W4L Studios · in association with Foundora
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-wall/40">
            Watamu · Kilifi · Malindi · Mombasa
          </p>
        </div>
      </div>
    </footer>
  );
}
