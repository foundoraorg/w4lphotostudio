import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, Lock } from "../components/Icons";
import { useToast } from "../components/ui/Toast";
import {
  adminBookings,
  adminCsv,
  adminLogin,
  adminSavePricing,
  adminSaveSession,
  adminUpdateBooking,
  adminBlockDate,
  adminUnblock,
  getAdminToken,
  setAdminToken,
} from "../lib/api";
import { useCatalogue } from "../lib/catalogue";
import type { Booking, BookingStatus, DepositStatus, PricingConfig, Session } from "../lib/config";
import { useCurrency } from "../lib/currency";
import { formatDateLong } from "../lib/format";
import { SLOTS } from "../lib/config";
import { useDocumentTitle } from "../lib/useDocumentTitle";

type Tab = "bookings" | "calendar" | "sessions" | "pricing";

export function Admin() {
  useDocumentTitle("Studio admin — W4L Studios");
  const [token, setToken] = useState<string | null>(() => getAdminToken());
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const next = await adminLogin(passcode);
      setToken(next);
      setPasscode("");
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-wall">
        <div className="wrap flex min-h-[70vh] items-center justify-center py-16">
          <form onSubmit={signIn} className="w-full max-w-sm border border-ink/20 bg-page p-6">
            <span className="flex h-10 w-10 items-center justify-center border border-ink/30">
              <Lock size={16} />
            </span>
            <h1 className="mt-4 font-display text-[26px] uppercase leading-none">Studio admin</h1>
            <p className="mt-2 font-serif text-[14px] leading-relaxed text-ink/70">
              Bookings, blocked dates, sessions and pricing. Local preview passcode: <span className="font-mono">w4l-studio</span>.
            </p>
            <label htmlFor="passcode" className="label mt-6">
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="field"
              autoComplete="current-password"
              required
            />
            {error && <p className="mt-2 font-mono text-[11px] text-bronze">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-lime mt-4 w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <Dashboard onSignOut={() => { setAdminToken(null); setToken(null); }} />;
}

function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("bookings");
  const { data, refresh } = useCatalogue();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setBookings(await adminBookings());
    } catch (issue) {
      toast(issue instanceof Error ? issue.message : "Could not load bookings.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-wall">
      <div className="wrap pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">Private</p>
            <h1 className="mt-2 font-display text-[clamp(28px,4vw,48px)] uppercase leading-none">Studio admin</h1>
          </div>
          <button type="button" onClick={onSignOut} className="btn btn-ghost">
            Sign out
          </button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto border-b border-line pb-3" role="tablist" aria-label="Admin sections">
          {(["bookings", "calendar", "sessions", "pricing"] as Tab[]).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={tab === option}
              onClick={() => setTab(option)}
              className={`chip min-h-[36px] shrink-0 ${tab === option ? "!border-ink !bg-ink !text-wall" : ""}`}
            >
              {option}
            </button>
          ))}
        </div>

        {tab === "bookings" && (
          <BookingsPanel
            bookings={bookings}
            loading={loading}
            onRefresh={load}
            onExport={async () => {
              try {
                const csv = await adminCsv();
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement("a");
                anchor.href = url;
                anchor.download = "w4l-bookings.csv";
                anchor.click();
                URL.revokeObjectURL(url);
              } catch {
                toast("Could not export the CSV.", "error");
              }
            }}
          />
        )}
        {tab === "calendar" && <CalendarPanel onChanged={() => void refresh()} />}
        {tab === "sessions" && <SessionsPanel sessions={data.sessions} onSaved={() => void refresh()} />}
        {tab === "pricing" && <PricingPanel config={data.pricingConfig} onSaved={() => void refresh()} />}
      </div>
    </div>
  );
}

