import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  BookingError,
  availability,
  blockDate,
  bookingsCsv,
  catalogueForClient,
  createBooking,
  lookupBookings,
  readBookings,
  readCatalogue,
  savePricing,
  saveSession,
  unblockDate,
  updateBooking,
} from "./bookings";
import type { BlockedDate, Booking, NewBooking, PricingConfig, Session } from "../src/lib/config";

const app = express();
const PORT = Number(process.env.PORT ?? 8787);
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "w4l-studio";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "w4l-local-admin-token";

app.disable("x-powered-by");
app.use(express.json({ limit: "200kb" }));

function tokenFrom(req: Request): string {
  const header = req.header("x-admin-token");
  if (header) return header;
  const query = req.query.token;
  return typeof query === "string" ? query : "";
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (tokenFrom(req) !== ADMIN_TOKEN) {
    res.status(401).json({ error: "Studio admin sign-in required." });
    return;
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, bookings: readBookings().bookings.length });
});

app.get("/api/catalogue", (_req, res) => {
  res.setHeader("cache-control", "no-store");
  res.json(catalogueForClient());
});

app.get("/api/availability", (_req, res) => {
  res.setHeader("cache-control", "no-store");
  res.json(availability());
});

app.post("/api/bookings", (req, res) => {
  try {
    const booking = createBooking(req.body as NewBooking);
    res.status(201).json({ booking });
  } catch (error) {
    if (error instanceof BookingError) {
      res.status(error.status).json({ error: error.message, code: error.code, bookedSlots: error.bookedSlots });
      return;
    }
    res.status(500).json({ error: "The booking could not be saved. Try again." });
  }
});

app.get("/api/bookings/lookup", (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q : "";
  res.setHeader("cache-control", "no-store");
  res.json({ bookings: lookupBookings(query) });
});

app.post("/api/admin/login", (req, res) => {
  const passcode = String((req.body as { passcode?: string })?.passcode ?? "");
  if (passcode !== ADMIN_PASSCODE) {
    res.status(401).json({ error: "That passcode does not open the studio." });
    return;
  }
  res.json({ token: ADMIN_TOKEN });
});

app.get("/api/admin/bookings", requireAdmin, (_req, res) => {
  res.setHeader("cache-control", "no-store");
  res.json({ bookings: readBookings().bookings.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)) });
});

app.patch("/api/admin/bookings/:id", requireAdmin, (req, res) => {
  try {
    const booking = updateBooking(
      String(req.params.id),
      req.body as Partial<Pick<Booking, "status" | "deposit_status">>,
    );
    res.json({ booking });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Could not update the booking." });
  }
});

app.post("/api/admin/blocked", requireAdmin, (req, res) => {
  try {
    const blocked = blockDate(req.body as BlockedDate);
    res.json({ blocked });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Could not block that date." });
  }
});

app.delete("/api/admin/blocked", requireAdmin, (req, res) => {
  try {
    const blocked = unblockDate(req.body as { date: string; slot: string | null });
    res.json({ blocked });
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Could not unblock that date." });
  }
});

app.put("/api/admin/sessions", requireAdmin, (req, res) => {
  try {
    saveSession(req.body as Session);
    res.json(catalogueForClient());
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Could not save the session." });
  }
});

app.put("/api/admin/pricing", requireAdmin, (req, res) => {
  try {
    savePricing(req.body as PricingConfig);
    res.json(catalogueForClient());
  } catch (error) {
    const status = error instanceof BookingError ? error.status : 500;
    res.status(status).json({ error: error instanceof Error ? error.message : "Could not save pricing." });
  }
});

app.get("/api/admin/export.csv", requireAdmin, (_req, res) => {
  res.setHeader("content-type", "text/csv; charset=utf-8");
  res.setHeader("content-disposition", 'attachment; filename="w4l-bookings.csv"');
  res.send(bookingsCsv());
});

app.get("/api/admin/blocked", requireAdmin, (_req, res) => {
  res.json({ blocked: readCatalogue().blockedDates });
});

// Optional single-process preview: serve the built site when it exists.
const dist = join(process.cwd(), "dist");
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.sendFile(join(dist, "index.html"));
      return;
    }
    next();
  });
}

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.path}` });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`W4L studio API listening on http://127.0.0.1:${PORT}`);
});

