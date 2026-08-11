import Link from "next/link";
import type { MouseEvent } from "react";

import type { PageId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";
import type { Viewport } from "@/builder/styles/types";

type EditorToolbarProps = {
  projectName: string;
  pages: readonly PageDocument[];
  activePageId: PageId;
  activeViewport: Viewport;
  dirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  previewHref: string;
  onPageChange: (pageId: PageId) => void;
  onViewportChange: (viewport: Viewport) => void;
  onUndo: () => void;
  onRedo: () => void;
  onPreviewOpen: (event: MouseEvent<HTMLAnchorElement>) => void;
};

const VIEWPORTS: readonly { value: Viewport; label: string }[] = [
  { value: "desktop", label: "Desktop" },
  { value: "tablet", label: "Tablet" },
  { value: "mobile", label: "Mobile" },
];

export function EditorToolbar({
  projectName,
  pages,
  activePageId,
  activeViewport,
  dirty,
  canUndo,
  canRedo,
  previewHref,
  onPageChange,
  onViewportChange,
  onUndo,
  onRedo,
  onPreviewOpen,
}: EditorToolbarProps) {
  return (
    <header className="editor-toolbar">
      <div className="editor-brand">
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
        <div className={dirty ? "save-indicator dirty" : "save-indicator"}>
          <span aria-hidden="true" />
          {dirty ? "Unsaved changes" : "All changes local"}
        </div>
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
