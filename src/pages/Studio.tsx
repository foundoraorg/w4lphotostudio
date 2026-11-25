import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ExternalLink } from "../components/Icons";
import { Accordion } from "../components/ui/Accordion";
import { FoundoraLockup } from "../components/Foundora";
import { CountUp } from "../components/ui/CountUp";
import { PrintImage } from "../components/ui/PrintImage";
import { Divider, Reveal } from "../components/ui/Reveal";
import { useCatalogue } from "../lib/catalogue";
import { GEAR, STUDIO_HIRE } from "../lib/config";
import { useCurrency } from "../lib/currency";
import { useParallax } from "../lib/hooks";
import { useDocumentTitle } from "../lib/useDocumentTitle";

const STEPS = [
  {
    id: "01",
    title: "Choose the session",
    body: "Start from the catalogue and shape the estimate. Add time, people, location and extras until it fits the brief.",
  },
  {
    id: "02",
    title: "Hold the date",
    body: "Pick a day and a slot on the booking calendar. The 30% deposit confirms it, and the studio rechecks the slot before anything is written down.",
  },
  {
    id: "03",
    title: "Shoot day",
    body: "Come to the studio or we travel to you. Light, direction and wardrobe are handled here, so you only have to arrive.",
  },
  {
    id: "04",
    title: "The gallery",
    body: "Choose your frames from a private gallery and we retouch them by hand. Delivered in seven working days, or 48 hours with rush.",
  },
];

