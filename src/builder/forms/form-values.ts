export type FormValues = Record<string, string | string[]>;

export type RuntimeFormSubmission = {
  formId: string;
  formName: string;
  values: FormValues;
};

export function formDataToValues(formData: FormData): FormValues {
  const values = Object.create(null) as FormValues;

  for (const [name, entry] of formData.entries()) {
    if (typeof entry !== "string") {
      throw new Error("File inputs are not supported by form submission yet");
    }

    const existing = values[name];
    if (existing === undefined) {
      values[name] = entry;
    } else if (Array.isArray(existing)) {
      values[name] = [...existing, entry];
    } else {
      values[name] = [existing, entry];
    }
  }

  return values;
}
