import type {
  BlockDefinition,
  ComponentTemplate,
  ComponentTemplateStyleOverrides,
} from "@/builder/registry/define-block-registry";
import { ButtonIcon } from "@/builder/registry/components/component-icons";
import { px, spacing } from "@/builder/registry/components/style-defaults";

export type ButtonPresetGroup = "essential" | "animated" | "3d" | "special";

export const BUTTON_PRESET_CATALOG = [
  {
    blockType: "button-outline",
    group: "essential",
  },
  {
    blockType: "button-soft-pill",
    group: "essential",
  },
  {
    blockType: "button-arrow-shift",
    group: "animated",
  },
  {
    blockType: "button-raised-3d",
    group: "3d",
  },
  {
    blockType: "button-gradient",
    group: "special",
  },
  {
    blockType: "button-glass",
    group: "special",
  },
  {
    blockType: "button-glow",
    group: "special",
  },
] as const satisfies readonly {
  blockType: string;
  group: ButtonPresetGroup;
}[];

type ButtonPresetOptions = {
  label: string;
  text: string;
  icon?: "arrow-right";
  iconAnimation?: "shift-right";
  styles: ComponentTemplateStyleOverrides;
};

function createButtonPresetDefinition({
  label,
  text,
  icon,
  iconAnimation,
  styles,
}: ButtonPresetOptions): BlockDefinition {
  return {
    library: {
      label,
      category: "Button presets",
      family: "buttons",
      icon: ButtonIcon,
    },
    createTemplate: (): ComponentTemplate => ({
      type: "button",
      props: {
        text,
        href: "",
        openInNewTab: false,
        icon: icon ?? null,
        iconPosition: "end",
        iconAnimation: iconAnimation ?? "none",
        behavior: "button",
      },
      styles,
    }),
  };
}

export const buttonOutlineBlockDefinition = createButtonPresetDefinition({
  label: "Clean outline",
  text: "Learn more",
  styles: {
    base: {
      backgroundColor: "transparent",
      color: "#17201f",
      borderWidth: { value: 1, unit: "px" },
      borderStyle: "solid",
      borderColor: "#17201f",
      borderRadius: px(8),
      fontWeight: 600,
    },
  },
});

export const buttonSoftPillBlockDefinition = createButtonPresetDefinition({
  label: "Soft pill",
  text: "See details",
  styles: {
    base: {
      padding: spacing(11, 22, 11, 22),
      backgroundColor: "#ede9fe",
      color: "#5b45d6",
      borderWidth: { value: 0, unit: "px" },
      borderStyle: "none",
      borderColor: "transparent",
      borderRadius: px(999),
      fontWeight: 600,
    },
  },
});

export const buttonArrowShiftBlockDefinition = createButtonPresetDefinition({
  label: "Arrow shift",
  text: "Explore",
  icon: "arrow-right",
  iconAnimation: "shift-right",
  styles: {
    base: {
      backgroundColor: "#17201f",
      color: "#ffffff",
      borderWidth: { value: 1, unit: "px" },
      borderStyle: "solid",
      borderColor: "#17201f",
      borderRadius: px(8),
      fontWeight: 600,
    },
  },
});

export const buttonRaised3dBlockDefinition = createButtonPresetDefinition({
  label: "Raised 3D",
  text: "Start building",
  icon: "arrow-right",
  styles: {
    base: {
      backgroundColor: "#f7c84c",
      backgroundImage: {
        kind: "linear-gradient",
        angle: 180,
        startColor: "#fbd76d",
        endColor: "#eab832",
      },
      color: "#3d2b08",
      borderWidth: { value: 2, unit: "px" },
      borderStyle: "solid",
      borderColor: "#9f7118",
      borderRadius: px(8),
      fontWeight: 700,
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
});

export const buttonGradientBlockDefinition = createButtonPresetDefinition({
  label: "Violet gradient",
  text: "Get started",
  styles: {
    base: {
      backgroundColor: "#6d5dfc",
      backgroundImage: {
        kind: "linear-gradient",
        angle: 135,
        startColor: "#7c3aed",
        endColor: "#2563eb",
      },
      color: "#ffffff",
      borderWidth: { value: 0, unit: "px" },
      borderStyle: "none",
      borderColor: "transparent",
      borderRadius: px(10),
      fontWeight: 650,
    },
  },
});

export const buttonGlassBlockDefinition = createButtonPresetDefinition({
  label: "Glass blur",
  text: "View project",
  styles: {
    base: {
      backgroundColor: "#6d5dfc24",
      color: "#33275f",
      borderWidth: { value: 1, unit: "px" },
      borderStyle: "solid",
      borderColor: "#8b7cf666",
      borderRadius: px(12),
      fontWeight: 600,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 1,
          blurRadius: 0,
          spreadRadius: 0,
          unit: "px",
          color: "#ffffff99",
          inset: true,
        },
        {
          offsetX: 0,
          offsetY: 8,
          blurRadius: 24,
          spreadRadius: -12,
          unit: "px",
          color: "#5b45d64d",
          inset: false,
        },
      ],
      backdropBlur: { value: 12, unit: "px" },
    },
  },
});

export const buttonGlowBlockDefinition = createButtonPresetDefinition({
  label: "Soft glow",
  text: "Join now",
  styles: {
    base: {
      padding: spacing(12, 22, 12, 22),
      backgroundColor: "#7258ff",
      color: "#ffffff",
      borderWidth: { value: 2, unit: "px" },
      borderStyle: "solid",
      borderColor: "#a99cff",
      borderRadius: px(999),
      fontWeight: 650,
      boxShadow: [
        {
          offsetX: 0,
          offsetY: 0,
          blurRadius: 0,
          spreadRadius: 3,
          unit: "px",
          color: "#7258ff1f",
          inset: false,
        },
        {
          offsetX: 0,
          offsetY: 7,
          blurRadius: 18,
          spreadRadius: 0,
          unit: "px",
          color: "#7258ff4d",
          inset: false,
        },
      ],
    },
  },
});