function BookingsPanel({
  bookings,
  loading,
  onRefresh,
  onExport,
}: {
  bookings: Booking[];
  loading: boolean;
  onRefresh: () => void;
  onExport: () => void;
}) {
  const { fmt } = useCurrency();
  const { toast } = useToast();
  const [working, setWorking] = useState<string | null>(null);

  const update = async (booking: Booking, patch: { status?: BookingStatus; deposit_status?: DepositStatus }) => {
    setWorking(booking.id);
    try {
      await adminUpdateBooking(booking.id, patch);
      toast(`${booking.reference} updated.`, "success");
      onRefresh();
    } catch (issue) {
      toast(issue instanceof Error ? issue.message : "Update failed.", "error");
    } finally {
      setWorking(null);
    }
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          {bookings.length} {bookings.length === 1 ? "booking" : "bookings"}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={onRefresh} className="btn btn-ghost">
            Refresh
          </button>
          <button type="button" onClick={onExport} className="btn btn-dark">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto border border-line">
        <table className="w-full min-w-[880px] border-collapse bg-page text-left">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-[0.1em] text-muted">
              <th className="px-3 py-2">Reference</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Session</th>
              <th className="px-3 py-2">Client</th>
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Deposit</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 font-serif text-[14px]">
                  Loading bookings…
                </td>
              </tr>
            )}
            {!loading && bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 font-serif text-[14px]">
                  No bookings yet. Complete one from the site to see it here.
                </td>
              </tr>
            )}
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b border-line/70 align-top">
                <td className="px-3 py-3 font-mono text-[12px]">{booking.reference}</td>
                <td className="px-3 py-3 font-mono text-[11px]">
                  {formatDateLong(booking.date)}
                  <br />
                  {booking.slot}
                </td>
                <td className="px-3 py-3 font-serif text-[13px]">{booking.selections.sessionTitle}</td>
                <td className="px-3 py-3 font-serif text-[13px]">
                  {booking.name}
                  <br />
                  <span className="font-mono text-[10px] text-muted">{booking.phone}</span>
                </td>
                <td className="px-3 py-3 font-mono text-[11px]">
                  {fmt(booking.estimate_kes)}
                  <br />
                  <span className="text-muted">dep. {fmt(booking.deposit_kes)}</span>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    disabled={working === booking.id}
                    onClick={() =>
                      update(booking, { deposit_status: booking.deposit_status === "paid" ? "unpaid" : "paid" })
                    }
                    className={`chip min-h-[32px] !px-2 !text-[10px] ${booking.deposit_status === "paid" ? "!border-ink !bg-accent" : ""}`}
                    aria-pressed={booking.deposit_status === "paid"}
                  >
                    {booking.deposit_status}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <label className="sr-only" htmlFor={`status-${booking.id}`}>
                    Status for {booking.reference}
                  </label>
                  <select
                    id={`status-${booking.id}`}
                    value={booking.status}
                    disabled={working === booking.id}
                    onChange={(event) => update(booking, { status: event.target.value as BookingStatus })}
                    className="min-h-[36px] border border-line bg-page px-2 font-mono text-[11px] uppercase"
                  >
                    {["pending", "confirmed", "cancelled", "completed"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CalendarPanel({ onChanged }: { onChanged: () => void }) {
  const { data, refresh } = useCatalogue();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<string>("");
  const [reason, setReason] = useState("Studio closed");
  const [busy, setBusy] = useState(false);
  const blocked = data.blockedDates;

  const add = async () => {
    if (!date) {
      toast("Pick a date first.", "error");
      return;
    }
    setBusy(true);
    try {
      await adminBlockDate({ date, slot: slot || null, reason });
      await refresh();
      onChanged();
      toast("Date blocked. It is greyed out on the booking calendar.", "success");
    } catch (issue) {
      toast(issue instanceof Error ? issue.message : "Could not block that date.", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (entry: { date: string; slot: string | null }) => {
    try {
      await adminUnblock(entry);
      await refresh();
      onChanged();
      toast("Date released.", "success");
    } catch {
      toast("Could not release that date.", "error");
    }
  };

  return (
    <section className="mt-6 grid gap-8 lg:grid-cols-2">
      <div className="border border-line bg-page p-5">
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Block a date or slot</h2>
        <p className="mt-2 font-serif text-[14px] text-ink/70">
          A whole day closes every slot. A single slot closes only that time and leaves the rest of the day bookable.
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="block-date" className="label">
              Date
            </label>
            <input
              id="block-date"
              type="date"
              value={date}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDate(event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="block-slot" className="label">
              Slot
            </label>
            <select id="block-slot" value={slot} onChange={(event) => setSlot(event.target.value)} className="field">
              <option value="">Whole day</option>
              {SLOTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="block-reason" className="label">
              Reason
            </label>
            <input id="block-reason" value={reason} onChange={(event) => setReason(event.target.value)} className="field" />
          </div>
          <button type="button" onClick={add} disabled={busy} className="btn btn-dark w-full">
            {busy ? "Blocking…" : "Block"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Blocked dates</h2>
        {blocked.length === 0 ? (
          <p className="mt-3 font-serif text-[14px] text-ink/70">Nothing blocked. The studio is open on every future date.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {[...blocked].sort((a, b) => a.date.localeCompare(b.date)).map((entry) => (
              <li key={`${entry.date}-${entry.slot ?? "all"}`} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <span className="block font-mono text-[12px]">
                    {formatDateLong(entry.date)} · {entry.slot ?? "All slots"}
                  </span>
                  <span className="font-serif text-[12px] text-muted">{entry.reason || "No reason given"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => remove({ date: entry.date, slot: entry.slot })}
                  className="chip min-h-[32px] !px-2 !text-[10px]"
                >
                  Release
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SessionsPanel({ sessions, onSaved }: { sessions: Session[]; onSaved: () => void }) {
  const { toast } = useToast();
  const { fmt } = useCurrency();
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? "");
  const session = sessions.find((item) => item.id === selectedId) ?? sessions[0];
  const [draft, setDraft] = useState<Session | null>(session ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(session ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!session || !draft) return <p className="mt-6 font-serif">No sessions in the catalogue.</p>;

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await adminSaveSession(draft);
      onSaved();
      toast(`${draft.title} saved. The site picks it up immediately.`, "success");
    } catch (issue) {
      toast(issue instanceof Error ? issue.message : "Could not save that session.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Catalogue</h2>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {sessions.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`flex w-full items-baseline justify-between gap-3 py-3 text-left ${
                  item.id === selectedId ? "text-ink" : "text-ink/60 hover:text-ink"
                }`}
              >
                <span className="font-serif text-[15px]">{item.title}</span>
                <span className="font-mono text-[11px] text-bronze">{fmt(item.base_price_kes)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={save} className="border border-line bg-page p-5">
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Edit session</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="session-title" className="label">Title</label>
            <input
              id="session-title"
              className="field"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="session-category" className="label">Category</label>
              <input
                id="session-category"
                className="field"
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
              />
            </div>
            <div>
              <label htmlFor="session-price" className="label">Base price (KES)</label>
              <input
                id="session-price"
                type="number"
                min={0}
                step={100}
                className="field font-mono"
                value={draft.base_price_kes}
                onChange={(event) => setDraft({ ...draft, base_price_kes: Number(event.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="session-duration" className="label">Duration (min)</label>
              <input
                id="session-duration"
                type="number"
                min={15}
                step={15}
                className="field font-mono"
                value={draft.base_duration_min}
                onChange={(event) => setDraft({ ...draft, base_duration_min: Number(event.target.value) })}
              />
            </div>
            <div>
              <label htmlFor="session-edits" className="label">Included edits</label>
              <input
                id="session-edits"
                type="number"
                min={0}
                className="field font-mono"
                value={draft.included_edits}
                onChange={(event) => setDraft({ ...draft, included_edits: Number(event.target.value) })}
              />
            </div>
          </div>
          <div>
            <label htmlFor="session-description" className="label">Description</label>
            <textarea
              id="session-description"
              className="field min-h-[110px]"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 font-serif text-[14px]">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
              className="h-4 w-4 accent-[#29211D]"
            />
            Visible on the site
          </label>
          <button type="submit" disabled={busy} className="btn btn-lime w-full">
            {busy ? "Saving…" : "Save session"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PricingPanel({ config, onSaved }: { config: PricingConfig; onSaved: () => void }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState<PricingConfig>(config);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const numberFields = useMemo(
    () => [
      { key: "editRate", label: "Edit rate (KES / photo)", value: draft.editRate },
      { key: "includedEdits", label: "Included edits", value: draft.includedEdits },
      { key: "rushMultiplier", label: "Rush multiplier", value: draft.rushMultiplier },
      { key: "depositPercent", label: "Deposit (0-1)", value: draft.depositPercent },
      { key: "usdRate", label: "KES per USD", value: draft.usdRate },
    ],
    [draft],
  );

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await adminSavePricing(draft);
      onSaved();
      toast("Pricing saved. New estimates use it immediately.", "success");
    } catch (issue) {
      toast(issue instanceof Error ? issue.message : "Could not save pricing.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="border border-line bg-page p-5">
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Rates</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {numberFields.map((field) => (
            <div key={field.key}>
              <label htmlFor={`pricing-${field.key}`} className="label">
                {field.label}
              </label>
              <input
                id={`pricing-${field.key}`}
                type="number"
                step={field.key === "depositPercent" ? 0.05 : 1}
                className="field font-mono"
                value={field.value}
                onChange={(event) =>
                  setDraft({ ...draft, [field.key]: Number(event.target.value) } as PricingConfig)
                }
              />
            </div>
          ))}
        </div>

        <h3 className="mt-6 font-display text-[15px] uppercase tracking-[0.04em]">Duration factors</h3>
        <div className="mt-2 space-y-2">
          {draft.durationOptions.map((option) => (
            <div key={option.id} className="flex items-center justify-between gap-3">
              <span className="font-serif text-[13px]">{option.label}</span>
              <input
                type="number"
                step={0.05}
                min={0.1}
                value={option.factor}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    durationOptions: draft.durationOptions.map((item) =>
                      item.id === option.id ? { ...item, factor: Number(event.target.value) } : item,
                    ),
                  })
                }
                className="h-9 w-24 border border-line bg-page px-2 font-mono text-[12px]"
                aria-label={`${option.label} factor`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-line bg-page p-5">
        <h2 className="font-display text-[18px] uppercase tracking-[0.04em]">Add-ons & travel</h2>
        <div className="mt-4 space-y-2">
          {draft.addOns.map((addOn) => (
            <div key={addOn.id} className="flex items-center justify-between gap-3">
              <span className="font-serif text-[13px]">{addOn.label}</span>
              <input
                type="number"
                step={100}
                min={0}
                value={addOn.price}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    addOns: draft.addOns.map((item) =>
                      item.id === addOn.id ? { ...item, price: Number(event.target.value) } : item,
                    ),
                  })
                }
                className="h-9 w-24 border border-line bg-page px-2 font-mono text-[12px]"
                aria-label={`${addOn.label} price`}
              />
            </div>
          ))}
        </div>

        <h3 className="mt-6 font-display text-[15px] uppercase tracking-[0.04em]">Travel fees</h3>
        <div className="mt-2 space-y-2">
          {draft.locations.map((location) => (
            <div key={location.id} className="flex items-center justify-between gap-3">
              <span className="font-serif text-[13px]">{location.label}</span>
              <input
                type="number"
                step={500}
                min={0}
                value={location.fee}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    locations: draft.locations.map((item) =>
                      item.id === location.id ? { ...item, fee: Number(event.target.value) } : item,
                    ),
                  })
                }
                className="h-9 w-24 border border-line bg-page px-2 font-mono text-[12px]"
                aria-label={`${location.label} travel fee`}
              />
            </div>
          ))}
        </div>

        <h3 className="mt-6 font-display text-[15px] uppercase tracking-[0.04em]">People factors</h3>
        <div className="mt-2 space-y-2">
          {draft.peopleBands.map((band) => (
            <div key={band.id} className="flex items-center justify-between gap-3">
              <span className="font-serif text-[13px]">{band.label}</span>
              <input
                type="number"
                step={0.05}
                min={0.1}
                value={band.factor}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    peopleBands: draft.peopleBands.map((item) =>
                      item.id === band.id ? { ...item, factor: Number(event.target.value) } : item,
                    ),
                  })
                }
                className="h-9 w-24 border border-line bg-page px-2 font-mono text-[12px]"
                aria-label={`${band.label} factor`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2">
        <button type="submit" disabled={busy} className="btn btn-lime w-full sm:w-auto">
          {busy ? "Saving…" : "Save pricing"}
        </button>
      </div>
    </form>
  );
}
