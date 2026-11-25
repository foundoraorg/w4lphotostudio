import { useEffect, useRef } from "react";
import { PRINTS } from "../opening/openingAssets";
import { responsiveSource } from "../../lib/responsive";
import "./story.css";

const CARD_COUNT = 12;

/** Cards are 150px wide on desktop and 110px on phones. */
const CARD_SIZES = "(min-width: 820px) 160px, 120px";

const DAWN_SRC = "/images/dawn/dawn.jpg";
const DAWN_ALT = "First light over the Indian Ocean at Watamu, before sunrise";
const DAWN_SOURCE = responsiveSource(DAWN_SRC, "100vw");

/** The wheel repeats the six prints; each card is resolved once, not per frame. */
const CARDS = Array.from({ length: CARD_COUNT }, (_, i) => {
  const print = PRINTS[i % PRINTS.length];
  return { print, ...responsiveSource(print.src, CARD_SIZES) };
});

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

interface Point { x: number; y: number; r: number }

function scatterFor(i: number, W: number, H: number): Point {
  const a = ((i * 9301 + 49297) % 233280) / 233280;
  const b = ((i * 7919 + 104729) % 233280) / 233280;
  return { x: a * W * 0.86 + W * 0.07, y: b * H * 0.78 + H * 0.11, r: (a - 0.5) * 70 };
}

function pileFor(i: number, W: number, H: number): Point {
  const off = (i - (CARD_COUNT - 1) / 2) * 1.6;
  const ring = i % 4;
  return { x: W / 2 + off * 3 + ring * 0.5, y: H / 2 + off * 2 - ring * 0.5, r: off * 2.2 };
}

