import type { ComponentType } from "@/builder/registry/component-registry";
import type { ResponsiveStyles } from "@/builder/styles/types";

import type { JsonObject } from "./json";
import type { NodeId, PageId, ProjectId } from "./ids";
import type { BooleanStateBinding } from "./state-binding";

export const CURRENT_PROJECT_SCHEMA_VERSION = 2 as const;

export type ProjectDocument = {
  schemaVersion: number;
  projectId: ProjectId;
  name: string;
  pages: Record<PageId, PageDocument>;
  pageOrder: PageId[];
  homePageId: PageId;
  createdAt: string;
  updatedAt: string;
  revision: number;
};

export type PageDocument = {
  id: PageId;
  name: string;
  slug: string;
  rootIds: NodeId[];
  nodes: Record<NodeId, BuilderNode>;
};

export type BuilderNode = {
  id: NodeId;
  type: ComponentType;
  componentVersion: number;
  childIds: NodeId[];
  props: JsonObject;
  styles: ResponsiveStyles;
  stateBinding?: BooleanStateBinding;
  meta: {
    name: string;
    locked: boolean;
  };
};
