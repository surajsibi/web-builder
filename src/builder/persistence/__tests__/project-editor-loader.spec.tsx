import "@/app/project-dashboard-theme.css";

import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectEditorLoader } from "@/builder/persistence/project-editor-loader";
import { ProjectRepositoryError } from "@/builder/persistence/project-repository";
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
    expect(screen.getByText("Saved locally")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Return to Projects" }));

    expect(onNavigateDashboard).toHaveBeenCalledOnce();
  });

  it("should save a supported migrated project through the revisioned repository path", async () => {
    const repository = createRepository();
    const project = await repository.create({ name: "Legacy Store" });
    const versionTwoProject = structuredClone(project);
    versionTwoProject.schemaVersion = 2;
    repository.putRaw(project.projectId, {
      storageKey: project.projectId,
      document: versionTwoProject,
      lastOpenedAt: null,
    });
    const save = vi.spyOn(repository, "save");

    render(
      <ProjectEditorLoader
        projectId={project.projectId}
        repository={repository}
      />,
    );

    expect(await screen.findByText("Unsaved changes")).toBeVisible();
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.getByText("Saved locally")).toBeVisible());
    await expect(repository.load(project.projectId)).resolves.toMatchObject({
      document: { schemaVersion: 3, revision: 1 },
      migrated: false,
    });
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

  it("should present keyboard-reachable retry actions when browser storage is unavailable", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    const load = vi.spyOn(repository, "load").mockRejectedValue(
      new ProjectRepositoryError(
        "storage-unavailable",
        "Synthetic storage failure",
      ),
    );
    render(
      <ProjectEditorLoader
        projectId="storage-failure"
        repository={repository}
      />,
    );

    const heading = await screen.findByRole("heading", {
      name: "Storage unavailable",
    });
    const boundary = heading.closest("main");
    if (!(boundary instanceof HTMLElement)) {
      throw new Error("Expected the storage error boundary to render");
    }
    const returnButton = screen.getByRole("button", {
      name: "Return to Projects",
    });
    const retryButton = screen.getByRole("button", { name: "Try again" });

    expect(returnButton).toBeVisible();
    expect(returnButton).toBeEnabled();
    expect(retryButton).toBeVisible();
    expect(retryButton).toBeEnabled();
    expect(
      getComputedStyle(boundary).getPropertyValue("--dashboard-ink").trim(),
    ).toBe("#17201f");
    expect(
      getComputedStyle(boundary).getPropertyValue("--dashboard-line").trim(),
    ).toBe("#dfe4dd");

    await user.tab();
    expect(returnButton).toHaveFocus();
    await user.tab();
    expect(retryButton).toHaveFocus();
    await user.click(retryButton);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(2));
  });
});
