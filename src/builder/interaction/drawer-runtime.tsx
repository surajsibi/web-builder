import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { useBooleanStateRuntime } from "@/builder/interaction/boolean-state-runtime";
import { asNodeId, type NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";

export type DrawerPanelSnapshot = {
  available: boolean;
  dialogId: string;
  open: boolean;
  panelNodeId: NodeId;
  stateNodeId: NodeId | null;
};

type DrawerLayerRegistration = {
  element: HTMLElement;
  panelNodeId: NodeId;
};

type DrawerLayerRemoval = {
  nextTopElement: HTMLElement | null;
  wasTop: boolean;
};

export type DrawerRuntime = {
  closePanel: (panelNodeId: NodeId) => boolean;
  getPanel: (panelNodeId: NodeId) => DrawerPanelSnapshot | null;
  isTopLayer: (panelNodeId: NodeId) => boolean;
  mode: "editor" | "preview";
  openPanel: (panelNodeId: NodeId, activator: HTMLElement) => boolean;
  portalHost: HTMLElement | null;
  registerLayer: (
    panelNodeId: NodeId,
    element: HTMLElement,
  ) => () => DrawerLayerRemoval;
  restorePanelFocus: (
    panelNodeId: NodeId,
    nextTopElement: HTMLElement | null,
  ) => void;
};

const DrawerRuntimeContext = createContext<DrawerRuntime | null>(null);
const DrawerPanelContext = createContext<NodeId | null>(null);

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function drawerDialogId(panelNodeId: NodeId): string {
  return `drawer-panel-${panelNodeId}`;
}

function focusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute("aria-hidden") !== "true",
  );
}

function focusInitialElement(dialog: HTMLElement): void {
  const close = dialog.querySelector<HTMLElement>(
    '[data-drawer-close-control="true"]:not([disabled])',
  );
  const target = close ?? focusableElements(dialog)[0] ?? dialog;
  target.focus({ preventScroll: true });
}

function subscribeToDocumentBody(): () => void {
  return () => undefined;
}

function getDocumentBody(): HTMLElement | null {
  return typeof document === "undefined" ? null : document.body;
}

type IsolatedElementSnapshot = {
  ariaHidden: string | null;
  element: HTMLElement;
  inert: boolean;
  inertAttribute: string | null;
};

function applyPreviewModalEffects(topLayer: HTMLElement): () => void {
  const body = document.body;
  const previousOverflow = body.style.overflow;
  const previousPaddingRight = body.style.paddingRight;
  const scrollbarWidth =
    document.documentElement.clientWidth > 0
      ? Math.max(0, window.innerWidth - document.documentElement.clientWidth)
      : 0;
  const isolated: IsolatedElementSnapshot[] = [];

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement) || child === topLayer) continue;
    isolated.push({
      ariaHidden: child.getAttribute("aria-hidden"),
      element: child,
      inert: child.inert,
      inertAttribute: child.getAttribute("inert"),
    });
    child.inert = true;
    child.setAttribute("inert", "");
    child.setAttribute("aria-hidden", "true");
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingRight = previousPaddingRight;

    for (const snapshot of isolated) {
      snapshot.element.inert = snapshot.inert;
      if (snapshot.inertAttribute === null) {
        snapshot.element.removeAttribute("inert");
      } else {
        snapshot.element.setAttribute("inert", snapshot.inertAttribute);
      }
      if (snapshot.ariaHidden === null) {
        snapshot.element.removeAttribute("aria-hidden");
      } else {
        snapshot.element.setAttribute("aria-hidden", snapshot.ariaHidden);
      }
    }
  };
}

