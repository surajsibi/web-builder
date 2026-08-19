import type {
  BlockDefinition,
  ComponentTemplate,
} from "@/builder/registry/define-block-registry";
import { px, spacing } from "@/builder/registry/components/style-defaults";

import { CommerceNavbarBlockIcon } from "./block-icons";

const FONT_FAMILY = "Inter, ui-sans-serif, system-ui, sans-serif";
const NAVBAR_CONTENT_MAX_WIDTH = 1232;

function createIconSurface(
  source: string,
  size: number,
  mobileDisplay: "block" | "none" = "block",
): ComponentTemplate {
  return {
    type: "text",
    props: { text: "", semanticTag: "span" },
    styles: {
      base: {
        display: "block",
        width: { mode: "fixed", value: size, unit: "px" },
        height: { mode: "fixed", value: size, unit: "px" },
        minWidth: px(size),
        maxWidth: px(size),
        margin: spacing(0, 0, 0, 0),
        padding: spacing(0, 0, 0, 0),
        color: "transparent",
        fontSize: px(0),
        lineHeight: 1,
        backgroundImage: {
          kind: "image",
          source,
          size: "contain",
          positionX: "center",
          positionY: "center",
          repeat: "no-repeat",
        },
      },
      mobile: { display: mobileDisplay },
    },
  };
}

function createTextLink(
  text: string,
  href: string,
  options: {
    color?: string;
    fontSize?: number;
    fontWeight?: number;
    padding?: ReturnType<typeof spacing>;
  } = {},
): ComponentTemplate {
  return {
    type: "link",
    props: { text, href, openInNewTab: false },
    styles: {
      base: {
        display: "flex",
        width: { mode: "fit" },
        height: { mode: "auto" },
        padding: options.padding ?? spacing(0, 0, 0, 0),
        backgroundColor: "transparent",
        color: options.color ?? "#171a24",
        fontFamily: FONT_FAMILY,
        fontSize: px(options.fontSize ?? 13),
        fontWeight: options.fontWeight ?? 500,
        lineHeight: 1.15,
        textDecoration: "none",
      },
    },
  };
}

function createUtilityAction(
  iconSource: string,
  eyebrow: string,
  label: string,
  href: string,
): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "div" },
    styles: {
      base: {
        display: "flex",
        width: { mode: "fit" },
        maxWidth: { value: 100, unit: "%" },
        margin: spacing(0, 0, 0, 0),
        padding: spacing(0, 0, 0, 0),
        flex: {
          direction: "row",
          wrap: "nowrap",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: px(7),
        },
      },
    },
    children: [
      createIconSurface(iconSource, 24),
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fit" },
            maxWidth: { value: 90, unit: "px" },
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 0, 0, 0),
            flex: {
              direction: "column",
              wrap: "nowrap",
              justifyContent: "center",
              alignItems: "flex-start",
              gap: px(1),
            },
          },
        },
        children: [
          {
            type: "text",
            props: { text: eyebrow, semanticTag: "span" },
            styles: {
              base: {
                display: "block",
                width: { mode: "fit" },
                color: "#dce3ff",
                fontFamily: FONT_FAMILY,
                fontSize: px(9),
                fontWeight: 400,
                lineHeight: 1.05,
              },
            },
          },
          createTextLink(label, href, {
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 500,
          }),
        ],
      },
    ],
  };
}

