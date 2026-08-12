export type JsonPrimitive = string | number | boolean | null;

export type JsonValue =
  | JsonPrimitive
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonObject = Record<string, JsonValue>;

function isPlainJsonObject(value: object): value is Record<string, unknown> {
  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function isJsonValueInternal(
  value: unknown,
  ancestors: WeakSet<object>,
): value is JsonValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "object" || !isPlainJsonObject(value)) {
    if (!Array.isArray(value)) {
      return false;
    }
  }

  const objectValue = value as object;

  if (ancestors.has(objectValue)) {
    return false;
  }

  ancestors.add(objectValue);

  let valid: boolean;
  if (Array.isArray(value)) {
    valid = Object.keys(value).length === value.length;
    for (let index = 0; valid && index < value.length; index += 1) {
      const descriptor = Object.getOwnPropertyDescriptor(value, index);
      valid =
        descriptor !== undefined &&
        "value" in descriptor &&
        isJsonValueInternal(descriptor.value, ancestors);
    }
  } else {
    valid =
      isPlainJsonObject(objectValue) &&
      Object.values(Object.getOwnPropertyDescriptors(objectValue)).every(
        (descriptor) =>
          !descriptor.enumerable ||
          ("value" in descriptor &&
            isJsonValueInternal(descriptor.value, ancestors)),
      );
  }

  ancestors.delete(objectValue);

  return valid;
}

export function isJsonValue(value: unknown): value is JsonValue {
  try {
    return isJsonValueInternal(value, new WeakSet<object>());
  } catch {
    return false;
  }
}

export function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    isJsonValue(value)
  );
}
