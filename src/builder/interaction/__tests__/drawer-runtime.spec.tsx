import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import {
  createTestNode,
  createTestPage,
} from "@/builder/testing/project-fixtures";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  for (const child of Array.from(document.body.children)) {
    child.removeAttribute("aria-hidden");
    child.removeAttribute("inert");
  }
});

function createDrawerPage(
  id: string,
  options: { defaultOpen?: boolean; side?: "left" | "right" | "top" | "bottom" } = {},
) {
  const state = createTestNode("boolean-state", `${id}-state`);
  const trigger = createTestNode("drawer-trigger", `${id}-trigger`);
  const panel = createTestNode("drawer-panel", `${id}-panel`, [
    `${id}-close`,
    `${id}-input`,
  ]);
  const close = createTestNode("drawer-close", `${id}-close`);
  const input = createTestNode("input", `${id}-input`);

  state.props.defaultValue = options.defaultOpen ?? false;
  trigger.props = {
    ...trigger.props,
    text: "Open navigation",
    targetDrawerNodeId: panel.id,
  };
  panel.props = {
    ...panel.props,
    targetStateNodeId: state.id,
    side: options.side ?? "left",
    dialogLabel: "Site navigation",
    sizePx: 360,
    zIndex: 2400,
  };
  close.props = { ...close.props, text: "Close navigation" };
  input.props = {
    ...input.props,
    label: "Drawer note",
    defaultValue: "Fresh note",
  };

  return {
    close,
    input,
    page: createTestPage(
      id,
      "Drawer page",
      `/${id}`,
      [state, trigger, panel],
      [close, input],
    ),
    panel,
    state,
    trigger,
  };
}

