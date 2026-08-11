import { z } from "zod";

const submissionTextSchema = z.string().max(10_000);
const submissionValueSchema = z.union([
  submissionTextSchema,
  z.array(submissionTextSchema).min(1).max(100),
]);

export const formSubmissionPayloadSchema = z
  .object({
    projectId: z.string().trim().min(1).max(200),
    pageId: z.string().trim().min(1).max(200),
    formId: z.string().trim().min(1).max(200),
    formName: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .regex(/^[A-Za-z][A-Za-z0-9_-]*$/),
    values: z
      .record(z.string().trim().min(1).max(100), submissionValueSchema)
      .refine((values) => Object.keys(values).length <= 100, {
        message: "A form submission may contain at most 100 named fields",
      }),
  })
  .strict();

export type FormSubmissionPayload = z.infer<
  typeof formSubmissionPayloadSchema
>;
