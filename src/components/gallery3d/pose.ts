export interface Pose {
  th: number;
  r: number;
  yaw: number;
  y: number;
  pitch: number;
}

export type Side = "outer" | "inner";

export const OUTER_RADIUS = 18;
export const INNER_RADIUS = 12.2;
export const OUTER_PRINT_RADIUS = 17.98;
export const INNER_PRINT_RADIUS = 12.22;
export const OUTER_COUNT = 36;
export const INNER_COUNT = 24;
export const PRINT_WIDTH = 1.36;
export const PRINT_HEIGHT = PRINT_WIDTH * 1.5;
export const PRINT_Y = 1.95;
export const WALL_HEIGHT = 6.2;
export const FOCUS_DISTANCE = 4.26;
export const SLOT = (Math.PI * 2) / 36;

export const WALK_POSE: Pose = { th: 0, r: 15.6, yaw: -0.3, y: 1.92, pitch: -0.12 };
export const WALK_POSE_PORTRAIT: Pose = { th: 0, r: 15.4, yaw: -0.42, y: 1.9, pitch: -0.1 };
export const WALK_POSE_MOBILE: Pose = WALK_POSE;

export function cameraPosition(pose: Pose): [number, number, number] {
  return [pose.r * Math.cos(pose.th), pose.y, pose.r * Math.sin(pose.th)];
}

/**
 * Forward is the tangent in the direction of decreasing theta, rotated by yaw
 * around the room. Pitch tilts the look target up or down.
 */
export function cameraDirection(pose: Pose): [number, number, number] {
  const direction = [Math.sin(pose.th + pose.yaw), 0, -Math.cos(pose.th + pose.yaw)] as [number, number, number];
  direction[1] = Math.tan(pose.pitch);
  return direction;
}

export function focusPose(side: Side, index: number): Pose {
  const angle =
    side === "outer" ? (index / OUTER_COUNT) * Math.PI * 2 : (index / INNER_COUNT) * Math.PI * 2;
  return {
    th: angle,
    r: side === "outer" ? OUTER_RADIUS - FOCUS_DISTANCE : INNER_RADIUS + FOCUS_DISTANCE,
    yaw: side === "outer" ? Math.PI / 2 : -Math.PI / 2,
    y: PRINT_Y - 0.52,
    pitch: 0.12,
  };
}

export function printAngle(side: Side, index: number): number {
  return side === "outer" ? (index / OUTER_COUNT) * Math.PI * 2 : (index / INNER_COUNT) * Math.PI * 2;
}

export function printSessionIndex(side: Side, index: number): number {
  if (side === "outer") return index % 9;
  return (index + 4) % 9;
}

export function walkPose(portrait: boolean): Pose {
  return portrait ? WALK_POSE_PORTRAIT : WALK_POSE;
}

export function shortestDelta(from: number, to: number): number {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

export const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeOutQuad = (t: number) => t * (2 - t);
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
