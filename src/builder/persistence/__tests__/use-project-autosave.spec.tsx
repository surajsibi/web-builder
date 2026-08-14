import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoreApi } from "zustand/vanilla";

import {
  ProjectRepositoryError,
  type ProjectRepository,
  type SaveProjectReceipt,
} from "@/builder/persistence/project-repository";
import {
  PROJECT_AUTOSAVE_DELAY_MS,
  useProjectAutosave,
} from "@/builder/persistence/use-project-autosave";
import {
  createBuilderStore,
  type BuilderStoreState,
} from "@/builder/store/builder-store";
import { MemoryProjectRepository } from "@/builder/testing/memory-project-repository";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function createRepository() {
  let id = 0;
  let minute = 0;
  return new MemoryProjectRepository({
    idGenerator: (prefix) => `${prefix}-${++id}`,
    now: () => `2026-08-14T10:${String(minute++).padStart(2, "0")}:00.000Z`,
  });
}

function AutosaveHarness({
  repository,
  store,
}: {
  repository: ProjectRepository;
  store: StoreApi<BuilderStoreState>;
}) {
  const { persistenceMessage, persistenceStatus, saveNow } = useProjectAutosave(
    store,
    repository,
  );
  return (
    <div>
      <span>{persistenceStatus}</span>
      {persistenceMessage ? <p>{persistenceMessage}</p> : null}
      <button onClick={() => void saveNow()} type="button">Save now</button>
    </div>
  );
}

describe("useProjectAutosave", () => {
  it("should save a dirty project after the debounce interval", async () => {
    vi.useFakeTimers();
    const repository = createRepository();
    const project = await repository.create({ name: "Commerce Site" });
    const store = createBuilderStore({ initialDocument: project });
    render(<AutosaveHarness repository={repository} store={store} />);

    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: project.homePageId,
        name: "Storefront",
      });
    });
    expect(screen.getByText("dirty")).toBeVisible();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(PROJECT_AUTOSAVE_DELAY_MS);
    });

    expect(screen.getByText("saved")).toBeVisible();
    expect(store.getState()).toMatchObject({ dirty: false });
    await expect(repository.load(project.projectId)).resolves.toMatchObject({
      document: {
        pages: {
          [project.homePageId]: expect.objectContaining({ name: "Storefront" }),
        },
        revision: 1,
      },
    });
  });

  it("should expose a storage failure without claiming the edit was saved", async () => {
    vi.useFakeTimers();
    class FailingRepository extends MemoryProjectRepository {
      override async save(): Promise<SaveProjectReceipt> {
        throw new ProjectRepositoryError(
          "storage-unavailable",
          "Synthetic storage failure",
        );
      }
    }
    const repository = new FailingRepository({
      idGenerator: (prefix) => `${prefix}-failure`,
      now: () => "2026-08-14T10:00:00.000Z",
    });
    const project = await repository.create({ name: "Commerce Site" });
    const store = createBuilderStore({ initialDocument: project });
    render(<AutosaveHarness repository={repository} store={store} />);
    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: project.homePageId,
        name: "Unsaved Storefront",
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save now" }));
      await Promise.resolve();
    });

    expect(screen.getByText("error")).toBeVisible();
    expect(
      screen.getByText(
        "Changes could not be saved because browser storage is unavailable.",
      ),
    ).toBeVisible();
    expect(store.getState().dirty).toBe(true);
  });

  it("should stop automatic writes after a revision conflict", async () => {
    vi.useFakeTimers();
    const repository = createRepository();
    const project = await repository.create({ name: "Commerce Site" });
    const store = createBuilderStore({ initialDocument: project });
    await repository.rename(project.projectId, {
      name: "Changed elsewhere",
      expectedRevision: 0,
    });
    render(<AutosaveHarness repository={repository} store={store} />);
    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: project.homePageId,
        name: "Local edit",
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Save now" }));
      await Promise.resolve();
    });
    expect(screen.getByText("conflict")).toBeVisible();

    act(() => {
      store.getState().dispatchEditorCommand({
        kind: "page.rename",
        pageId: project.homePageId,
        name: "Another local edit",
      });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PROJECT_AUTOSAVE_DELAY_MS * 2);
    });

    expect(store.getState().persistenceStatus).toBe("conflict");
    await expect(repository.load(project.projectId)).resolves.toMatchObject({
      document: {
        name: "Changed elsewhere",
        revision: 1,
      },
    });
  });
});
