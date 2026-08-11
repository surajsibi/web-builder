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

  const valid = Array.isArray(value)
    ? value.every((item) => isJsonValueInternal(item, ancestors))
    : isPlainJsonObject(objectValue) &&
      Object.values(objectValue).every((item) =>
        isJsonValueInternal(item, ancestors),
      );

  ancestors.delete(objectValue);

  return valid;
}

export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonValueInternal(value, new WeakSet<object>());
}

export function isJsonObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    isJsonValue(value)
  );
}
