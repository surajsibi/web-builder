import { z } from "zod";

export const nodeReferenceIdSchema = z.string().trim().max(200);
