import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectDashboard } from "@/builder/dashboard/project-dashboard";
import {
  ProjectRepositoryError,
  type ProjectListResult,
} from "@/builder/persistence/project-repository";
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

describe("ProjectDashboard", () => {
  it("should create the first project and open its editor route", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    const onOpenProject = vi.fn();
    render(
      <ProjectDashboard
        onOpenProject={onOpenProject}
        repository={repository}
      />,
    );

    await user.click(
      await screen.findByRole("button", { name: "Create your first project" }),
    );
    const dialog = screen.getByRole("dialog", { name: "Create a new project" });
    await user.type(within(dialog).getByLabelText("Project name"), "Online Store");
    await user.click(within(dialog).getByRole("button", { name: "Create project" }));

    expect(onOpenProject).toHaveBeenCalledWith(expect.stringMatching(/^project-/));
    await expect(repository.list()).resolves.toMatchObject({
      items: [
        {
          availability: "ready",
          summary: expect.objectContaining({ name: "Online Store" }),
        },
      ],
    });
  });

  it("should contain keyboard focus and restore it when the dialog closes", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    render(<ProjectDashboard repository={repository} />);
    const trigger = await screen.findByRole("button", { name: "New project" });

    await user.click(trigger);
    const input = screen.getByLabelText("Project name");
    expect(input).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Create project" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("should show safe recovery details without ordinary project actions", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    await repository.create({ name: "Healthy Store" });
    repository.putRaw("damaged-record", {
      storageKey: "damaged-record",
      document: {
        name: "Damaged Store",
        schemaVersion: 2,
        updatedAt: "2026-08-13T09:00:00.000Z",
        rawSecret: "must-not-render",
      },
    });
    render(<ProjectDashboard repository={repository} />);

    const damagedHeading = await screen.findByRole("heading", {
      name: "Damaged Store",
    });
    const damagedCard = damagedHeading.closest("article");
    expect(damagedCard).not.toBeNull();
    const card = within(damagedCard as HTMLElement);

    expect(card.getByText("Needs recovery")).toBeVisible();
    expect(card.queryByRole("button", { name: /^Open$/ })).not.toBeInTheDocument();
    expect(card.queryByRole("button", { name: "Rename" })).not.toBeInTheDocument();
    expect(card.queryByRole("button", { name: "Duplicate" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Healthy Store" })).toBeVisible();

    await user.click(card.getByRole("button", { name: "View recovery details" }));
    const dialog = screen.getByRole("dialog", { name: "Damaged Store" });
    expect(
      within(dialog).getByText("Your original browser record remains unchanged."),
    ).toBeVisible();
    expect(dialog).not.toHaveTextContent("must-not-render");
    expect(dialog).not.toHaveTextContent("damaged-record");
  });

  it("should distinguish unsupported projects with compatibility copy", async () => {
    const repository = createRepository();
    repository.putRaw("future-record", {
      name: "Future Store",
      schemaVersion: 999,
      updatedAt: "2026-08-14T09:00:00.000Z",
    });
    render(<ProjectDashboard repository={repository} />);

    expect(
      await screen.findByText(
        "This project was created with a version of Canvas Studio that this build cannot open.",
      ),
    ).toBeVisible();
  });

  it("should render storage failure as a dashboard-level unavailable state", async () => {
    class StorageUnavailableRepository extends MemoryProjectRepository {
      override async list(): Promise<ProjectListResult> {
        throw new ProjectRepositoryError(
          "storage-unavailable",
          "Synthetic IndexedDB failure",
        );
      }
    }
    render(<ProjectDashboard repository={new StorageUnavailableRepository()} />);

    expect(
      await screen.findByRole("heading", { name: "Storage unavailable" }),
    ).toBeVisible();
    expect(screen.queryByText("Needs recovery")).not.toBeInTheDocument();
    expect(screen.queryByText("Synthetic IndexedDB failure")).not.toBeInTheDocument();
  });
});
