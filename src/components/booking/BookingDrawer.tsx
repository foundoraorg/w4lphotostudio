import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, createBooking, fetchAvailability, type Availability } from "../../lib/api";
import type { Booking, DepositMethod } from "../../lib/config";
import { DEPOSIT_METHODS, SLOTS } from "../../lib/config";
import { useCatalogue } from "../../lib/catalogue";
import { useCurrency } from "../../lib/currency";
import { formatDateLong } from "../../lib/format";
import { downloadIcs } from "../../lib/ics";
import { useBooking } from "./BookingContext";
import { CalendarMonth, slotAvailability } from "./CalendarMonth";
import { ArrowLeft, ArrowRight, Check, Close, Download, Mail, Trash, WhatsApp } from "../Icons";
import { Lockup } from "../Lockup";
import { PrintImage } from "../ui/PrintImage";
import { useToast } from "../ui/Toast";

interface FormState {
  date: string;
  slot: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  method: DepositMethod;
  terms: boolean;
}

const EMPTY_FORM: FormState = {
  date: "",
  slot: "",
  name: "",
  phone: "",
  email: "",
  notes: "",
  method: "mpesa",
  terms: false,
};

const PHONE_RE = /^(?:\+254|254|0)(7|1)\d{8}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function BookingDrawer() {
  const { items, isOpen, step, close, setStep, removeItem, total, deposits } = useBooking();
  const { data } = useCatalogue();
  const { fmt } = useCurrency();
  const { toast } = useToast();
  const [availability, setAvailability] = useState<Availability>({ booked: [], blocked: [] });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    void fetchAvailability().then((next) => {
      if (alive) setAvailability(next);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, step]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const startIndex = form.slot ? SLOTS.indexOf(form.slot as (typeof SLOTS)[number]) : -1;
  const slotPlan =
    startIndex >= 0
      ? items.map((_, index) => SLOTS[startIndex + index]).filter(Boolean)
      : [];
  const enoughSlots = items.length === 0 || slotPlan.length === items.length;

  const setField = (patch: Partial<FormState>) => {
    setForm((current) => ({ ...current, ...patch }));
    setServerError("");
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.date) next.date = "Choose a date.";
    if (!form.slot) next.slot = "Choose a time.";
    if (form.name.trim().length < 2) next.name = "Add the name the booking is under.";
    if (!PHONE_RE.test(form.phone.replace(/[\s\-()]/g, ""))) next.phone = "Use +254 7xx xxx xxx or 07xx xxx xxx.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "That email needs a full address.";
    if (!form.method) next.method = "Choose a deposit method.";
    if (!form.terms) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const confirm = async () => {
    setServerError("");
    if (!validate()) {
      toast("A few details are missing.", "error");
      return;
    }
    if (!enoughSlots) {
      setErrors((current) => ({ ...current, slot: "That start time leaves no room for all the sessions in this booking." }));
      return;
    }
    setSubmitting(true);
    const created: Booking[] = [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      try {
        const booking = await createBooking({
          session_id: item.sessionId,
          selections: item.selections,
          estimate_kes: item.estimateKes,
          deposit_kes: item.depositKes,
          date: form.date,
          slot: SLOTS[startIndex + index],
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          notes: form.notes.trim(),
          deposit_method: form.method,
          termsAccepted: form.terms,
        });
        created.push(booking);
        removeItem(item.key);
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "The booking could not be saved. Check your connection.";
        if (error instanceof ApiError && error.code === "slot_taken") {
          const next = await fetchAvailability();
          setAvailability(next);
          setErrors((current) => ({ ...current, slot: message }));
        }
        setServerError(created.length ? "" : message);
        if (created.length) {
          setConfirmed(created);
          setStep("confirmed");
          toast("The first session is booked. The others need a new time.", "error");
        }
        setSubmitting(false);
        return;
      }
    }
    setConfirmed(created);
    setStep("confirmed");
    setForm(EMPTY_FORM);
    setSubmitting(false);
    toast("Booking confirmed. The studio has your date.", "success");
    const next = await fetchAvailability();
    setAvailability(next);
  };

  const reset = () => {
    setConfirmed([]);
    setForm(EMPTY_FORM);
    setServerError("");
    setErrors({});
    setStep("items");
  };

  const closeDrawer = () => {
    close();
    if (step === "confirmed") reset();
  };

  return (
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        className="drawer-scrim absolute inset-0 bg-night/45"
        onClick={closeDrawer}
        aria-label="Close the booking drawer"
      />
      <aside
        className="drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-drawer shadow-[-24px_0_70px_rgba(16,19,24,0.28)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        style={{ animation: "drawer-in 450ms cubic-bezier(.1,.85,.2,1) both" }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink/15 px-5 py-4">
          <div>
            <p className="micro">
              {step === "items" ? "Step 1 of 2" : step === "details" ? "Step 2 of 2" : "Confirmed"}
            </p>
            <h2 id="booking-title" className="mt-0.5 font-display text-[19px] uppercase tracking-[0.04em]">
              {step === "items" ? "My bookings" : step === "details" ? "Your details" : "You're booked"}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="flex h-11 w-11 items-center justify-center"
            aria-label="Close booking"
          >
            <Close />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === "items" && (
            <div>
              {items.length === 0 ? (
                <div className="py-10">
                  <p className="font-serif text-[17px] leading-relaxed">
                    Nothing in this booking yet. Choose a session and it will be held here while you pick a date.
                  </p>
                  <Link to="/sessions" onClick={close} className="btn btn-dark mt-6">
                    Browse sessions <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-3 border border-ink/15 bg-page p-3">
                      <PrintImage
                        session={data.sessions.find((session) => session.id === item.sessionId)}
                        crop={{ x: 0, y: 0, w: 1 / 3, h: 1 / 3 }}
                        alt={`${item.title} session`}
                        className="h-[86px] w-16 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-display text-[14px] uppercase leading-tight tracking-[0.02em]">{item.title}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            className="p-1 text-muted hover:text-ink"
                            aria-label={`Remove ${item.title}`}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                        <p className="micro mt-1 leading-relaxed">
                          {item.selections.durationLabel} · {item.selections.people}{" "}
                          {item.selections.people === 1 ? "person" : "people"}
                          {item.selections.edits ? ` · ${item.selections.edits} edits` : ""}
                          {item.selections.locationId !== "studio" ? ` · ${item.selections.locationLabel}` : ""}
                          {item.selections.rush ? " · rush" : ""}
                        </p>
                        <div className="mt-2 flex items-baseline justify-between gap-2">
                          <span className="font-mono text-[13px]">{fmt(item.estimateKes)}</span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                            Deposit {fmt(item.depositKes)}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {items.length > 0 && (
                <div className="mt-5 flex items-baseline justify-between border-t border-ink/20 pt-3">
                  <span className="micro">Subtotal</span>
                  <span className="font-mono text-[16px]">{fmt(total)}</span>
                </div>
              )}
              {items.length > 0 && (
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="micro">Deposit at booking · 30%</span>
                  <span className="font-mono text-[12px] text-bronze">{fmt(deposits)}</span>
                </div>
              )}
            </div>
          )}

          {step === "details" && (
            <div>
              <button
                type="button"
                onClick={() => setStep("items")}
                className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink"
              >
                <ArrowLeft size={13} /> My bookings
              </button>

              <p className="micro mb-2">Date</p>
              <CalendarMonth
                value={form.date || null}
                onChange={(iso) => setField({ date: iso, slot: "" })}
                availability={availability}
              />
              {errors.date && <p className="mt-2 font-mono text-[11px] text-bronze">{errors.date}</p>}

              <p className="micro mb-2 mt-5">Time slot</p>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time slot">
                {SLOTS.map((slot) => {
                  const state = form.date ? slotAvailability(availability, form.date, slot) : "open";
                  const disabled = !form.date || state !== "open";
                  const selected = form.slot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected}
                      onClick={() => setField({ slot })}
                      className={`flex min-h-[44px] flex-col items-center justify-center border font-mono text-[13px] transition-colors ${
                        selected
                          ? "border-ink bg-accent text-ink"
                          : disabled
                            ? "border-line bg-transparent text-ink/25 line-through"
                            : "border-line bg-page text-ink hover:border-ink"
                      }`}
                    >
                      {slot}
                      {state === "booked" && <span className="text-[8px] uppercase tracking-[0.08em]">booked</span>}
                      {state === "blocked" && <span className="text-[8px] uppercase tracking-[0.08em]">closed</span>}
                    </button>
                  );
                })}
              </div>
              {errors.slot && <p className="mt-2 font-mono text-[11px] text-bronze">{errors.slot}</p>}
              {items.length > 1 && form.slot && enoughSlots && (
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted">
                  Slots held: {slotPlan.join(" · ")}
                </p>
              )}
              {!form.date && <p className="mt-2 font-serif text-[12px] italic text-muted">Pick a date to see open times.</p>}

              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="booking-name" className="label">
                    Full name
                  </label>
                  <input
                    id="booking-name"
                    className="field"
                    value={form.name}
                    autoComplete="name"
                    onChange={(event) => setField({ name: event.target.value })}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "error-name" : undefined}
                  />
                  {errors.name && <p id="error-name" className="mt-1 font-mono text-[11px] text-bronze">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="booking-phone" className="label">
                    Phone (WhatsApp)
                  </label>
                  <input
                    id="booking-phone"
                    className="field"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0712 345 678"
                    value={form.phone}
                    onChange={(event) => setField({ phone: event.target.value })}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "error-phone" : undefined}
                  />
                  {errors.phone && <p id="error-phone" className="mt-1 font-mono text-[11px] text-bronze">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="booking-email" className="label">
                    Email
                  </label>
                  <input
                    id="booking-email"
                    className="field"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => setField({ email: event.target.value })}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? "error-email" : undefined}
                  />
                  {errors.email && <p id="error-email" className="mt-1 font-mono text-[11px] text-bronze">{errors.email}</p>}
                </div>
                <div>
                  <label htmlFor="booking-notes" className="label">
                    Notes (optional)
                  </label>
                  <textarea
                    id="booking-notes"
                    className="field min-h-[86px] resize-y"
                    value={form.notes}
                    onChange={(event) => setField({ notes: event.target.value })}
                    placeholder="Wardrobe, references, who is coming…"
                  />
                </div>
              </div>

              <fieldset className="mt-6">
                <legend className="label">Deposit method · 30%</legend>
                <div className="space-y-2">
                  {DEPOSIT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-start gap-3 border px-3 py-3 transition-colors ${
                        form.method === method.id ? "border-ink bg-page" : "border-ink/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deposit-method"
                        value={method.id}
                        checked={form.method === method.id}
                        onChange={() => setField({ method: method.id })}
                        className="mt-1 h-4 w-4 accent-[#29211D]"
                      />
                      <span>
                        <span className="block font-display text-[13px] uppercase tracking-[0.06em]">{method.label}</span>
                        <span className="mt-0.5 block font-serif text-[12px] leading-snug text-ink/70">{method.instruction}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.method && <p className="mt-1 font-mono text-[11px] text-bronze">{errors.method}</p>}
              </fieldset>

              <label className="mt-5 flex cursor-pointer items-start gap-3 font-serif text-[13px] leading-snug">
                <input
                  type="checkbox"
                  checked={form.terms}
                  onChange={(event) => setField({ terms: event.target.checked })}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#29211D]"
                  aria-invalid={Boolean(errors.terms)}
                />
                <span>
                  I agree to the studio terms, the 30% deposit and the 72-hour reschedule window.
                  {errors.terms && <span className="mt-1 block font-mono text-[11px] text-bronze">{errors.terms}</span>}
                </span>
              </label>

              {serverError && (
                <p role="alert" className="mt-4 border border-bronze bg-bronze/10 px-3 py-2 font-serif text-[13px]">
                  {serverError}
                </p>
              )}
            </div>
          )}

          {step === "confirmed" && (
            <Confirmation
              bookings={confirmed}
              onReset={reset}
              onClose={closeDrawer}
            />
          )}
        </div>

        {step !== "confirmed" && (
          <footer className="border-t border-ink/15 bg-drawer px-5 py-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="micro">Total · deposit</span>
              <span className="font-mono text-[15px]">
                {fmt(total)} <span className="text-bronze">/ {fmt(deposits)}</span>
              </span>
            </div>
            {step === "items" ? (
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setStep("details")}
                className="btn btn-lime mt-3 w-full"
              >
                Continue to details <ArrowRight size={15} />
              </button>
            ) : (
              <button type="button" disabled={submitting || items.length === 0} onClick={confirm} className="btn btn-lime mt-3 w-full">
                {submitting ? "Confirming…" : "Confirm booking"} <ArrowRight size={15} />
              </button>
            )}
          </footer>
        )}
      </aside>
    </div>
  );
}

