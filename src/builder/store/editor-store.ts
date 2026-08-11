import { createNewProject } from "@/builder/project/factory";
import { createBuilderStore } from "@/builder/store/builder-store";

function createInitialEditorProject() {
  return createNewProject({
    name: "Make It Yours",
    now: "2026-08-07T00:00:00.000Z",
    idGenerator: (prefix) =>
      prefix === "project" ? "project-editor" : "page-editor-home",
  });
}

export const editorStore = createBuilderStore({
  initialDocument: createInitialEditorProject(),
});
