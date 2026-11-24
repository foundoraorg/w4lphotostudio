import type { Booking, Settings } from "./config";

function stamp(date: string, slot: string, addHours = 0): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = slot.split(":").map(Number);
  return `${y}${`${m}`.padStart(2, "0")}${`${d}`.padStart(2, "0")}T${`${(h + addHours) % 24}`.padStart(2, "0")}${`${min}`.padStart(2, "0")}00`;
}

export function buildIcs(bookings: Booking[], settings: Settings): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//W4L Studios//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const booking of bookings) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking.id}@w4lstudios.co.ke`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${stamp(booking.date, booking.slot)}`,
      `DTEND:${stamp(booking.date, booking.slot, 2)}`,
      `SUMMARY:W4L Studios — ${booking.selections.sessionTitle}`,
      `LOCATION:${settings.address}`,
      `DESCRIPTION:Reference ${booking.reference}. Deposit ${booking.deposit_kes} KES via ${booking.deposit_method.toUpperCase()}. Questions: ${settings.phone}.`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(bookings: Booking[], settings: Settings) {
  const blob = new Blob([buildIcs(bookings, settings)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `w4l-${bookings[0]?.reference ?? "booking"}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
