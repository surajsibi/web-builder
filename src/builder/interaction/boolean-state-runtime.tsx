import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { InteractionAction } from "@/builder/interaction/types";
import { asNodeId, type NodeId } from "@/builder/model/ids";
import type { PageDocument } from "@/builder/model/project-document";

type BooleanDefinitions = Readonly<Record<NodeId, boolean>>;

type BooleanRuntimeState = {
  pageId: string;
  definitionKey: string;
  defaults: BooleanDefinitions;
  values: BooleanDefinitions;
};

export type BooleanStateRuntime = {
  dispatch: (action: InteractionAction) => boolean;
  has: (stateNodeId: NodeId) => boolean;
  read: (stateNodeId: NodeId) => boolean | undefined;
};

const BooleanStateRuntimeContext =
  createContext<BooleanStateRuntime | null>(null);

function definitionsFor(page: Readonly<PageDocument>): BooleanDefinitions {
  const definitions = Object.create(null) as Record<NodeId, boolean>;

  for (const node of Object.values(page.nodes)) {
    if (
      node.type === "boolean-state" &&
      typeof node.props.defaultValue === "boolean"
    ) {
      definitions[node.id] = node.props.defaultValue;
    }
  }

  return definitions;
}

function definitionKeyFor(definitions: BooleanDefinitions): string {
  return JSON.stringify(
    Object.entries(definitions).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

function reconcileRuntimeState(
  current: Readonly<BooleanRuntimeState>,
  pageId: string,
  definitions: BooleanDefinitions,
  definitionKey: string,
): BooleanRuntimeState {
  if (current.pageId !== pageId) {
    return {
      pageId,
      definitionKey,
      defaults: definitions,
      values: definitions,
    };
  }

  const values = Object.create(null) as Record<NodeId, boolean>;
  for (const [rawNodeId, defaultValue] of Object.entries(definitions)) {
    const nodeId = asNodeId(rawNodeId);
    values[nodeId] =
      Object.hasOwn(current.defaults, nodeId) &&
      current.defaults[nodeId] === defaultValue
        ? current.values[nodeId]
        : defaultValue;
  }

  return {
    pageId,
    definitionKey,
    defaults: definitions,
    values,
  };
}

export function BooleanStateRuntimeProvider({
  page,
  children,
}: {
  page: Readonly<PageDocument>;
  children: ReactNode;
}) {
  const definitions = useMemo(() => definitionsFor(page), [page]);
  const definitionKey = useMemo(
    () => definitionKeyFor(definitions),
    [definitions],
  );
  const [runtimeState, setRuntimeState] = useState<BooleanRuntimeState>(() => ({
    pageId: page.id,
    definitionKey,
    defaults: definitions,
    values: definitions,
  }));

  if (
    runtimeState.pageId !== page.id ||
    runtimeState.definitionKey !== definitionKey
  ) {
    setRuntimeState((current) =>
      reconcileRuntimeState(current, page.id, definitions, definitionKey),
    );
  }

  const activeState =
    runtimeState.pageId === page.id &&
    runtimeState.definitionKey === definitionKey
      ? runtimeState
      : reconcileRuntimeState(
          runtimeState,
          page.id,
          definitions,
          definitionKey,
        );

  const has = useCallback(
    (stateNodeId: NodeId) => Object.hasOwn(activeState.values, stateNodeId),
    [activeState.values],
  );
  const read = useCallback(
    (stateNodeId: NodeId) => activeState.values[stateNodeId],
    [activeState.values],
  );
  const dispatch = useCallback(
    (action: InteractionAction): boolean => {
      if (!Object.hasOwn(activeState.values, action.stateNodeId)) return false;

      setRuntimeState((current) => {
        if (!Object.hasOwn(current.values, action.stateNodeId)) return current;
        const currentValue = current.values[action.stateNodeId];
        const nextValue =
          action.kind === "boolean.toggle" ? !currentValue : action.value;
        if (nextValue === currentValue) return current;

        return {
          ...current,
          values: {
            ...current.values,
            [action.stateNodeId]: nextValue,
          },
        };
      });
      return true;
    },
    [activeState.values],
  );
  const value = useMemo(
    () => ({ dispatch, has, read }),
    [dispatch, has, read],
  );

  return (
    <BooleanStateRuntimeContext.Provider value={value}>
      {children}
    </BooleanStateRuntimeContext.Provider>
  );
}

export function useBooleanStateRuntime(): BooleanStateRuntime | null {
  return useContext(BooleanStateRuntimeContext);
}