describe("Drawer runtime", () => {
  it("should open and close the referenced Panel through Boolean State", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-connected");
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-controls", dialog.id);
    expect(dialog.closest("[data-drawer-layer]")).toHaveStyle({ zIndex: "2400" });

    await user.click(
      within(dialog).getByRole("button", { name: "Close navigation" }),
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("should restore focus to whichever connected Trigger opened the Panel", async () => {
    const user = userEvent.setup();
    const { page, panel, trigger } = createDrawerPage("drawer-many-triggers");
    trigger.props.text = "Open from header";
    const secondTrigger = createTestNode(
      "drawer-trigger",
      "drawer-many-triggers-second",
    );
    secondTrigger.props = {
      ...secondTrigger.props,
      text: "Open from footer",
      targetDrawerNodeId: panel.id,
    };
    page.nodes[secondTrigger.id] = secondTrigger;
    page.rootIds.splice(2, 0, secondTrigger.id);
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    for (const triggerName of ["Open from header", "Open from footer"]) {
      const activeTrigger = screen.getByRole("button", { name: triggerName });
      await user.click(activeTrigger);
      const dialog = await screen.findByRole("dialog", {
        name: "Site navigation",
      });
      await user.click(
        within(dialog).getByRole("button", { name: "Close navigation" }),
      );
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      expect(activeTrigger).toHaveFocus();
    }
  });

  it("should honor authored disabled state on Trigger and Close", async () => {
    const user = userEvent.setup();
    const { close, page, trigger } = createDrawerPage("drawer-disabled-controls");
    trigger.props.disabled = true;
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const disabledTrigger = screen.getByRole("button", {
      name: "Open navigation",
    });

    expect(disabledTrigger).toBeDisabled();
    await user.click(disabledTrigger);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    const updatedPage = structuredClone(page);
    updatedPage.nodes[trigger.id].props.disabled = false;
    updatedPage.nodes[close.id].props.disabled = true;
    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });
    const disabledClose = within(dialog).getByRole("button", {
      name: "Close navigation",
    });
    expect(disabledClose).toBeDisabled();
    await user.click(disabledClose);
    expect(dialog).toBeInTheDocument();
  });

  it("should open from a generic State Action and remount fresh descendants", async () => {
    const user = userEvent.setup();
    const { page, state } = createDrawerPage("drawer-generic-action");
    const action = createTestNode("state-action", "drawer-generic-toggle");
    action.props = {
      ...action.props,
      text: "Toggle navigation state",
      targetStateNodeId: state.id,
      action: "toggle",
    };
    page.nodes[action.id] = action;
    page.rootIds.splice(1, 0, action.id);
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const toggle = screen.getByRole("button", { name: "Toggle navigation state" });

    await user.click(toggle);
    const field = await screen.findByRole("textbox", { name: "Drawer note" });
    await user.clear(field);
    await user.type(field, "Visitor draft");
    expect(field).toHaveValue("Visitor draft");

    await user.click(toggle);
    await waitFor(() =>
      expect(screen.queryByRole("textbox", { name: "Drawer note" })).not.toBeInTheDocument(),
    );
    await user.click(toggle);

    expect(await screen.findByRole("textbox", { name: "Drawer note" })).toHaveValue(
      "Fresh note",
    );
  });

  it("should trap focus, close on Escape, and restore modal side effects", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-modal-lifecycle");
    document.body.style.overflow = "scroll";
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    await user.click(trigger);

    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });
    const close = within(dialog).getByRole("button", {
      name: "Close navigation",
    });
    const field = within(dialog).getByRole("textbox", { name: "Drawer note" });
    expect(close).toHaveFocus();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(view.container).toHaveAttribute("inert");

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(field).toHaveFocus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body).toHaveStyle({ overflow: "scroll" });
    expect(view.container).not.toHaveAttribute("inert");
    expect(trigger).toHaveFocus();
  });

  it("should wrap in both directions when the dialog fallback has focus", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-dialog-focus-fallback");
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });
    const close = within(dialog).getByRole("button", {
      name: "Close navigation",
    });
    const field = within(dialog).getByRole("textbox", { name: "Drawer note" });

    dialog.focus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(field).toHaveFocus();

    dialog.focus();
    await user.keyboard("{Tab}");
    expect(close).toHaveFocus();
  });

  it("should close only when the backdrop itself is activated", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-backdrop");
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });

    await user.click(dialog);
    expect(screen.getByRole("dialog", { name: "Site navigation" })).toBeInTheDocument();

    const backdrop = document.querySelector<HTMLElement>("[data-drawer-backdrop]");
    if (!backdrop) throw new Error("Expected a Drawer backdrop");
    await user.click(backdrop);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("should leave an unresolved Trigger unavailable without opening a dialog", async () => {
    const user = userEvent.setup();
    const trigger = createTestNode("drawer-trigger", "drawer-unresolved-trigger");
    trigger.props = {
      ...trigger.props,
      text: "Unavailable drawer",
      targetDrawerNodeId: "missing-panel",
    };
    const page = createTestPage(
      "drawer-unresolved",
      "Unresolved Drawer",
      "/drawer-unresolved",
      [trigger],
    );
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const control = screen.getByRole("button", { name: "Unavailable drawer" });

    expect(control).toHaveAttribute("aria-disabled", "true");
    await user.click(control);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should activate Trigger and Close with Enter and Space", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-keyboard");
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();

    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog", {
      name: "Site navigation",
    });
    const close = within(dialog).getByRole("button", {
      name: "Close navigation",
    });
    expect(close).toHaveFocus();

    await user.keyboard(" ");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("should close and clean up when the referenced Boolean State is deleted", async () => {
    const user = userEvent.setup();
    const { page, state } = createDrawerPage("drawer-state-deletion");
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const updatedPage = structuredClone(page);
    delete updatedPage.nodes[state.id];
    updatedPage.rootIds = updatedPage.rootIds.filter(
      (nodeId) => nodeId !== state.id,
    );

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveAttribute("aria-disabled", "true");
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
    expect(trigger).toHaveFocus();
  });

  it("should clean up modal effects when the rendered page changes", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-page-switch");
    const destinationText = createTestNode("text", "drawer-destination-text");
    destinationText.props.text = "Destination page";
    const destinationPage = createTestPage(
      "drawer-destination",
      "Destination",
      "/destination",
      [destinationText],
    );
    document.body.style.overflow = "clip";
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();

    view.rerender(
      <PageRenderingController
        page={destinationPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Destination page")).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: "clip" });
    expect(view.container).not.toHaveAttribute("aria-hidden");
    expect(view.container).not.toHaveAttribute("inert");
  });

  it("should restore exact body and background state when the runtime unmounts", async () => {
    const user = userEvent.setup();
    const { page } = createDrawerPage("drawer-runtime-unmount");
    const background = document.createElement("aside");
    background.setAttribute("aria-hidden", "false");
    document.body.append(background);
    document.body.style.overflow = "clip";
    document.body.style.paddingRight = "7px";
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(background).toHaveAttribute("aria-hidden", "true");
    expect(background).toHaveAttribute("inert");

    view.unmount();

    expect(document.body).toHaveStyle({
      overflow: "clip",
      paddingRight: "7px",
    });
    expect(background).toHaveAttribute("aria-hidden", "false");
    expect(background).not.toHaveAttribute("inert");
    background.remove();
  });

  it("should recover after the Panel state reference is reconnected", async () => {
    const user = userEvent.setup();
    const { page, panel, state } = createDrawerPage("drawer-reconnection");
    panel.props.targetStateNodeId = "missing-state";
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger).toHaveAttribute("aria-disabled", "true");
    const updatedPage = structuredClone(page);
    updatedPage.nodes[panel.id].props.targetStateNodeId = state.id;

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    expect(trigger).toHaveAttribute("aria-disabled", "false");

    await user.click(trigger);

    expect(
      await screen.findByRole("dialog", { name: "Site navigation" }),
    ).toBeInTheDocument();
  });

  it("should preserve an open Drawer across unrelated page edits", async () => {
    const user = userEvent.setup();
    const { input, page } = createDrawerPage("drawer-unrelated-edit");
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const updatedPage = structuredClone(page);
    updatedPage.nodes[input.id].props.label = "Updated Drawer note";

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="mobile"
      />,
    );

    expect(screen.getByRole("dialog", { name: "Site navigation" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Updated Drawer note" })).toBeInTheDocument();
  });

  it("should apply an authored default change to Panel presence", async () => {
    const { page, state } = createDrawerPage("drawer-default-change");
    const view = render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const updatedPage = structuredClone(page);
    updatedPage.nodes[state.id].props.defaultValue = true;

    view.rerender(
      <PageRenderingController
        page={updatedPage}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );

    expect(
      await screen.findByRole("dialog", { name: "Site navigation" }),
    ).toBeInTheDocument();
  });

  it("should keep only the top mounted Drawer interactive during cleanup", async () => {
    const user = userEvent.setup();
    const first = createDrawerPage("drawer-layer-first", { defaultOpen: true });
    const second = createDrawerPage("drawer-layer-second", { defaultOpen: true });
    first.panel.props.dialogLabel = "First drawer";
    first.close.props.text = "Close first drawer";
    second.panel.props.dialogLabel = "Second drawer";
    second.close.props.text = "Close second drawer";
    const page = createTestPage(
      "drawer-layers",
      "Drawer layers",
      "/drawer-layers",
      [
        first.state,
        first.trigger,
        first.panel,
        second.state,
        second.trigger,
        second.panel,
      ],
      [first.close, first.input, second.close, second.input],
    );
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    expect(
      await screen.findByRole("dialog", {
        name: "First drawer",
        hidden: true,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Second drawer" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Second drawer" })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("dialog", { name: "First drawer" })).toBeInTheDocument();
    expect(document.body).toHaveStyle({ overflow: "hidden" });
    expect(screen.getByRole("button", { name: "Close first drawer" })).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(document.body).not.toHaveStyle({ overflow: "hidden" });
  });

  it("should keep Drawer Close safely inactive outside a Panel", async () => {
    const user = userEvent.setup();
    const close = createTestNode("drawer-close", "orphaned-drawer-close");
    close.props.text = "Orphaned close";
    const page = createTestPage(
      "drawer-orphan-close",
      "Orphan close",
      "/drawer-orphan-close",
      [close],
    );
    render(
      <PageRenderingController
        page={page}
        runtime={{ mode: "preview" }}
        viewport="desktop"
      />,
    );
    const control = screen.getByRole("button", { name: "Orphaned close" });

    expect(control).toHaveAttribute("aria-disabled", "true");
    expect(control).toHaveAttribute("data-drawer-close-status", "orphaned");
    await user.click(control);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it.each(["left", "right", "top", "bottom"] as const)(
    "should anchor an open Panel to the %s side",
    async (side) => {
      const { page } = createDrawerPage(`drawer-side-${side}`, {
        defaultOpen: true,
        side,
      });
      render(
        <PageRenderingController
          page={page}
          runtime={{ mode: "preview" }}
          viewport="desktop"
        />,
      );

      const dialog = await screen.findByRole("dialog", {
        name: "Site navigation",
      });

      expect(dialog).toHaveAttribute("data-drawer-side", side);
      if (side === "left" || side === "right") {
        expect(dialog).toHaveStyle({ height: "100%", width: "min(360px, 100%)" });
      } else {
        expect(dialog).toHaveStyle({ height: "min(360px, 100%)", width: "100%" });
      }
    },
  );
});