function createPrimaryBar(): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "div" },
    styles: {
      base: {
        display: "flex",
        width: { mode: "fill" },
        height: { mode: "auto" },
        maxWidth: px(NAVBAR_CONTENT_MAX_WIDTH),
        margin: {
          top: px(0),
          right: { keyword: "auto" },
          bottom: px(0),
          left: { keyword: "auto" },
        },
        padding: spacing(0, 0, 0, 0),
        flex: {
          direction: "row",
          wrap: "nowrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: px(14),
        },
      },
      tablet: { padding: spacing(0, 0, 0, 0) },
      mobile: {
        padding: spacing(0, 0, 0, 0),
        flex: {
          direction: "column",
          wrap: "nowrap",
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: px(12),
        },
      },
    },
    children: [
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fixed", value: 150, unit: "px" },
            minWidth: px(150),
            maxWidth: px(150),
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 0, 0, 0),
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: px(7),
            },
          },
          tablet: {
            width: { mode: "fixed", value: 126, unit: "px" },
            minWidth: px(126),
            maxWidth: px(126),
          },
          mobile: {
            width: { mode: "fill" },
            minWidth: px(0),
            maxWidth: { value: 100, unit: "%" },
            flex: { justifyContent: "center" },
          },
        },
        children: [
          {
            type: "image",
            props: {
              src: "/commerce-navbar/bag.svg",
              alt: "",
              href: "",
              openInNewTab: false,
              fit: "contain",
            },
            styles: {
              base: {
                display: "block",
                width: { mode: "fixed", value: 30, unit: "px" },
                height: { mode: "fixed", value: 30, unit: "px" },
                minWidth: px(30),
                maxWidth: px(30),
                margin: spacing(0, 0, 0, 0),
                padding: spacing(0, 0, 0, 0),
              },
            },
          },
          createTextLink("Brandname", "#top", {
            color: "#ffffff",
            fontSize: 19,
            fontWeight: 700,
          }),
        ],
      },
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fixed", value: 140, unit: "px" },
            minWidth: px(140),
            maxWidth: px(140),
            margin: spacing(0, 0, 0, 0),
            padding: spacing(10, 10, 10, 10),
            backgroundColor: "#2940db",
            borderRadius: px(7),
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: px(7),
            },
          },
          tablet: { display: "none" },
          mobile: { display: "none" },
        },
        children: [
          createIconSurface("/commerce-navbar/location.svg", 20),
          createTextLink("United States...", "#location", {
            color: "#ffffff",
            fontSize: 12,
            fontWeight: 500,
          }),
        ],
      },
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fill" },
            height: { mode: "fixed", value: 42, unit: "px" },
            minWidth: px(180),
            maxWidth: { value: 620, unit: "px" },
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 2, 0, 0),
            backgroundColor: "#ffffff",
            borderRadius: px(7),
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: px(0),
            },
          },
          mobile: {
            width: { mode: "fill" },
            minWidth: px(0),
            maxWidth: { value: 100, unit: "%" },
          },
        },
        children: [
          {
            type: "input",
            props: {
              label: "Find product",
              controlId: "",
              name: "product-search",
              inputType: "text",
              allowPasswordReveal: false,
              placeholder: "Find product",
              defaultValue: "",
              required: false,
              disabled: false,
            },
            styles: {
              base: {
                display: "block",
                width: { mode: "fill" },
                height: { mode: "fill" },
                minWidth: px(0),
                padding: spacing(0, 12, 0, 12),
                backgroundColor: "#ffffff",
                color: "#5e6475",
                fontFamily: FONT_FAMILY,
                fontSize: px(13),
                fontWeight: 400,
                lineHeight: 1.2,
                borderWidth: { value: 0, unit: "px" },
                borderStyle: "none",
                borderColor: "transparent",
                borderRadius: px(7),
              },
            },
          },
          {
            type: "button",
            props: {
              text: "Search",
              href: "",
              openInNewTab: false,
              icon: null,
              iconPosition: "start",
              iconAnimation: "none",
              behavior: "button",
            },
            styles: {
              base: {
                display: "block",
                width: { mode: "fixed", value: 40, unit: "px" },
                height: { mode: "fixed", value: 38, unit: "px" },
                minWidth: px(40),
                padding: spacing(0, 0, 0, 0),
                backgroundColor: "#f5f7ff",
                backgroundImage: {
                  kind: "image",
                  source: "/commerce-navbar/search.svg",
                  size: "contain",
                  positionX: "center",
                  positionY: "center",
                  repeat: "no-repeat",
                },
                color: "transparent",
                fontSize: px(0),
                lineHeight: 1,
                borderWidth: { value: 0, unit: "px" },
                borderStyle: "none",
                borderColor: "transparent",
                borderRadius: px(6),
              },
            },
          },
        ],
      },
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fixed", value: 302, unit: "px" },
            minWidth: px(302),
            maxWidth: px(302),
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 0, 0, 0),
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: px(12),
            },
          },
          tablet: {
            width: { mode: "fixed", value: 278, unit: "px" },
            minWidth: px(278),
            maxWidth: px(278),
            flex: { gap: px(8) },
          },
          mobile: {
            width: { mode: "fill" },
            minWidth: px(0),
            maxWidth: { value: 100, unit: "%" },
            flex: { justifyContent: "space-around", gap: px(8) },
          },
        },
        children: [
          createUtilityAction(
            "/commerce-navbar/heart.svg",
            "Saved",
            "0 items",
            "#saved",
          ),
          createUtilityAction(
            "/commerce-navbar/user.svg",
            "Account",
            "Sign in",
            "#account",
          ),
          createUtilityAction(
            "/commerce-navbar/cart.svg",
            "My cart",
            "0 items",
            "#cart",
          ),
        ],
      },
    ],
  };
}

