import { initOrderPage } from "./order.ts";

/**
 * Progressive enhancement only — the mobile nav panel is fully visible
 * (stacked, no JS) until this wires up the toggle; every page works with
 * JS disabled. Every init below is a no-op if its page doesn't have the
 * matching elements, which is what lets one shared bundle cover every page —
 * a second per-page <script> tag isn't reliably picked up by the Eleventy
 * Vite plugin's HTML entry scanning.
 */

function initMobileNav(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-nav-toggle]");
  const panel = document.querySelector<HTMLElement>("[data-nav-panel]");
  if (!toggle || !panel) return;

  toggle.hidden = false;
  panel.hidden = true;

  const setOpen = (open: boolean): void => {
    toggle.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  };

  toggle.addEventListener("click", () => {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });
}

/**
 * Drives --header-height and --sticky-offset (consumed by header.njk's
 * mobile toggle isn't affected, but menu.njk's category sub-nav `top-[...]`
 * and each category section's `scroll-mt-[...]` are) off the header's real
 * rendered height, not a hardcoded guess. The header's height isn't fixed —
 * it can change with viewport width or once webfonts swap in — so a
 * hardcoded pixel value drifts out of sync and either lets the sub-nav stick
 * partly behind the header or leaves a gap when jumping to a category.
 */
function initStickyOffsets(): void {
  const header = document.querySelector<HTMLElement>("header");
  if (!header) return;
  const subnav = document.querySelector<HTMLElement>('nav[aria-label="Menu categories"]');

  const update = (): void => {
    const headerHeight = header.getBoundingClientRect().height;
    const subnavHeight = subnav?.getBoundingClientRect().height ?? 0;
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    document.documentElement.style.setProperty("--sticky-offset", `${headerHeight + subnavHeight}px`);
  };

  update();
  window.addEventListener("resize", update);
  // Webfonts finishing their swap can reflow the header's text height.
  document.fonts?.ready.then(update).catch(() => {});
}

function initContactForm(): void {
  const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
  const success = document.querySelector<HTMLElement>("[data-contact-success]");
  if (!form || !success) return;

  const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    "input[required], textarea[required]",
  );

  const setFieldValid = (field: HTMLInputElement | HTMLTextAreaElement, valid: boolean): void => {
    field.classList.toggle("border-wine-600", !valid);
    field.setAttribute("aria-invalid", String(!valid));
    const error = field.closest("div")?.querySelector<HTMLElement>("[data-error]");
    if (error) error.hidden = valid;
  };

  fields.forEach((field) => {
    field.addEventListener("blur", () => setFieldValid(field, field.checkValidity()));
  });

  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    let valid = true;
    fields.forEach((field) => {
      const fieldValid = field.checkValidity();
      setFieldValid(field, fieldValid);
      if (!fieldValid) valid = false;
    });
    if (!valid) return;

    const button = form.querySelector<HTMLButtonElement>("[data-submit-button]");
    const label = button?.querySelector<HTMLElement>("[data-label]");
    if (button) button.disabled = true;
    if (label) label.textContent = "Sending…";

    window.setTimeout(() => {
      form.hidden = true;
      success.hidden = false;
      success.focus();
    }, 500);
  });
}

function parseTimeLabel(label: string): { hours: number; minutes: number } {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim());
  if (!match) return { hours: 19, minutes: 0 };
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

function toIcsStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function downloadReservationIcs(start: Date, guests: string): void {
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Via Roma//Reservations//EN",
    "BEGIN:VEVENT",
    `DTSTART:${toIcsStamp(start)}`,
    `DTEND:${toIcsStamp(end)}`,
    `SUMMARY:Reservation at Via Roma (Table for ${guests})`,
    "LOCATION:123 Via Roma, Knoxville, TN 37902",
    "DESCRIPTION:Via Roma reservation — demo confirmation, not a real booking.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "via-roma-reservation.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function initReservationForm(): void {
  const form = document.querySelector<HTMLFormElement>("[data-reservation-form]");
  const success = document.querySelector<HTMLElement>("[data-reservation-success]");
  if (!form || !success) return;

  const requiredFields = form.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
    "input[required], select[required]",
  );

  const setFieldValid = (
    field: HTMLInputElement | HTMLSelectElement,
    valid: boolean,
  ): void => {
    const container = field.closest("div") ?? field.closest("fieldset");
    const error = container?.querySelector<HTMLElement>("[data-error]");
    if (error) error.hidden = valid;
  };

  requiredFields.forEach((field) => {
    field.addEventListener("blur", () => setFieldValid(field, field.checkValidity()));
  });

  let lastStart = new Date();
  let lastGuests = "";

  form.addEventListener("submit", (event: SubmitEvent) => {
    event.preventDefault();

    let valid = true;
    requiredFields.forEach((field) => {
      const fieldValid = field.checkValidity();
      setFieldValid(field, fieldValid);
      if (!fieldValid) valid = false;
    });

    const timeChecked = form.querySelector<HTMLInputElement>('input[name="time"]:checked');
    const timeError = form
      .querySelector('input[name="time"]')
      ?.closest("fieldset")
      ?.querySelector<HTMLElement>("[data-error]");
    if (timeError) timeError.hidden = Boolean(timeChecked);
    if (!timeChecked) valid = false;

    if (!valid || !timeChecked) return;

    const data = new FormData(form);
    const guests = String(data.get("guests"));
    const dateValue = String(data.get("date"));
    const timeLabel = timeChecked.value;

    const [year, month, day] = dateValue.split("-").map(Number);
    const { hours, minutes } = parseTimeLabel(timeLabel);
    const start = new Date(year ?? 2026, (month ?? 1) - 1, day ?? 1, hours, minutes);
    lastStart = start;
    lastGuests = guests;

    const guestsOut = success.querySelector<HTMLElement>("[data-confirm-guests]");
    const datetimeOut = success.querySelector<HTMLElement>("[data-confirm-datetime]");
    if (guestsOut) guestsOut.textContent = guests;
    if (datetimeOut) {
      const dateLabel = start.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      datetimeOut.textContent = `${dateLabel} · ${timeLabel}`;
    }

    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  const modifyButton = success.querySelector<HTMLButtonElement>("[data-modify-reservation]");
  modifyButton?.addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    form.querySelector<HTMLElement>("input, select")?.focus();
  });

  const calendarButton = success.querySelector<HTMLButtonElement>("[data-add-to-calendar]");
  calendarButton?.addEventListener("click", () => {
    downloadReservationIcs(lastStart, lastGuests);
  });
}

initMobileNav();
initStickyOffsets();
initContactForm();
initReservationForm();
initOrderPage();
