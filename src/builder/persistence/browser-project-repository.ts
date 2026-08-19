import { IndexedDbProjectRepository } from "./indexeddb-project-repository";
import type {
  ProjectLoadResult,
  ProjectListInput,
  ProjectListResult,
  ProjectRepository,
  SaveProjectInput,
  SaveProjectReceipt,
} from "./project-repository";
import type { ProjectDocument } from "@/builder/model/project-document";

let browserRepository: ProjectRepository | null = null;

class LazyBrowserProjectRepository implements ProjectRepository {
  private repository: IndexedDbProjectRepository | null = null;

  private resolve(): IndexedDbProjectRepository {
    this.repository ??= new IndexedDbProjectRepository();
    return this.repository;
  }

  async list(input?: ProjectListInput): Promise<ProjectListResult> {
    return this.resolve().list(input);
  }

  async create(input: { name: string }): Promise<ProjectDocument> {
    return this.resolve().create(input);
  }

  async load(projectId: string): Promise<ProjectLoadResult> {
    return this.resolve().load(projectId);
  }

  async save(
    projectId: string,
    input: SaveProjectInput,
  ): Promise<SaveProjectReceipt> {
    return this.resolve().save(projectId, input);
  }

  async rename(
    projectId: string,
    input: { name: string; expectedRevision: number },
  ): Promise<SaveProjectReceipt> {
    return this.resolve().rename(projectId, input);
  }

  async duplicate(
    projectId: string,
    input?: { name?: string },
  ): Promise<ProjectDocument> {
    return this.resolve().duplicate(projectId, input);
  }
}

export function getBrowserProjectRepository(): ProjectRepository {
  browserRepository ??= new LazyBrowserProjectRepository();
  return browserRepository;
}