function createMegaMenuColumn(
  title: string,
  href: string,
  items: readonly { text: string; href: string }[],
): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "div" },
    styles: {
      base: {
        display: "flex",
        width: { mode: "fill" },
        maxWidth: { value: 100, unit: "%" },
        margin: spacing(0, 0, 0, 0),
        padding: spacing(0, 0, 0, 0),
        flex: {
          direction: "column",
          wrap: "nowrap",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          gap: px(9),
        },
      },
    },
    children: [
      createTextLink(title, href, {
        color: "#171a24",
        fontSize: 14,
        fontWeight: 700,
        padding: spacing(0, 0, 3, 0),
      }),
      ...items.map((item) =>
        createTextLink(item.text, item.href, {
          color: "#5e6475",
          fontSize: 12,
          fontWeight: 500,
        }),
      ),
    ],
  };
}

function createCategoryDisclosure(): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "details" },
    styles: {
      base: {
        display: "block",
        width: { mode: "fit" },
        maxWidth: { value: 100, unit: "%" },
        margin: spacing(0, 0, 0, 0),
        padding: spacing(0, 0, 0, 0),
        position: "relative",
        zIndex: 30,
      },
      mobile: { width: { mode: "fill" } },
    },
    children: [
      {
        type: "container",
        props: { semanticTag: "summary" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fit" },
            maxWidth: { value: 100, unit: "%" },
            margin: spacing(0, 0, 0, 0),
            padding: spacing(5, 0, 5, 0),
            color: "#171a24",
            fontFamily: FONT_FAMILY,
            fontSize: px(13),
            fontWeight: 600,
            lineHeight: 1.15,
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: px(7),
            },
          },
          mobile: {
            width: { mode: "fill" },
            flex: { justifyContent: "center" },
          },
        },
        children: [
          createIconSurface("/commerce-navbar/menu.svg", 18),
          {
            type: "text",
            props: { text: "All category", semanticTag: "span" },
            styles: {
              base: {
                display: "block",
                width: { mode: "fit" },
                margin: spacing(0, 0, 0, 0),
                padding: spacing(0, 0, 0, 0),
                color: "#171a24",
                fontFamily: FONT_FAMILY,
                fontSize: px(13),
                fontWeight: 600,
                lineHeight: 1.15,
              },
            },
          },
          createIconSurface("/commerce-navbar/chevron-down.svg", 13),
        ],
      },
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "grid",
            width: { mode: "fixed", value: 720, unit: "px" },
            height: { mode: "auto" },
            maxWidth: { value: 720, unit: "px" },
            margin: spacing(0, 0, 0, 0),
            padding: spacing(24, 24, 24, 24),
            backgroundColor: "#ffffff",
            borderWidth: { value: 1, unit: "px" },
            borderStyle: "solid",
            borderColor: "#e1e4ec",
            borderRadius: px(10),
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 14,
                blurRadius: 30,
                spreadRadius: -12,
                unit: "px",
                color: "#11182738",
                inset: false,
              },
            ],
            position: "absolute",
            zIndex: 40,
            grid: {
              columns: 4,
              columnGap: px(24),
              rowGap: px(20),
              alignItems: "start",
            },
          },
          tablet: {
            width: { mode: "fixed", value: 640, unit: "px" },
            maxWidth: { value: 640, unit: "px" },
            padding: spacing(20, 20, 20, 20),
            grid: { columns: 2 },
          },
          mobile: {
            width: { mode: "fill" },
            maxWidth: { value: 100, unit: "%" },
            margin: spacing(8, 0, 0, 0),
            padding: spacing(18, 18, 18, 18),
            position: "static",
            grid: { columns: 1, rowGap: px(18) },
          },
        },
        children: [
          createMegaMenuColumn("Electronics", "#electronics", [
            { text: "Smartphones", href: "#smartphones" },
            { text: "Laptops", href: "#laptops" },
            { text: "Cameras", href: "#cameras" },
            { text: "Audio", href: "#audio" },
          ]),
          createMegaMenuColumn("Fashion", "#clothes", [
            { text: "Men", href: "#men" },
            { text: "Women", href: "#women" },
            { text: "Shoes", href: "#shoes" },
            { text: "Accessories", href: "#accessories" },
          ]),
          createMegaMenuColumn("Home & Living", "#home-living", [
            { text: "Furniture", href: "#furniture" },
            { text: "Kitchen", href: "#kitchen" },
            { text: "Decor", href: "#decor" },
            { text: "Bedding", href: "#bedding" },
          ]),
          createMegaMenuColumn("More to explore", "#categories", [
            { text: "Auto parts", href: "#auto-parts" },
            { text: "Sports & fitness", href: "#sports-fitness" },
            { text: "Outdoor", href: "#outdoor" },
            { text: "Gift boxes", href: "#gift-boxes" },
          ]),
        ],
      },
    ],
  };
}