export function DrawerRuntimeProvider({
  children,
  mode,
  page,
  portalHost,
}: {
  children: ReactNode;
  mode: "editor" | "preview";
  page: Readonly<PageDocument>;
  portalHost?: HTMLElement | null;
}) {
  const booleanRuntime = useBooleanStateRuntime();
  const documentBody = useSyncExternalStore(
    subscribeToDocumentBody,
    getDocumentBody,
    () => null,
  );
  const layerRef = useRef<readonly DrawerLayerRegistration[]>([]);
  const activatorsRef = useRef(new Map<NodeId, HTMLElement>());
  const [layers, setLayers] = useState<readonly DrawerLayerRegistration[]>([]);

  useEffect(() => {
    activatorsRef.current.clear();
  }, [page.id]);

  useLayoutEffect(() => {
    if (mode !== "preview" || layers.length === 0) return;
    return applyPreviewModalEffects(layers[layers.length - 1].element);
  }, [layers, mode]);

  const getPanel = useCallback(
    (panelNodeId: NodeId): DrawerPanelSnapshot | null => {
      const panel = page.nodes[panelNodeId];
      if (!panel || panel.type !== "drawer-panel") return null;

      const rawStateNodeId = panel.props.targetStateNodeId;
      const stateNodeId =
        typeof rawStateNodeId === "string" && rawStateNodeId !== ""
          ? asNodeId(rawStateNodeId)
          : null;
      const available =
        stateNodeId !== null && booleanRuntime?.has(stateNodeId) === true;

      return {
        available,
        dialogId: drawerDialogId(panelNodeId),
        open: available && booleanRuntime?.read(stateNodeId) === true,
        panelNodeId,
        stateNodeId,
      };
    },
    [booleanRuntime, page.nodes],
  );

  const openPanel = useCallback(
    (panelNodeId: NodeId, activator: HTMLElement): boolean => {
      const panel = getPanel(panelNodeId);
      if (!panel?.available || panel.stateNodeId === null) return false;
      const dispatched =
        booleanRuntime?.dispatch({
          kind: "boolean.set",
          stateNodeId: panel.stateNodeId,
          value: true,
        }) === true;
      if (dispatched) activatorsRef.current.set(panelNodeId, activator);
      return dispatched;
    },
    [booleanRuntime, getPanel],
  );

  const closePanel = useCallback(
    (panelNodeId: NodeId): boolean => {
      const panel = getPanel(panelNodeId);
      if (!panel?.available || panel.stateNodeId === null) return false;
      return (
        booleanRuntime?.dispatch({
          kind: "boolean.set",
          stateNodeId: panel.stateNodeId,
          value: false,
        }) === true
      );
    },
    [booleanRuntime, getPanel],
  );

  const isTopLayer = useCallback((panelNodeId: NodeId): boolean => {
    return layerRef.current.at(-1)?.panelNodeId === panelNodeId;
  }, []);

  const registerLayer = useCallback(
    (panelNodeId: NodeId, element: HTMLElement) => {
      const next = [
        ...layerRef.current.filter(
          (registration) => registration.element !== element,
        ),
        { element, panelNodeId },
      ];
      layerRef.current = next;
      setLayers(next);

      return (): DrawerLayerRemoval => {
        const current = layerRef.current;
        const wasTop = current.at(-1)?.element === element;
        const remaining = current.filter(
          (registration) => registration.element !== element,
        );
        layerRef.current = remaining;
        setLayers(remaining);
        return {
          nextTopElement: remaining.at(-1)?.element ?? null,
          wasTop,
        };
      };
    },
    [],
  );

  const restorePanelFocus = useCallback(
    (panelNodeId: NodeId, nextTopElement: HTMLElement | null) => {
      const activator = activatorsRef.current.get(panelNodeId) ?? null;
      activatorsRef.current.delete(panelNodeId);

      queueMicrotask(() => {
        if (
          activator?.isConnected &&
          (nextTopElement === null || nextTopElement.contains(activator)) &&
          (!(activator instanceof HTMLButtonElement) || !activator.disabled)
        ) {
          activator.focus({ preventScroll: true });
          return;
        }

        const nextDialog = nextTopElement?.querySelector<HTMLElement>(
          '[role="dialog"]',
        );
        if (nextDialog) focusInitialElement(nextDialog);
      });
    },
    [],
  );

  const resolvedPortalHost =
    portalHost === undefined ? documentBody : portalHost;
  const value = useMemo<DrawerRuntime>(
    () => ({
      closePanel,
      getPanel,
      isTopLayer,
      mode,
      openPanel,
      portalHost: resolvedPortalHost,
      registerLayer,
      restorePanelFocus,
    }),
    [
      closePanel,
      getPanel,
      isTopLayer,
      mode,
      openPanel,
      registerLayer,
      resolvedPortalHost,
      restorePanelFocus,
    ],
  );

  return (
    <DrawerRuntimeContext.Provider value={value}>
      {children}
    </DrawerRuntimeContext.Provider>
  );
}

export function useDrawerRuntime(): DrawerRuntime | null {
  return useContext(DrawerRuntimeContext);
}

export function DrawerPanelScope({
  children,
  panelNodeId,
}: {
  children: ReactNode;
  panelNodeId: NodeId;
}) {
  return (
    <DrawerPanelContext.Provider value={panelNodeId}>
      {children}
    </DrawerPanelContext.Provider>
  );
}

export function useDrawerPanelNodeId(): NodeId | null {
  return useContext(DrawerPanelContext);
}

export function useDrawerModalLifecycle(panelNodeId: NodeId, active: boolean) {
  const runtime = useDrawerRuntime();
  const layerRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const mode = runtime?.mode;
  const registerLayer = runtime?.registerLayer;
  const restorePanelFocus = runtime?.restorePanelFocus;

  useLayoutEffect(() => {
    if (!active) return;
    const layer = layerRef.current;
    const dialog = dialogRef.current;
    if (!layer || !dialog || !registerLayer || !restorePanelFocus) return;

    const unregister = registerLayer(panelNodeId, layer);
    if (mode === "preview") focusInitialElement(dialog);

    return () => {
      const removal = unregister();
      if (mode === "preview" && removal.wasTop) {
        restorePanelFocus(panelNodeId, removal.nextTopElement);
      }
    };
  }, [active, mode, panelNodeId, registerLayer, restorePanelFocus]);

  useEffect(() => {
    if (!active || !runtime) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!runtime.isTopLayer(panelNodeId)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        runtime.closePanel(panelNodeId);
        return;
      }
      if (event.key !== "Tab" || runtime.mode !== "preview") return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = focusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (
        event.shiftKey &&
        (active === dialog || active === first || !dialog.contains(active))
      ) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (
        !event.shiftKey &&
        (active === dialog || active === last || !dialog.contains(active))
      ) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [active, panelNodeId, runtime]);

  return { dialogRef, layerRef };
}
