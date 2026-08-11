import { formSubmissionPayloadSchema } from "@/builder/forms/submission-contract";

export async function POST(request: Request) {
  let input: unknown;

  try {
    input = await request.json();
  } catch {
    return Response.json(
      { accepted: false, error: "The request body must contain valid JSON." },
      { status: 400 },
    );
  }

  const result = formSubmissionPayloadSchema.safeParse(input);
  if (!result.success) {
    return Response.json(
      { accepted: false, error: "The form submission is invalid." },
      { status: 422 },
    );
  }

  return Response.json({ accepted: true });
}
