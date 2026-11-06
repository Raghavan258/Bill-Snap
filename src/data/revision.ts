const listeners = new Set<() => void>();

/** Tells open screens that saved records changed. */
export function bumpData(): void {
  listeners.forEach((listener) => listener());
}

/** Subscribes a screen to record changes. Returns an unsubscribe function. */
export function subscribeData(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
