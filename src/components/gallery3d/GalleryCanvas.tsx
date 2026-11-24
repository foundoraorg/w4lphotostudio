import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import * as THREE from "three";
import type { Session } from "../../lib/config";
import { useCurrency } from "../../lib/currency";
import { useReducedMotion } from "../../lib/hooks";
import {
  cameraDirection,
  cameraPosition,
  easeOutCubic,
  easeOutExpo,
  easeOutQuad,
  easeOutQuart,
  focusPose,
  PRINT_HEIGHT,
  PRINT_WIDTH,
  shortestDelta,
  SLOT,
  walkPose,
  type Pose,
  type Side,
} from "./pose";
import { buildGalleryScene, type GalleryScene, type PrintHandle } from "./scene";

export interface GalleryHandle {
  walk: (direction: 1 | -1) => void;
  stepBack: () => void;
}

interface Props {
  sessions: Session[];
  intro: boolean;
  onOpen: (session: Session, rect: DOMRect) => void;
  onFail: () => void;
}

interface Transition {
  from: Pose;
  to: Pose;
  start: number;
  duration: number;
  focus: boolean;
}

export const GalleryCanvas = forwardRef<GalleryHandle, Props>(function GalleryCanvas(
  { sessions, intro, onOpen, onFail },
  ref,
) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<GalleryHandle | null>(null);
  const galleryRef = useRef<GalleryScene | null>(null);
  const { currency, rate } = useCurrency();
  const reduced = useReducedMotion();
  const [cursor, setCursor] = useState<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useImperativeHandle(ref, () => ({
    walk: (direction) => apiRef.current?.walk(direction),
    stepBack: () => apiRef.current?.stepBack(),
  }));

  useEffect(() => {
    const container = mountRef.current;
    if (!container || reduced) return;

    let disposed = false;
    let gallery: GalleryScene | null = null;
    let frame = 0;
    let observer: ResizeObserver | null = null;
    const clock = new THREE.Clock();
    const portrait = window.innerHeight > window.innerWidth;
    const baseWalk = walkPose(portrait);
    const current: Pose = { ...baseWalk, th: 0.3 };
    const targetTh = { value: current.th };
    const activeFocus = { current: null as null | { side: Side; index: number; sessionIndex: number } };
    let transition: Transition | null = null;
    let introMove: { from: Pose; to: Pose; start: number; duration: number } | null = null;
    let dragging = false;
    let lastX = 0;
    let downX = 0;
    let downY = 0;
    let lastHover = 0;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const canvasRect = () => gallery?.renderer.domElement.getBoundingClientRect() ?? new DOMRect(0, 0, 1, 1);

    const pick = (clientX: number, clientY: number): PrintHandle | null => {
      if (!gallery) return null;
      const rect = canvasRect();
      ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(ndc, gallery.camera);
      const hits = raycaster.intersectObjects(
        gallery.prints.map((print) => print.mesh),
        false,
      );
      if (!hits.length) return null;
      const found = gallery.prints.find((print) => print.mesh === hits[0].object);
      return found ?? null;
    };

    const setPose = (pose: Pose) => {
      current.th = pose.th;
      current.r = pose.r;
      current.yaw = pose.yaw;
      current.y = pose.y;
      current.pitch = pose.pitch;
    };

    const glide = (to: Pose, focus: boolean, duration = 950) => {
      transition = {
        from: { ...current },
        to: { ...to, th: current.th + shortestDelta(current.th, to.th) },
        start: performance.now(),
        duration,
        focus,
      };
    };

    const glideToFocus = (hit: PrintHandle) => {
      activeFocus.current = { side: hit.side, index: hit.index, sessionIndex: hit.sessionIndex };
      glide(focusPose(hit.side, hit.index), true, 950);
    };

    const stepBack = () => {
      if (!activeFocus.current && !transition) return;
      activeFocus.current = null;
      targetTh.value = current.th;
      glide({ ...walkPose(window.innerHeight > window.innerWidth), th: current.th }, false, 600);
    };

    const printRect = (print: PrintHandle): DOMRect => {
      if (!gallery) return new DOMRect(0, 0, 0, 0);
      const rect = canvasRect();
      const corners = [
        new THREE.Vector3(-PRINT_WIDTH / 2, PRINT_HEIGHT / 2, 0.04),
        new THREE.Vector3(PRINT_WIDTH / 2, PRINT_HEIGHT / 2, 0.04),
        new THREE.Vector3(-PRINT_WIDTH / 2, -PRINT_HEIGHT / 2, 0.04),
        new THREE.Vector3(PRINT_WIDTH / 2, -PRINT_HEIGHT / 2, 0.04),
      ].map((corner) => {
        const world = print.mesh.localToWorld(corner);
        const projected = world.project(gallery!.camera);
        return {
          x: rect.left + ((projected.x + 1) / 2) * rect.width,
          y: rect.top + ((1 - projected.y) / 2) * rect.height,
        };
      });
      const xs = corners.map((point) => point.x);
      const ys = corners.map((point) => point.y);
      const left = Math.min(...xs);
      const top = Math.min(...ys);
      return new DOMRect(left, top, Math.max(...xs) - left, Math.max(...ys) - top);
    };

    const openPrint = (print: PrintHandle) => {
      const session = sessions[print.sessionIndex % sessions.length];
      if (!session) return;
      onOpen(session, printRect(print));
    };

    const walk = (direction: 1 | -1) => {
      if (activeFocus.current) {
        stepBack();
        return;
      }
      transition = null;
      const slot = Math.round(targetTh.value / SLOT);
      targetTh.value = (slot + direction) * SLOT;
    };

    apiRef.current = { walk, stepBack };

    const onClick = (event: PointerEvent) => {
      const hit = pick(event.clientX, event.clientY);
      if (!hit) {
        if (activeFocus.current) stepBack();
        return;
      }
      if (
        activeFocus.current &&
        activeFocus.current.index === hit.index &&
        activeFocus.current.side === hit.side
      ) {
        openPrint(hit);
        return;
      }
      glideToFocus(hit);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      lastX = event.clientX;
      downX = event.clientX;
      downY = event.clientY;
      setCursor((value) => ({ ...value, active: false }));
    };

    const onPointerMove = (event: PointerEvent) => {
      const now = performance.now();
      if (dragging) {
        const dx = event.clientX - lastX;
        lastX = event.clientX;
        if (Math.abs(event.clientX - downX) > 6 || Math.abs(event.clientY - downY) > 6) {
          if (activeFocus.current) stepBack();
          targetTh.value += dx * (window.innerWidth < 820 ? 0.0042 : 0.0022);
        }
        return;
      }
      if (now - lastHover < 55) return;
      lastHover = now;
      const hit = pick(event.clientX, event.clientY);
      const bounds = container.getBoundingClientRect();
      setCursor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top, active: Boolean(hit) });
    };

    const onPointerUp = (event: PointerEvent) => {
      const distance = Math.hypot(event.clientX - downX, event.clientY - downY);
      dragging = false;
      if (distance <= 6) onClick(event);
    };

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (activeFocus.current) {
        stepBack();
        return;
      }
      targetTh.value += -event.deltaY * 0.0016;
    };

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT" || target.isContentEditable)) {
        return;
      }
      if (event.key === "Escape") {
        if (activeFocus.current) stepBack();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        walk(1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        walk(-1);
      }
    };

    const onLeave = () => {
      dragging = false;
      setCursor((value) => ({ ...value, active: false }));
    };

    const resize = () => {
      if (!gallery) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      gallery.renderer.setSize(width, height, false);
      gallery.camera.aspect = width / Math.max(1, height);
      gallery.camera.fov = height > width ? 70 : 56;
      gallery.camera.updateProjectionMatrix();
    };

    const start = async () => {
      try {
        if (!window.WebGLRenderingContext) throw new Error("No WebGL");
        await Promise.race([document.fonts.ready, new Promise((resolve) => window.setTimeout(resolve, 1500))]);
        gallery = await buildGalleryScene(container, sessions, { currency, rate, portrait });
        if (disposed) {
          gallery.dispose();
          return;
        }
        galleryRef.current = gallery;
        resize();
        observer = new ResizeObserver(resize);
        observer.observe(container);
        // Label textures are regenerated whenever the currency changes.
        apiRef.current = { walk, stepBack };
        setPose(current);
        introMove = intro
          ? {
              from: { ...current, th: current.th + 0.55, r: current.r + 1.1, y: current.y + 0.2, pitch: -0.2 },
              to: { ...current, th: 0 },
              start: performance.now(),
              duration: 1400,
            }
          : null;

        const loop = () => {
          if (disposed || !gallery) return;
          const delta = Math.min(0.05, clock.getDelta());
          const now = performance.now();

          if (introMove) {
            const t = Math.min(1, (now - introMove.start) / introMove.duration);
            const eased = easeOutExpo(t);
            current.th = introMove.from.th + (introMove.to.th - introMove.from.th) * eased;
            current.r = introMove.from.r + (introMove.to.r - introMove.from.r) * eased;
            current.y = introMove.from.y + (introMove.to.y - introMove.from.y) * eased;
            current.pitch = introMove.from.pitch + (introMove.to.pitch - introMove.from.pitch) * eased;
            targetTh.value = current.th;
            if (t >= 1) introMove = null;
          } else if (transition) {
            const t = Math.min(1, (now - transition.start) / transition.duration);
            const move = transition;
            current.th = move.from.th + (move.to.th - move.from.th) * easeOutQuart(t);
            current.yaw = move.from.yaw + (move.to.yaw - move.from.yaw) * easeOutQuad(t);
            current.r = move.from.r + (move.to.r - move.from.r) * easeOutCubic(t);
            current.y = move.from.y + (move.to.y - move.from.y) * easeOutCubic(t);
            current.pitch = move.from.pitch + (move.to.pitch - move.from.pitch) * easeOutCubic(t);
            if (t >= 1) {
              transition = null;
              targetTh.value = current.th;
              if (!move.focus) activeFocus.current = null;
            }
          } else if (!activeFocus.current) {
            current.th += (targetTh.value - current.th) * (1 - Math.exp(-delta / 0.36));
          }

          const [x, y, z] = cameraPosition(current);
          gallery.camera.position.set(x, y, z);
          const [dx, dy, dz] = cameraDirection(current);
          gallery.camera.lookAt(x + dx, y + dy, z + dz);
          gallery.renderer.render(gallery.scene, gallery.camera);
          frame = requestAnimationFrame(loop);
        };

        loop();
      } catch {
        if (!disposed) onFail();
      }
    };

    void start();

    const element = container;
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerUp);
    element.addEventListener("pointerleave", onLeave);
    window.addEventListener("keydown", onKey);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerUp);
      element.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("keydown", onKey);
      gallery?.dispose();
      gallery = null;
      galleryRef.current = null;
      apiRef.current = null;
    };
    // The scene is rebuilt only when the catalogue changes; labels are patched
    // separately for currency, and motion is handled inside the scene loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, reduced, intro]);

  useEffect(() => {
    // Currency conversion for the wall labels, without rebuilding the camera.
    galleryRef.current?.updateLabels(currency, rate);
  }, [currency, rate]);

  return (
    <div
      ref={mountRef}
      className="gallery-canvas absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
      tabIndex={0}
      role="application"
      aria-label="Interactive gallery. Use the left and right arrow keys to walk, click a photograph to look closer, Escape to step back."
      onBlur={() => setCursor((value) => ({ ...value, active: false }))}
    >
      <span className="sr-only">
        A curved gallery passage with framed portraits on the outer and inner walls. Arrow keys walk the room, clicking a
        photograph glides towards it, and a second click opens the session.
      </span>
      {cursor.active && (
        <span
          className="pointer-events-none absolute z-10 hidden -translate-x-1/2 -translate-y-1/2 border border-ink bg-accent px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink md:inline-flex"
          style={{ left: cursor.x, top: cursor.y }}
        >
          Open the session
        </span>
      )}
    </div>
  );
});

