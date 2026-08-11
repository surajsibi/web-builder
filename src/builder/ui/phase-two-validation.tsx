"use client";

import { useState } from "react";
import { useStore } from "zustand";
import type { StoreApi } from "zustand/vanilla";

import type { EditorCommand } from "@/builder/commands/types";
import { createNewProject } from "@/builder/project/factory";
import {
  createBuilderStore,
  type BuilderStoreState,
} from "@/builder/store/builder-store";

const validationStore = createBuilderStore({
  initialDocument: createNewProject({ name: "Phase 2 Validation Project" }),
});

function commandLabel(result: unknown): string {
  return JSON.stringify(result, null, 2);
}

type PhaseTwoValidationProps = {
  store?: StoreApi<BuilderStoreState>;
};

export function PhaseTwoValidation({
  store = validationStore,
}: PhaseTwoValidationProps) {
  const state = useStore(store);
  const [lastResult, setLastResult] = useState("No command executed yet.");
  const document = state.document;
  const activePage =
    document && state.activePageId ? document.pages[state.activePageId] : null;
  const selectedNode =
    activePage && state.selectedNodeId
      ? activePage.nodes[state.selectedNodeId]
      : null;

  const run = (command: EditorCommand) => {
    setLastResult(commandLabel(state.dispatchEditorCommand(command)));
  };

  if (!document || !activePage || !state.activePageId) {
    return <main>Project hydration failed.</main>;
  }

  const selectedParentId = selectedNode
    ? state.parentById[selectedNode.id]
    : null;
  const selectedAtRoot = selectedNode && selectedParentId === null;
  const selectedRootDestinationLength =
    activePage.rootIds.length - (selectedAtRoot ? 1 : 0);
  const selectedIsHidden = selectedNode?.styles.base.display === "none";
  const selectedHasText =
    selectedNode && typeof selectedNode.props.text === "string";

  return (
    <main className="validation-shell">
      <header className="validation-header">
        <div>
          <p className="eyebrow">Architecture harness</p>
          <h1>Phase 2 state validation</h1>
          <p>
            Exercise hydration, canonical commands, selection, and history
            without drag-and-drop or Inspector behavior.
          </p>
        </div>
        <dl className="status-grid">
          <div>
            <dt>Commit</dt>
            <dd>{state.commitId}</dd>
          </div>
          <div>
            <dt>Dirty</dt>
            <dd>{state.dirty ? "Yes" : "No"}</dd>
          </div>
          <div>
            <dt>Undo</dt>
            <dd>{state.history.past.length}</dd>
          </div>
          <div>
            <dt>Redo</dt>
            <dd>{state.history.future.length}</dd>
          </div>
        </dl>
      </header>

      <section className="validation-grid">
        <article className="validation-panel">
          <h2>Pages</h2>
          <ul aria-label="Project pages" className="stack">
            {document.pageOrder.map((pageId) => {
              const page = document.pages[pageId];
              const active = pageId === state.activePageId;

              return (
                <li key={pageId}>
                  <button
                    aria-pressed={active}
                    className={active ? "list-button active" : "list-button"}
                    onClick={() => {
                      setLastResult(commandLabel(state.setActivePage(pageId)));
                    }}
                    type="button"
                  >
                    <span>{page.name}</span>
                    <small>{page.slug}</small>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="button-grid">
            <button onClick={() => run({ kind: "page.create" })} type="button">
              Create page
            </button>
            <button
              onClick={() =>
                run({
                  kind: "page.rename",
                  pageId: activePage.id,
                  name: `${activePage.name} Updated`,
                })
              }
              type="button"
            >
              Rename active
            </button>
            <button
              disabled={activePage.id === document.homePageId}
              onClick={() =>
                run({ kind: "page.delete", pageId: activePage.id })
              }
              type="button"
            >
              Delete active
            </button>
          </div>
        </article>

        <article className="validation-panel">
          <h2>Active page nodes</h2>
          {Object.keys(activePage.nodes).length === 0 ? (
            <p className="empty-state">This page has no nodes.</p>
          ) : (
            <ul aria-label="Active page nodes" className="stack">
              {Object.values(activePage.nodes).map((node) => (
                <li key={node.id}>
                  <button
                    aria-pressed={node.id === state.selectedNodeId}
                    className={
                      node.id === state.selectedNodeId
                        ? "list-button active"
                        : "list-button"
                    }
                    onClick={() => {
                      setLastResult(commandLabel(state.selectNode(node.id)));
                    }}
                    type="button"
                  >
                    <span>{node.meta.name}</span>
                    <small>
                      {node.type} · {node.id}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="button-grid">
            <button
              onClick={() =>
                run({
                  kind: "node.insert",
                  pageId: activePage.id,
                  componentType: "card",
                  destination: {
                    parentId: null,
                    index: activePage.rootIds.length,
                  },
                })
              }
              type="button"
            >
              Insert root card
            </button>
            <button
              disabled={!selectedNode}
              onClick={() => {
                if (!selectedNode) return;
                run({
                  kind: "node.insert",
                  pageId: activePage.id,
                  componentType: "text",
                  destination: {
                    parentId: selectedNode.id,
                    index: selectedNode.childIds.length,
                  },
                });
              }}
              type="button"
            >
              Insert text inside selected
            </button>
            <button
              disabled={!selectedNode}
              onClick={() => {
                if (!selectedNode) return;
                run({
                  kind: "node.move",
                  pageId: activePage.id,
                  nodeId: selectedNode.id,
                  destination: {
                    parentId: null,
                    index: selectedRootDestinationLength,
                  },
                });
              }}
              type="button"
            >
              Move selected to root end
            </button>
            <button
              disabled={!selectedNode}
              onClick={() => {
                if (!selectedNode) return;
                run({
                  kind: "node.remove",
                  pageId: activePage.id,
                  nodeId: selectedNode.id,
                });
              }}
              type="button"
            >
              Remove selected
            </button>
          </div>
        </article>

        <article className="validation-panel">
          <h2>Selected node</h2>
          {selectedNode ? (
            <>
              <dl className="selection-details">
                <div>
                  <dt>Name</dt>
                  <dd>{selectedNode.meta.name}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{selectedNode.type}</dd>
                </div>
                <div>
                  <dt>ID</dt>
                  <dd>{selectedNode.id}</dd>
                </div>
                <div>
                  <dt>Parent</dt>
                  <dd>{selectedParentId ?? "Page root"}</dd>
                </div>
                <div>
                  <dt>Locked</dt>
                  <dd>{selectedNode.meta.locked ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Hidden</dt>
                  <dd>{selectedIsHidden ? "Yes" : "No"}</dd>
                </div>
              </dl>
              <div className="button-grid">
                <button
                  onClick={() =>
                    run({
                      kind: "node.rename",
                      pageId: activePage.id,
                      nodeId: selectedNode.id,
                      name: `${selectedNode.meta.name} Updated`,
                    })
                  }
                  type="button"
                >
                  Rename
                </button>
                <button
                  onClick={() =>
                    run({
                      kind: "node.lock",
                      pageId: activePage.id,
                      nodeId: selectedNode.id,
                      locked: !selectedNode.meta.locked,
                    })
                  }
                  type="button"
                >
                  {selectedNode.meta.locked ? "Unlock" : "Lock"}
                </button>
                <button
                  disabled={selectedNode.meta.locked}
                  onClick={() =>
                    run({
                      kind: "node.hide",
                      pageId: activePage.id,
                      nodeId: selectedNode.id,
                      hidden: !selectedIsHidden,
                    })
                  }
                  type="button"
                >
                  {selectedIsHidden ? "Show" : "Hide"}
                </button>
                <button
                  disabled={selectedNode.meta.locked || !selectedHasText}
                  onClick={() => {
                    if (!selectedHasText) return;
                    run({
                      kind: "node.updateProps",
                      pageId: activePage.id,
                      nodeId: selectedNode.id,
                      nextProps: {
                        ...selectedNode.props,
                        text: `${selectedNode.props.text} updated`,
                      },
                    });
                  }}
                  type="button"
                >
                  Update text prop
                </button>
                <button
                  disabled={selectedNode.meta.locked}
                  onClick={() =>
                    run({
                      kind: "node.updateStyles",
                      pageId: activePage.id,
                      nodeId: selectedNode.id,
                      viewport: "desktop",
                      changes: [
                        {
                          target: { property: "backgroundColor" },
                          value: "#e0f2fe",
                        },
                      ],
                    })
                  }
                  type="button"
                >
                  Update background
                </button>
                <button
                  onClick={() => {
                    setLastResult(commandLabel(state.clearSelection()));
                  }}
                  type="button"
                >
                  Clear selection
                </button>
              </div>
            </>
          ) : (
            <p className="empty-state">No node selected.</p>
          )}
        </article>

        <article className="validation-panel">
          <h2>History</h2>
          <div className="button-grid">
            <button
              disabled={state.history.past.length === 0}
              onClick={() => setLastResult(commandLabel(state.undo()))}
              type="button"
            >
              Undo
            </button>
            <button
              disabled={state.history.future.length === 0}
              onClick={() => setLastResult(commandLabel(state.redo()))}
              type="button"
            >
              Redo
            </button>
          </div>
          <h3>Last result</h3>
          <output aria-live="polite">
            <pre>{lastResult}</pre>
          </output>
        </article>
      </section>
    </main>
  );
}
