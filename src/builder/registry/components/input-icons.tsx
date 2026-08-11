export function PasswordVisibilityIcon({
  visible,
}: {
  visible: boolean;
}) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.2A10.9 10.9 0 0 1 12 5c6.2 0 9.5 7 9.5 7a15.9 15.9 0 0 1-2.7 3.8M6.6 6.6C3.9 8.4 2.5 12 2.5 12S5.8 19 12 19c1.5 0 2.8-.4 4-1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M2.5 12S5.8 5 12 5s9.5 7 9.5 7-3.3 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  );
}
