import * as THREE from "three";
import type { ImageCrop, Session } from "../../lib/config";
import { money, type Currency } from "../../lib/format";
import { loadSheet } from "../../lib/portfolio";
import {
  INNER_COUNT,
  INNER_PRINT_RADIUS,
  INNER_RADIUS,
  OUTER_COUNT,
  OUTER_PRINT_RADIUS,
  OUTER_RADIUS,
  PRINT_HEIGHT,
  PRINT_WIDTH,
  PRINT_Y,
  WALL_HEIGHT,
  printAngle,
  printSessionIndex,
  type Side,
} from "./pose";

const WALL = 0xf3f0e9;
const BRONZE = 0xb97953;
const INK = 0x29211d;

export interface PrintHandle {
  mesh: THREE.Mesh;
  side: Side;
  index: number;
  angle: number;
  sessionIndex: number;
  group: THREE.Group;
}

export interface GalleryScene {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  prints: PrintHandle[];
  updateLabels: (currency: Currency, rate: number) => void;
  dispose: () => void;
}

function canvasTexture(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function wallTexture(top: string, bottom: string, band: string) {
  return canvasTexture(
    (ctx, width, height) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, top);
      gradient.addColorStop(0.55, band);
      gradient.addColorStop(1, bottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      // Faint vertical panel joints, so the corridor reads as built.
      ctx.fillStyle = "rgba(41,33,29,0.035)";
      for (let x = 0; x < width; x += 64) ctx.fillRect(x, 0, 1, height);
    },
    512,
    256,
  );
}

function floorTexture() {
  return canvasTexture(
    (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, "#F7F3EA");
      gradient.addColorStop(0.55, "#E8E1D2");
      gradient.addColorStop(1, "#D9D0BE");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    512,
    512,
  );
}

function ceilingTexture() {
  return canvasTexture(
    (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, "#E9E2D4");
      gradient.addColorStop(1, "#C9C0AF");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    256,
    256,
  );
}

function glowTexture(colour: string) {
  return canvasTexture(
    (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 4, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, colour);
      gradient.addColorStop(0.55, colour.replace(/[\d.]+\)$/, "0.16)"));
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    256,
    256,
  );
}

