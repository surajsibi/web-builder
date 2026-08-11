import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/form-submissions/route";

function submissionRequest(body: string) {
  return new Request("http://localhost/api/form-submissions", {
    body,
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("POST /api/form-submissions", () => {
  it("should accept a validated form submission without echoing visitor values", async () => {
    const response = await POST(
      submissionRequest(
        JSON.stringify({
          projectId: "project-1",
          pageId: "page-contact",
          formId: "node-contact-form",
          formName: "contactForm",
          values: {
            country: "India",
            interest: ["Design", "Development"],
          },
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ accepted: true });
  });

  it("should reject malformed JSON", async () => {
    const response = await POST(submissionRequest("not-json"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      accepted: false,
      error: "The request body must contain valid JSON.",
    });
  });

  it("should reject an invalid submission envelope", async () => {
    const response = await POST(
      submissionRequest(
        JSON.stringify({
          projectId: "project-1",
          pageId: "page-contact",
          formId: "node-contact-form",
          formName: "contact form",
          values: { country: "India" },
        }),
      ),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      accepted: false,
      error: "The form submission is invalid.",
    });
  });
});
