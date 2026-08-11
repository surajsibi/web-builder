import { CURRENT_PROJECT_SCHEMA_VERSION } from "@/builder/model/project-document";

export type DocumentMigration = {
  fromVersion: number;
  toVersion: number;
  migrate: (value: unknown) => unknown;
};

export const documentMigrations: readonly DocumentMigration[] = [];

export type DocumentMigrationResult =
  | { success: true; value: unknown; migrated: boolean }
  | {
      success: false;
      stage: "document-version" | "document-migration";
      schemaVersion: number;
      reason: string;
    };

function readSchemaVersion(value: unknown): number | null {
  if (typeof value !== "object" || value === null) return null;
  const schemaVersion = Reflect.get(value, "schemaVersion");
  return Number.isInteger(schemaVersion) ? (schemaVersion as number) : null;
}

export function runDocumentMigrations(
  input: unknown,
): DocumentMigrationResult {
  const initialVersion = readSchemaVersion(input);

  if (initialVersion === null) {
    return {
      success: false,
      stage: "document-version",
      schemaVersion: -1,
      reason: "schemaVersion must be an integer",
    };
  }

  if (initialVersion > CURRENT_PROJECT_SCHEMA_VERSION) {
    return {
      success: false,
      stage: "document-version",
      schemaVersion: initialVersion,
      reason: `Future schema version ${initialVersion} is not supported`,
    };
  }

  let value = input;
  let version = initialVersion;
  let migrated = false;

  while (version < CURRENT_PROJECT_SCHEMA_VERSION) {
    const candidates = documentMigrations.filter(
      (migration) => migration.fromVersion === version,
    );

    if (candidates.length !== 1) {
      return {
        success: false,
        stage: "document-version",
        schemaVersion: version,
        reason:
          candidates.length === 0
            ? `No migration starts at schema version ${version}`
            : `Ambiguous migrations start at schema version ${version}`,
      };
    }

    const migration = candidates[0];

    try {
      value = migration.migrate(value);
    } catch (error) {
      return {
        success: false,
        stage: "document-migration",
        schemaVersion: version,
        reason:
          error instanceof Error ? error.message : "Document migration failed",
      };
    }

    const migratedVersion = readSchemaVersion(value);
    if (migratedVersion !== migration.toVersion) {
      return {
        success: false,
        stage: "document-migration",
        schemaVersion: version,
        reason: `Migration ${version} -> ${migration.toVersion} produced schema version ${migratedVersion}`,
      };
    }

    version = migration.toVersion;
    migrated = true;
  }

  return { success: true, value, migrated };
}
