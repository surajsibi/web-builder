import { describe, expect, it } from "vitest";

import { projectContent } from "@/builder/persistence/project-repository";
import { MemoryProjectRepository } from "@/builder/testing/memory-project-repository";

function createRepository() {
  let id = 0;
  let time = 0;
  return new MemoryProjectRepository({
    idGenerator: (prefix) => `${prefix}-${++id}`,
    now: () => `2026-08-14T10:${String(time++).padStart(2, "0")}:00.000Z`,
  });
}

describe("MemoryProjectRepository", () => {
  it("should create, list, and load a project", async () => {
    const repository = createRepository();

    const created = await repository.create({ name: "  Commerce Site  " });
    const listed = await repository.list();
    const loaded = await repository.load(created.projectId);

    expect(created.name).toBe("Commerce Site");
    expect(listed).toEqual({
      items: [
        {
          availability: "ready",
          summary: expect.objectContaining({
            projectId: created.projectId,
            name: "Commerce Site",
            revision: 0,
            pageCount: 1,
          }),
        },
      ],
      nextCursor: null,
    });
    expect(loaded).toEqual({ document: created, migrated: false });
    expect(loaded.document).not.toBe(created);
  });

  it("should increment revisions and reject a stale save", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "Commerce Site" });

    const receipt = await repository.save(project.projectId, {
      expectedRevision: 0,
      content: { ...projectContent(project), name: "Published Store" },
    });

    expect(receipt).toMatchObject({ revision: 1 });
    await expect(
      repository.save(project.projectId, {
        expectedRevision: 0,
        content: projectContent(project),
      }),
    ).rejects.toMatchObject({ code: "revision-conflict", currentRevision: 1 });
    await expect(repository.load(project.projectId)).resolves.toMatchObject({
      document: {
        name: "Published Store",
        revision: 1,
      },
      migrated: false,
    });
  });

  it("should rename and duplicate without sharing project identity", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "Commerce Site" });

    await repository.rename(project.projectId, {
      name: "Storefront",
      expectedRevision: project.revision,
    });
    const duplicate = await repository.duplicate(project.projectId);

    expect(await repository.load(project.projectId)).toMatchObject({
      document: {
        name: "Storefront",
        revision: 1,
      },
      migrated: false,
    });
    expect(duplicate).toMatchObject({ name: "Storefront Copy", revision: 0 });
    expect(duplicate.projectId).not.toBe(project.projectId);
  });

  it("should keep generated duplicate names within the dashboard name limit", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "x".repeat(120) });

    const duplicate = await repository.duplicate(project.projectId);

    expect(duplicate.name).toHaveLength(120);
    expect(duplicate.name).toMatch(/ Copy$/);
  });

  it("should invalidate an offset cursor when a save changes inventory ordering", async () => {
    let id = 0;
    let second = 0;
    const repository = new MemoryProjectRepository({
      idGenerator: (prefix) => `${prefix}-${++id}`,
      now: () => new Date(Date.UTC(2026, 7, 14, 10, 0, second++)).toISOString(),
    });
    const buried = await repository.create({ name: "Buried Project" });
    for (let index = 1; index <= 100; index += 1) {
      await repository.create({ name: `Project ${index}` });
    }
    const firstPage = await repository.list({ limit: 100 });
    expect(firstPage.nextCursor).not.toBeNull();
    await repository.rename(buried.projectId, {
      name: "Updated Buried Project",
      expectedRevision: buried.revision,
    });

    await expect(
      repository.list({ cursor: firstPage.nextCursor ?? undefined, limit: 100 }),
    ).rejects.toMatchObject({ code: "inventory-changed" });
  });

  it("should report supported stored-document migration without rewriting the source", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "Legacy Store" });
    const versionTwoProject = structuredClone(project);
    versionTwoProject.schemaVersion = 2;
    repository.putRaw(project.projectId, {
      storageKey: project.projectId,
      document: versionTwoProject,
      lastOpenedAt: null,
    });

    const firstLoad = await repository.load(project.projectId);
    const secondLoad = await repository.load(project.projectId);

    expect(firstLoad).toMatchObject({
      document: { schemaVersion: 3, revision: 0 },
      migrated: true,
    });
    expect(secondLoad.migrated).toBe(true);
  });

  it("should isolate a corrupt record while keeping valid projects available", async () => {
    const repository = createRepository();
    const valid = await repository.create({ name: "Healthy Store" });
    repository.putRaw("damaged-record", {
      storageKey: "damaged-record",
      document: {
        name: "Damaged Store",
        updatedAt: "2026-08-13T09:00:00.000Z",
        schemaVersion: 2,
      },
      lastOpenedAt: null,
    });

    const result = await repository.list();

    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          availability: "ready",
          summary: expect.objectContaining({ projectId: valid.projectId }),
        }),
        {
          availability: "unavailable",
          summary: {
            recoveryId: "damaged-record",
            displayName: "Damaged Store",
            lastKnownUpdatedAt: "2026-08-13T09:00:00.000Z",
            reason: "invalid-project",
          },
        },
      ]),
    );
    await expect(repository.load("damaged-record")).rejects.toMatchObject({
      code: "invalid-project",
    });
  });

  it("should reject every operation when the storage key and project identity differ", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "Identity B" });
    const storageKey = "project-A";
    repository.putRaw(storageKey, {
      storageKey,
      document: project,
      lastOpenedAt: null,
    });

    await expect(repository.list()).resolves.toMatchObject({
      items: expect.arrayContaining([
        {
          availability: "unavailable",
          summary: {
            recoveryId: storageKey,
            displayName: "Identity B",
            lastKnownUpdatedAt: project.updatedAt,
            reason: "invalid-project",
          },
        },
      ]),
    });
    await expect(repository.load(storageKey)).rejects.toMatchObject({
      code: "invalid-project",
      unavailableProject: { recoveryId: storageKey },
    });
    await expect(
      repository.save(storageKey, {
        expectedRevision: project.revision,
        content: projectContent(project),
      }),
    ).rejects.toMatchObject({ code: "invalid-project" });
    await expect(
      repository.rename(storageKey, {
        name: "Wrong target",
        expectedRevision: project.revision,
      }),
    ).rejects.toMatchObject({ code: "invalid-project" });
    await expect(repository.duplicate(storageKey)).rejects.toMatchObject({
      code: "invalid-project",
    });
  });

  it("should classify a future document version separately from corruption", async () => {
    const repository = createRepository();
    repository.putRaw("future-record", {
      name: "Future Store",
      schemaVersion: 999,
      updatedAt: "2026-08-14T09:00:00.000Z",
    });

    const result = await repository.list();

    expect(result.items).toEqual([
      {
        availability: "unavailable",
        summary: {
          recoveryId: "future-record",
          displayName: "Future Store",
          lastKnownUpdatedAt: "2026-08-14T09:00:00.000Z",
          reason: "unsupported-version",
        },
      },
    ]);
  });

  it("should hide unsafe recovery metadata behind bounded fallbacks", async () => {
    const repository = createRepository();
    repository.putRaw("unsafe-record", {
      name: `Unsafe\u0000${"x".repeat(150)}`,
      updatedAt: "not-a-date",
      schemaVersion: 2,
    });

    const result = await repository.list();

    expect(result.items).toEqual([
      {
        availability: "unavailable",
        summary: {
          recoveryId: "unsafe-record",
          displayName: "Unavailable local project",
          lastKnownUpdatedAt: null,
          reason: "invalid-project",
        },
      },
    ]);
  });
});
