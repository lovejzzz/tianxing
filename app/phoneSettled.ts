"use client";

/**
 * Runs `callback` once the opening 3D turn is over, or right away when there
 * is none (phones, reduced motion, no WebGL, client-side navigation).
 *
 * Work that can wait — preparing the fluid type, warming the audio engine,
 * decoding hidden icons — must not land inside the turn: a single 20 ms task
 * there drops frames the eye reads as a stutter. The intro marks its state on
 * <html>: `phone-intro-pending` until the first frame, then `phone-3d-ready`
 * until `phone-3d-complete`.
 */
export function onPhoneSettled(callback: () => void) {
  const root = document.documentElement;
  const settled = () => !root.classList.contains("phone-intro-pending")
    && (!root.classList.contains("phone-3d-ready") || root.classList.contains("phone-3d-complete"));

  if (settled()) {
    callback();
    return () => {};
  }
  const observer = new MutationObserver(() => {
    if (!settled()) return;
    observer.disconnect();
    callback();
  });
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

/** Idle work after the turn, with a deadline so it still happens on a busy page. */
export function whenPhoneIdle(callback: () => void, timeout = 1500) {
  let idleHandle: number | null = null;
  let timer: number | null = null;
  const stopWaiting = onPhoneSettled(() => {
    if ("requestIdleCallback" in window) idleHandle = window.requestIdleCallback(callback, { timeout });
    else timer = (setTimeout as Window["setTimeout"])(callback, 200);
  });
  return () => {
    stopWaiting();
    if (idleHandle !== null) window.cancelIdleCallback(idleHandle);
    if (timer !== null) clearTimeout(timer);
  };
}
