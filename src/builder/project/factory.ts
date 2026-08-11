import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  type ProjectDocument,
} from "@/builder/model/project-document";
import { asPageId, asProjectId } from "@/builder/model/ids";

import { createId, type IdGenerator } from "./id-generator";

type NewProjectOptions = {
  name?: string;
  now?: string;
  idGenerator?: IdGenerator;
};

export function createNewProject(
  options: NewProjectOptions = {},
): ProjectDocument {
  const idGenerator = options.idGenerator ?? createId;
  const projectId = asProjectId(idGenerator("project"));
  const homePageId = asPageId(idGenerator("page"));
  const now = options.now ?? new Date().toISOString();

  return {
    schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION,
    projectId,
    name: options.name?.trim() || "Untitled Project",
    pages: {
      [homePageId]: {
        id: homePageId,
        name: "Home",
        slug: "/",
        rootIds: [],
        nodes: {},
      },
    },
    pageOrder: [homePageId],
    homePageId,
    createdAt: now,
    updatedAt: now,
    revision: 0,
  };
}
