import type { ProjectDocument } from "@/builder/model/project-document";

export function cloneProjectDocument(
  document: Readonly<ProjectDocument>,
): ProjectDocument {
  return structuredClone(document);
}

export function valuesEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
