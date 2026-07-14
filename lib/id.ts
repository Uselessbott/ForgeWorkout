/**
 * Lightweight unique id generator.
 *
 * Do NOT use the `uuid` package here — it relies on crypto.getRandomValues()
 * and crashes on some Android/iOS runtimes. This scheme is unique enough
 * for local, offline, single-device data.
 */
export function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}
