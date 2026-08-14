import { describe, expect, it } from "vitest";

import { duplicateProjectDocument } from "@/builder/project/duplicate";
import { prepareProjectHydration } from "@/builder/project/hydration";
import { createTestProject } from "@/builder/testing/project-fixtures";

describe("duplicateProjectDocument", () => {
  it("should create an independent valid project with fresh IDs", () => {
    const source = createTestProject({ includeAboutPage: true });
    let sequence = 0;

    const duplicate = duplicateProjectDocument(source, {
      name: "Storefront Copy",
      now: "2026-08-14T10:30:00.000Z",
      idGenerator: (prefix) => `${prefix}-copy-${++sequence}`,
    });

    expect(duplicate).toMatchObject({
      name: "Storefront Copy",
      createdAt: "2026-08-14T10:30:00.000Z",
      updatedAt: "2026-08-14T10:30:00.000Z",
      revision: 0,
    });
    expect(duplicate.projectId).toMatch(/^project-copy-[0-9]+$/);
    expect(duplicate.pageOrder).not.toEqual(source.pageOrder);
    expect(Object.keys(duplicate.pages)).not.toEqual(Object.keys(source.pages));
    expect(
      Object.values(duplicate.pages).flatMap((page) => Object.keys(page.nodes)),
    ).not.toEqual(
      Object.values(source.pages).flatMap((page) => Object.keys(page.nodes)),
    );
    expect(prepareProjectHydration(duplicate).success).toBe(true);

    duplicate.pages[duplicate.homePageId].name = "Changed duplicate";
    expect(source.pages[source.homePageId].name).toBe("Home");
  });
});
