import { z } from "zod";

import type { NodeId } from "./ids";

export const BOOLEAN_STATE_VISIBILITIES = ["show", "hide"] as const;

export const booleanStateBindingSchema = z
  .object({
    stateNodeId: z.string().min(1),
    on: z.enum(BOOLEAN_STATE_VISIBILITIES),
    off: z.enum(BOOLEAN_STATE_VISIBILITIES),
  })
  .strict();

export type BooleanStateBinding = {
  stateNodeId: NodeId;
  on: (typeof BOOLEAN_STATE_VISIBILITIES)[number];
  off: (typeof BOOLEAN_STATE_VISIBILITIES)[number];
};
export type BooleanStateVisibility = BooleanStateBinding["on"];
