type ComponentIconProps = {
  children: React.ReactNode;
};

function ComponentIcon({ children }: ComponentIconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      height="20"
      viewBox="0 0 20 20"
      width="20"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

export function SectionIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="14" stroke="currentColor" width="18" x="1" y="3" />
      <path d="M1 7h18" stroke="currentColor" />
    </ComponentIcon>
  );
}

export function ContainerIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="12" stroke="currentColor" width="16" x="2" y="4" />
      <rect fill="none" height="6" stroke="currentColor" width="10" x="5" y="7" />
    </ComponentIcon>
  );
}

export function BooleanStateIcon() {
  return (
    <ComponentIcon>
      <circle cx="6" cy="10" fill="none" r="3" stroke="currentColor" />
      <circle cx="14" cy="10" fill="none" r="3" stroke="currentColor" />
      <path d="M9 10h2" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function StateActionIcon() {
  return (
    <ComponentIcon>
      <path d="M3 10h10" stroke="currentColor" strokeLinecap="round" />
      <path d="m10 6 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="10" fill="currentColor" r="1.5" />
    </ComponentIcon>
  );
}

export function ConditionalContentIcon() {
  return (
    <ComponentIcon>
      <path d="M2.5 6h5l2.5 4 2.5-4h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <rect fill="none" height="5" rx="1" stroke="currentColor" width="11" x="4.5" y="12" />
    </ComponentIcon>
  );
}

export function DrawerTriggerIcon() {
  return (
    <ComponentIcon>
      <path d="M3 10h9" stroke="currentColor" strokeLinecap="round" />
      <path d="m9 6 4 4-4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 3v14" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function DrawerPanelIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="1.5" stroke="currentColor" width="18" x="1" y="2" />
      <path d="M8 2v16" stroke="currentColor" />
      <path d="M4 7h2M4 10h2M4 13h2" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function DrawerCloseIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="2" stroke="currentColor" width="16" x="2" y="2" />
      <path d="m6 6 8 8M14 6l-8 8" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function HeadingIcon() {
  return (
    <ComponentIcon>
      <path d="M4 3v14M16 3v14M4 10h12" stroke="currentColor" strokeWidth="2" />
    </ComponentIcon>
  );
}

export function TextIcon() {
  return (
    <ComponentIcon>
      <path d="M3 5h14M3 9h14M3 13h10M3 17h8" stroke="currentColor" />
    </ComponentIcon>
  );
}

export function LabelIcon() {
  return (
    <ComponentIcon>
      <path d="M3 4h14M7 4v12M4 16h6" fill="none" stroke="currentColor" strokeLinecap="round" />
      <path d="M12 10h5" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function CardIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="2" stroke="currentColor" width="16" x="2" y="2" />
      <path d="M5 7h10M5 11h7" stroke="currentColor" />
    </ComponentIcon>
  );
}

export function ButtonIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="10" rx="3" stroke="currentColor" width="18" x="1" y="5" />
      <path d="M7 10h6" stroke="currentColor" />
    </ComponentIcon>
  );
}

export function LinkIcon() {
  return (
    <ComponentIcon>
      <path
        d="M8 6H6a4 4 0 0 0 0 8h2M12 6h2a4 4 0 0 1 0 8h-2M7 10h6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </ComponentIcon>
  );
}

export function ImageIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="2" stroke="currentColor" width="18" x="1" y="2" />
      <circle cx="6" cy="7" fill="none" r="1.5" stroke="currentColor" />
      <path d="m3 16 4.5-4.5 2.5 2.5 2.5-3 4.5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </ComponentIcon>
  );
}

export function DropdownIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="12" rx="2" stroke="currentColor" width="18" x="1" y="4" />
      <path d="M4 8h7M13 8l2 2 2-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </ComponentIcon>
  );
}

export function FormIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="2" stroke="currentColor" width="16" x="2" y="2" />
      <path d="M5 6h10M5 10h6M5 14h8" fill="none" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function InputIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="12" rx="2" stroke="currentColor" width="18" x="1" y="4" />
      <path d="M4 10h7M14 7v6M12.5 7h3M12.5 13h3" fill="none" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function TextareaIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="16" rx="2" stroke="currentColor" width="18" x="1" y="2" />
      <path d="M4 6h12M4 10h12M4 14h8" fill="none" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}

export function CheckboxIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="8" rx="1" stroke="currentColor" width="8" x="2" y="6" />
      <path d="m4 10 1.5 1.5L8 8.5M12 8h6M12 12h6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </ComponentIcon>
  );
}

export function CheckboxGroupIcon() {
  return (
    <ComponentIcon>
      <rect fill="none" height="6" rx="1" stroke="currentColor" width="6" x="2" y="3" />
      <path d="m3.5 6 1 1L7 4.5M11 6h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <rect fill="none" height="6" rx="1" stroke="currentColor" width="6" x="2" y="11" />
      <path d="m3.5 14 1 1L7 12.5M11 14h7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </ComponentIcon>
  );
}

export function RadioGroupIcon() {
  return (
    <ComponentIcon>
      <circle cx="5" cy="6" fill="none" r="2.25" stroke="currentColor" />
      <circle cx="5" cy="6" fill="currentColor" r="1" />
      <circle cx="5" cy="14" fill="none" r="2.25" stroke="currentColor" />
      <path d="M9 6h7M9 14h7" stroke="currentColor" strokeLinecap="round" />
    </ComponentIcon>
  );
}
