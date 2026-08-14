import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";

import { IndexedDbProjectRepository } from "@/builder/persistence/indexeddb-project-repository";
import { projectContent } from "@/builder/persistence/project-repository";

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
});
