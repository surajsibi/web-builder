import { describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/form-submissions/route";

function submissionRequest(body: string) {
  return new Request("http://localhost/api/form-submissions", {
    body,
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("POST /api/form-submissions", () => {
  it("should reject submissions without reading or echoing visitor values", async () => {
    const request = submissionRequest(
      JSON.stringify({
        projectId: "project-1",
        pageId: "page-contact",
        formId: "node-contact-form",
        formName: "contactForm",
        values: { password: "visitor-secret" },
      }),
    );
    const readBody = vi.spyOn(request, "json");

    const response = POST(request);
    const body = await response.text();

    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(readBody).not.toHaveBeenCalled();
    expect(JSON.parse(body)).toEqual({
      accepted: false,
      error: "Form submissions are unavailable. Preview submissions are not saved.",
    });
    expect(body).not.toContain("visitor-secret");
  });
});
