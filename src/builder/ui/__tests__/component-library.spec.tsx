import { DragDropProvider } from "@dnd-kit/react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  BUTTON_PRESET_CATALOG,
} from "@/builder/registry/blocks/button-preset-blocks";
import { INPUT_PRESET_CATALOG } from "@/builder/registry/blocks/input-preset-blocks";
import {
  blockRegistry,
  resolveBlockTemplate,
  type BlockType,
} from "@/builder/registry/block-registry";
import { resolveComponentTemplate } from "@/builder/registry/define-block-registry";
import { compileStyleValues } from "@/builder/styles/compile";
import { resolveResponsiveStyles } from "@/builder/styles/resolve";
import { ComponentLibrary } from "@/builder/ui/component-library";

afterEach(cleanup);

function renderComponentLibrary() {
  render(
    <DragDropProvider>
      <ComponentLibrary
        getBlockInsertionLabel={() => "Page root"}
        getComponentInsertionLabel={() => "Page root"}
        onInsertBlock={vi.fn()}
        onInsertComponent={vi.fn()}
      />
    </DragDropProvider>,
  );
}

describe("ComponentLibrary", () => {
  it("should render every Button thumbnail from the same template styles it inserts", () => {
    renderComponentLibrary();
    const buttonCases = [
      {
        accessibleName: "Add Button",
        node: resolveComponentTemplate({ type: "button" }),
      },
      ...BUTTON_PRESET_CATALOG.map(({ blockType }) => {
        const typedBlockType = blockType as BlockType;
        return {
          accessibleName: `Add ${blockRegistry[typedBlockType].label} button`,
          node: resolveBlockTemplate(typedBlockType),
        };
      }),
    ];

    expect(buttonCases).toHaveLength(8);
    for (const buttonCase of buttonCases) {
      const action = screen.getByRole("button", {
        name: buttonCase.accessibleName,
      });
      const preview = action.querySelector<HTMLElement>(
        ".library-rendered-component",
      );
      if (!preview) {
        throw new Error(`Expected rendered preview for ${buttonCase.accessibleName}`);
      }

      const expectedStyle = document.createElement("span").style;
      Object.assign(
        expectedStyle,
        compileStyleValues(
          resolveResponsiveStyles(buttonCase.node.styles, "desktop"),
        ),
      );
      for (const property of Array.from(expectedStyle)) {
        expect(preview.style.getPropertyValue(property)).toBe(
          expectedStyle.getPropertyValue(property),
        );
      }
    }
  });

  it("should expose Input presets backed by the shared Input primitive", () => {
    renderComponentLibrary();

    fireEvent.click(screen.getByRole("button", { name: /Forms/ }));

    expect(INPUT_PRESET_CATALOG).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Add Input" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Password reveal input" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Native controls, editable behavior."),
    ).toBeInTheDocument();
    expect(resolveBlockTemplate("input-password-reveal")).toMatchObject({
      type: "input",
      props: {
        inputType: "password",
        allowPasswordReveal: true,
      },
    });
  });

  it("should expose the reusable Image primitive in Media and find it as a logo", () => {
    renderComponentLibrary();
    const familyNavigation = screen.getByRole("navigation", {
      name: "Component families",
    });

    fireEvent.click(
      within(familyNavigation).getByRole("button", { name: /Media/ }),
    );

    expect(screen.getByRole("button", { name: "Add Image" })).toBeInTheDocument();
    expect(screen.getByText("1 shown")).toBeInTheDocument();

    fireEvent.click(
      within(familyNavigation).getByRole("button", { name: /All components/ }),
    );
    fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), {
      target: { value: "logo" },
    });

    expect(screen.getByRole("button", { name: "Add Image" })).toBeInTheDocument();
  });

  it("should filter the Forms family by component type", () => {
    renderComponentLibrary();

    fireEvent.click(screen.getByRole("button", { name: /Forms/ }));
    const filters = screen.getByRole("group", {
      name: "Form component filters",
    });

    expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(within(filters).getByRole("button", { name: "Inputs" }));

    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Add Input" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Textarea" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Password reveal input" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Dropdown" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Form" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("3 shown")).toBeInTheDocument();

    fireEvent.click(within(filters).getByRole("button", { name: "Choices" }));

    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(4);
    expect(screen.getByRole("button", { name: "Add Dropdown" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Radio Group" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Checkbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Checkbox Group" }),
    ).toBeInTheDocument();

    fireEvent.click(within(filters).getByRole("button", { name: "Forms" }));

    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Add Form" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Label" })).toBeInTheDocument();
  });

  it("should reset the Forms filter after leaving and reopening the family", () => {
    renderComponentLibrary();

    fireEvent.click(screen.getByRole("button", { name: /Forms/ }));
    fireEvent.click(screen.getByRole("button", { name: "Inputs" }));
    fireEvent.click(screen.getByRole("button", { name: /Buttons/ }));
    fireEvent.click(screen.getByRole("button", { name: /Forms/ }));

    const filters = screen.getByRole("group", {
      name: "Form component filters",
    });
    expect(within(filters).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(9);
  });

  it("should collect every prebuilt Navbar block in a dedicated Navbar section", () => {
    renderComponentLibrary();
    const familyNavigation = screen.getByRole("navigation", {
      name: "Component families",
    });

    fireEvent.click(
      within(familyNavigation).getByRole("button", { name: /Navbar/ }),
    );

    expect(
      screen.getByRole("button", { name: "Add Navbar block" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add Commerce Navbar block" }),
    ).toBeInTheDocument();
    expect(screen.getByText("2 shown")).toBeInTheDocument();

    fireEvent.click(
      within(familyNavigation).getByRole("button", { name: /Navigation/ }),
    );

    expect(screen.getByRole("button", { name: "Add Link" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Navbar block" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Add Commerce Navbar block" }),
    ).not.toBeInTheDocument();
  });

  it("should show complete non-interactive previews for both Navbar blocks", () => {
    renderComponentLibrary();

    fireEvent.click(screen.getByRole("button", { name: /Blocks/ }));

    const navbarAction = screen.getByRole("button", {
      name: "Add Navbar block",
    });
    const commerceAction = screen.getByRole("button", {
      name: "Add Commerce Navbar block",
    });

    expect(navbarAction).toHaveTextContent("WorkAboutPlaygroundResource");
    expect(navbarAction).toHaveTextContent("ihyaet@gmail.com");
    expect(commerceAction).toHaveTextContent("Brandname");
    expect(commerceAction).toHaveTextContent("Find product");
    expect(commerceAction).toHaveTextContent("Electronics");
    expect(
      navbarAction.querySelector('img[src="/saturn-mark.svg"]'),
    ).toBeInTheDocument();
    expect(
      commerceAction.querySelector('img[src="/commerce-navbar/bag.svg"]'),
    ).toBeInTheDocument();

    for (const action of [navbarAction, commerceAction]) {
      expect(
        action.querySelector(".library-rendered-block-scale"),
      ).toBeInTheDocument();
      expect(action.querySelector(".library-preview-icon")).not.toBeInTheDocument();
      expect(
        action.querySelector("button, a, input, textarea, select"),
      ).not.toBeInTheDocument();
      expect(action.closest(".library-card")).toHaveClass("is-structural-block");
    }
  });

  describe("search", () => {
    it("should find Dropdown when searching by its name", () => {
      renderComponentLibrary();

      fireEvent.change(
        screen.getByRole("searchbox", { name: "Search components" }),
        { target: { value: "dropdown" } },
      );

      expect(screen.getByRole("button", { name: "Add Dropdown" })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(1);
    });

    it("should find Dropdown and Checkbox Group for the shared select term", () => {
      renderComponentLibrary();

      fireEvent.change(
        screen.getByRole("searchbox", { name: "Search components" }),
        { target: { value: "select" } },
      );

      expect(screen.getByRole("button", { name: "Add Dropdown" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Checkbox Group" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(2);
    });

    it.each(["radio", "choice", "options"])(
      "should find Radio Group when searching by the %s term",
      (query) => {
        renderComponentLibrary();

        fireEvent.change(
          screen.getByRole("searchbox", { name: "Search components" }),
          { target: { value: query } },
        );

        expect(
          screen.getByRole("button", { name: "Add Radio Group" }),
        ).toBeInTheDocument();
      },
    );

    it.each(["textarea", "multiline", "text area"])(
      "should find Textarea when searching by its name or the %s term",
      (query) => {
        renderComponentLibrary();

        fireEvent.change(
          screen.getByRole("searchbox", { name: "Search components" }),
          { target: { value: query } },
        );

        expect(
          screen.getByRole("button", { name: "Add Textarea" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(1);
      },
    );

    it.each(["label", "field label", "caption"])(
      "should find Label when searching by the %s term",
      (query) => {
        renderComponentLibrary();

        fireEvent.change(
          screen.getByRole("searchbox", { name: "Search components" }),
          { target: { value: query } },
        );

        expect(screen.getByRole("button", { name: "Add Label" })).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(1);
      },
    );

    it.each(["boolean", "consent"])(
      "should find Checkbox when searching by the %s term",
      (query) => {
        renderComponentLibrary();

        fireEvent.change(
          screen.getByRole("searchbox", { name: "Search components" }),
          { target: { value: query } },
        );

        expect(
          screen.getByRole("button", { name: "Add Checkbox" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(1);
      },
    );

    it.each(["checkbox group", "checkboxes", "multiple", "multi-select"])(
      "should find Checkbox Group when searching by the %s term",
      (query) => {
        renderComponentLibrary();

        fireEvent.change(
          screen.getByRole("searchbox", { name: "Search components" }),
          { target: { value: query } },
        );

        expect(
          screen.getByRole("button", { name: "Add Checkbox Group" }),
        ).toBeInTheDocument();
        expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(1);
      },
    );

    it("should find both Checkbox controls for a generic checkbox search", () => {
      renderComponentLibrary();

      fireEvent.change(
        screen.getByRole("searchbox", { name: "Search components" }),
        { target: { value: "checkbox" } },
      );

      expect(screen.getByRole("button", { name: "Add Checkbox" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Checkbox Group" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(2);
    });

    it("should filter components and blocks by category without case or surrounding-space sensitivity", () => {
      renderComponentLibrary();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), {
        target: { value: "  FORMS  " },
      });

      expect(screen.getAllByRole("button", { name: /^Add / })).toHaveLength(9);
      expect(screen.getByRole("button", { name: "Add Form" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Label" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Input" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Textarea" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Dropdown" })).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Radio Group" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Checkbox" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Checkbox Group" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add Password reveal input" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Add Section" }),
      ).not.toBeInTheDocument();
    });

    it("should show an empty result state when no library entry matches", () => {
      renderComponentLibrary();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search components" }), {
        target: { value: "missing-widget" },
      });

      expect(screen.getByText("No matching components")).toBeInTheDocument();
      expect(screen.getByText("0 shown")).toHaveAttribute("aria-live", "polite");
      expect(screen.queryByRole("button", { name: /^Add / })).not.toBeInTheDocument();
    });

    it("should restore all results when the accessible clear action is used", () => {
      renderComponentLibrary();
      const searchbox = screen.getByRole("searchbox", { name: "Search components" });
      fireEvent.change(searchbox, { target: { value: "navbar" } });

      fireEvent.click(screen.getByRole("button", { name: "Clear component search" }));

      expect(searchbox).toHaveValue("");
      expect(
        screen.queryByRole("button", { name: "Clear component search" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add Section" })).toBeInTheDocument();
      expect(screen.queryByText("No matching components")).not.toBeInTheDocument();
    });
  });
});
