import type { ProjectDocument } from "@/builder/model/project-document";
import { createNewProject } from "@/builder/project/factory";
import { duplicateProjectDocument } from "@/builder/project/duplicate";
import type { IdGenerator } from "@/builder/project/id-generator";

import {
  asStoredRecord,
  assertReadyPreparedStoredProject,
  buildSavedProject,
  createProjectPaginationState,
  defaultDuplicateProjectName,
  documentFromStoredRecord,
  normalizeProjectName,
  paginateProjectItems,
  prepareStoredProject,
  prepareUnavailableStoredProject,
  projectContent,
  type ProjectListInput,
  type ProjectListItem,
  type ProjectListResult,
  type ProjectLoadResult,
  type ProjectRepository,
  ProjectRepositoryError,
  type SaveProjectInput,
  type SaveProjectReceipt,
  type StoredProjectRecord,
} from "./project-repository";

export const PROJECT_DATABASE_NAME = "canvas-studio-projects";
export const PROJECT_DATABASE_VERSION = 1;
export const PROJECT_STORE_NAME = "projects";

type IndexedDbProjectRepositoryOptions = {
  indexedDB?: IDBFactory;
  databaseName?: string;
  now?: () => string;
  idGenerator?: IdGenerator;
};

function storageError(message: string, cause?: unknown): ProjectRepositoryError {
  return new ProjectRepositoryError("storage-unavailable", message, { cause });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), {
      once: true,
    });
    request.addEventListener(
      "error",
      () => reject(storageError("Browser project storage request failed", request.error)),
      { once: true },
    );
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "abort",
      () => reject(storageError("Browser project storage transaction aborted", transaction.error)),
      { once: true },
    );
    transaction.addEventListener(
      "error",
      () => reject(storageError("Browser project storage transaction failed", transaction.error)),
      { once: true },
    );
  });
}

function encodeIndexedDbKey(key: IDBValidKey): string {
  if (typeof key === "string") return `string:${JSON.stringify(key)}`;
  if (typeof key === "number") return `number:${String(key)}`;
  if (key instanceof Date) return `date:${key.toISOString()}`;
  if (Array.isArray(key)) {
    return `array:[${key.map((part) => encodeIndexedDbKey(part)).join(",")}]`;
  }
  const bytes = key instanceof ArrayBuffer
    ? new Uint8Array(key)
    : new Uint8Array(key.buffer, key.byteOffset, key.byteLength);
  return `binary:${Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("")}`;
}

function indexedDbRecoveryId(key: IDBValidKey): string {
  return `indexeddb-key:${encodeIndexedDbKey(key)}`;
}

function prepareIndexedDbStoredProject(
  storageKey: IDBValidKey,
  storedValue: unknown,
) {
  const rawDocument = documentFromStoredRecord(storedValue);
  if (typeof storageKey !== "string") {
    return prepareUnavailableStoredProject(
      indexedDbRecoveryId(storageKey),
      rawDocument,
      {
        stage: "document-schema",
        path: "storageKey",
        reason: "Stored project key must be a string",
      },
    );
  }

  const prepared = prepareStoredProject(storageKey, rawDocument);
  return prepared.availability === "ready"
    ? prepared
    : prepareUnavailableStoredProject(
        indexedDbRecoveryId(storageKey),
        rawDocument,
        prepared.error,
      );
}

function assertReadyIndexedDbStoredProject(
  storageKey: IDBValidKey,
  storedValue: unknown,
): ProjectLoadResult {
  return assertReadyPreparedStoredProject(
    prepareIndexedDbStoredProject(storageKey, storedValue),
  );
}

export class IndexedDbProjectRepository implements ProjectRepository {
  private readonly factory: IDBFactory;
  private readonly databaseName: string;
  private readonly now: () => string;
  private readonly idGenerator?: IdGenerator;
  private databasePromise: Promise<IDBDatabase> | null = null;
  private readonly paginationState = createProjectPaginationState();

  constructor(options: IndexedDbProjectRepositoryOptions = {}) {
    const factory = options.indexedDB ?? globalThis.indexedDB;
    if (!factory) {
      throw storageError("IndexedDB is unavailable in this browser");
    }
    this.factory = factory;
    this.databaseName = options.databaseName ?? PROJECT_DATABASE_NAME;
    this.now = options.now ?? (() => new Date().toISOString());
    this.idGenerator = options.idGenerator;
  }

