import { useLayoutEffect, useRef, type CSSProperties } from "react";
import { PaperPlane } from "./PaperPlane";
import { PixelIcon } from "./PixelIcon";
import { PrintFan } from "./PrintFan";
import { openingMetrics, printFan, PRINT_ICONS, type FanSlot } from "./openingAssets";
import "./opening.css";

const HEADLINE = "The light works";

const PLANE_IN = 0.33;
const PLANE_LAND = 1.27;
const PLANE_END = 1.33;

const MORPH_START = 1.9;
const MORPH_STEP = 0.22;

/** The opening flight, x and y in % of the section. */
const FLIGHT: ReadonlyArray<readonly [number, number, number]> = [
  [0.33, -3, 73],
  [0.45, 4, 71],
  [0.6, 13, 65],
  [0.7, 22, 55],
  [0.8, 31, 44],
  [0.87, 32.5, 47.5],
  [0.93, 26, 48],
  [1.0, 21.5, 45],
  [1.07, 22.5, 51.5],
  [1.15, 27, 52],
];

/** Prints rise in this order, each over 0.7s. */
const PRINT_STARTS: ReadonlyArray<{ index: number; at: number }> = [
  { index: 5, at: 0.53 },
  { index: 2, at: 0.6 },
  { index: 0, at: 0.63 },
  { index: 1, at: 0.7 },
  { index: 3, at: 0.8 },
  { index: 4, at: 0.86 },
];

const LETTER_TOTAL = HEADLINE.split("").filter((char) => char !== " ").length;
const ICON_TOTAL = PRINT_ICONS.length;

const iconsLeft = (lettersLeft: number) => Math.ceil((ICON_TOTAL * lettersLeft) / LETTER_TOTAL);

/** Width of the icon row (7 marks + gaps + the lead-in gap), in icon units. */
const ICON_ROW_UNITS = ICON_TOTAL + (ICON_TOTAL - 1) * 0.2 + 1.6;

const catmull = (p0: number, p1: number, p2: number, p3: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3)
  );
};

interface Point {
  t: number;
  x: number;
  y: number;
}

const samplePath = (points: Point[], time: number): Point => {
  let i = 0;
  while (i < points.length - 2 && time > points[i + 1].t) i += 1;
  const p1 = points[i];
  const p2 = points[i + 1];
  const span = p2.t - p1.t;
  const u = span === 0 ? 0 : Math.min(1, Math.max(0, (time - p1.t) / span));
  const p0 = points[Math.max(0, i - 1)];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  return {
    t: time,
    x: catmull(p0.x, p1.x, p2.x, p3.x, u),
    y: catmull(p0.y, p1.y, p2.y, p3.y, u),
  };
};

/**
 * W4L Studios opening — "The light works".
 *
 * One requestAnimationFrame timeline, measured with performance.now() from
 * mount, drives the plane flight, the icon-to-letter morph and the print
 * fan. High-frequency movement is written straight to the DOM, so React
 * never re-renders during the sequence.
 *
 * The section is self-contained: it sits directly under the site header and
 * can be followed by the gallery or a later scroll stage without touching
 * the timeline.
 */
