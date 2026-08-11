export const BUTTON_ICON_NAMES = [
  "arrow-right",
  "arrow-left",
  "plus",
  "check",
  "download",
  "external-link",
] as const;

export type ButtonIconName = (typeof BUTTON_ICON_NAMES)[number];

export const BUTTON_ICON_OPTIONS = [
  { label: "None", value: null },
  { label: "Arrow right", value: "arrow-right" },
  { label: "Arrow left", value: "arrow-left" },
  { label: "Plus", value: "plus" },
  { label: "Check", value: "check" },
  { label: "Download", value: "download" },
  { label: "External link", value: "external-link" },
] as const satisfies readonly {
  label: string;
  value: ButtonIconName | null;
}[];

const BUTTON_ICON_PATHS = {
  "arrow-right": ["M5 12h14", "m13 6 6 6-6 6"],
  "arrow-left": ["M19 12H5", "m11 18-6-6 6-6"],
  plus: ["M12 5v14", "M5 12h14"],
  check: ["m5 12 4 4L19 6"],
  download: ["M12 3v12", "m7 10 5 5 5-5", "M5 21h14"],
  "external-link": [
    "M14 5h5v5",
    "M10 14 19 5",
    "M19 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h6",
  ],
} as const satisfies Record<ButtonIconName, readonly string[]>;

export function ButtonContentIcon({ name }: { name: ButtonIconName }) {
  return (
    <svg
      aria-hidden="true"
      className="button-content-icon"
      focusable="false"
      height="1em"
      style={{ flexShrink: 0 }}
      viewBox="0 0 24 24"
      width="1em"
      xmlns="http://www.w3.org/2000/svg"
    >
      {BUTTON_ICON_PATHS[name].map((path) => (
        <path
          d={path}
          fill="none"
          key={path}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}