export function Studio() {
  useDocumentTitle(
    "Studio — W4L Studios, Watamu",
    "Inside W4L Studios: the room, the gear, how a session runs, studio hire rates and the Foundora partnership.",
  );
  const { data } = useCatalogue();
  const { fmt } = useCurrency();
  const parallax = useParallax<HTMLDivElement>(0.12);
  const heroSession = data.sessions[5] ?? data.sessions[0];

  return (
    <div className="bg-wall">
      <section className="relative h-[58vh] min-h-[380px] overflow-hidden border-b border-line" aria-label="The studio">
        <div className="absolute inset-0 overflow-hidden">
          <div ref={parallax} className="absolute -inset-y-[12%] inset-x-0 scale-105">
            {heroSession && (
              <PrintImage
                session={heroSession}
                alt={`${heroSession.title} at W4L Studios`}
                className="h-full w-full"
                sizes="100vw"
              />
            )}
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-wall via-wall/25 to-transparent" />
        <div className="relative z-10 flex h-full items-end">
          <div className="wrap pb-10">
            <p className="kicker">Watamu, Kenya · Est. 2019</p>
            <h1 className="page-title mt-3 max-w-3xl">A studio, not a conveyor belt.</h1>
            <p className="mt-4 max-w-lg font-serif text-[16px] leading-relaxed text-ink/80">
              One room, good light and enough time to do it properly. In association with Foundora.
            </p>
          </div>
        </div>
      </section>

      <section className="wrap py-16 md:py-24" aria-labelledby="about-title">
        <div className="grid gap-10 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
          <div>
            <p className="kicker">About</p>
            <h2 id="about-title" className="mt-4 font-display text-[clamp(30px,3.6vw,48px)] uppercase leading-[0.95]">
              Warm rooms, sharp light, unhurried people.
            </h2>
          </div>
          <div className="prose-studio max-w-xl">
            <p>
              W4L Studios is run by a small team of photographers and a retoucher on Turtle Bay Road in Watamu. We shoot
              portraits, families, editorial, product and brand work, mostly on the coast, sometimes further inland.
            </p>
            <p className="mt-4">
              The work is warm and direct. We light for skin rather than drama, we direct enough that nobody has to invent a
              pose, and we keep the room quiet so the pictures look like the people in them.
            </p>
            <p className="mt-4">
              We work in association with <strong className="font-medium">Foundora</strong>, a design practice that builds
              slow, useful things. Their tagline is the belief we shoot by: find better, live smarter.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/sessions" className="btn btn-lime">
                See the sessions <ArrowRight size={15} />
              </Link>
              <Link to="/contact" className="btn">
                Ask us anything
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-page" aria-labelledby="gear-title">
        <div className="wrap py-14 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="kicker">The gear and the space</p>
              <h2 id="gear-title" className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] uppercase leading-[0.95]">
                Everything is in the room.
              </h2>
            </div>
            <p className="max-w-sm font-serif text-[15px] leading-relaxed text-ink/70">
              Two shooting bays, a cyclorama corner, a changing room, a steamer and a kettle. Parking is on the road outside.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {GEAR.map((item, index) => (
              <Reveal key={item.id} variant="fade" delay={index * 80} className="block">
                <p className="font-display text-[clamp(42px,6vw,76px)] leading-none">
                  <CountUp value={item.value} suffix={item.suffix} />
                </p>
                <p className="micro mt-2">{item.label}</p>
              </Reveal>
            ))}
          </div>

          <Divider className="mt-12" />

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                title: "Lighting",
                body: "Profoto-style strobes with softboxes, beauty dish, strip lights and a ring. Continuous light for video and reels.",
              },
              {
                title: "Backdrops",
                body: "Twelve hand-painted and paper grounds in ivory, sand, ochre, clay and a deep espresso. Swappable in ten minutes.",
              },
              {
                title: "Space",
                body: "Six point two metres of height, a wide shooting bay and a corner built for headshots. Hireable by the half or full day.",
              },
            ].map((block) => (
              <div key={block.title}>
                <h3 className="font-display text-[16px] uppercase tracking-[0.08em]">{block.title}</h3>
                <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink/75">{block.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <section className="border-t border-line bg-page py-14 md:py-20" aria-labelledby="testimonials-title">
        <div className="wrap flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">In their words</p>
            <h2 id="testimonials-title" className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] uppercase leading-[0.95]">
              Five hundred families later.
            </h2>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Drag to read</p>
        </div>
        <div className="snap-row mt-8 pb-2" role="list" aria-label="Client testimonials">
          {data.testimonials.map((item) => (
            <figure key={item.id} className="w-[78vw] max-w-[420px] border border-line bg-wall p-6" role="listitem">
              <blockquote className="font-serif text-[18px] leading-relaxed">“{item.quote}”</blockquote>
              <figcaption className="micro mt-5">
                {item.name} · {item.session}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap py-14 md:py-20" aria-labelledby="faq-title">
        <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
          <div>
            <p className="kicker">Questions</p>
            <h2 id="faq-title" className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] uppercase leading-[0.95]">
              The things people ask.
            </h2>
            <p className="mt-4 font-serif text-[15px] leading-relaxed text-ink/70">
              Anything else, the studio answers on WhatsApp within the working day.
            </p>
            <Link to="/contact" className="link-underline mt-5 text-ink">
              Ask a question <ArrowRight size={14} />
            </Link>
          </div>
          <Accordion items={data.faqs.map((faq) => ({ id: faq.id, title: faq.q, content: <p>{faq.a}</p> }))} />
        </div>
      </section>

      <section className="border-t border-line bg-page py-14 md:py-20" aria-labelledby="hire-title">
        <div className="wrap">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">Studio hire</p>
              <h2 id="hire-title" className="mt-3 font-display text-[clamp(28px,3.4vw,44px)] uppercase leading-[0.95]">
                Take the room for the day.
              </h2>
            </div>
            <Link to="/contact" className="btn">
              Check availability
            </Link>
          </div>

          <ul className="mt-8 divide-y divide-line border-y border-line">
            {STUDIO_HIRE.map((rate) => (
              <li key={rate.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-6">
                <span className="font-display text-[17px] uppercase tracking-[0.04em]">{rate.label}</span>
                <span className="font-mono text-[15px] text-bronze">
                  {fmt(rate.price)} <span className="text-[10px] uppercase text-muted">/ {rate.unit}</span>
                </span>
                <span className="font-serif text-[14px] text-ink/65 sm:text-right">{rate.note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-serif text-[13px] text-muted">
            Hire includes an assistant, tea and the use of the backdrops. Lighting is included; a technician is quoted separately.
          </p>
        </div>
      </section>

      <PartnerBand />
    </div>
  );
}

function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const middle = window.innerHeight / 2;
      let nearest = 0;
      let distance = Number.POSITIVE_INFINITY;
      refs.current.forEach((node, index) => {
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const centre = rect.top + rect.height / 2;
        const nextDistance = Math.abs(centre - middle);
        if (nextDistance < distance) {
          distance = nextDistance;
          nearest = index;
        }
      });
      setActive(nearest);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="wrap py-16 md:py-24" aria-labelledby="how-title">
      <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <p className="kicker">How it works</p>
          <h2 id="how-title" className="mt-3 font-display text-[clamp(30px,3.6vw,48px)] uppercase leading-[0.95]">
            From curiosity to a held date.
          </h2>
          <p className="mt-4 max-w-sm font-serif text-[15px] leading-relaxed text-ink/70">
            Four steps, mostly on your phone. No calls unless you want one.
          </p>
        </div>

        <ol className="relative">
          <span aria-hidden="true" className="absolute bottom-6 left-[15px] top-6 w-px bg-line md:left-[19px]" />
          {STEPS.map((step, index) => (
            <li
              key={step.id}
              ref={(node) => {
                refs.current[index] = node;
              }}
              className={`relative flex gap-5 border-b border-line py-7 pl-0 transition-opacity duration-500 last:border-0 ${
                active === index ? "opacity-100" : "opacity-45"
              }`}
            >
              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] transition-colors md:h-10 md:w-10 ${
                  active === index ? "border-ink bg-accent text-ink" : "border-line bg-wall text-muted"
                }`}
                aria-hidden="true"
              >
                {index === active ? <Check size={14} /> : step.id}
              </span>
              <div>
                <h3 className="font-display text-[18px] uppercase tracking-[0.04em]">{step.title}</h3>
                <p className="mt-2 max-w-md font-serif text-[15px] leading-relaxed text-ink/75">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PartnerBand() {
  const { data } = useCatalogue();
  return (
    <section className="on-dark bg-night py-16 text-wall md:py-24" aria-labelledby="partner-title">
      <div className="wrap grid gap-10 md:grid-cols-[1fr_1fr] md:items-end">
        <div>
          <p className="kicker !text-accent">Our partner</p>
          <div className="mt-6 bg-wall px-6 py-6 md:px-8 md:py-8">
            <FoundoraLockup href={data.settings.partnerUrl} className="h-16 w-auto md:h-32" />
          </div>
          <h2 id="partner-title" className="mt-8 font-display text-[clamp(34px,5vw,64px)] uppercase leading-[0.92] text-wall">
            Find better.
            <br />
            Live smarter.
          </h2>
        </div>
        <div>
          <p className="max-w-md font-serif text-[17px] leading-relaxed text-wall/70">
            Foundora designs the things we photograph. They wrote the line we keep above the studio door, and they built
            this booking system with us.
          </p>
          <a
            href={data.settings.partnerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="link-underline mt-6 inline-flex text-accent"
          >
            Visit Foundora <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
