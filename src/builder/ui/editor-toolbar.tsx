import Link from "next/link";
import type { MouseEvent } from "react";

import type { PageId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { Viewport } from "@/builder/styles/types";
import type { ProjectPersistenceStatus } from "@/builder/store/builder-store";

type EditorToolbarProps = {
  projectName: string;
  pages: readonly PageDocument[];
  activePageId: PageId;
  activeViewport: Viewport;
  dirty: boolean;
  persistenceStatus: ProjectPersistenceStatus;
  persistenceMessage: string | null;
  canUndo: boolean;
  canRedo: boolean;
  previewHref: string;
  onPageChange: (pageId: PageId) => void;
  onViewportChange: (viewport: Viewport) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
  onDashboard?: () => void;
  onSaveNow?: () => void;
};

const VIEWPORTS: readonly { value: Viewport; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

const SAVE_STATUS_LABEL: Record<ProjectPersistenceStatus, string> = {
  saved: "Saved locally",
  dirty: "Unsaved changes",
  saving: "Saving...",
  error: "Save failed",
  conflict: "Save conflict",
};

export function EditorToolbar({
  projectName,
  pages,
  activePageId,
  activeViewport,
  dirty,
  persistenceStatus,
  persistenceMessage,
  canUndo,
  canRedo,
  previewHref,
  onPageChange,
  onViewportChange,
  onUndo,
  onRedo,
  onPreviewOpen,
  onDashboard,
  onSaveNow,
}: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="editor-brand">
        {onDashboard ? (
          <button
            aria-label="Return to Projects"
            className="toolbar-dashboard-button"
            onClick={onDashboard}
            type="button"
          >
            {"\u2190"}
          </button>
        ) : null}
        <span aria-hidden="true" className="editor-brand-mark">
          C
        </span>
        <div>
          <strong>Canvas Studio</strong>
          <span>{projectName}</span>
        </div>
      </div>

      <label className="toolbar-page-select">
        <span>Page</span>
        <select
          aria-label="Active page"
          onChange={(event) => onPageChange(event.currentTarget.value as PageId)}
          value={activePageId}
        >
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.name}
            </option>
          ))}
        </select>
      </label>

      <div aria-label="History controls" className="toolbar-history">
        <button disabled={!canUndo} onClick={onUndo} type="button">
          Undo
        </button>
        <button disabled={!canRedo} onClick={onRedo} type="button">
          Redo
        </button>
      </div>

      <div aria-label="Responsive viewport" className="viewport-switcher">
        {VIEWPORTS.map((viewport) => (
          <button
            aria-pressed={activeViewport === viewport.value}
            key={viewport.value}
            onClick={() => onViewportChange(viewport.value)}
            type="button"
          >
            {viewport.label}
          </button>
        ))}
      </div>

      <div className="toolbar-status-actions">
        <div
          aria-atomic="true"
          aria-live="polite"
          className="toolbar-persistence-status"
          role={persistenceMessage ? "status" : undefined}
        >
          <div className={`save-indicator ${persistenceStatus}`}>
            <span aria-hidden="true" />
            {SAVE_STATUS_LABEL[persistenceStatus]}
          </div>
          {persistenceMessage ? (
            <p className="toolbar-persistence-message">
              {persistenceMessage}
            </p>
          ) : null}
        </div>
        {onSaveNow ? (
          <button
            className="toolbar-save-button"
            disabled={!dirty || persistenceStatus === "saving" || persistenceStatus === "conflict"}
            onClick={onSaveNow}
            type="button"
          >
            Save now
          </button>
        ) : null}
        <Link
          className="toolbar-preview-link"
          href={previewHref}
          onAuxClick={onPreviewOpen}
          onClick={onPreviewOpen}
          onContextMenu={onPreviewOpen}
          rel="noopener noreferrer"
          target="_blank"
        >
          Preview
        </Link>
      </div>
    </header>
  );
}
