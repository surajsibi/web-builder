import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import {
  IndexedDbProjectRepository,
  PROJECT_DATABASE_VERSION,
  PROJECT_STORE_NAME,
} from "@/builder/persistence/indexeddb-project-repository";
import { projectContent } from "@/builder/persistence/project-repository";
import { createNewProject } from "@/builder/project/factory";

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener("error", () => reject(request.error), {
      once: true,
    });
  });
}

async function replaceStoredRecord(
  indexedDB: IDBFactory,
  databaseName: string,
  storageKey: IDBValidKey,
  document: unknown,
): Promise<void> {
  const database = await requestResult(
    indexedDB.open(databaseName, PROJECT_DATABASE_VERSION),
  );
  const transaction = database.transaction(PROJECT_STORE_NAME, "readwrite");
  const completed = new Promise<void>((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener("error", () => reject(transaction.error), {
      once: true,
    });
    transaction.addEventListener("abort", () => reject(transaction.error), {
      once: true,
    });
  });
  transaction.objectStore(PROJECT_STORE_NAME).put({
    storageKey,
    document,
    lastOpenedAt: null,
  });
  await completed;
  database.close();
}

function createProjectDocument(projectId: string, name: string) {
  let id = 0;
  return createNewProject({
    name,
    now: "2026-08-14T10:00:00.000Z",
    idGenerator: (prefix) =>
      prefix === "project" ? projectId : `${prefix}-${++id}`,
  });
}

