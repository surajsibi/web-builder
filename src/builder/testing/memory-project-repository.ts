import type { IdGenerator } from "@/builder/project/id-generator";
import { createNewProject } from "@/builder/project/factory";
import { duplicateProjectDocument } from "@/builder/project/duplicate";
import {
  asStoredRecord,
  assertReadyStoredProject,
  buildSavedProject,
  defaultDuplicateProjectName,
  documentFromStoredRecord,
  normalizeProjectName,
  paginateProjectItems,
  prepareStoredProject,
  projectContent,
  type ProjectListItem,
  type ProjectListInput,
  type ProjectListResult,
  type ProjectLoadResult,
  type ProjectRepository,
  ProjectRepositoryError,
  type SaveProjectInput,
  type SaveProjectReceipt,
} from "@/builder/persistence/project-repository";
import type { ProjectDocument } from "@/builder/model/project-document";

type MemoryProjectRepositoryOptions = {
  now?: () => string;
  idGenerator?: IdGenerator;
  initialRecords?: Readonly<Record<string, unknown>>;
};

export class MemoryProjectRepository implements ProjectRepository {
  private readonly records = new Map<string, unknown>();
  private readonly now: () => string;
  private readonly idGenerator?: IdGenerator;

  constructor(options: MemoryProjectRepositoryOptions = {}) {
    this.now = options.now ?? (() => new Date().toISOString());
    this.idGenerator = options.idGenerator;
    for (const [key, value] of Object.entries(options.initialRecords ?? {})) {
      this.records.set(key, structuredClone(value));
    }
  }

  putRaw(storageKey: string, value: unknown): void {
    this.records.set(storageKey, structuredClone(value));
  }

  async list(input?: ProjectListInput): Promise<ProjectListResult> {
    const items: ProjectListItem[] = [];
    for (const [storageKey, stored] of this.records) {
      const prepared = prepareStoredProject(
        storageKey,
        documentFromStoredRecord(stored),
      );
      items.push(
        prepared.availability === "ready"
          ? { availability: "ready", summary: prepared.summary }
          : { availability: "unavailable", summary: prepared.summary },
      );
    }
    return paginateProjectItems(items, input);
  }

  async create(input: { name: string }): Promise<ProjectDocument> {
    const project = createNewProject({
      name: normalizeProjectName(input.name),
      now: this.now(),
      idGenerator: this.idGenerator,
    });
    if (this.records.has(project.projectId)) {
      throw new ProjectRepositoryError(
        "unexpected-storage-error",
        "Generated project ID already exists",
      );
    }
    this.records.set(project.projectId, asStoredRecord(project));
    return structuredClone(project);
  }

  async load(projectId: string): Promise<ProjectLoadResult> {
    if (!this.records.has(projectId)) {
      throw new ProjectRepositoryError("not-found", "Project not found");
    }
    return assertReadyStoredProject(projectId, this.records.get(projectId));
  }

  async save(
    projectId: string,
    input: SaveProjectInput,
  ): Promise<SaveProjectReceipt> {
    const { document: current } = await this.load(projectId);
    const saved = buildSavedProject(current, input, this.now());
    this.records.set(projectId, asStoredRecord(saved));
    return {
      projectId: saved.projectId,
      revision: saved.revision,
      updatedAt: saved.updatedAt,
    };
  }

  async rename(
    projectId: string,
    input: { name: string; expectedRevision: number },
  ): Promise<SaveProjectReceipt> {
    const { document: current } = await this.load(projectId);
    return this.save(projectId, {
      expectedRevision: input.expectedRevision,
      content: {
        ...projectContent(current),
        name: normalizeProjectName(input.name),
      },
    });
  }

  async duplicate(
    projectId: string,
    input?: { name?: string },
  ): Promise<ProjectDocument> {
    const { document: source } = await this.load(projectId);
    const duplicate = duplicateProjectDocument(source, {
      name: input?.name
        ? normalizeProjectName(input.name)
        : defaultDuplicateProjectName(source.name),
      now: this.now(),
      idGenerator: this.idGenerator,
    });
    if (this.records.has(duplicate.projectId)) {
      throw new ProjectRepositoryError(
        "unexpected-storage-error",
        "Generated project ID already exists",
      );
    }
    this.records.set(duplicate.projectId, asStoredRecord(duplicate));
    return structuredClone(duplicate);
  }
}
