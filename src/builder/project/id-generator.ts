export type IdGenerator = (prefix: "project" | "page" | "node") => string;

let fallbackCounter = 0;

export const createId: IdGenerator = (prefix) => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  fallbackCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter.toString(36)}`;
};