describe("IndexedDbProjectRepository", () => {
  it("should persist projects across repository instances", async () => {
    const indexedDB = new IDBFactory();
    let id = 0;
    const options = {
      indexedDB,
      databaseName: "project-repository-persistence-test",
      idGenerator: (prefix: "project" | "page" | "node") =>
        `${prefix}-${++id}`,
      now: () => "2026-08-14T10:00:00.000Z",
    };
    const first = new IndexedDbProjectRepository(options);
    const project = await first.create({ name: "Commerce Site" });
    await first.save(project.projectId, {
      expectedRevision: project.revision,
      content: { ...projectContent(project), name: "Saved Commerce Site" },
    });
    first.close();

    const reopened = new IndexedDbProjectRepository(options);

    await expect(reopened.load(project.projectId)).resolves.toMatchObject({
      document: {
        name: "Saved Commerce Site",
        revision: 1,
      },
      migrated: false,
    });
    await expect(reopened.list()).resolves.toMatchObject({
      items: [
        {
          availability: "ready",
          summary: expect.objectContaining({ projectId: project.projectId }),
        },
      ],
    });
    reopened.close();
  });

  it("should enforce revision checks inside a read-write transaction", async () => {
    const indexedDB = new IDBFactory();
    let id = 0;
    const repository = new IndexedDbProjectRepository({
      indexedDB,
      databaseName: "project-repository-revision-test",
      idGenerator: (prefix) => `${prefix}-${++id}`,
      now: () => "2026-08-14T10:00:00.000Z",
    });
    const project = await repository.create({ name: "Commerce Site" });

    await repository.rename(project.projectId, {
      name: "Renamed Store",
      expectedRevision: 0,
    });

    await expect(
      repository.save(project.projectId, {
        expectedRevision: 0,
        content: projectContent(project),
      }),
    ).rejects.toMatchObject({ code: "revision-conflict", currentRevision: 1 });
    repository.close();
  });

  it("should contain a record whose storage key and project identity differ", async () => {
    const indexedDB = new IDBFactory();
    const databaseName = "project-repository-identity-test";
    let id = 0;
    const repository = new IndexedDbProjectRepository({
      indexedDB,
      databaseName,
      idGenerator: (prefix) => `${prefix}-${++id}`,
      now: () => "2026-08-14T10:00:00.000Z",
    });
    const project = await repository.create({ name: "Identity A" });
    const mismatched = { ...project, projectId: "project-B" };
    await replaceStoredRecord(
      indexedDB,
      databaseName,
      project.projectId,
      mismatched,
    );

    await expect(repository.list()).resolves.toMatchObject({
      items: [
        {
          availability: "unavailable",
          summary: expect.objectContaining({
            recoveryId: expect.stringMatching(/^indexeddb-key:string:/),
            reason: "invalid-project",
          }),
        },
      ],
    });
    await expect(repository.load(project.projectId)).rejects.toMatchObject({
      code: "invalid-project",
    });
    await expect(
      repository.save(project.projectId, {
        expectedRevision: project.revision,
        content: projectContent(project),
      }),
    ).rejects.toMatchObject({ code: "invalid-project" });
    await expect(
      repository.rename(project.projectId, {
        name: "Wrong target",
        expectedRevision: project.revision,
      }),
    ).rejects.toMatchObject({ code: "invalid-project" });
    await expect(repository.duplicate(project.projectId)).rejects.toMatchObject({
      code: "invalid-project",
    });
    repository.close();
  });

  it("should classify a numeric physical key as unavailable instead of coercing it", async () => {
    const indexedDB = new IDBFactory();
    const databaseName = "project-repository-numeric-key-test";
    const repository = new IndexedDbProjectRepository({ indexedDB, databaseName });
    const numericProject = createProjectDocument("1", "Numeric Project");
    await repository.list();
    await replaceStoredRecord(indexedDB, databaseName, 1, numericProject);

    const listed = await repository.list();

    expect(listed.items).toEqual([
      {
        availability: "unavailable",
        summary: expect.objectContaining({
          displayName: "Numeric Project",
          reason: "invalid-project",
        }),
      },
    ]);
    expect(listed.items[0]?.summary).toMatchObject({
      recoveryId: expect.not.stringMatching(/^1$/),
    });
    await expect(repository.load("1")).rejects.toMatchObject({ code: "not-found" });
    repository.close();
  });

  it("should keep unavailable recovery identities unique across physical key types", async () => {
    const indexedDB = new IDBFactory();
    const databaseName = "project-repository-recovery-identity-test";
    const repository = new IndexedDbProjectRepository({ indexedDB, databaseName });
    const numericProject = createProjectDocument("1", "Numeric Project");
    const literalStringProject = createProjectDocument(
      "different-project-id",
      "Literal String Project",
    );
    await repository.list();
    await replaceStoredRecord(indexedDB, databaseName, 1, numericProject);
    await replaceStoredRecord(
      indexedDB,
      databaseName,
      "indexeddb-key:number:1",
      literalStringProject,
    );

    const listed = await repository.list();
    const unavailable = listed.items.filter(
      (item) => item.availability === "unavailable",
    );

    expect(unavailable).toHaveLength(2);
    expect(
      new Set(unavailable.map((item) => item.summary.recoveryId)).size,
    ).toBe(2);
    repository.close();
  });

  it("should keep colliding numeric and string keys distinct and mutate only the string project", async () => {
    const indexedDB = new IDBFactory();
    const databaseName = "project-repository-colliding-key-test";
    let id = 0;
    const repository = new IndexedDbProjectRepository({
      indexedDB,
      databaseName,
      idGenerator: (prefix) =>
        prefix === "project" ? "1" : `${prefix}-${++id}`,
      now: () => "2026-08-14T10:00:00.000Z",
    });
    const stringProject = await repository.create({ name: "String Project" });
    const numericProject = createProjectDocument("1", "Numeric Project");
    await replaceStoredRecord(indexedDB, databaseName, 1, numericProject);

    const listed = await repository.list();
    const ready = listed.items.find((item) => item.availability === "ready");
    const unavailable = listed.items.find(
      (item) => item.availability === "unavailable",
    );

    expect(listed.items).toHaveLength(2);
    expect(ready).toMatchObject({
      availability: "ready",
      summary: { projectId: "1", name: "String Project" },
    });
    expect(unavailable).toMatchObject({
      availability: "unavailable",
      summary: {
        displayName: "Numeric Project",
        reason: "invalid-project",
      },
    });
    expect(unavailable?.summary.recoveryId).not.toBe(stringProject.projectId);
    await expect(repository.load("1")).resolves.toMatchObject({
      document: { name: "String Project" },
    });

    await repository.rename("1", {
      name: "Renamed String Project",
      expectedRevision: stringProject.revision,
    });

    await expect(repository.list()).resolves.toMatchObject({
      items: expect.arrayContaining([
        {
          availability: "ready",
          summary: expect.objectContaining({ name: "Renamed String Project" }),
        },
        {
          availability: "unavailable",
          summary: expect.objectContaining({ displayName: "Numeric Project" }),
        },
      ]),
    });
    repository.close();
  });
});
