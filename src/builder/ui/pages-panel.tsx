import { useEffect, useRef, useState } from "react";

import type { PageId } from "@/builder/model/ids";
import type { ProjectDocument } from "@/builder/model/project-document";

type PagesPanelProps = {
  activePageId: PageId;
  document: Readonly<ProjectDocument>;
  onCreatePage: (name: string) => boolean;
  onDeletePage: (pageId: PageId) => boolean;
  onDuplicatePage: (pageId: PageId) => boolean;
  onRenamePage: (pageId: PageId, name: string) => boolean;
  onSelectPage: (pageId: PageId) => void;
  onSetHomePage: (pageId: PageId) => boolean;
};

export function PagesPanel({
  activePageId,
  document,
  onCreatePage,
  onDeletePage,
  onDuplicatePage,
  onRenamePage,
  onSelectPage,
  onSetHomePage,
}: PagesPanelProps) {
  const [creating, setCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [editingPageId, setEditingPageId] = useState<PageId | null>(null);
  const [renameName, setRenameName] = useState("");
  const [menuPageId, setMenuPageId] = useState<PageId | null>(null);
  const [deletingPageId, setDeletingPageId] = useState<PageId | null>(null);
  const actionButtonRefs = useRef(new Map<PageId, HTMLButtonElement>());
  const pageSelectButtonRefs = useRef(new Map<PageId, HTMLButtonElement>());
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCompletedRef = useRef(false);
  const deleteReturnFocusRef = useRef<PageId | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuReturnFocusRef = useRef<PageId | null>(null);
  const menuTabNavigationRef = useRef(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const renameReturnFocusRef = useRef<PageId | null>(null);
  const wasCreatingRef = useRef(false);
  const wasDeletingRef = useRef(false);

  useEffect(() => {
    if (creating) {
      wasCreatingRef.current = true;
      createInputRef.current?.focus();
    } else if (wasCreatingRef.current) {
      wasCreatingRef.current = false;
      createButtonRef.current?.focus();
    }
  }, [creating]);

  useEffect(() => {
    if (editingPageId) {
      renameInputRef.current?.focus();
    } else if (renameReturnFocusRef.current) {
      actionButtonRefs.current.get(renameReturnFocusRef.current)?.focus();
      renameReturnFocusRef.current = null;
    }
  }, [editingPageId]);

  useEffect(() => {
    if (menuPageId) {
      const firstMenuItem = menuRef.current?.querySelector<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      );
      firstMenuItem?.focus();
    } else if (menuReturnFocusRef.current) {
      actionButtonRefs.current.get(menuReturnFocusRef.current)?.focus();
      menuReturnFocusRef.current = null;
    }
  }, [menuPageId]);

  useEffect(() => {
    if (deletingPageId) {
      wasDeletingRef.current = true;
      deleteButtonRef.current?.focus();
    } else if (wasDeletingRef.current) {
      wasDeletingRef.current = false;
      if (deleteCompletedRef.current) {
        pageSelectButtonRefs.current.get(activePageId)?.focus();
      } else if (deleteReturnFocusRef.current) {
        actionButtonRefs.current.get(deleteReturnFocusRef.current)?.focus();
      }
      deleteCompletedRef.current = false;
      deleteReturnFocusRef.current = null;
    }
  }, [activePageId, deletingPageId]);

  const cancelCreate = () => {
    setCreating(false);
    setCreateName("");
  };

  const cancelRename = () => {
    setEditingPageId(null);
    setRenameName("");
  };

  const closeMenuAndRestoreFocus = (pageId: PageId) => {
    menuReturnFocusRef.current = pageId;
    setMenuPageId(null);
  };

  const cancelDelete = () => {
    deleteCompletedRef.current = false;
    setDeletingPageId(null);
  };

  const handleMenuKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    pageId: PageId,
  ) => {
    if (event.key === "Tab") {
      menuTabNavigationRef.current = true;
      return;
    }

    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitem"]:not(:disabled)',
      ),
    );
    const currentIndex = items.indexOf(
      event.currentTarget.ownerDocument.activeElement as HTMLButtonElement,
    );
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        currentIndex < 0
          ? items.length - 1
          : (currentIndex - 1 + items.length) % items.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = items.length - 1;
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeMenuAndRestoreFocus(pageId);
      return;
    }

    if (nextIndex !== null && items[nextIndex]) {
      event.preventDefault();
      items[nextIndex].focus();
    }
  };

  const deletingPage = deletingPageId
    ? document.pages[deletingPageId]
    : undefined;

  return (
    <section aria-labelledby="pages-panel-title" className="pages-panel">
      <header className="pages-panel-header">
        <div className="panel-heading">
          <div>
            <p className="panel-eyebrow">Manage</p>
            <h2 id="pages-panel-title">Website pages</h2>
          </div>
          <span className="panel-count">
            {document.pageOrder.length} {document.pageOrder.length === 1 ? "page" : "pages"}
          </span>
        </div>
        <p className="panel-intro">
          Create and manage the pages saved inside this project.
        </p>

        {creating ? (
          <form
            className="page-create-form"
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                cancelCreate();
              }
            }}
            onSubmit={(event) => {
              event.preventDefault();
              const name = createName.trim();
              if (name !== "" && onCreatePage(name)) cancelCreate();
            }}
          >
            <label htmlFor="new-page-name">Page name</label>
            <input
              id="new-page-name"
              onChange={(event) => setCreateName(event.currentTarget.value)}
              placeholder="e.g. Portfolio"
              ref={createInputRef}
              value={createName}
            />
            <div className="page-form-actions">
              <button disabled={createName.trim() === ""} type="submit">
                Create
              </button>
              <button className="is-secondary" onClick={cancelCreate} type="button">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            aria-label="Create new page"
            className="page-create-button"
            onClick={() => setCreating(true)}
            ref={createButtonRef}
            type="button"
          >
            <span aria-hidden="true">+</span>
            <span>
              <strong>Create new page</strong>
              <small>Add another canvas to this project</small>
            </span>
          </button>
        )}
      </header>

      <div className="pages-panel-list-heading">
        <span>Pages in this project</span>
        <span>{document.pageOrder.length}</span>
      </div>

      <div aria-label="Pages in this project" className="page-list" role="list">
        {document.pageOrder.map((pageId) => {
          const page = document.pages[pageId];
          const isHome = pageId === document.homePageId;
          const isActive = pageId === activePageId;
          const containsLockedNode = Object.values(page.nodes).some(
            (node) => node.meta.locked,
          );
          const deleteDisabled =
            isHome || document.pageOrder.length === 1 || containsLockedNode;
          const deleteReason = isHome
            ? "The home page cannot be deleted"
            : document.pageOrder.length === 1
              ? "The last page cannot be deleted"
              : containsLockedNode
                ? "Unlock this page's components before deleting it"
                : undefined;

          return (
            <div
              className={`page-list-item${isActive ? " is-active" : ""}`}
              key={page.id}
              role="listitem"
            >
              {editingPageId === page.id ? (
                <form
                  className="page-rename-form"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      event.preventDefault();
                      event.stopPropagation();
                      cancelRename();
                    }
                  }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    const name = renameName.trim();
                    if (name !== "" && onRenamePage(page.id, name)) cancelRename();
                  }}
                >
                  <label htmlFor={`rename-${page.id}`}>Rename {page.name}</label>
                  <input
                    aria-label={`Rename ${page.name}`}
                    id={`rename-${page.id}`}
                    onChange={(event) => setRenameName(event.currentTarget.value)}
                    ref={renameInputRef}
                    value={renameName}
                  />
                  <div className="page-form-actions">
                    <button disabled={renameName.trim() === ""} type="submit">
                      Save
                    </button>
                    <button className="is-secondary" onClick={cancelRename} type="button">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button
                    aria-current={isActive ? "page" : undefined}
                    aria-label={`Open ${page.name} page`}
                    className="page-list-select"
                    onClick={() => {
                      setMenuPageId(null);
                      onSelectPage(page.id);
                    }}
                    ref={(button) => {
                      if (button) pageSelectButtonRefs.current.set(page.id, button);
                      else pageSelectButtonRefs.current.delete(page.id);
                    }}
                    type="button"
                  >
                    <span aria-hidden="true" className="page-list-icon">
                      <svg viewBox="0 0 24 24">
                        <path d="M6 3.5h9l3 3V20.5H6z" />
                        <path d="M15 3.5v3h3M9 11h6M9 15h6" />
                      </svg>
                    </span>
                    <span className="page-list-copy">
                      <span>
                        <strong>{page.name}</strong>
                        {isHome ? <span className="page-home-badge">Home</span> : null}
                      </span>
                      <small>{page.slug}</small>
                    </span>
                  </button>

                  <div className="page-actions">
                    <button
                      aria-controls={`page-actions-${page.id}`}
                      aria-expanded={menuPageId === page.id}
                      aria-haspopup="menu"
                      aria-label={`Actions for ${page.name}`}
                      className="page-actions-toggle"
                      onClick={() => {
                        menuReturnFocusRef.current = null;
                        setMenuPageId((current) =>
                          current === page.id ? null : page.id,
                        );
                      }}
                      onPointerDown={() => {
                        if (menuPageId === page.id) {
                          menuTabNavigationRef.current = false;
                        }
                      }}
                      ref={(button) => {
                        if (button) actionButtonRefs.current.set(page.id, button);
                        else actionButtonRefs.current.delete(page.id);
                      }}
                      type="button"
                    >
                      <span aria-hidden="true">...</span>
                    </button>
                    {menuPageId === page.id ? (
                      <div
                        aria-label={`${page.name} page actions`}
                        className="page-actions-menu"
                        id={`page-actions-${page.id}`}
                        onBlur={(event) => {
                          const nextTarget = event.relatedTarget;
                          const movedToOwnToggle =
                            nextTarget === actionButtonRefs.current.get(page.id);
                          const movedWithTab = menuTabNavigationRef.current;
                          menuTabNavigationRef.current = false;
                          if (
                            (!(nextTarget instanceof Node) ||
                              !event.currentTarget.contains(nextTarget)) &&
                            (!movedToOwnToggle || movedWithTab)
                          ) {
                            setMenuPageId(null);
                          }
                        }}
                        onKeyDown={(event) => handleMenuKeyDown(event, page.id)}
                        ref={menuRef}
                        role="menu"
                      >
                        <button
                          onClick={() => {
                            renameReturnFocusRef.current = page.id;
                            setEditingPageId(page.id);
                            setRenameName(page.name);
                            setMenuPageId(null);
                          }}
                          role="menuitem"
                          tabIndex={-1}
                          type="button"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => {
                            if (onDuplicatePage(page.id)) {
                              closeMenuAndRestoreFocus(page.id);
                            }
                          }}
                          role="menuitem"
                          tabIndex={-1}
                          type="button"
                        >
                          Duplicate
                        </button>
                        <button
                          aria-describedby={
                            isHome ? `set-home-reason-${page.id}` : undefined
                          }
                          disabled={isHome}
                          onClick={() => {
                            if (onSetHomePage(page.id)) {
                              closeMenuAndRestoreFocus(page.id);
                            }
                          }}
                          role="menuitem"
                          tabIndex={-1}
                          type="button"
                        >
                          Set as home
                        </button>
                        <button
                          aria-describedby={
                            deleteReason ? `delete-reason-${page.id}` : undefined
                          }
                          className="is-danger"
                          disabled={deleteDisabled}
                          onClick={() => {
                            deleteReturnFocusRef.current = page.id;
                            deleteCompletedRef.current = false;
                            setDeletingPageId(page.id);
                            setMenuPageId(null);
                          }}
                          role="menuitem"
                          tabIndex={-1}
                          type="button"
                        >
                          Delete
                        </button>
                        {isHome ? (
                          <span
                            className="page-action-reason"
                            id={`set-home-reason-${page.id}`}
                            role="note"
                          >
                            This page is already the home page.
                          </span>
                        ) : null}
                        {deleteReason ? (
                          <span
                            className="page-action-reason"
                            id={`delete-reason-${page.id}`}
                            role="note"
                          >
                            {deleteReason}.
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {deletingPage ? (
        <div
          aria-describedby="page-delete-description"
          aria-labelledby="page-delete-title"
          className="page-delete-confirmation"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              cancelDelete();
            }
          }}
          role="alertdialog"
        >
          <strong id="page-delete-title">Delete {deletingPage.name}?</strong>
          <p id="page-delete-description">This removes the page and its content.</p>
          <div className="page-form-actions">
            <button
              className="is-danger"
              onClick={() => {
                if (onDeletePage(deletingPage.id)) {
                  deleteCompletedRef.current = true;
                  setDeletingPageId(null);
                }
              }}
              ref={deleteButtonRef}
              type="button"
            >
              Delete page
            </button>
            <button
              className="is-secondary"
              onClick={cancelDelete}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