function wheelFor(i: number, W: number, H: number): Point {
  const radius = Math.min(W, H) * 0.34;
  const angle = (i / CARD_COUNT) * Math.PI * 2 - Math.PI / 2;
  return { x: W / 2 + Math.cos(angle) * radius, y: H / 2 + Math.sin(angle) * radius, r: (angle * 180) / Math.PI + 90 };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export function CardWheel() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    if (!section || !sticky) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scatter: Point[] = [], pile: Point[] = [], wheel: Point[] = [];

    const layout = () => {
      const W = sticky.clientWidth, H = sticky.clientHeight;
      scatter = Array.from({ length: CARD_COUNT }, (_, i) => scatterFor(i, W, H));
      pile = Array.from({ length: CARD_COUNT }, (_, i) => pileFor(i, W, H));
      wheel = Array.from({ length: CARD_COUNT }, (_, i) => wheelFor(i, W, H));
    };

    const apply = (p: number) => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const [from, to, t] = p < 0.5
          ? [scatter[i], pile[i], p * 2]
          : [pile[i], wheel[i], (p - 0.5) * 2];
        const x = lerp(from.x, to.x, t);
        const y = lerp(from.y, to.y, t);
        const r = lerp(from.r, to.r, t);
        const s = 1 - 0.08 * Math.abs(p - 0.5) * 2;
        card.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${r}deg) scale(${s})`;
      });
    };

    layout();
    if (reduced) { apply(1); return; }

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      apply(clamp(total <= 0 ? 1 : scrolled / total, 0, 1));
    };
    let frame = 0;
    const throttled = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; onScroll(); });
    };
    const onResize = () => { layout(); onScroll(); };

    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      window.removeEventListener("scroll", throttled);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={sectionRef} className="ss-cards" aria-label="Prints in motion">
      <div ref={stickyRef} className="ss-cards__sticky">
        <div className="ss-cards__head">
          <p className="ss-cards__kicker">The index</p>
          <h2 className="ss-cards__title">Twelve prints, one wheel</h2>
        </div>
        {CARDS.map(({ print, ...responsive }, i) => (
          <div key={i} ref={(el) => { cardRefs.current[i] = el; }} className="ss-card">
            <img
              src={print.src}
              srcSet={responsive.srcSet}
              sizes={responsive.sizes}
              width={responsive.width}
              height={responsive.height}
              alt=""
              loading="lazy"
            />
            <span className="ss-card__num">{String(i + 1).padStart(2, "0")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

interface Cloud { x: number; y: number; w: number; h: number; speed: number; alpha: number; puffs: { dx: number; dy: number; r: number }[] }

const CLOUD_COUNT = 5;
const CLOUD_BLUR = 18;

/**
 * A thin band of drifting haze, sized relative to the viewport so it reads the
 * same on a phone as on a wide screen. The puffs are drawn blurred: over a
 * photograph, hard-edged discs look like decoration rather than weather.
 */
function makeClouds(W: number, H: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const w = W * (0.26 + ((i * 7) % 4) * 0.06);
    const h = w * 0.2;
    const n = 5 + (i % 3);
    const puffs = Array.from({ length: n }, (_, j) => ({
      dx: (j - (n - 1) / 2) * (w / (n + 2)),
      dy: ((j * 13) % 9) - 4,
      r: h * (0.5 + ((j * 7) % 4) / 10),
    }));
    clouds.push({
      x: (i / CLOUD_COUNT) * (W + w) - w / 2,
      // Kept in the sky, away from the water.
      y: H * (0.1 + ((i * 23) % 42) / 100),
      w, h,
      speed: 0.1 + ((i * 7) % 4) * 0.035,
      alpha: 0.16 + ((i * 11) % 3) * 0.05,
      puffs,
    });
  }
  return clouds;
}

export function DawnSky() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const photo = frameRef.current;
    const canvas = canvasRef.current;
    if (!section || !photo || !canvas) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let clouds: Cloud[] = [];
    let raf = 0;
    let w = 0, h = 0, dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      clouds = makeClouds(w, h);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#f8f6f0";
      ctx.filter = `blur(${CLOUD_BLUR}px)`;
      for (const c of clouds) {
        ctx.globalAlpha = c.alpha;
        for (const p of c.puffs) {
          ctx.beginPath();
          ctx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.filter = "none";
    };

    const step = () => {
      for (const c of clouds) {
        c.x += c.speed;
        if (c.x - c.w / 2 > w + 60) {
          c.x = -c.w / 2 - 60;
          c.y = h * (0.12 + Math.random() * 0.7);
        }
      }
      draw();
      raf = requestAnimationFrame(step);
    };

    // A slow push into the horizon, lifting a little as it goes. The frame is
    // oversized (inset -8%) so the move never reveals an edge.
    const applyCamera = (p: number) => {
      photo.style.transform = `translate3d(0, ${(-p * 2.5).toFixed(2)}%, 0) scale(${(1 + p * 0.42).toFixed(3)})`;
    };

    const onScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      applyCamera(clamp(total <= 0 ? 0.5 : scrolled / total, 0, 1));
    };

    resize();
    if (reduced) {
      draw();
      applyCamera(0.45);
      const onResize = () => { resize(); draw(); };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }
    raf = requestAnimationFrame(step);
    let frame = 0;
    const throttled = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; onScroll(); });
    };
    const onResize = () => { resize(); onScroll(); };
    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", onResize);
    onScroll();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", throttled);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <section ref={sectionRef} className="ss-dawn" aria-label="Dawn sky">
      <div className="ss-dawn__sticky">
        <div ref={frameRef} className="ss-dawn__frame">
          <img
            src={DAWN_SRC}
            srcSet={DAWN_SOURCE.srcSet}
            sizes={DAWN_SOURCE.sizes}
            width={DAWN_SOURCE.width}
            height={DAWN_SOURCE.height}
            alt={DAWN_ALT}
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="ss-dawn__sky" aria-hidden="true">
          <canvas ref={canvasRef} className="ss-dawn__canvas" />
        </div>
        <div className="ss-dawn__copy">
          <p className="kicker">Dawn, Watamu</p>
          <h2>The light works</h2>
        </div>
      </div>
    </section>
  );
}

export function Manifesto() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { el.classList.add("is-in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="ss-manifesto" aria-label="Manifesto">
      <div className="ss-manifesto__inner">
        <p className="ss-manifesto__kicker">Manifesto</p>
        <span className="ss-manifesto__line">Photographs that stay.</span>
        <span className="ss-manifesto__line">Made slowly, by hand,</span>
        <span className="ss-manifesto__line">on the Kenyan coast.</span>
        <span className="ss-manifesto__line">Light, kept.</span>
        <p className="ss-manifesto__sign">W4L Studios · Watamu · In association with Foundora</p>
      </div>
    </section>
  );
}

export default function ScrollStory() {
  return (
    <>
      <CardWheel />
      <DawnSky />
      <Manifesto />
    </>
  );
}