/**
 * Conversion measurement hook. No analytics vendor is installed in the
 * preview (and none may be added without updating the privacy page).
 * Events are dispatched as a DOM CustomEvent so an owner-approved,
 * privacy-reviewed analytics tool can subscribe later:
 *
 *   window.addEventListener("lar:track", (e) => console.log(e.detail))
 *
 * Events: request_form_start, request_form_submit, request_form_success,
 *         request_form_error, phone_click, directions_click
 */
export function track(event: string, detail: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lar:track", { detail: { event, ...detail } }));
}