  close(): void {
    void this.databasePromise?.then((database) => database.close());
    this.databasePromise = null;
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;

    const opening = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = this.factory.open(this.databaseName, PROJECT_DATABASE_VERSION);
      } catch (error) {
        reject(storageError("Browser project storage could not open", error));
        return;
      }
      request.addEventListener("upgradeneeded", () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(PROJECT_STORE_NAME)) {
          database.createObjectStore(PROJECT_STORE_NAME, {
            keyPath: "storageKey",
          });
        }
      });
      request.addEventListener("success", () => resolve(request.result), {
        once: true,
      });
      request.addEventListener(
        "blocked",
        () => reject(storageError("Browser project storage upgrade is blocked")),
        { once: true },
      );
      request.addEventListener(
        "error",
        () => reject(storageError("Browser project storage could not open", request.error)),
        { once: true },
      );
    }).catch((error: unknown) => {
      this.databasePromise = null;
      throw error;
    });
    this.databasePromise = opening;
    return opening;
  }

  private async readonlyStore(): Promise<IDBObjectStore> {
    const database = await this.openDatabase();
    return database.transaction(PROJECT_STORE_NAME, "readonly").objectStore(
      PROJECT_STORE_NAME,
    );
  }

  async list(input?: ProjectListInput): Promise<ProjectListResult> {
    const store = await this.readonlyStore();
    const items = await new Promise<ProjectListItem[]>((resolve, reject) => {
      const result: ProjectListItem[] = [];
      const request = store.openCursor();
      request.addEventListener("success", () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(result);
          return;
        }
        const storageKey = cursor.primaryKey;
        const prepared = prepareIndexedDbStoredProject(storageKey, cursor.value);
        result.push(
          prepared.availability === "ready"
            ? { availability: "ready", summary: prepared.summary }
            : { availability: "unavailable", summary: prepared.summary },
        );
        cursor.continue();
      });
      request.addEventListener(
        "error",
        () => reject(storageError("Browser projects could not be listed", request.error)),
        { once: true },
      );
    });
    return paginateProjectItems(items, input, this.paginationState);
  }

  async create(input: { name: string }): Promise<ProjectDocument> {
    const project = createNewProject({
      name: normalizeProjectName(input.name),
      now: this.now(),
      idGenerator: this.idGenerator,
    });
    await this.insertNewRecord(asStoredRecord(project));
    return structuredClone(project);
  }

  async load(projectId: string): Promise<ProjectLoadResult> {
    const store = await this.readonlyStore();
    const stored = await requestResult(store.get(projectId));
    if (stored === undefined) {
      throw new ProjectRepositoryError("not-found", "Project not found");
    }
    return assertReadyIndexedDbStoredProject(projectId, stored);
  }

  async save(
    projectId: string,
    input: SaveProjectInput,
  ): Promise<SaveProjectReceipt> {
    return this.mutateExisting(projectId, (current) => {
      const saved = buildSavedProject(current, input, this.now());
      return {
        document: saved,
        result: {
          projectId: saved.projectId,
          revision: saved.revision,
          updatedAt: saved.updatedAt,
        },
      };
    });
  }

  async rename(
    projectId: string,
    input: { name: string; expectedRevision: number },
  ): Promise<SaveProjectReceipt> {
    return this.mutateExisting(projectId, (current) => {
      const saved = buildSavedProject(
        current,
        {
          expectedRevision: input.expectedRevision,
          content: {
            ...projectContent(current),
            name: normalizeProjectName(input.name),
          },
        },
        this.now(),
      );
      return {
        document: saved,
        result: {
          projectId: saved.projectId,
          revision: saved.revision,
          updatedAt: saved.updatedAt,
        },
      };
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
    await this.insertNewRecord(asStoredRecord(duplicate));
    return structuredClone(duplicate);
  }

  private async insertNewRecord(record: StoredProjectRecord): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction(PROJECT_STORE_NAME, "readwrite");
    const done = transactionResult(transaction);
    try {
      transaction.objectStore(PROJECT_STORE_NAME).add(record);
      await done;
    } catch (error) {
      if (error instanceof ProjectRepositoryError) throw error;
      throw new ProjectRepositoryError(
        "unexpected-storage-error",
        "Project could not be created",
        { cause: error },
      );
    }
  }

  private async mutateExisting<T>(
    projectId: string,
    mutate: (current: ProjectDocument) => {
      document: ProjectDocument;
      result: T;
    },
  ): Promise<T> {
    const database = await this.openDatabase();
    const transaction = database.transaction(PROJECT_STORE_NAME, "readwrite");
    const store = transaction.objectStore(PROJECT_STORE_NAME);
    const done = transactionResult(transaction);
    try {
      const stored = await requestResult(store.get(projectId));
      if (stored === undefined) {
        throw new ProjectRepositoryError("not-found", "Project not found");
      }
      const { document: current } = assertReadyIndexedDbStoredProject(
        projectId,
        stored,
      );
      const next = mutate(current);
      await requestResult(store.put(asStoredRecord(next.document)));
      await done;
      return next.result;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The request may already have aborted or completed the transaction.
      }
      await done.catch(() => undefined);
      throw error;
    }
  }
}
