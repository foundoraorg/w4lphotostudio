import seed from "../../data/sessions.json";
import type { BlockedDate, Booking, Catalogue, NewBooking, PricingConfig, Session } from "./config";

export const seedCatalogue = seed as unknown as Catalogue;

export interface Availability {
  booked: { date: string; slot: string; status: string }[];
  blocked: BlockedDate[];
}

export class ApiError extends Error {
  status: number;
  code?: string;
  bookedSlots?: string[];
  constructor(message: string, status: number, code?: string, bookedSlots?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.bookedSlots = bookedSlots;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; code?: string; bookedSlots?: string[] };
    throw new ApiError(body.error || `Request failed (${res.status})`, res.status, body.code, body.bookedSlots);
  }
  return data as T;
}

/** Catalogue with a bundled seed fallback so the site never renders empty. */
export async function fetchCatalogue(): Promise<Catalogue> {
  try {
    return await request<Catalogue>("/catalogue", { signal: AbortSignal.timeout(6000) });
  } catch {
    return seedCatalogue;
  }
}

export async function fetchAvailability(): Promise<Availability> {
  try {
    return await request<Availability>("/availability");
  } catch {
    return { booked: [], blocked: [] };
  }
}

export async function createBooking(payload: NewBooking): Promise<Booking> {
  const data = await request<{ booking: Booking }>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.booking;
}

export async function lookupBookings(query: string): Promise<Booking[]> {
  const data = await request<{ bookings: Booking[] }>(`/bookings/lookup?q=${encodeURIComponent(query)}`);
  return data.bookings;
}

export const ADMIN_TOKEN_KEY = "w4l.admin.token";

export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

export async function adminLogin(passcode: string): Promise<string> {
  const data = await request<{ token: string }>("/admin/login", {
    method: "POST",
    body: JSON.stringify({ passcode }),
  });
  setAdminToken(data.token);
  return data.token;
}

function adminInit(init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      "x-admin-token": getAdminToken() ?? "",
      ...(init?.headers ?? {}),
    },
  };
}

export async function adminBookings(): Promise<Booking[]> {
  const data = await request<{ bookings: Booking[] }>("/admin/bookings", adminInit());
  return data.bookings;
}

export async function adminUpdateBooking(
  id: string,
  patch: Partial<Pick<Booking, "status" | "deposit_status">>,
): Promise<Booking> {
  const data = await request<{ booking: Booking }>(`/admin/bookings/${encodeURIComponent(id)}`, adminInit({
    method: "PATCH",
    body: JSON.stringify(patch),
  }));
  return data.booking;
}

export async function adminBlockDate(entry: BlockedDate): Promise<BlockedDate[]> {
  const data = await request<{ blocked: BlockedDate[] }>("/admin/blocked", adminInit({
    method: "POST",
    body: JSON.stringify(entry),
  }));
  return data.blocked;
}

export async function adminUnblock(entry: { date: string; slot: string | null }): Promise<BlockedDate[]> {
  const data = await request<{ blocked: BlockedDate[] }>("/admin/blocked", adminInit({
    method: "DELETE",
    body: JSON.stringify(entry),
  }));
  return data.blocked;
}

export async function adminSaveSession(session: Session): Promise<Catalogue> {
  return request<Catalogue>("/admin/sessions", adminInit({
    method: "PUT",
    body: JSON.stringify(session),
  }));
}

export async function adminSavePricing(pricingConfig: PricingConfig): Promise<Catalogue> {
  return request<Catalogue>("/admin/pricing", adminInit({
    method: "PUT",
    body: JSON.stringify(pricingConfig),
  }));
}

export function adminCsvUrl(): string {
  return `/api/admin/export.csv?token=${encodeURIComponent(getAdminToken() ?? "")}`;
}

export async function adminCsv(): Promise<string> {
  const res = await fetch(adminCsvUrl());
  if (!res.ok) throw new ApiError("Could not export bookings", res.status);
  return res.text();
}
