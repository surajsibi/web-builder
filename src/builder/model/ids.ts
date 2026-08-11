declare const identifierBrand: unique symbol;

type Identifier<Name extends string> = string & {
  readonly [identifierBrand]: Name;
};

export type ProjectId = Identifier<"ProjectId">;
export type PageId = Identifier<"PageId">;
export type NodeId = Identifier<"NodeId">;

export function asProjectId(value: string): ProjectId {
  return value as ProjectId;
}

export function asPageId(value: string): PageId {
  return value as PageId;
}

export function asNodeId(value: string): NodeId {
  return value as NodeId;
}
