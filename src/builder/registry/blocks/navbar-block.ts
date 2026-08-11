import type { ComponentTemplate } from "@/builder/registry/define-block-registry";
import { px, spacing } from "@/builder/registry/components/style-defaults";

import { NavbarBlockIcon } from "./block-icons";

const NAVBAR_CONTENT_MAX_WIDTH = 1232;

const navigationLinkStyles = {
  base: {
    display: "block" as const,
    width: { mode: "fit" as const },
    padding: spacing(16, 4, 16, 4),
    backgroundColor: "transparent",
    color: "#f7f7f5",
    fontSize: px(20),
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: px(-0.5),
    textAlign: "center" as const,
    textDecoration: "none" as const,
  },
  mobile: {
    width: { mode: "fill" as const },
    padding: spacing(12, 8, 12, 8),
  },
};

export function createNavbarTemplate(): ComponentTemplate {
  return {
    type: "section",
    props: { semanticTag: "header", anchorId: "" },
    styles: {
      base: {
        padding: spacing(28, 12, 21, 12),
        backgroundColor: "#f4f5f5",
      },
      mobile: { padding: spacing(16, 12, 16, 12) },
    },
    children: [
      {
        type: "container",
        props: { semanticTag: "nav" },
        styles: {
          base: {
            display: "flex",
            maxWidth: px(NAVBAR_CONTENT_MAX_WIDTH),
            padding: spacing(10, 10, 10, 10),
            backgroundColor: "#202020",
            borderWidth: { value: 0, unit: "px" },
            borderStyle: "none",
            borderColor: "transparent",
            borderRadius: px(999),
            boxShadow: [
              {
                offsetX: 0,
                offsetY: 14,
                blurRadius: 22,
                spreadRadius: -9,
                unit: "px",
                color: "#11182770",
                inset: false,
              },
            ],
            flex: {
              direction: "row",
              wrap: "nowrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: px(24),
            },
          },
          tablet: {
            padding: spacing(10, 10, 10, 10),
          },
          mobile: {
            padding: spacing(10, 10, 10, 10),
            borderRadius: px(28),
            flex: {
              direction: "column",
              justifyContent: "flex-start",
              alignItems: "stretch",
              gap: px(10),
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
                width: { mode: "fit" },
                maxWidth: { value: 100, unit: "%" },
                margin: spacing(0, 0, 0, 0),
                padding: spacing(0, 0, 0, 0),
                flex: {
                  direction: "row",
                  wrap: "nowrap",
                  justifyContent: "flex-start",
                  alignItems: "center",
                  gap: px(38),
                },
              },
              tablet: {
                padding: spacing(0, 0, 0, 0),
              },
              mobile: {
                width: { mode: "fill" },
                padding: spacing(0, 0, 0, 0),
                flex: {
                  direction: "column",
                  wrap: "nowrap",
                  alignItems: "stretch",
                  gap: px(4),
                },
              },
            },
            children: [
              {
                type: "image",
                props: {
                  src: "/saturn-mark.svg",
                  alt: "Home",
                  href: "#top",
                  openInNewTab: false,
                  fit: "contain",
                },
                styles: {
                  base: {
                    display: "block",
                    width: { mode: "fixed", value: 56, unit: "px" },
                    height: { mode: "fixed", value: 56, unit: "px" },
                    minWidth: px(56),
                    maxWidth: px(56),
                    margin: spacing(0, 0, 0, 0),
                    padding: spacing(0, 0, 0, 0),
                    borderRadius: px(999),
                  },
                  mobile: {
                    margin: {
                      right: { keyword: "auto" },
                      left: { keyword: "auto" },
                    },
                  },
                },
              },
              {
                type: "link",
                props: {
                  text: "Work",
                  href: "#work",
                  openInNewTab: false,
                },
                styles: navigationLinkStyles,
              },
              {
                type: "link",
                props: {
                  text: "About",
                  href: "#about",
                  openInNewTab: false,
                },
                styles: navigationLinkStyles,
              },
              {
                type: "link",
                props: {
                  text: "Playground",
                  href: "#playground",
                  openInNewTab: false,
                },
                styles: navigationLinkStyles,
              },
              {
                type: "link",
                props: {
                  text: "Resource",
                  href: "#resource",
                  openInNewTab: false,
                },
                styles: navigationLinkStyles,
              },
            ],
          },
          {
            type: "button",
            props: {
              text: "ihyaet@gmail.com",
              href: "mailto:ihyaet@gmail.com",
              openInNewTab: false,
              icon: null,
              iconPosition: "start",
              behavior: "button",
            },
            styles: {
              base: {
                width: { mode: "fixed", value: 208, unit: "px" },
                height: { mode: "fixed", value: 56, unit: "px" },
                padding: spacing(0, 14, 0, 14),
                backgroundColor: "#ffffff",
                color: "#202020",
                fontSize: px(20),
                fontWeight: 500,
                lineHeight: 1.2,
                letterSpacing: px(-0.5),
                textDecoration: "none",
                borderWidth: { value: 0, unit: "px" },
                borderStyle: "none",
                borderColor: "transparent",
                borderRadius: px(999),
              },
              mobile: {
                width: { mode: "fill" },
              },
            },
          },
        ],
      },
    ],
  };
}

export const navbarBlockDefinition = {
  label: "Navbar",
  category: "Navigation",
  icon: NavbarBlockIcon,
  createTemplate: createNavbarTemplate,
};
