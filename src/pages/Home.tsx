import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "../components/Icons";
import { GalleryCanvas, type GalleryHandle } from "../components/gallery3d/GalleryCanvas";
import { useFlyer } from "../components/gallery3d/FlyerContext";
import { OpeningHero } from "../components/opening/OpeningHero";
import ScrollStory from "../components/story/ScrollStory";
import { PrintImage } from "../components/ui/PrintImage";
import { sessionImage } from "../lib/images";
import { Reveal } from "../components/ui/Reveal";
import { useCatalogue } from "../lib/catalogue";
import type { Session } from "../lib/config";
import { useCurrency } from "../lib/currency";
import { useMediaQuery } from "../lib/hooks";
import { formatDurationLabel } from "../lib/pricing";

export function Home() {
  const { sessions } = useCatalogue();
  const { fmt } = useCurrency();
  const navigate = useNavigate();
  const { startFlyer } = useFlyer();
  const gallery = useRef<GalleryHandle | null>(null);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [mode, setMode] = useState<"gallery" | "sessions">("gallery");
  const [failed, setFailed] = useState(false);

  const showGrid = mode === "sessions" || reduced || failed;

  const openSession = (session: Session, rect: DOMRect) => {
    startFlyer({
      image: sessionImage(session),
      from: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    });
    navigate(`/sessions/${session.slug}`, { state: { flyer: true } });
  };

  return (
    <>
      <OpeningHero />

      <ScrollStory />

      <section
        className="relative h-[calc(100svh-4rem)] min-h-[540px] overflow-hidden bg-wall lg:h-[calc(100svh-72px)]"
        aria-label="Gallery passage"
      >
        {showGrid ? (
          <div className="absolute inset-0 overflow-y-auto px-5 pb-16 pt-20 sm:px-8 lg:px-12">
            <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-6">
              {sessions.map((session) => (
                <Link key={session.id} to={`/sessions/${session.slug}`} className="group">
                  <PrintImage
                    session={session}
                    alt={`${session.title} — ${session.category} session photograph`}
                    className="aspect-[3/4] w-full"
                  />
                  <div className="mt-3 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-[14px] uppercase tracking-[0.02em] sm:text-[16px]">{session.title}</h2>
                      <p className="micro mt-1">
                        {session.category} · {formatDurationLabel(session.base_duration_min)}
                      </p>
                    </div>
                    <p className="shrink-0 font-mono text-[11px] text-bronze">From {fmt(session.base_price_kes)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <p className="mx-auto mt-10 max-w-6xl font-serif text-[13px] text-muted">
              {reduced ? "Motion is reduced on this device, so the sessions are shown as a grid." : "Your browser cannot draw the 3D passage, so the sessions are shown as a grid."}
            </p>
          </div>
        ) : (
          <GalleryCanvas
            ref={gallery}
            sessions={sessions}
            intro={false}
            onOpen={openSession}
            onFail={() => setFailed(true)}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-4">
          <div className="pointer-events-auto inline-flex border border-ink/25 bg-wall/85 backdrop-blur-sm" role="group" aria-label="Gallery view">
            {(["gallery", "sessions"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
                className={`min-h-[36px] px-3 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  mode === option ? "bg-ink text-wall" : "text-ink hover:bg-ink/5"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {!showGrid && (
          <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
            <div className="flex flex-1 items-center justify-between gap-3 px-4 pt-14 sm:px-6">
              <div className="pointer-events-auto flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => gallery.current?.walk(1)}
                  aria-label="Walk forward through the gallery"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/30 bg-wall/70 backdrop-blur-sm transition-colors hover:bg-accent hover:text-ink"
                >
                  <ArrowRight size={18} className="rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => gallery.current?.walk(-1)}
                  aria-label="Walk back through the gallery"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/30 bg-wall/70 backdrop-blur-sm transition-colors hover:bg-accent hover:text-ink"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
              <p className="hidden max-w-[220px] text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink/60 md:block">
                Scroll or drag to walk the gallery
                <br />
                Click a photo to see the session
              </p>
            </div>

            <div className="flex flex-col items-start justify-between gap-6 px-5 pb-8 sm:px-8 lg:flex-row lg:items-end lg:px-12 lg:pb-24">
              <div className="max-w-full min-w-0">
                <div className="overflow-hidden">
                  <p className="kicker intro-line">You are walking past</p>
                </div>
                <div className="mt-2 overflow-hidden">
                  <h2 className="display-hero text-ink intro-line">The light works</h2>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <div className="overflow-hidden">
                    <Link
                      to="/sessions"
                      className="link-underline text-ink intro-line"
                    >
                      See sessions &amp; prices <ArrowRight size={14} />
                    </Link>
                  </div>
                  <div className="overflow-hidden">
                    <Link
                      to="/estimate"
                      className="link-underline text-ink intro-line"
                    >
                      Get a quick estimate
                    </Link>
                  </div>
                </div>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/60 md:hidden">
                  Scroll or drag to walk · Tap a photo to open it
                </p>
              </div>
              <div className="shrink-0 overflow-hidden">
                <p
                  className="hidden font-mono text-[10px] uppercase leading-relaxed tracking-[0.12em] text-ink/60 lg:block intro-line"
                >
                  W4L Studios · Watamu
                  <br />
                  In association with Foundora
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="border-t border-line bg-wall">
        <div className="wrap grid gap-10 py-16 md:grid-cols-[0.9fr_1.1fr] md:py-24">
          <div>
            <p className="kicker">The studio</p>
            <Reveal as="h2" className="mt-4 block font-display text-[clamp(32px,4vw,54px)] uppercase leading-[0.95]">
              A room built for light, on the Kenyan coast.
            </Reveal>
          </div>
          <div className="prose-studio max-w-xl">
            <p>
              W4L Studios is a working photography studio in Watamu, shooting portraits, families, editorial and brand work.
              We built the room, the backdrops and the light ourselves, then set the booking up so you never have to call.
            </p>
            <p className="mt-4">
              We work in association with Foundora, a design studio with the same belief: better things, made calmly and
              kept for a long time.
            </p>
            <Link to="/studio" className="link-underline mt-6 text-ink">
              Inside the studio <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-page">
        <div className="wrap py-16 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker">The index</p>
              <Reveal as="h2" className="mt-3 block font-display text-[clamp(30px,4vw,52px)] uppercase leading-[0.95]">
                Nine ways to be photographed
              </Reveal>
            </div>
            <Link to="/sessions" className="link-underline text-ink">
              All sessions <ArrowRight size={14} />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-6">
            {sessions.map((session) => (
              <Link key={session.id} to={`/sessions/${session.slug}`} className="group block">
                <div className="overflow-hidden">
                  <PrintImage
                    session={session}
                    alt={`${session.title} session`}
                    className="aspect-[4/5] w-full transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="font-display text-[15px] uppercase tracking-[0.02em]">{session.title}</h3>
                  <p className="font-mono text-[11px] text-bronze">From {fmt(session.base_price_kes)}</p>
                  <p className="micro w-full">
                    {session.category} · {formatDurationLabel(session.base_duration_min)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-wall">
        <div className="wrap flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-16">
          <div>
            <p className="kicker">Three minutes, no phone call</p>
            <h2 className="mt-3 font-display text-[clamp(26px,3.4vw,42px)] uppercase leading-[0.95]">
              Build the estimate. Hold the date.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/estimate" className="btn btn-lime">
              Quick estimate <ArrowRight size={15} />
            </Link>
            <Link to="/sessions" className="btn">
              Browse sessions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
