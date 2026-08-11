import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PageRenderingController } from "@/builder/rendering/page-rendering-controller";
import { createTestProject } from "@/builder/testing/project-fixtures";

afterEach(cleanup);

describe("PageRenderingController", () => {
  it("should render every page root without editor-only wrappers or prompts", () => {
    const project = createTestProject();
    const page = project.pages[project.homePageId];

    const { container } = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );

    expect(container.children).toHaveLength(1);
    expect(container.firstElementChild?.tagName).toBe("SECTION");
    expect(screen.getByRole("article")).toContainElement(screen.getByText("Text"));
    expect(screen.queryByText(/empty/i)).not.toBeInTheDocument();
    expect(container.querySelector(".canvas-node")).not.toBeInTheDocument();
  });

  it("should render an empty page as empty runtime output", () => {
    const project = createTestProject({ includeAboutPage: true });
    const page = project.pages[project.pageOrder[1]];

    const { container } = render(
      <PageRenderingController page={page} viewport="desktop" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
