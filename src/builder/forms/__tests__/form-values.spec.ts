import { describe, expect, it } from "vitest";

import { formDataToValues } from "@/builder/forms/form-values";

describe("formDataToValues", () => {
  it("should serialize one named value as a string", () => {
    const formData = new FormData();
    formData.append("country", "India");

    expect(formDataToValues(formData)).toEqual({ country: "India" });
  });

  it("should preserve repeated names as an ordered array", () => {
    const formData = new FormData();
    formData.append("interest", "Design");
    formData.append("interest", "Development");

    expect(formDataToValues(formData)).toEqual({
      interest: ["Design", "Development"],
    });
  });

  it("should reject file values until an upload contract exists", () => {
    const formData = new FormData();
    formData.append("attachment", new File(["example"], "example.txt"));

    expect(() => formDataToValues(formData)).toThrow(
      "File inputs are not supported",
    );
  });
});
