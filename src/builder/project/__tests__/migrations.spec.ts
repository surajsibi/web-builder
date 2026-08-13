import { describe, expect, it } from "vitest";

import { CURRENT_PROJECT_SCHEMA_VERSION } from "@/builder/model/project-document";
import { runDocumentMigrations } from "@/builder/project/migrations";

describe("runDocumentMigrations", () => {
  it("should migrate a version 1 document to version 2 without changing its content", () => {
    const input = {
      schemaVersion: 1,
      pages: { home: { rootIds: ["node-1"] } },
    };
    const original = structuredClone(input);

    const result = runDocumentMigrations(input);

    expect(result).toEqual({
      success: true,
      value: {
        schemaVersion: 2,
        pages: { home: { rootIds: ["node-1"] } },
      },
      migrated: true,
    });
    expect(input).toEqual(original);
  });

  it("should return a current document unchanged without marking it migrated", () => {
    const input = { schemaVersion: CURRENT_PROJECT_SCHEMA_VERSION, value: "kept" };

    const result = runDocumentMigrations(input);

    expect(result).toEqual({ success: true, value: input, migrated: false });
  });

  it.each([
    [{}, -1, "schemaVersion must be an integer"],
    [{ schemaVersion: "1" }, -1, "schemaVersion must be an integer"],
    [{ schemaVersion: 1.5 }, -1, "schemaVersion must be an integer"],
  ])(
    "should reject a missing or non-integer document version",
    (input, schemaVersion, reason) => {
      expect(runDocumentMigrations(input)).toEqual({
        success: false,
        stage: "document-version",
        schemaVersion,
        reason,
      });
    },
  );

  it("should reject future document versions", () => {
    const futureVersion = CURRENT_PROJECT_SCHEMA_VERSION + 1;

    expect(runDocumentMigrations({ schemaVersion: futureVersion })).toEqual({
      success: false,
      stage: "document-version",
      schemaVersion: futureVersion,
      reason: `Future schema version ${futureVersion} is not supported`,
    });
  });

  it("should reject a legacy document when no migration starts at its version", () => {
    expect(runDocumentMigrations({ schemaVersion: 0 })).toEqual({
      success: false,
      stage: "document-version",
      schemaVersion: 0,
      reason: "No migration starts at schema version 0",
    });
  });
});
