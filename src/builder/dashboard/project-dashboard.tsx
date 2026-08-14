"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getBrowserProjectRepository } from "@/builder/persistence/browser-project-repository";
import {
  MAX_PROJECT_NAME_LENGTH,
  ProjectRepositoryError,
  type ProjectListItem,
  type ProjectRepository,
  type ProjectSummary,
  type UnavailableProjectSummary,
} from "@/builder/persistence/project-repository";

type ProjectDashboardProps = {
  repository?: ProjectRepository;
  onOpenProject?: (projectId: string) => void;
};

type NameDialogState =
  | { mode: "create" }
  | { mode: "rename"; project: ProjectSummary };

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function formatSavedAt(value: string | null): string {
  if (value === null) return "Last saved time unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Last saved time unavailable";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function errorMessage(error: unknown): string {
  if (error instanceof ProjectRepositoryError) {
    if (error.code === "storage-unavailable") {
      return "Local project storage is unavailable. Check this browser's storage permissions and try again.";
    }
    if (error.code === "revision-conflict") {
      return "This project changed in another editor. Refresh the dashboard before trying again.";
    }
    if (error.code === "invalid-request") return error.message;
  }
  return "Canvas Studio could not complete that project action. Please try again.";
}

function recoveryExplanation(reason: UnavailableProjectSummary["reason"]): string {
  return reason === "unsupported-version"
    ? "This project was created with a version of Canvas Studio that this build cannot open."
    : "This project's saved data is damaged or incomplete and cannot be opened safely.";
}

function useDashboardDialog(onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute("hidden"));
      const first = focusable.at(0);
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return dialogRef;
}

