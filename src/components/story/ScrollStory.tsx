import { useEffect, useRef } from "react";
import { PRINTS } from "../opening/openingAssets";
import { responsiveSource } from "../../lib/responsive";
import "./story.css";

const CARD_COUNT = 12;

/** Cards are 150px wide on desktop and 110px on phones. */
const CARD_SIZES = "(min-width: 820px) 160px, 120px";

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

function makeClouds(W: number, H: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < 6; i++) {
    const w = 120 + (i * 47) % 180;
    const h = w * (0.32 + ((i * 13) % 10) / 40);
    const n = 4 + (i % 3);
    const puffs = Array.from({ length: n }, (_, j) => ({
      dx: (j - (n - 1) / 2) * (w / (n + 1)),
      dy: ((j * 17) % 7) - 3,
      r: h * (0.55 + ((j * 11) % 5) / 10),
    }));
    clouds.push({
      x: (i / 6) * (W + 200) - 100,
      y: H * (0.12 + ((i * 23) % 70) / 100),
      w, h,
      speed: 0.18 + ((i * 7) % 5) * 0.06,
      alpha: 0.55 + ((i * 11) % 4) * 0.08,
      puffs,
    });
  }
  return clouds;
}

export function DawnSky() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const cameraRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const camera = cameraRef.current;
    const canvas = canvasRef.current;
    if (!section || !camera || !canvas) return;
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
      for (const c of clouds) {
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = "#f8f6f0";
        for (const p of c.puffs) {
          ctx.beginPath();
          ctx.arc(c.x + p.dx, c.y + p.dy, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
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

    const applyCamera = (p: number) => {
      const scale = 0.55 + p * 1.15;
      const opacity = 0.35 + (1 - Math.abs(p - 0.5) * 2) * 0.65;
      camera.style.transform = `translate(-50%, -50%) scale(${scale})`;
      camera.style.opacity = String(clamp(opacity, 0.35, 1));
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
      applyCamera(0.5);
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
        <div className="ss-dawn__sky" aria-hidden="true">
          <canvas ref={canvasRef} className="ss-dawn__canvas" />
        </div>
        <div ref={cameraRef} className="ss-dawn__camera" aria-hidden="true">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <circle cx="12" cy="12.5" r="3.5" />
            <path d="M8 6l1.5-2h5L16 6" />
            <circle cx="17.5" cy="8.5" r="0.8" fill="currentColor" />
          </svg>
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