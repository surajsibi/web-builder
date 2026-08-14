import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectEditorLoader } from "@/builder/persistence/project-editor-loader";
import { MemoryProjectRepository } from "@/builder/testing/memory-project-repository";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

function createRepository() {
  let id = 0;
  return new MemoryProjectRepository({
    idGenerator: (prefix) => `${prefix}-${++id}`,
    now: () => "2026-08-14T10:00:00.000Z",
  });
}

describe("ProjectEditorLoader", () => {
  it("should load a project into a dedicated editor and return to the dashboard", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    const project = await repository.create({ name: "Commerce Site" });
    const onNavigateDashboard = vi.fn();
    render(
      <ProjectEditorLoader
        onNavigateDashboard={onNavigateDashboard}
        projectId={project.projectId}
        repository={repository}
      />,
    );

    expect(await screen.findByText("Commerce Site")).toBeVisible();
    expect(screen.getByLabelText("Saved locally")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Return to Projects" }));

    expect(onNavigateDashboard).toHaveBeenCalledOnce();
  });

  it("should bound a corrupt direct route without rendering editor actions", async () => {
    const repository = createRepository();
    repository.putRaw("damaged-record", {
      storageKey: "damaged-record",
      document: {
        name: "Damaged Store",
        schemaVersion: 2,
        rawSecret: "must-not-render",
      },
    });
    const save = vi.spyOn(repository, "save");
    render(
      <ProjectEditorLoader
        projectId="damaged-record"
        repository={repository}
      />,
    );

    const heading = await screen.findByRole("heading", { name: "Damaged Store" });
    const boundary = heading.closest("main");
    expect(boundary).not.toBeNull();
    const boundedContent = within(boundary as HTMLElement);
    expect(heading).toBeVisible();
    expect(boundedContent.getByText("Needs recovery")).toBeVisible();
    expect(boundedContent.queryByRole("button", { name: "Save now" })).not.toBeInTheDocument();
    expect(boundedContent.queryByRole("link", { name: "Preview" })).not.toBeInTheDocument();
    expect(boundary).not.toHaveTextContent("must-not-render");
    expect(boundary).not.toHaveTextContent("damaged-record");
    expect(save).not.toHaveBeenCalled();
  });

  it("should render a missing project without creating a blank replacement", async () => {
    const repository = createRepository();
    const create = vi.spyOn(repository, "create");
    render(
      <ProjectEditorLoader projectId="missing-project" repository={repository} />,
    );

    expect(
      await screen.findByRole("heading", { name: "Project not found" }),
    ).toBeVisible();
    expect(screen.queryByText("Your page is empty")).not.toBeInTheDocument();
    expect(create).not.toHaveBeenCalled();
  });
});
