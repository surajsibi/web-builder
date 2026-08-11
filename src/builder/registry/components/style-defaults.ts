import type { LengthValue, SpacingValue } from "@/builder/styles/types";

export function px(value: number): LengthValue {
  return { value, unit: "px" };
}

export function spacing(
  top: number,
  right: number,
  bottom: number,
  left: number,
): SpacingValue {
  return {
    top: px(top),
    right: px(right),
    bottom: px(bottom),
    left: px(left),
  };
}
