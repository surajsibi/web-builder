import { describe, expect, it } from "vitest";

import {
  blockRegistry,
  resolveBlockTemplate,
} from "@/builder/registry/block-registry";
import {
  validateBlockRegistry,
  type BlockDefinition,
} from "@/builder/registry/define-block-registry";

function TestIcon() {
  return null;
}

function createDefinition(
  createTemplate: BlockDefinition["createTemplate"],
): BlockDefinition {
  return {
    label: "Test block",
    category: "Test",
    icon: TestIcon,
    createTemplate,
  };
}

describe("blockRegistry", () => {
  it("should expose a resolved Navbar template composed from editable primitives", () => {
    const template = resolveBlockTemplate("navbar");

    expect(Object.keys(blockRegistry)).toEqual([
      "navbar",
      "commerce-navbar",
      "button-outline",
      "button-soft-pill",
      "button-arrow-shift",
      "button-raised-3d",
      "button-gradient",
      "button-glass",
      "button-glow",
      "input-password-reveal",
    ]);
    expect(template.type).toBe("section");
    expect(template.props).toMatchObject({ semanticTag: "header" });
    expect(template.children).toHaveLength(1);
    expect(template.children[0]).toMatchObject({
      type: "container",
      props: { semanticTag: "nav" },
    });

    const navigation = template.children[0];
    expect(navigation.componentVersion).toBe(3);
    expect(navigation.styles.base.maxWidth).toEqual({
      value: 1232,
      unit: "px",
    });
    expect(navigation.children.map((child) => child.type)).toEqual([
      "container",
      "button",
    ]);
    expect(navigation.styles.base).toMatchObject({
      backgroundColor: "#202020",
      borderRadius: { value: 999, unit: "px" },
    });
    expect(navigation.styles.mobile?.flex).toMatchObject({
      direction: "column",
      alignItems: "stretch",
    });
    const menu = navigation.children[0];
    expect(menu.children.map((child) => child.type)).toEqual([
      "image",
      "link",
      "link",
      "link",
      "link",
    ]);
    expect(menu.children[0].props).toMatchObject({
      src: "/saturn-mark.svg",
      alt: "Home",
      href: "#top",
      fit: "contain",
    });
    expect(
      menu.children.slice(1).map((child) => child.props.href),
    ).toEqual(["#work", "#about", "#playground", "#resource"]);
    expect(navigation.children[1].props).toMatchObject({
      text: "ihyaet@gmail.com",
      href: "mailto:ihyaet@gmail.com",
    });
  });

  it("should expose the Commerce Navbar as a separate two-row editable template", () => {
    const template = resolveBlockTemplate("commerce-navbar");

    expect(template).toMatchObject({
      type: "section",
      props: { semanticTag: "header" },
    });
    expect(template.children).toHaveLength(2);

    expect(template.styles.base.padding).toEqual({
      top: { value: 0, unit: "px" },
      right: { value: 0, unit: "px" },
      bottom: { value: 0, unit: "px" },
      left: { value: 0, unit: "px" },
    });

    const [primaryRow, categoryRow] = template.children;
    expect(primaryRow).toMatchObject({
      type: "container",
      props: { semanticTag: "div" },
    });
    expect(primaryRow.styles.base).toMatchObject({
      maxWidth: { value: 100, unit: "%" },
      backgroundColor: "#3048f4",
    });
    expect(primaryRow.children).toHaveLength(1);

    const primaryBar = primaryRow.children[0];
    expect(primaryBar.styles.base.maxWidth).toEqual({
      value: 1232,
      unit: "px",
    });
    expect(primaryBar.children.map((child) => child.type)).toEqual([
      "container",
      "container",
      "container",
      "container",
    ]);

    const [brand, location, search, actions] = primaryBar.children;
    expect(brand.children[0]).toMatchObject({
      type: "image",
      props: {
        src: "/commerce-navbar/bag.svg",
        alt: "",
        href: "",
        fit: "contain",
      },
    });
    expect(brand.children[1].props).toMatchObject({
      text: "Brandname",
      href: "#top",
    });
    expect(location.children[0].styles.base.backgroundImage).toMatchObject({
      source: "/commerce-navbar/location.svg",
    });
    expect(search.children.map((child) => child.type)).toEqual([
      "input",
      "button",
    ]);
    expect(search.children[0].props).toMatchObject({
      label: "Find product",
      placeholder: "Find product",
    });
    expect(search.children[1].styles.base.backgroundImage).toMatchObject({
      source: "/commerce-navbar/search.svg",
    });
    expect(actions.children).toHaveLength(3);
    expect(
      actions.children.map(
        (action) => action.children[0].styles.base.backgroundImage,
      ),
    ).toEqual([
      expect.objectContaining({ source: "/commerce-navbar/heart.svg" }),
      expect.objectContaining({ source: "/commerce-navbar/user.svg" }),
      expect.objectContaining({ source: "/commerce-navbar/cart.svg" }),
    ]);

    expect(categoryRow).toMatchObject({
      type: "container",
      props: { semanticTag: "div" },
    });
    expect(categoryRow.styles.base).toMatchObject({
      maxWidth: { value: 100, unit: "%" },
      backgroundColor: "#ffffff",
    });
    expect(categoryRow.children).toHaveLength(1);

    const categoryBar = categoryRow.children[0];
    expect(categoryBar).toMatchObject({
      type: "container",
      props: { semanticTag: "nav" },
    });
    expect(categoryBar.styles.base.maxWidth).toEqual({
      value: 1232,
      unit: "px",
    });
    const categoryDisclosure = categoryBar.children[0];
    expect(categoryDisclosure).toMatchObject({
      type: "container",
      props: { semanticTag: "details" },
    });
    const [categorySummary, megaMenu] = categoryDisclosure.children;
    expect(categorySummary).toMatchObject({
      type: "container",
      props: { semanticTag: "summary" },
    });
    expect(categorySummary.children[0].styles.base.backgroundImage).toMatchObject(
      { source: "/commerce-navbar/menu.svg" },
    );
    expect(categorySummary.children[1].props).toMatchObject({
      text: "All category",
      semanticTag: "span",
    });
    expect(categorySummary.children[2].styles.base.backgroundImage).toMatchObject(
      { source: "/commerce-navbar/chevron-down.svg" },
    );
    expect(megaMenu.styles.base).toMatchObject({
      display: "grid",
      position: "absolute",
      grid: { columns: 4 },
    });
    expect(megaMenu.styles.mobile).toMatchObject({
      position: "static",
      grid: { columns: 1 },
    });
    expect(
      megaMenu.children.map((column) => column.children[0].props.text),
    ).toEqual([
      "Electronics",
      "Fashion",
      "Home & Living",
      "More to explore",
    ]);
    expect(
      megaMenu.children.flatMap((column) =>
        column.children.slice(1).map((link) => link.props.text),
      ),
    ).toEqual([
      "Smartphones",
      "Laptops",
      "Cameras",
      "Audio",
      "Men",
      "Women",
      "Shoes",
      "Accessories",
      "Furniture",
      "Kitchen",
      "Decor",
      "Bedding",
      "Auto parts",
      "Sports & fitness",
      "Outdoor",
      "Gift boxes",
    ]);
    expect(
      categoryBar.children
        .filter((child) => child.type === "link")
        .map((child) => child.props.text),
    ).toEqual([
      "Electronics",
      "Auto parts",
      "Bestsellers",
      "Clothes",
      "Gift boxes",
      "New arrivals",
    ]);
  });

  it("should resolve the Password reveal preset to one editable Input primitive", () => {
    const template = resolveBlockTemplate("input-password-reveal");

    expect(template).toMatchObject({
      type: "input",
      componentVersion: 3,
      props: {
        label: "Password",
        controlId: "",
        name: "password",
        inputType: "password",
        allowPasswordReveal: true,
        placeholder: "Enter password",
      },
      children: [],
    });
  });

  it("should resolve a Button preset to one editable Button primitive", () => {
    const template = resolveBlockTemplate("button-raised-3d");

    expect(template).toMatchObject({
      type: "button",
      props: {
        text: "Start building",
        icon: "arrow-right",
        iconPosition: "end",
        iconAnimation: "none",
        behavior: "button",
      },
      styles: {
        base: {
          backgroundColor: "#f7c84c",
          borderColor: "#9f7118",
          borderStyle: "solid",
          borderWidth: { value: 2, unit: "px" },
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 5,
              blurRadius: 0,
              spreadRadius: 0,
              unit: "px",
              color: "#9f7118",
              inset: false,
            },
          ],
        },
      },
      children: [],
    });
  });

  it("should define glass and glow looks with reusable style effects", () => {
    const glass = resolveBlockTemplate("button-glass");
    const glow = resolveBlockTemplate("button-glow");

    expect(glass.styles.base).toMatchObject({
      backdropBlur: { value: 12, unit: "px" },
      boxShadow: [
        expect.objectContaining({ inset: true }),
        expect.objectContaining({ blurRadius: 24, inset: false }),
      ],
    });
    expect(glow.styles.base.boxShadow).toEqual([
      expect.objectContaining({ blurRadius: 0, spreadRadius: 3 }),
      expect.objectContaining({ blurRadius: 18, offsetY: 7 }),
    ]);
  });

  it("should preserve the Arrow shift interaction on the resolved Button", () => {
    const template = resolveBlockTemplate("button-arrow-shift");

    expect(template).toMatchObject({
      type: "button",
      props: {
        text: "Explore",
        icon: "arrow-right",
        iconPosition: "end",
        iconAnimation: "shift-right",
      },
      children: [],
    });
  });
});

describe("validateBlockRegistry", () => {
  it("should reject a template that references an unknown component type", () => {
    const definition = createDefinition(() => ({
      type: "missing",
    }) as never);

    expect(() => validateBlockRegistry({ broken: definition })).toThrow(
      "broken.root references unknown component type: missing",
    );
  });

  it("should reject invalid final props after applying template overrides", () => {
    const definition = createDefinition(() => ({
      type: "link",
      props: { text: "Broken", href: "", openInNewTab: false },
    }));

    expect(() => validateBlockRegistry({ broken: definition })).toThrow(
      "broken.root props are invalid",
    );
  });

  it("should reject an internal edge that violates component placement", () => {
    const definition = createDefinition(() => ({
      type: "link",
      children: [{ type: "text" }],
    }));

    expect(() => validateBlockRegistry({ broken: definition })).toThrow(
      "broken.root.children[0] cannot place text inside link",
    );
  });
});