export function OpeningHero() {
  const rootRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const head = root.querySelector<HTMLElement>(".op-headline");
    const line = root.querySelector<HTMLElement>(".op-line");
    const plane = root.querySelector<HTMLElement>(".op-plane");
    const iconRow = root.querySelector<HTMLElement>(".op-icons");
    const fan = root.querySelector<HTMLElement>(".op-fan");
    const letters = Array.from(root.querySelectorAll<HTMLElement>(".op-char"));
    const measure = root.querySelector<HTMLElement>(".op-measure");
    const icons = Array.from(root.querySelectorAll<HTMLElement>(".op-icon"));
    const prints = Array.from(root.querySelectorAll<HTMLElement>(".op-print"));
    if (
      !head ||
      !line ||
      !plane ||
      !iconRow ||
      !fan ||
      !measure ||
      letters.length !== HEADLINE.length ||
      icons.length !== ICON_TOTAL ||
      prints.length !== 6
    ) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers: number[] = [];
    let metrics = openingMetrics();
    let layout = printFan(metrics);
    let frame = 0;
    let alive = true;
    let startedAt = 0;
    let stepCursor = 0;
    let printCursor = 0;
    let landed = false;
    let landing: { x: number; y: number } | null = null;

    const setVar = (el: HTMLElement, name: string, value: string) => {
      el.style.setProperty(name, value);
    };

    /**
     * Fit the marks to the viewport. Portrait phones stack them above the
     * line, so the headline keeps its brand scale; wider screens keep the
     * inline row and shrink the marks only if the row would overrun.
     */
    const fitIcons = () => {
      const stacked = window.matchMedia("(max-width: 819px) and (orientation: portrait)").matches;
      if (stacked) return metrics.ic;
      const text = measure.getBoundingClientRect().width;
      const room = metrics.W - 32 - text;
      const maxIcon = room / ICON_ROW_UNITS;
      return Math.max(10, Math.min(metrics.ic, maxIcon));
    };

    const applyMetrics = () => {
      metrics = openingMetrics(root);
      layout = printFan(metrics);
      setVar(root, "--u", `${metrics.u}px`);
      setVar(root, "--hfs", `${metrics.hfs}px`);
      metrics = { ...metrics, ic: fitIcons() };
      setVar(root, "--ic", `${metrics.ic}px`);
    };

    const placePrints = (initial: boolean) => {
      setVar(fan, "--cw", `${layout.cw}px`);
      layout.slots.forEach((slot: FanSlot, index: number) => {
        const print = prints[index];
        setVar(print, "--x", `${slot.x}px`);
        setVar(print, "--y", `${initial ? metrics.H + layout.cw * 1.2 : slot.y}px`);
        setVar(print, "--r", `${initial ? 8 : slot.rotation}deg`);
      });
      // Commit the start transform before the transition is allowed back on.
      void fan.offsetHeight;
      prints.forEach((print) => {
        print.style.transition = "";
      });
    };

    const settlePrint = (index: number) => {
      const slot = layout.slots[index];
      setVar(prints[index], "--x", `${slot.x}px`);
      setVar(prints[index], "--y", `${slot.y}px`);
      setVar(prints[index], "--r", `${slot.rotation}deg`);
    };

    const measureLanding = () => {
      const rootBox = root.getBoundingClientRect();
      const iconBox = icons[0].getBoundingClientRect();
      landing = {
        x: iconBox.left + iconBox.width / 2 - rootBox.left,
        y: iconBox.top + iconBox.height / 2 - rootBox.top,
      };
    };

    const flightPoints = (): Point[] =>
      FLIGHT.map(([t, x, y]) => ({ t, x: (x / 100) * metrics.W, y: (y / 100) * metrics.H }));

    /** Interpolate two angles the short way round. */
    const shortestAngle = (from: number, to: number, u: number) => {
      const delta = ((((to - from) % 360) + 540) % 360) - 180;
      return from + delta * u;
    };

    const revealLetter = (index: number) => {
      const before = line.getBoundingClientRect().width;
      letters[index].classList.add("is-on");
      const after = line.getBoundingClientRect().width;
      const shift = (after - before) / 2;
      if (!shift) return;
      // Hold the group where it was, then glide it into its new centre.
      line.style.transition = "none";
      line.style.transform = `translateX(${shift}px)`;
      void line.offsetWidth;
      line.style.transition = "transform .22s cubic-bezier(.25,.75,.2,1)";
      line.style.transform = "translateX(0)";
    };

    const runStep = (index: number) => {
      const isSpace = (letters[index].textContent ?? "").trim() === "";
      const lettersBefore = letters
        .slice(index)
        .filter((letter) => (letter.textContent ?? "").trim() !== "").length;
      const lettersAfter = isSpace ? lettersBefore : lettersBefore - 1;

      revealLetter(index);

      for (let left = iconsLeft(lettersBefore); left > iconsLeft(lettersAfter); left -= 1) {
        const icon = icons[ICON_TOTAL - left];
        if (!icon) continue;
        icon.classList.remove("is-landed");
        icon.classList.add("is-morphing");
        timers.push(
          window.setTimeout(() => {
            icon.style.display = "none";
          }, MORPH_STEP * 1000 + 5),
        );
      }
    };

    const tick = (now: number) => {
      if (!alive) return;
      const t = (now - startedAt) / 1000;

      if (t >= PLANE_IN) {
        if (!landing) measureLanding();
        const points = flightPoints();
        const flightEnd = points[points.length - 1];
        const target = landing ?? flightEnd;
        const settle = Math.min(1, Math.max(0, (t - 1.15) / (PLANE_LAND - 1.15)));
        const ease = 1 - Math.pow(1 - settle, 3);

        let x: number;
        let y: number;
        let rotation: number;

        if (t <= 1.15) {
          // The authored flight, untouched.
          const point = samplePath(points, t);
          const ahead = samplePath(points, Math.min(t + 0.02, 1.15));
          const back = samplePath(points, Math.max(FLIGHT[0][0], t - 0.02));
          let dx = ahead.x - point.x;
          let dy = ahead.y - point.y;
          if (Math.abs(dx) + Math.abs(dy) < 0.2) {
            dx = flightEnd.x - back.x;
            dy = flightEnd.y - back.y;
          }
          x = point.x;
          y = point.y;
          rotation = (Math.atan2(dy, dx) * 180) / Math.PI + 18;
        } else {
          // 1.15 → 1.27: settle from the flight's last point onto the icon.
          const dx = target.x - flightEnd.x;
          const dy = target.y - flightEnd.y;
          const settleAngle = (Math.atan2(dy, dx) * 180) / Math.PI + 18;
          const back = samplePath(points, 1.13);
          const flightAngle =
            (Math.atan2(flightEnd.y - back.y, flightEnd.x - back.x) * 180) / Math.PI + 18;
          x = flightEnd.x + dx * ease;
          y = flightEnd.y + dy * ease;
          rotation = shortestAngle(flightAngle, settleAngle, ease);
        }

        const fade =
          t <= PLANE_LAND ? 0 : Math.min(1, (t - PLANE_LAND) / (PLANE_END - PLANE_LAND));
        const size = metrics.ic * 0.95;
        plane.style.opacity = `${1 - fade}`;
        plane.style.transform =
          `translate3d(${x - size / 2}px, ${y - size / 2}px, 0) ` +
          `rotate(${rotation}deg) scale(${1 - 0.4 * fade})`;

        if (!landed && t >= PLANE_LAND) {
          landed = true;
          icons[0].classList.add("is-landed");
          iconRow.classList.add("is-up");
        }
      }

      while (stepCursor < letters.length && t >= MORPH_START + stepCursor * MORPH_STEP) {
        runStep(stepCursor);
        stepCursor += 1;
      }

      while (printCursor < PRINT_STARTS.length && t >= PRINT_STARTS[printCursor].at) {
        settlePrint(PRINT_STARTS[printCursor].index);
        printCursor += 1;
      }

      const done =
        stepCursor >= letters.length && printCursor >= PRINT_STARTS.length && t > PLANE_END;
      if (!done) frame = requestAnimationFrame(tick);
    };

    const finishInstantly = () => {
      root.classList.add("is-done");
      letters.forEach((letter) => letter.classList.add("is-on"));
      icons.forEach((icon) => {
        icon.classList.remove("is-morphing", "is-landed");
        icon.style.display = "none";
      });
      plane.style.opacity = "0";
      placePrints(false);
    };

    const resetDom = () => {
      line.style.transition = "none";
      line.style.transform = "translateX(0)";
      iconRow.classList.remove("is-up");
      letters.forEach((letter) => letter.classList.remove("is-on"));
      icons.forEach((icon) => {
        icon.classList.remove("is-morphing", "is-landed");
        icon.style.display = "";
      });
      plane.style.opacity = "0";
      plane.style.transform = "";
      root.classList.remove("is-done");
      stepCursor = 0;
      printCursor = 0;
      landed = false;
      landing = null;
    };

    /*
     * The hero scrolls away 1:1. Holding the headline at full strength would
     * let it slide under the fixed header, so it fades out over the last
     * 1.35 headline-heights before it reaches the nav.
     */
    const navEl = document.querySelector<HTMLElement>("header");
    let fadeFrame = 0;
    const updateFade = () => {
      fadeFrame = 0;
      const navH = navEl?.getBoundingClientRect().height ?? 64;
      const top = head.getBoundingClientRect().top;
      const from = navH + metrics.hfs * 1.9;
      const to = navH + metrics.hfs * 0.55;
      const fade = Math.min(1, Math.max(0, (top - to) / (from - to)));
      head.style.opacity = `${fade}`;
    };
    const onScroll = () => {
      if (fadeFrame) return;
      fadeFrame = requestAnimationFrame(updateFade);
    };

    const onResize = () => {
      applyMetrics();
      updateFade();
      landing = null;
      if (reduced) {
        finishInstantly();
        return;
      }
      // Let the fan settle on the new geometry; the rise only runs once.
      placePrints(false);
      printCursor = PRINT_STARTS.length;
    };

    applyMetrics();
    resetDom();
    updateFade();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (reduced) {
      finishInstantly();
      window.addEventListener("resize", onResize);
      return () => {
        alive = false;
        timers.forEach((id) => window.clearTimeout(id));
        if (fadeFrame) cancelAnimationFrame(fadeFrame);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
      };
    }

    placePrints(true);
    startedAt = performance.now();
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", onResize);

    // Once the last mark has folded away, close the gap it was holding so
    // the settled headline is centred.
    timers.push(
      window.setTimeout(
        () => root.classList.add("is-done"),
        (MORPH_START + letters.length * MORPH_STEP + 0.25) * 1000,
      ),
    );

    // Re-fit once the brand faces have loaded and the measurement is exact.
    document.fonts?.ready.then(() => {
      if (alive) applyMetrics();
    });

    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      if (fadeFrame) cancelAnimationFrame(fadeFrame);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section ref={rootRef} className="op" data-opening="w4l">
      <PrintFan />
      <PaperPlane />
      <h1 className="op-headline" aria-label={HEADLINE}>
        <span className="op-measure" aria-hidden="true">
          {HEADLINE}
        </span>
        <span className="op-line" aria-hidden="true">
          <span className="op-word">
            {HEADLINE.split("").map((char, index) => (
              <span key={`char-${index}`} className={char === " " ? "op-char op-space" : "op-char"}>
                {char}
              </span>
            ))}
          </span>
          <span className="op-icons">
            {PRINT_ICONS.map((map, index) => (
              <span
                key={`icon-${index}`}
                className={index === 0 ? "op-icon op-icon--first" : "op-icon"}
                style={{ "--i": index } as CSSProperties}
              >
                <PixelIcon map={map} />
              </span>
            ))}
          </span>
        </span>
      </h1>
    </section>
  );
}