function ProjectNameDialog({
  state,
  pending,
  error,
  onCancel,
  onSubmit,
}: {
  state: NameDialogState;
  pending: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}) {
  const dialogRef = useDashboardDialog(onCancel);
  const [name, setName] = useState(
    state.mode === "rename" ? state.project.name : "",
  );
  const title = state.mode === "create" ? "Create a new project" : "Rename project";

  return (
    <div className="dashboard-dialog-backdrop" role="presentation">
      <section
        aria-describedby="project-name-dialog-description"
        aria-labelledby="project-name-dialog-title"
        aria-modal="true"
        className="dashboard-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="dashboard-dialog-mark" aria-hidden="true">
          {state.mode === "create" ? "+" : "Aa"}
        </div>
        <h2 id="project-name-dialog-title">{title}</h2>
        <p id="project-name-dialog-description">
          {state.mode === "create"
            ? "Start with a blank responsive page. You can add sections and content in the builder."
            : "Choose a clear name so this project is easy to find later."}
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(name);
          }}
        >
          <label htmlFor="project-name">Project name</label>
          <input
            autoFocus
            disabled={pending}
            id="project-name"
            maxLength={MAX_PROJECT_NAME_LENGTH}
            onChange={(event) => setName(event.target.value)}
            placeholder="My online store"
            required
            value={name}
          />
          <div className="dashboard-field-hint">
            <span>Use a name you will recognize.</span>
            <span>{name.length}/{MAX_PROJECT_NAME_LENGTH}</span>
          </div>
          {error ? <p className="dashboard-dialog-error" role="alert">{error}</p> : null}
          <div className="dashboard-dialog-actions">
            <button
              className="dashboard-button secondary"
              disabled={pending}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button className="dashboard-button primary" disabled={pending} type="submit">
              {pending
                ? state.mode === "create" ? "Creating…" : "Saving…"
                : state.mode === "create" ? "Create project" : "Save name"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function RecoveryDialog({
  project,
  onClose,
}: {
  project: UnavailableProjectSummary;
  onClose: () => void;
}) {
  const dialogRef = useDashboardDialog(onClose);
  return (
    <div className="dashboard-dialog-backdrop" role="presentation">
      <section
        aria-describedby="recovery-dialog-description"
        aria-labelledby="recovery-dialog-title"
        aria-modal="true"
        className="dashboard-dialog recovery-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="dashboard-dialog-mark warning" aria-hidden="true">!</div>
        <span className="recovery-badge">Needs recovery</span>
        <h2 id="recovery-dialog-title">{project.displayName}</h2>
        <p id="recovery-dialog-description">
          {recoveryExplanation(project.reason)}
        </p>
        <div className="recovery-preservation-note">
          <strong>Your original browser record remains unchanged.</strong>
          <span>
            Normal editing and autosave are disabled so Canvas Studio does not
            overwrite it. A guided recovery tool will be added in a future update.
          </span>
        </div>
        <p className="dashboard-dialog-meta">
          Stored on this browser
          {project.lastKnownUpdatedAt
            ? ` · Last known update ${formatSavedAt(project.lastKnownUpdatedAt)}`
            : ""}
        </p>
        <div className="dashboard-dialog-actions">
          <button className="dashboard-button primary" autoFocus onClick={onClose} type="button">
            Close details
          </button>
        </div>
      </section>
    </div>
  );
}

export function ProjectDashboard({
  repository: providedRepository,
  onOpenProject,
}: ProjectDashboardProps) {
  const router = useRouter();
  const repository = useMemo(
    () => providedRepository ?? getBrowserProjectRepository(),
    [providedRepository],
  );
  const [items, setItems] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [nameDialog, setNameDialog] = useState<NameDialogState | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [recoveryProject, setRecoveryProject] =
    useState<UnavailableProjectSummary | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await repository.list({ limit: 100 });
      setItems(result.items);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    repository
      .list({ limit: 100 })
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repository]);

  const readyCount = items.filter((item) => item.availability === "ready").length;
  const unavailableCount = items.length - readyCount;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleItems = normalizedQuery
    ? items.filter((item) => {
        const name = item.availability === "ready"
          ? item.summary.name
          : item.summary.displayName;
        return name.toLocaleLowerCase().includes(normalizedQuery);
      })
    : items;

  const openProject = (projectId: string) => {
    if (onOpenProject) onOpenProject(projectId);
    else router.push(`/projects/${encodeURIComponent(projectId)}`);
  };

  const rememberTrigger = () => {
    dialogTrigger.current = document.activeElement as HTMLElement | null;
  };

  const closeDialog = () => {
    setNameDialog(null);
    setRecoveryProject(null);
    setDialogError(null);
    requestAnimationFrame(() => dialogTrigger.current?.focus());
  };

  const submitName = async (name: string) => {
    if (!nameDialog) return;
    const actionKey = nameDialog.mode;
    setPendingAction(actionKey);
    setDialogError(null);
    try {
      if (nameDialog.mode === "create") {
        const project = await repository.create({ name });
        setNameDialog(null);
        openProject(project.projectId);
        return;
      }
      await repository.rename(nameDialog.project.projectId, {
        name,
        expectedRevision: nameDialog.project.revision,
      });
      setNameDialog(null);
      setAnnouncement(`Renamed project to ${name.trim()}.`);
      await loadProjects();
    } catch (error) {
      setDialogError(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  const duplicateProject = async (project: ProjectSummary) => {
    const actionKey = `duplicate:${project.projectId}`;
    setPendingAction(actionKey);
    setAnnouncement(null);
    try {
      const duplicate = await repository.duplicate(project.projectId);
      openProject(duplicate.projectId);
    } catch (error) {
      setAnnouncement(errorMessage(error));
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="project-dashboard">
      <header className="dashboard-topbar">
        <div className="dashboard-brand">
          <span className="dashboard-brand-mark" aria-hidden="true">C</span>
          <span>
            <strong>Canvas Studio</strong>
            <small>Website builder</small>
          </span>
        </div>
        <div className="dashboard-storage-pill">
          <span aria-hidden="true" /> Local workspace
        </div>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <div>
            <p className="dashboard-eyebrow">Your workspace</p>
            <h1 id="dashboard-title">Build something remarkable.</h1>
            <p>
              Create, manage, and reopen your websites. Projects stay private in
              this browser while you build.
            </p>
          </div>
          <button
            className="dashboard-button primary new-project-button"
            onClick={() => {
              rememberTrigger();
              setDialogError(null);
              setNameDialog({ mode: "create" });
            }}
            type="button"
          >
            <span aria-hidden="true">+</span> New project
          </button>
        </section>

        <section className="dashboard-projects" aria-labelledby="projects-heading">
          <div className="dashboard-section-header">
            <div>
              <h2 id="projects-heading">Projects</h2>
              {!loading && !loadError ? (
                <p>
                  {plural(items.length, "local project")}
                  {unavailableCount > 0
                    ? `, ${plural(unavailableCount, "needs recovery", "need recovery")}`
                    : ""}
                </p>
              ) : null}
            </div>
            {items.length > 0 ? (
              <label className="dashboard-search">
                <span className="sr-only">Search projects</span>
                <span aria-hidden="true">⌕</span>
                <input
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search projects"
                  type="search"
                  value={query}
                />
              </label>
            ) : null}
          </div>

          <p aria-live="polite" className="sr-only">
            {announcement}
          </p>

          {loading ? (
            <div className="dashboard-state-card" role="status">
              <span className="dashboard-loader" aria-hidden="true" />
              <h3>Loading your projects</h3>
              <p>Reading this browser&apos;s local workspace…</p>
            </div>
          ) : null}

          {!loading && loadError ? (
            <div className="dashboard-state-card error-state" role="alert">
              <span className="dashboard-state-icon" aria-hidden="true">!</span>
              <h3>Storage unavailable</h3>
              <p>{loadError}</p>
              <button className="dashboard-button secondary" onClick={loadProjects} type="button">
                Try again
              </button>
            </div>
          ) : null}

          {!loading && !loadError && items.length === 0 ? (
            <div className="dashboard-state-card empty-state">
              <span className="dashboard-empty-illustration" aria-hidden="true">
                <i />
              </span>
              <h3>Your first project starts here</h3>
              <p>Create a blank website, then shape every page in the visual builder.</p>
              <button
                className="dashboard-button primary"
                onClick={() => {
                  rememberTrigger();
                  setNameDialog({ mode: "create" });
                }}
                type="button"
              >
                Create your first project
              </button>
            </div>
          ) : null}

          {!loading && !loadError && items.length > 0 && visibleItems.length === 0 ? (
            <div className="dashboard-state-card compact-state">
              <h3>No matching projects</h3>
              <p>Try a different project name.</p>
            </div>
          ) : null}

          {!loading && !loadError && visibleItems.length > 0 ? (
            <div className="project-card-grid">
              {visibleItems.map((item) => {
                if (item.availability === "unavailable") {
                  const project = item.summary;
                  return (
                    <article className="project-card unavailable" key={project.recoveryId}>
                      <div className="project-card-preview unavailable-preview" aria-hidden="true">
                        <span>!</span>
                      </div>
                      <div className="project-card-body">
                        <div className="project-card-title-row">
                          <h3>{project.displayName}</h3>
                          <span className="recovery-badge">Needs recovery</span>
                        </div>
                        <p className="project-recovery-copy">
                          {recoveryExplanation(project.reason)}
                        </p>
                        <p className="project-card-meta">
                          Stored on this browser
                          {project.lastKnownUpdatedAt
                            ? ` · ${formatSavedAt(project.lastKnownUpdatedAt)}`
                            : ""}
                        </p>
                        <div className="project-card-actions recovery-actions">
                          <button
                            className="dashboard-text-button"
                            onClick={() => {
                              rememberTrigger();
                              setRecoveryProject(project);
                            }}
                            type="button"
                          >
                            View recovery details
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }

                const project = item.summary;
                const duplicating = pendingAction === `duplicate:${project.projectId}`;
                return (
                  <article className="project-card" key={project.projectId}>
                    <button
                      aria-label={`Open ${project.name}`}
                      className="project-card-preview"
                      onClick={() => openProject(project.projectId)}
                      type="button"
                    >
                      <span className="project-preview-browser" aria-hidden="true">
                        <i /><i /><i />
                        <b>{project.name.slice(0, 1).toUpperCase()}</b>
                      </span>
                      <span className="project-preview-open">Open builder →</span>
                    </button>
                    <div className="project-card-body">
                      <div className="project-card-title-row">
                        <h3>{project.name}</h3>
                        <span className="ready-badge">Ready</span>
                      </div>
                      <p className="project-card-meta">
                        {plural(project.pageCount, "page")} · Saved on this browser
                      </p>
                      <p className="project-card-date">
                        Last saved <time dateTime={project.updatedAt}>{formatSavedAt(project.updatedAt)}</time>
                      </p>
                      <div className="project-card-actions">
                        <button
                          className="dashboard-text-button"
                          onClick={() => openProject(project.projectId)}
                          type="button"
                        >
                          Open
                        </button>
                        <button
                          className="dashboard-icon-button"
                          onClick={() => {
                            rememberTrigger();
                            setDialogError(null);
                            setNameDialog({ mode: "rename", project });
                          }}
                          type="button"
                        >
                          Rename
                        </button>
                        <button
                          className="dashboard-icon-button"
                          disabled={duplicating}
                          onClick={() => duplicateProject(project)}
                          type="button"
                        >
                          {duplicating ? "Duplicating…" : "Duplicate"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {announcement ? <p className="dashboard-announcement" role="status">{announcement}</p> : null}
        </section>
      </div>

      <footer className="dashboard-footer">
        <span>Canvas Studio</span>
        <span>Your projects are stored locally in this browser.</span>
      </footer>

      {nameDialog ? (
        <ProjectNameDialog
          error={dialogError}
          onCancel={closeDialog}
          onSubmit={submitName}
          pending={pendingAction === nameDialog.mode}
          state={nameDialog}
        />
      ) : null}
      {recoveryProject ? (
        <RecoveryDialog onClose={closeDialog} project={recoveryProject} />
      ) : null}
    </main>
  );
}