function Confirmation({ bookings, onReset, onClose }: { bookings: Booking[]; onReset: () => void; onClose: () => void }) {
  const { data } = useCatalogue();
  const { fmt } = useCurrency();
  const { toast } = useToast();
  const { settings } = data;
  const primary = bookings[0];
  if (!primary) {
    return (
      <div className="py-8">
        <p className="font-serif text-[16px]">Nothing was confirmed. Try again from the studio catalogue.</p>
        <button type="button" className="btn btn-dark mt-5" onClick={onReset}>
          Back to my bookings
        </button>
      </div>
    );
  }

  const method = DEPOSIT_METHODS.find((item) => item.id === primary.deposit_method) ?? DEPOSIT_METHODS[0];
  const summary = bookings
    .map((booking) => `${booking.selections.sessionTitle} · ${formatDateLong(booking.date)} · ${booking.slot}`)
    .join("\n");
  const whatsapp = `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(
    `Hello W4L Studios, I have booked ${summary}. Reference ${bookings.map((b) => b.reference).join(", ")}.`,
  )}`;
  const mailto = `mailto:${settings.email}?subject=${encodeURIComponent(
    `Booking ${primary.reference}`,
  )}&body=${encodeURIComponent(`${summary}\n\nReference: ${bookings.map((b) => b.reference).join(", ")}\nName: ${primary.name}\nDeposit: ${primary.deposit_kes} KES via ${method.label}`)}`;

  const download = () => {
    downloadIcs(bookings, settings);
    toast("Calendar file downloaded.", "success");
  };

  return (
    <div>
      <div className="flex flex-col items-center py-2 text-center">
        <svg viewBox="0 0 64 64" className="check-mark h-16 w-16" aria-hidden="true">
          <circle cx="32" cy="32" r="30" />
          <path d="M18 33.5 28 43l19-22" />
        </svg>
        <p className="mt-4 font-display text-[26px] uppercase leading-none">Thank you, {primary.name.split(" ")[0]}.</p>
        <p className="mt-2 font-serif text-[14px] text-ink/70">Your slot is held. Send the deposit to lock it in.</p>
        <p className="kicker mt-5">Reference</p>
        <p className="font-mono text-[24px] tracking-[0.06em]">{bookings.map((booking) => booking.reference).join(" · ")}</p>
      </div>

      <div className="mt-5 border border-ink/20 bg-page p-4">
        <Lockup size="sm" />
        <dl className="mt-4 space-y-2 font-mono text-[12px]">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex flex-wrap justify-between gap-x-3 border-b border-ink/10 pb-2 last:border-0">
              <dt className="uppercase tracking-[0.08em] text-muted">{booking.selections.sessionTitle}</dt>
              <dd>
                {formatDateLong(booking.date)} · {booking.slot}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.08em] text-muted">Total</dt>
            <dd>{fmt(primary.estimate_kes)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.08em] text-muted">Deposit due · 30%</dt>
            <dd className="text-bronze">{fmt(primary.deposit_kes)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="uppercase tracking-[0.08em] text-muted">Via</dt>
            <dd>{method.label}</dd>
          </div>
        </dl>
        <p className="mt-3 border-t border-ink/10 pt-3 font-serif text-[12px] leading-snug text-ink/70">{method.instruction}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button type="button" onClick={download} className="btn btn-dark w-full">
          <Download size={15} /> Add to calendar (.ics)
        </button>
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn w-full">
          <WhatsApp size={15} /> Send on WhatsApp
        </a>
        <a href={mailto} className="btn w-full">
          <Mail size={15} /> Email me this
        </a>
        <button type="button" onClick={onClose} className="btn btn-ghost w-full">
          <Check size={15} /> Done
        </button>
      </div>
      <p className="mt-3 text-center font-serif text-[11px] leading-snug text-muted">
        Final quote confirmed after we review your brief.
      </p>
    </div>
  );
}
