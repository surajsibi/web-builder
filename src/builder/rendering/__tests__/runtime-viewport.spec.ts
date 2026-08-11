import { describe, expect, it } from "vitest";

import { viewportForWidth } from "@/builder/rendering/runtime-viewport";

describe("viewportForWidth", () => {
  it("should use the shared responsive breakpoint boundaries", () => {
    expect(viewportForWidth(390)).toBe("mobile");
    expect(viewportForWidth(767)).toBe("mobile");
    expect(viewportForWidth(768)).toBe("tablet");
    expect(viewportForWidth(1024)).toBe("tablet");
    expect(viewportForWidth(1025)).toBe("desktop");
    expect(viewportForWidth(1440)).toBe("desktop");
  });
});