function shadowTexture() {
  return canvasTexture(
    (ctx, width, height) => {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 2);
      gradient.addColorStop(0, "rgba(35,25,20,0.34)");
      gradient.addColorStop(0.6, "rgba(35,25,20,0.12)");
      gradient.addColorStop(1, "rgba(35,25,20,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    },
    256,
    256,
  );
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  session: Session,
  currency: Currency,
  rate: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#29211D";
  ctx.font = '500 22px "DM Mono", monospace';
  ctx.fillText(session.category.toUpperCase(), width / 2, 44);

  ctx.fillStyle = "#B97953";
  ctx.fillRect(width / 2 - 40, 62, 80, 2);

  ctx.fillStyle = "#29211D";
  ctx.font = 'italic 400 58px Newsreader, Georgia, serif';
  ctx.fillText(session.title, width / 2, 138);

  const price = money(session.base_price_kes, currency, rate);
  ctx.font = '500 24px "DM Mono", monospace';
  ctx.fillStyle = "#6F665F";
  ctx.fillText(`FROM ${price.toUpperCase()} · TAP TO BOOK`, width / 2, 200);
}

function labelTexture(session: Session, currency: Currency, rate: number) {
  return canvasTexture((ctx, width, height) => drawLabel(ctx, width, height, session, currency, rate), 768, 256);
}

function cropped(base: THREE.Texture, crop: ImageCrop): THREE.Texture {
  const texture = base.clone();
  texture.offset.set(crop.x, 1 - crop.y - crop.h);
  texture.repeat.set(crop.w, crop.h);
  texture.needsUpdate = true;
  return texture;
}

export async function buildGalleryScene(
  container: HTMLElement,
  sessions: Session[],
  options: { currency: Currency; rate: number; portrait: boolean },
): Promise<GalleryScene> {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(WALL);
  scene.fog = new THREE.Fog(WALL, 10, 46);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  renderer.setClearColor(WALL, 1);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(options.portrait ? 70 : 56, 1, 0.1, 120);

  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  // Room shell.
  const outerWallTexture = track(wallTexture("#EEE8DC", "#D8CFBE", "#F6F1E7"));
  outerWallTexture.wrapS = THREE.RepeatWrapping;
  outerWallTexture.repeat.set(10, 1);
  const innerWallTexture = track(wallTexture("#F6F1E7", "#DDD4C4", "#FBF7EF"));
  innerWallTexture.wrapS = THREE.RepeatWrapping;
  innerWallTexture.repeat.set(7, 1);

  const outerGeometry = track(new THREE.CylinderGeometry(OUTER_RADIUS, OUTER_RADIUS, WALL_HEIGHT, 96, 1, true));
  const outerMaterial = track(new THREE.MeshBasicMaterial({ map: outerWallTexture, side: THREE.BackSide, fog: true }));
  const outerWall = new THREE.Mesh(outerGeometry, outerMaterial);
  outerWall.position.y = WALL_HEIGHT / 2;
  scene.add(outerWall);

  const innerGeometry = track(new THREE.CylinderGeometry(INNER_RADIUS, INNER_RADIUS, WALL_HEIGHT, 96, 1, true));
  const innerMaterial = track(new THREE.MeshBasicMaterial({ map: innerWallTexture, side: THREE.FrontSide, fog: true }));
  const innerWall = new THREE.Mesh(innerGeometry, innerMaterial);
  innerWall.position.y = WALL_HEIGHT / 2;
  scene.add(innerWall);

  const floorMap = track(floorTexture());
  const floorGeometry = track(new THREE.CircleGeometry(OUTER_RADIUS, 96));
  const floorMaterial = track(new THREE.MeshBasicMaterial({ map: floorMap, fog: true }));
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.001;
  scene.add(floor);

  const ceilingMap = track(ceilingTexture());
  const ceilingMaterial = track(new THREE.MeshBasicMaterial({ map: ceilingMap, fog: true }));
  const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = WALL_HEIGHT;
  scene.add(ceiling);

  // Skirting line where wall meets floor.
  const skirtGeometry = track(new THREE.CylinderGeometry(OUTER_PRINT_RADIUS, OUTER_PRINT_RADIUS, 0.06, 96, 1, true));
  const skirtMaterial = track(new THREE.MeshBasicMaterial({ color: BRONZE, side: THREE.BackSide, transparent: true, opacity: 0.35 }));
  const outerSkirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
  outerSkirt.position.y = 0.03;
  scene.add(outerSkirt);
  const innerSkirtGeometry = track(new THREE.CylinderGeometry(INNER_PRINT_RADIUS, INNER_PRINT_RADIUS, 0.06, 96, 1, true));
  const innerSkirt = new THREE.Mesh(innerSkirtGeometry, skirtMaterial);
  innerSkirt.position.y = 0.03;
  scene.add(innerSkirt);

  // Print assets.
  const sheet = await loadSheet();
  const baseTexture = track(new THREE.Texture(sheet as CanvasImageSource));
  baseTexture.needsUpdate = true;
  baseTexture.colorSpace = THREE.SRGBColorSpace;
  baseTexture.anisotropy = anisotropy;

  const haloMap = track(glowTexture("rgba(200,242,61,0.5)"));
  const shadowMap = track(shadowTexture());
  const haloGeometry = track(new THREE.PlaneGeometry(2.5, 3.2));
  const shadowGeometry = track(new THREE.PlaneGeometry(2.7, 3.4));
  const frameGeometry = track(new THREE.BoxGeometry(PRINT_WIDTH + 0.14, PRINT_HEIGHT + 0.14, 0.06));
  const printGeometry = track(new THREE.PlaneGeometry(PRINT_WIDTH, PRINT_HEIGHT));
  const labelGeometry = track(new THREE.PlaneGeometry(1.34, 0.447));

  const haloMaterial = track(
    new THREE.MeshBasicMaterial({ map: haloMap, transparent: true, depthWrite: false, opacity: 0.55 }),
  );
  const shadowMaterial = track(
    new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false, opacity: 0.9 }),
  );
  const frameMaterial = track(new THREE.MeshBasicMaterial({ color: BRONZE }));

  const printTextures = new Map<number, THREE.Texture>();
  const printMaterials = new Map<number, THREE.MeshBasicMaterial>();
  for (let index = 0; index < 9; index += 1) {
    const session = sessions[index];
    if (!session) continue;
    const texture = track(cropped(baseTexture, session.image_crop));
    texture.anisotropy = anisotropy;
    printTextures.set(index, texture);
    printMaterials.set(index, track(new THREE.MeshBasicMaterial({ map: texture })));
  }

  const labelMaterials = new Map<number, THREE.MeshBasicMaterial>();
  for (let index = 0; index < 9; index += 1) {
    const session = sessions[index];
    if (!session) continue;
    const texture = track(labelTexture(session, options.currency, options.rate));
    texture.anisotropy = anisotropy;
    labelMaterials.set(index, track(new THREE.MeshBasicMaterial({ map: texture, transparent: true })));
  }

  const prints: PrintHandle[] = [];

  const addPrint = (side: Side, index: number) => {
    const sessionIndex = printSessionIndex(side, index);
    const session = sessions[sessionIndex];
    if (!session) return;
    const angle = printAngle(side, index);
    const radius = side === "outer" ? OUTER_PRINT_RADIUS : INNER_PRINT_RADIUS;

    const group = new THREE.Group();
    group.position.set(radius * Math.cos(angle), PRINT_Y, radius * Math.sin(angle));
    // Outer prints face the centre; inner prints face the corridor.
    group.rotation.y = side === "outer" ? -(angle + Math.PI / 2) : Math.PI / 2 - angle;

    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
    shadow.position.z = -0.035;
    group.add(shadow);

    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.z = -0.02;
    group.add(halo);

    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.z = -0.005;
    group.add(frame);

    const print = new THREE.Mesh(printGeometry, printMaterials.get(sessionIndex));
    print.position.z = 0.035;
    print.userData = { side, index, sessionIndex };
    group.add(print);

    const labelMaterial = labelMaterials.get(sessionIndex);
    if (labelMaterial) {
      const label = new THREE.Mesh(labelGeometry, labelMaterial);
      label.position.set(0, -(PRINT_HEIGHT / 2 + 0.36), 0.034);
      group.add(label);
    }

    scene.add(group);
    prints.push({ mesh: print, side, index, angle, sessionIndex, group });
  };

  for (let index = 0; index < OUTER_COUNT; index += 1) addPrint("outer", index);
  for (let index = 0; index < INNER_COUNT; index += 1) addPrint("inner", index);

  const updateLabels = (currency: Currency, rate: number) => {
    for (let index = 0; index < 9; index += 1) {
      const session = sessions[index];
      const material = labelMaterials.get(index);
      if (!session || !material) continue;
      const previous = material.map;
      const texture = labelTexture(session, currency, rate);
      texture.anisotropy = anisotropy;
      material.map = texture;
      material.needsUpdate = true;
      previous?.dispose();
    }
  };

  return {
    scene,
    camera,
    renderer,
    prints,
    updateLabels,
    dispose: () => {
      for (const item of disposables) item.dispose();
      printTextures.clear();
      labelMaterials.clear();
      printMaterials.clear();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) container.removeChild(renderer.domElement);
      scene.clear();
    },
  };
}

export { INK };