function createCategoryBar(): ComponentTemplate {
  const categoryLink = (text: string, href: string) =>
    createTextLink(text, href, {
      color: "#171a24",
      fontSize: 13,
      fontWeight: 500,
      padding: spacing(5, 0, 5, 0),
    });

  return {
    type: "container",
    props: { semanticTag: "nav" },
    styles: {
      base: {
        display: "flex",
        width: { mode: "fill" },
        height: { mode: "auto" },
        minHeight: px(40),
        maxWidth: px(NAVBAR_CONTENT_MAX_WIDTH),
        margin: {
          top: px(0),
          right: { keyword: "auto" },
          bottom: px(0),
          left: { keyword: "auto" },
        },
        padding: spacing(7, 0, 7, 0),
        flex: {
          direction: "row",
          wrap: "wrap",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: px(24),
        },
      },
      tablet: {
        padding: spacing(8, 0, 8, 0),
        flex: { gap: px(18) },
      },
      mobile: {
        padding: spacing(10, 0, 10, 0),
        flex: { justifyContent: "center", gap: px(12) },
      },
    },
    children: [
      createCategoryDisclosure(),
      {
        type: "text",
        props: { text: "", semanticTag: "span" },
        styles: {
          base: {
            display: "block",
            width: { mode: "fixed", value: 1, unit: "px" },
            height: { mode: "fixed", value: 25, unit: "px" },
            minWidth: px(1),
            maxWidth: px(1),
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 0, 0, 0),
            backgroundColor: "#d8dae3",
            color: "transparent",
            fontSize: px(0),
            lineHeight: 1,
          },
          mobile: { display: "none" },
        },
      },
      categoryLink("Electronics", "#electronics"),
      categoryLink("Auto parts", "#auto-parts"),
      categoryLink("Bestsellers", "#bestsellers"),
      categoryLink("Clothes", "#clothes"),
      categoryLink("Gift boxes", "#gift-boxes"),
      categoryLink("New arrivals", "#new-arrivals"),
      {
        type: "container",
        props: { semanticTag: "div" },
        styles: {
          base: {
            display: "flex",
            width: { mode: "fit" },
            maxWidth: { value: 100, unit: "%" },
            margin: spacing(0, 0, 0, 0),
            padding: spacing(0, 0, 0, 0),
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "flex-start",
              alignItems: "center",
              gap: px(4),
            },
          },
        },
        children: [
          categoryLink("More", "#more"),
          createIconSurface("/commerce-navbar/chevron-down.svg", 12),
        ],
      },
    ],
  };
}

function createPrimaryRow(): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "div" },
    styles: {
      base: {
        display: "block",
        width: { mode: "fill" },
        minHeight: px(64),
        maxWidth: { value: 100, unit: "%" },
        margin: spacing(0, 0, 0, 0),
        padding: spacing(10, 24, 10, 24),
        backgroundColor: "#3048f4",
      },
      tablet: { padding: spacing(10, 20, 10, 20) },
      mobile: { padding: spacing(14, 16, 14, 16) },
    },
    children: [createPrimaryBar()],
  };
}

function createCategoryRow(): ComponentTemplate {
  return {
    type: "container",
    props: { semanticTag: "div" },
    styles: {
      base: {
        display: "block",
        width: { mode: "fill" },
        minHeight: px(40),
        maxWidth: { value: 100, unit: "%" },
        margin: spacing(0, 0, 0, 0),
        padding: spacing(0, 24, 0, 24),
        backgroundColor: "#ffffff",
        boxShadow: [
          {
            offsetX: 0,
            offsetY: 3,
            blurRadius: 5,
            spreadRadius: -3,
            unit: "px",
            color: "#11182755",
            inset: false,
          },
        ],
      },
      tablet: { padding: spacing(0, 20, 0, 20) },
      mobile: { padding: spacing(0, 16, 0, 16) },
    },
    children: [createCategoryBar()],
  };
}

export function createCommerceNavbarTemplate(): ComponentTemplate {
  return {
    type: "section",
    props: { semanticTag: "header", anchorId: "" },
    styles: {
      base: {
        padding: spacing(0, 0, 0, 0),
        backgroundColor: "#e8eaf4",
      },
      mobile: { padding: spacing(0, 0, 0, 0) },
    },
    children: [createPrimaryRow(), createCategoryRow()],
  };
}

export const commerceNavbarBlockDefinition: BlockDefinition = {
  library: {
    label: "Commerce Navbar",
    category: "Navigation",
    family: "navbar",
    icon: CommerceNavbarBlockIcon,
  },
  createTemplate: createCommerceNavbarTemplate,
};
