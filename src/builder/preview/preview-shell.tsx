"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import type { RuntimeFormSubmission } from "@/builder/forms/form-values";
import { useRuntimeViewport } from "@/builder/rendering/runtime-viewport";
import {
  createBuilderStore,
  type BuilderStoreState,
} from "@/builder/store/builder-store";
import { editorStore } from "@/builder/store/editor-store";
import { takePreviewSnapshot } from "@/builder/preview/preview-snapshot";

type PreviewShellProps = {
  snapshotId?: string | null;
  store?: StoreApi<BuilderStoreState>;
};

export function PreviewShell({ snapshotId = null, store }: PreviewShellProps) {
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
  const projectId = document?.projectId ?? null;
  const pageId = page?.id ?? null;
  const submitForm = useCallback(
    async (submission: RuntimeFormSubmission) => {
      if (!projectId || !pageId) {
        throw new Error("The preview submission context is unavailable");
      }

      if (process.env.NODE_ENV !== "production") {
        console.log("Form submission values:", submission.values);
      }

      const response = await fetch("/api/form-submissions", {
        body: JSON.stringify({
          projectId,
          pageId,
          ...submission,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("The form submission was rejected");
      }
    },
    [pageId, projectId],
  );

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
        snapshot = takePreviewSnapshot(window.localStorage, snapshotId);
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
  }, [previewStore, snapshotId]);

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
        runtime={{ mode: "preview", submitForm }}
        viewport={viewport}
      />
    </div>
  );
}
