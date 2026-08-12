"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import { useRuntimeViewport } from "@/builder/rendering/runtime-viewport";
import {
  createBuilderStore,
  type BuilderStoreState,
} from "@/builder/store/builder-store";
import { editorStore } from "@/builder/store/editor-store";
import {
  takePreviewSnapshot,
  type PreviewSnapshotReader,
} from "@/builder/preview/preview-snapshot";

type PreviewShellProps = {
  previewStorage?: PreviewSnapshotReader;
  snapshotId?: string | null;
  store?: StoreApi<BuilderStoreState>;
};

export function PreviewShell({
  previewStorage,
  snapshotId = null,
  store,
}: PreviewShellProps) {
  const [snapshotStore] = useState(() => createBuilderStore());
  const consumedSnapshotRef = useRef<{
    id: string;
    value: ReturnType<typeof takePreviewSnapshot>;
  } | null>(null);
  const previewStore = store ?? (snapshotId ? snapshotStore : editorStore);
  const [snapshotResult, setSnapshotResult] = useState<{
    id: string | null;
    status: "loading" | "ready" | "unavailable";
  }>({ id: snapshotId, status: snapshotId ? "loading" : "ready" });
  const snapshotStatus =
    snapshotResult.id === snapshotId
      ? snapshotResult.status
      : snapshotId
        ? "loading"
        : "ready";
  const document = useStore(previewStore, (state) => state.document);
  const activePageId = useStore(previewStore, (state) => state.activePageId);
  const viewport = useRuntimeViewport();
  const page = document && activePageId ? document.pages[activePageId] : null;

  useEffect(() => {
    if (!snapshotId) return;

    let canceled = false;
    const complete = (status: "ready" | "unavailable") => {
      queueMicrotask(() => {
        if (!canceled) setSnapshotResult({ id: snapshotId, status });
      });
    };

    let snapshot;
    if (consumedSnapshotRef.current?.id === snapshotId) {
      snapshot = consumedSnapshotRef.current.value;
    } else {
      try {
        snapshot = takePreviewSnapshot(
          previewStorage ?? window.localStorage,
          snapshotId,
        );
        consumedSnapshotRef.current = { id: snapshotId, value: snapshot };
      } catch {
        complete("unavailable");
        return () => {
          canceled = true;
        };
      }
    }

    if (!snapshot) {
      complete("unavailable");
      return () => {
        canceled = true;
      };
    }

    const hydration = previewStore
      .getState()
      .hydrateProject(snapshot.document, snapshot.activePageId);
    complete(hydration.success ? "ready" : "unavailable");
    return () => {
      canceled = true;
    };
  }, [previewStorage, previewStore, snapshotId]);

  if (snapshotStatus === "loading") {
    return (
      <main aria-busy="true" className="preview-unavailable">
        <div>
          <p>Preparing preview</p>
          <h1>Loading the current page…</h1>
        </div>
      </main>
    );
  }

  if (snapshotStatus === "unavailable" || !document || !page) {
    return (
      <main className="preview-unavailable">
        <div>
          <p>Preview unavailable</p>
          <h1>The current page could not be loaded.</h1>
          <Link href="/">Return to the editor</Link>
        </div>
      </main>
    );
  }

  return (
    <div
      aria-label={`${page.name} preview`}
      className="preview-runtime"
      data-preview-viewport={viewport}
    >
      <PageRenderingController
        page={page}
        runtime={{
          formSubmissionNotice:
            "Preview only: submissions are not saved or sent.",
          mode: "preview",
        }}
        viewport={viewport}
      />
    </div>
  );
}
