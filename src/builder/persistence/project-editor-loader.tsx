"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreApi } from "zustand/vanilla";

import { getBrowserProjectRepository } from "@/builder/persistence/browser-project-repository";
import {
  ProjectRepositoryError,
  type ProjectRepository,
  type UnavailableProjectSummary,
} from "@/builder/persistence/project-repository";
import { useProjectAutosave } from "@/builder/persistence/use-project-autosave";
import {
  createBuilderStore,
  type BuilderStoreState,
} from "@/builder/store/builder-store";
import { EditorShell } from "@/builder/ui/editor-shell";

type ProjectEditorLoaderProps = {
  projectId: string;
  repository?: ProjectRepository;
  onNavigateDashboard?: () => void;
};

type LoaderState =
  | { status: "loading" }
  | { status: "ready"; store: StoreApi<BuilderStoreState> }
  | {
      status: "error";
      kind: "not-found" | "unavailable" | "storage" | "unexpected";
      unavailableProject?: UnavailableProjectSummary;
    };

function unavailableExplanation(project: UnavailableProjectSummary): string {
  return project.reason === "unsupported-version"
    ? "This project was created with a version of Canvas Studio that this build cannot open."
    : "This project's saved data is damaged or incomplete and cannot be opened safely.";
}

function classifyLoadError(error: unknown): LoaderState {
  if (error instanceof ProjectRepositoryError) {
    if (
      (error.code === "invalid-project" || error.code === "unsupported-version") &&
      error.unavailableProject
    ) {
      return {
        status: "error",
        kind: "unavailable",
        unavailableProject: error.unavailableProject,
      };
    }
    if (error.code === "not-found") return { status: "error", kind: "not-found" };
    if (error.code === "storage-unavailable") {
      return { status: "error", kind: "storage" };
    }
  }
  return { status: "error", kind: "unexpected" };
}

function ProjectEditorBoundary({
  state,
  onDashboard,
  onRetry,
}: {
  state: Extract<LoaderState, { status: "error" }>;
  onDashboard: () => void;
  onRetry: () => void;
}) {
  const unavailable = state.unavailableProject;
  const title = unavailable?.displayName ??
    (state.kind === "not-found"
      ? "Project not found"
      : state.kind === "storage"
        ? "Storage unavailable"
        : "Project could not open");
  const explanation = unavailable
    ? unavailableExplanation(unavailable)
    : state.kind === "not-found"
      ? "This project is not stored in this browser, or it was removed outside Canvas Studio."
      : state.kind === "storage"
        ? "Canvas Studio cannot read local project storage. Check this browser's storage permissions and try again."
        : "Canvas Studio could not safely load this project. No project data was changed.";

  return (
    <main className="project-editor-boundary">
      <section aria-labelledby="editor-boundary-title" className="project-editor-boundary-card">
        <div className={unavailable ? "editor-boundary-icon warning" : "editor-boundary-icon"} aria-hidden="true">
          {unavailable ? "!" : "C"}
        </div>
        {unavailable ? <span className="recovery-badge">Needs recovery</span> : null}
        <h1 id="editor-boundary-title">{title}</h1>
        <p>{explanation}</p>
        {unavailable ? (
          <div className="recovery-preservation-note">
            <strong>Your original browser record remains unchanged.</strong>
            <span>
              Editing and autosave are disabled. A guided recovery tool will be
              added in a future update.
            </span>
          </div>
        ) : null}
        <div className="project-editor-boundary-actions">
          <button className="dashboard-button secondary" onClick={onDashboard} type="button">
            Return to Projects
          </button>
          {!unavailable && state.kind !== "not-found" ? (
            <button className="dashboard-button primary" onClick={onRetry} type="button">
              Try again
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function ReadyProjectEditor({
  repository,
  store,
  onDashboard,
}: {
  repository: ProjectRepository;
  store: StoreApi<BuilderStoreState>;
  onDashboard: () => void;
}) {
  const { saveNow } = useProjectAutosave(store, repository);

  const returnToDashboard = async () => {
    const state = store.getState();
    if (state.persistenceStatus === "conflict") {
      onDashboard();
      return;
    }
    if (state.dirty && !(await saveNow())) return;
    onDashboard();
  };

  return (
    <EditorShell
      onDashboard={() => void returnToDashboard()}
      onSaveNow={() => void saveNow()}
      store={store}
    />
  );
}

export function ProjectEditorLoader({
  projectId,
  repository: providedRepository,
  onNavigateDashboard,
}: ProjectEditorLoaderProps) {
  const router = useRouter();
  const repository = useMemo(
    () => providedRepository ?? getBrowserProjectRepository(),
    [providedRepository],
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<LoaderState>({ status: "loading" });
  const navigateDashboard = () => {
    if (onNavigateDashboard) onNavigateDashboard();
    else router.push("/");
  };

  useEffect(() => {
    let active = true;
    repository
      .load(projectId)
      .then(({ document, migrated }) => {
        if (active) {
          setState({
            status: "ready",
            store: createBuilderStore({
              initialDocument: document,
              initialPersistenceDirty: migrated,
            }),
          });
        }
      })
      .catch((error: unknown) => {
        if (active) setState(classifyLoadError(error));
      });
    return () => {
      active = false;
    };
  }, [projectId, reloadToken, repository]);

  if (state.status === "loading") {
    return (
      <main className="project-editor-boundary">
        <div className="project-editor-loading" role="status">
          <span className="dashboard-loader" aria-hidden="true" />
          <strong>Opening project</strong>
          <span>Validating the local project before editing…</span>
        </div>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <ProjectEditorBoundary
        onDashboard={navigateDashboard}
        onRetry={() => {
          setState({ status: "loading" });
          setReloadToken((value) => value + 1);
        }}
        state={state}
      />
    );
  }

  return (
    <ReadyProjectEditor
      onDashboard={navigateDashboard}
      repository={repository}
      store={state.store}
    />
  );
}
