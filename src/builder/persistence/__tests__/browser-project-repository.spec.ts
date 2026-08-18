import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrowserProjectRepository } from "@/builder/persistence/browser-project-repository";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getBrowserProjectRepository", () => {
  it("should remain lazy when rendered without browser storage", async () => {
    vi.stubGlobal("indexedDB", undefined);

    const repository = getBrowserProjectRepository();

    expect(repository).toBeDefined();
    await expect(repository.list()).rejects.toMatchObject({
      code: "storage-unavailable",
    });
  });
});
