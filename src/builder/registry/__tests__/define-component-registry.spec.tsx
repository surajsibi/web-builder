import { z } from "zod";
import { describe, expect, it } from "vitest";

import type { ComponentDefinition } from "@/builder/registry/define-component-registry";
import {
  defineComponentRegistry,
  validateComponentRegistry,
} from "@/builder/registry/define-component-registry";

const testPropsSchema = z.object({ label: z.string() }).strict();
type TestProps = z.infer<typeof testPropsSchema>;

function TestIcon() {
  return null;
}

function TestRenderer() {
  return <div />;
}

function createDefinition(): ComponentDefinition<TestProps> {
  return {
    version: 1,
    library: {
      label: "Test",
      category: "Test",
      icon: TestIcon,
    },
    defaults: {
      props: { label: "Valid" },
      styles: {
        base: {
          display: "block",
          width: { mode: "fill" },
          height: { mode: "auto" },
        },
      },
    },
    children: { allowed: false },
    propsSchema: testPropsSchema,
    inspector: {
      props: [{ path: "label", label: "Label", control: "text" }],
      styles: ["sizing"],
    },
    render: TestRenderer,
  };
}

type RegistryInput = Parameters<typeof validateComponentRegistry>[0];

describe("defineComponentRegistry", () => {
  it("should validate and freeze the static registry lookup", () => {
    const registry = defineComponentRegistry({ test: createDefinition() });

    expect(Object.isFrozen(registry)).toBe(true);
    expect(registry.test.library.label).toBe("Test");
  });
});

describe("validateComponentRegistry", () => {
  it("should reject defaults that do not pass the component props schema", () => {
    const definition = createDefinition();
    const invalidDefinition = {
      ...definition,
      defaults: {
        ...definition.defaults,
        props: { label: 42 },
      },
    };

    expect(() =>
      validateComponentRegistry({
        test: invalidDefinition,
      } as unknown as RegistryInput),
    ).toThrow("test.defaults.props does not pass propsSchema");
  });

  it("should reject unknown placement references", () => {
    const definition = createDefinition();
    const invalidDefinition = {
      ...definition,
      children: { allowed: true, accepts: ["missing"] },
    };

    expect(() =>
      validateComponentRegistry({
        test: invalidDefinition,
      } as unknown as RegistryInput),
    ).toThrow(
      "test.children.accepts references unknown component type: missing",
    );
  });

  it("should reject duplicate inspector capabilities", () => {
    const definition = createDefinition();
    const invalidDefinition = {
      ...definition,
      inspector: {
        ...definition.inspector,
        styles: ["sizing", "sizing"],
      },
    };

    expect(() =>
      validateComponentRegistry({
        test: invalidDefinition,
      } as unknown as RegistryInput),
    ).toThrow("test.inspector.styles contains duplicate capability: sizing");
  });

  it("should reject a dependent multi-select with an unknown options path", () => {
    const definition = createDefinition();
    const invalidDefinition = {
      ...definition,
      inspector: {
        ...definition.inspector,
        props: [
          {
            path: "label",
            label: "Label",
            control: "string-multi-select",
            optionsPath: "missing",
          },
        ],
      },
    };

    expect(() =>
      validateComponentRegistry({
        test: invalidDefinition,
      } as unknown as RegistryInput),
    ).toThrow(
      "test.inspector.props requires a valid optionsPath for string-multi-select: label",
    );
  });

  it("should reject a migration path that does not reach the current version", () => {
    const definition = createDefinition();
    const invalidDefinition = {
      ...definition,
      version: 3,
      migrations: [
        {
          fromVersion: 1,
          toVersion: 2,
          migrate: (value: unknown) => value,
        },
      ],
    };

    expect(() =>
      validateComponentRegistry({
        test: invalidDefinition,
      } as unknown as RegistryInput),
    ).toThrow("test migration path does not reach its current version");
  });
});
