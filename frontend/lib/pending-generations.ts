import type { GenerateResponse } from "@/lib/api-client";

// In-memory only: lets the prompt page kick off generation and navigate to
// the result page immediately, while the result page picks up the same
// in-flight request instead of waiting on the prompt page for minutes.
// Cleared on a full page reload, which is fine — a reload falls back to
// whatever's already been persisted to sessionStorage once it resolves.
const pending = new Map<string, Promise<GenerateResponse>>();

export function registerPendingGeneration(id: string, promise: Promise<GenerateResponse>): void {
  pending.set(id, promise);
}

export function takePendingGeneration(id: string): Promise<GenerateResponse> | undefined {
  const promise = pending.get(id);
  pending.delete(id);
  return promise;
}
