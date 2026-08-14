"use client";

import { useCallback, useEffect, useRef } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import {
  projectContent,
  ProjectRepositoryError,
  type ProjectRepository,
} from "@/builder/persistence/project-repository";
import type { BuilderStoreState } from "@/builder/store/builder-store";

export const PROJECT_AUTOSAVE_DELAY_MS = 750;

function saveError(error: unknown): {
  status: "error" | "conflict";
  message: string;
} {
  if (error instanceof ProjectRepositoryError) {
    if (error.code === "revision-conflict") {
      return {
        status: "conflict",
        message:
          "This project changed in another editor. Reload it or return to Projects before making more changes.",
      };
    }
    if (error.code === "storage-unavailable") {
      return {
        status: "error",
        message:
          "Changes could not be saved because browser storage is unavailable.",
      };
    }
  }
  return {
    status: "error",
    message: "Changes could not be saved. Try Save now again.",
  };
}

export function useProjectAutosave(
  store: StoreApi<BuilderStoreState>,
  repository: ProjectRepository,
) {
  const persistenceStatus = useStore(
    store,
    (state) => state.persistenceStatus,
  );
  const persistenceMessage = useStore(
    store,
    (state) => state.persistenceMessage,
  );
  const commitId = useStore(store, (state) => state.commitId);
  const savePromise = useRef<Promise<boolean> | null>(null);

  const saveNow = useCallback((): Promise<boolean> => {
    if (savePromise.current) return savePromise.current;

    const operation = (async () => {
      while (true) {
        const state = store.getState();
        if (!state.document) return false;
        if (state.persistenceStatus === "conflict") return false;
        if (!state.dirty) return true;

        const document = state.document;
        const capturedCommitId = state.commitId;
        state.markSaveStarted();
        try {
          const receipt = await repository.save(document.projectId, {
            expectedRevision: document.revision,
            content: projectContent(document),
          });
          store.getState().markSaveSucceeded({ capturedCommitId, receipt });
        } catch (error) {
          store.getState().markSaveFailed(saveError(error));
          return false;
        }
      }
    })();
    const tracked: Promise<boolean> = operation.finally(() => {
      if (savePromise.current === tracked) savePromise.current = null;
    });
    savePromise.current = tracked;
    return tracked;
  }, [repository, store]);

  useEffect(() => {
    if (persistenceStatus !== "dirty") return;
    const timer = window.setTimeout(() => {
      void saveNow();
    }, PROJECT_AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [commitId, persistenceStatus, saveNow]);

  useEffect(() => {
    if (persistenceStatus === "saved") return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [persistenceStatus]);

  return { persistenceMessage, persistenceStatus, saveNow };
}
