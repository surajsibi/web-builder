import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { asPageId } from "@/builder/model/ids";
import { createTestProject } from "@/builder/testing/project-fixtures";
import { PagesPanel } from "@/builder/ui/pages-panel";

afterEach(cleanup);

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof PagesPanel>> = {},
) {
  const document = createTestProject({ includeAboutPage: true });
  const props: React.ComponentProps<typeof PagesPanel> = {
    activePageId: asPageId("page-home"),
    document,
    onCreatePage: vi.fn(() => true),
    onDeletePage: vi.fn(() => true),
    onDuplicatePage: vi.fn(() => true),
    onRenamePage: vi.fn(() => true),
    onSelectPage: vi.fn(),
    onSetHomePage: vi.fn(() => true),
    ...overrides,
  };

  return { ...render(<PagesPanel {...props} />), props };
}

describe("PagesPanel", () => {
  it("should show project pages and identify the active page", () => {
    renderPanel();

    expect(
      screen.getByRole("heading", { name: "Website pages" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 pages")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Home page" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByText("Home", { selector: ".page-home-badge" }),
    ).toBeInTheDocument();
  });

  it("should select a page from the project list", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Open About page" }));

    expect(props.onSelectPage).toHaveBeenCalledWith("page-about");
  });

  it("should explain why home-page actions are unavailable", () => {
    renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Actions for Home" }));

    const menu = screen.getByRole("menu", { name: "Home page actions" });
    expect(
      within(menu).getByRole("menuitem", { name: "Set as home" }),
    ).toBeDisabled();
    expect(
      within(menu).getByRole("menuitem", { name: "Delete" }),
    ).toBeDisabled();
    expect(
      within(menu).getByText("This page is already the home page."),
    ).toBeInTheDocument();
    expect(
      within(menu).getByText("The home page cannot be deleted."),
    ).toBeInTheDocument();
  });

  it("should create a page with a trimmed visible name", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Create new page" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Page name" }), {
      target: { value: "  Contact  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(props.onCreatePage).toHaveBeenCalledWith("Contact");
  });

  it("should rename a page from its action menu", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Actions for About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Rename" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Rename About" }), {
      target: { value: "Our story" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(props.onRenamePage).toHaveBeenCalledWith("page-about", "Our story");
  });

  it("should duplicate a page from its action menu", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Actions for About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Duplicate" }));

    expect(props.onDuplicatePage).toHaveBeenCalledWith("page-about");
    expect(
      screen.getByRole("button", { name: "Actions for About" }),
    ).toHaveFocus();
  });

  it("should promote a page to home from its action menu", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Actions for About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Set as home" }));

    expect(props.onSetHomePage).toHaveBeenCalledWith("page-about");
  });

  it("should support menu arrow keys and restore focus when Escape closes the menu", () => {
    renderPanel();

    const actionsButton = screen.getByRole("button", {
      name: "Actions for About",
    });
    fireEvent.click(actionsButton);
    const renameItem = screen.getByRole("menuitem", { name: "Rename" });
    const duplicateItem = screen.getByRole("menuitem", { name: "Duplicate" });
    expect(renameItem).toHaveFocus();

    fireEvent.keyDown(renameItem, { key: "ArrowDown" });
    expect(duplicateItem).toHaveFocus();

    fireEvent.keyDown(duplicateItem, { key: "Escape" });
    expect(
      screen.queryByRole("menu", { name: "About page actions" }),
    ).not.toBeInTheDocument();
    expect(actionsButton).toHaveFocus();
  });

  it("should close the action menu and move focus forward when Tab is pressed", async () => {
    const user = userEvent.setup();
    renderPanel();
    await user.click(screen.getByRole("button", { name: "Actions for Home" }));
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();

    await user.tab();

    expect(
      screen.queryByRole("menu", { name: "Home page actions" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open About page" })).toHaveFocus();
  });

  it("should close the action menu and move focus backward when Shift+Tab is pressed", async () => {
    const user = userEvent.setup();
    renderPanel();
    const actionsButton = screen.getByRole("button", {
      name: "Actions for Home",
    });
    await user.click(actionsButton);
    expect(screen.getByRole("menuitem", { name: "Rename" })).toHaveFocus();

    await user.tab({ shift: true });

    expect(
      screen.queryByRole("menu", { name: "Home page actions" }),
    ).not.toBeInTheDocument();
    expect(actionsButton).toHaveFocus();
  });

  it("should focus page forms and restore focus when creation is canceled with Escape", () => {
    renderPanel();

    const createButton = screen.getByRole("button", { name: "Create new page" });
    fireEvent.click(createButton);
    const createInput = screen.getByRole("textbox", { name: "Page name" });
    expect(createInput).toHaveFocus();

    fireEvent.keyDown(createInput, { key: "Escape" });

    expect(
      screen.queryByRole("textbox", { name: "Page name" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create new page" }),
    ).toHaveFocus();
  });

  it("should focus delete confirmation and restore focus when Escape cancels", () => {
    renderPanel();

    const actionsButton = screen.getByRole("button", {
      name: "Actions for About",
    });
    fireEvent.click(actionsButton);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    const confirmation = screen.getByRole("alertdialog", {
      name: "Delete About?",
      description: "This removes the page and its content.",
    });
    const deleteButton = within(confirmation).getByRole("button", {
      name: "Delete page",
    });
    expect(deleteButton).toHaveFocus();

    fireEvent.keyDown(deleteButton, { key: "Escape" });

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(actionsButton).toHaveFocus();
  });

  it("should require confirmation before deleting an eligible page", () => {
    const { props } = renderPanel();

    fireEvent.click(screen.getByRole("button", { name: "Actions for About" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const confirmation = screen.getByRole("alertdialog", {
      name: "Delete About?",
    });
    fireEvent.click(
      within(confirmation).getByRole("button", { name: "Delete page" }),
    );

    expect(props.onDeletePage).toHaveBeenCalledWith("page-about");
    expect(
      screen.getByRole("button", { name: "Open Home page" }),
    ).toHaveFocus();
  });
});
