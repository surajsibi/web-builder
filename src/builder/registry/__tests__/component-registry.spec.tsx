import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  canPlaceType,
  componentRegistry,
} from "@/builder/registry/component-registry";

afterEach(cleanup);

describe("componentRegistry", () => {
  it("should expose the seventeen primitives with valid defaults and versions", () => {
    expect(Object.keys(componentRegistry)).toEqual([
      "section",
      "container",
      "boolean-state",
      "heading",
      "text",
      "label",
      "card",
      "image",
      "link",
      "button",
      "form",
      "input",
      "textarea",
      "dropdown",
      "radio-group",
      "checkbox",
      "checkbox-group",
    ]);

    for (const definition of Object.values(componentRegistry)) {
      expect(() =>
        definition.propsSchema.parse(definition.defaults.props),
      ).not.toThrow();
    }

    expect(
      Object.fromEntries(
        Object.entries(componentRegistry).map(([type, definition]) => [
          type,
          definition.version,
        ]),
      ),
    ).toEqual({
      section: 1,
      container: 3,
      "boolean-state": 1,
      heading: 1,
      text: 1,
      label: 1,
      card: 1,
      image: 1,
      link: 1,
      button: 5,
      form: 1,
      input: 3,
      textarea: 2,
      dropdown: 2,
      "radio-group": 1,
      checkbox: 1,
      "checkbox-group": 1,
    });
    expect(componentRegistry.link.defaults.styles.base.textDecoration).toBe(
      "underline",
    );
  });

  it("should declare the Button Boolean State reference and direct Canvas interaction", () => {
    expect(componentRegistry.button.references).toEqual([
      {
        path: "targetStateNodeId",
        targetType: "boolean-state",
        scope: "page",
        onDuplicate: "remap-if-target-cloned",
      },
    ]);
    expect(componentRegistry.button.editor).toEqual({
      directInteraction: true,
    });
  });

  it("should reject unsupported Boolean State and Button action values", () => {
    expect(() =>
      componentRegistry["boolean-state"].propsSchema.parse({
        defaultValue: false,
        persistedValue: true,
      }),
    ).toThrow();
    expect(() =>
      componentRegistry.button.propsSchema.parse({
        ...componentRegistry.button.defaults.props,
        stateAction: "open",
      }),
    ).toThrow();
    expect(() =>
      componentRegistry.button.propsSchema.parse({
        ...componentRegistry.button.defaults.props,
        href: "/docs",
        targetStateNodeId: "menu-state",
        stateAction: "toggle",
      }),
    ).toThrow();
  });

  it("should render an accessible image with authored fitting", () => {
    const RenderImage = componentRegistry.image.render;
    const rootRef = vi.fn();

    render(
      <RenderImage
        className="published-image"
        props={{
          src: "/saturn-mark.svg",
          alt: "Saturn",
          href: "",
          openInNewTab: false,
          fit: "contain",
        }}
        rootRef={rootRef}
        style={{ height: "56px", width: "56px" }}
      />,
    );

    const image = screen.getByRole("img", { name: "Saturn" });
    expect(image).toHaveAttribute("src", "/saturn-mark.svg");
    expect(image).toHaveClass("published-image");
    expect(image).toHaveStyle({
      height: "56px",
      objectFit: "contain",
      width: "56px",
    });
    expect(rootRef).toHaveBeenCalledWith(image);
  });

  it("should render a linked image as a protected accessible destination", () => {
    const RenderImage = componentRegistry.image.render;

    render(
      <RenderImage
        props={{
          src: "https://cdn.example.com/logo.svg",
          alt: "Example home",
          href: "https://example.com",
          openInNewTab: true,
          fit: "cover",
        }}
        style={{ height: "48px", width: "120px" }}
      />,
    );

    const link = screen.getByRole("link", { name: "Example home" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(link).getByRole("img", { name: "Example home" })).toHaveStyle({
      objectFit: "cover",
    });
  });

  it("should reject unsafe image sources and inaccessible linked-image state", () => {
    const valid = {
      src: "/logo.svg",
      alt: "Logo",
      href: "",
      openInNewTab: false,
      fit: "contain",
    } as const;

    expect(() =>
      componentRegistry.image.propsSchema.parse({
        ...valid,
        src: "data:image/svg+xml,<svg></svg>",
      }),
    ).toThrow();
    expect(() =>
      componentRegistry.image.propsSchema.parse({
        ...valid,
        href: "javascript:alert(1)",
      }),
    ).toThrow();
    expect(() =>
      componentRegistry.image.propsSchema.parse({
        ...valid,
        openInNewTab: true,
      }),
    ).toThrow();
    expect(() =>
      componentRegistry.image.propsSchema.parse({
        ...valid,
        alt: "",
        href: "/",
      }),
    ).toThrow();
  });

  it("should render a container component through one semantic root", () => {
    const Card = componentRegistry.card.render;
    const rootRef = vi.fn();

    render(
      <Card
        className="published-card"
        props={{ semanticTag: "article" }}
        rootRef={rootRef}
        style={{ backgroundColor: "rgb(255, 255, 255)" }}
      >
        <p>Card content</p>
      </Card>,
    );

    const card = screen.getByRole("article");

    expect(card).toHaveClass("published-card");
    expect(card).toHaveStyle({ backgroundColor: "rgb(255, 255, 255)" });
    expect(card).toHaveTextContent("Card content");
    expect(rootRef).toHaveBeenCalledWith(card);
  });

  it("should expose an accessible native disclosure through container semantics", () => {
    const Container = componentRegistry.container.render;

    render(
      <Container props={{ semanticTag: "details" }} style={{}}>
        <Container props={{ semanticTag: "summary" }} style={{}}>
          All category
        </Container>
        <div>Category links</div>
      </Container>,
    );

    const summary = screen.getByText("All category");
    const disclosure = summary.closest("details");

    expect(summary).toHaveClass("builder-disclosure-summary");
    expect(disclosure).toHaveClass("builder-disclosure");
    expect(disclosure).not.toHaveAttribute("open");

    fireEvent.click(summary);

    expect(disclosure).toHaveAttribute("open");

    fireEvent.click(summary);

    expect(disclosure).not.toHaveAttribute("open");
  });

  it("should render an action as a button when it has no destination", () => {
    const Button = componentRegistry.button.render;

    render(
      <Button
        props={{
          text: "Save",
          href: "",
          openInNewTab: false,
          icon: null,
          iconPosition: "start",
          iconAnimation: "none",
          behavior: "button",
          targetStateNodeId: "",
          stateAction: "none",
        }}
        style={{}}
      />,
    );

    const button = screen.getByRole("button", { name: "Save" });

    expect(button).toHaveAttribute(
      "type",
      "button",
    );
    expect(button.querySelector("svg")).not.toBeInTheDocument();
  });

  it("should render a decorative icon before button text", () => {
    const Button = componentRegistry.button.render;

    render(
      <Button
        props={{
          text: "Add item",
          href: "",
          openInNewTab: false,
          icon: "plus",
          iconPosition: "start",
          iconAnimation: "none",
          behavior: "button",
          targetStateNodeId: "",
          stateAction: "none",
        }}
        style={{}}
      />,
    );

    const button = screen.getByRole("button", { name: "Add item" });
    const icon = button.querySelector("svg");

    expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icon).toHaveClass("button-content-icon");
    expect(button).toHaveAttribute("data-button-icon-animation", "none");
    expect(button.firstElementChild).toBe(icon);
    expect(button.lastElementChild).toHaveTextContent("Add item");
  });

  it("should mark a configured trailing icon for the shared shift interaction", () => {
    const Button = componentRegistry.button.render;

    render(
      <Button
        props={{
          text: "Explore",
          href: "",
          openInNewTab: false,
          icon: "arrow-right",
          iconPosition: "end",
          iconAnimation: "shift-right",
          behavior: "button",
          targetStateNodeId: "",
          stateAction: "none",
        }}
        style={{}}
      />,
    );

    const button = screen.getByRole("button", { name: "Explore" });

    expect(button).toHaveAttribute(
      "data-button-icon-animation",
      "shift-right",
    );
    expect(button.lastElementChild).toHaveClass("button-content-icon");
  });

  it("should render a safe new-tab action as a protected link", () => {
    const Button = componentRegistry.button.render;

    render(
      <Button
        props={{
          text: "Documentation",
          href: "https://example.com/docs",
          openInNewTab: true,
          icon: "external-link",
          iconPosition: "end",
          iconAnimation: "none",
          behavior: "button",
          targetStateNodeId: "",
          stateAction: "none",
        }}
        style={{}}
      />,
    );

    const link = screen.getByRole("link", { name: "Documentation" });

    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.lastElementChild?.tagName).toBe("svg");
    expect(link.lastElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("should render a semantic navigation link with a protected new-tab destination", () => {
    const Link = componentRegistry.link.render;

    render(
      <Link
        props={{
          text: "Features",
          href: "/features",
          openInNewTab: true,
        }}
        style={{
          color: "rgb(15, 23, 42)",
          textDecoration: "line-through",
        }}
      />,
    );

    const link = screen.getByRole("link", { name: "Features" });

    expect(link).toHaveAttribute("href", "/features");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveStyle({
      color: "rgb(15, 23, 42)",
      textDecoration: "line-through",
    });
  });

  it("should reject an empty or unsafe navigation-link destination", () => {
    expect(() =>
      componentRegistry.link.propsSchema.parse({
        text: "Missing destination",
        href: "",
        openInNewTab: false,
      }),
    ).toThrow();

    expect(() =>
      componentRegistry.link.propsSchema.parse({
        text: "Unsafe destination",
        href: "javascript:alert(1)",
        openInNewTab: false,
      }),
    ).toThrow();
  });

  it("should reject unsafe link schemes and invalid link state", () => {
    expect(() =>
      componentRegistry.button.propsSchema.parse({
        text: "Unsafe",
        href: "javascript:alert(1)",
        openInNewTab: false,
        icon: null,
        iconPosition: "start",
        iconAnimation: "none",
        behavior: "button",
        targetStateNodeId: "",
        stateAction: "none",
      }),
    ).toThrow();

    expect(() =>
      componentRegistry.button.propsSchema.parse({
        text: "No destination",
        href: "",
        openInNewTab: true,
        icon: null,
        iconPosition: "start",
        iconAnimation: "none",
        behavior: "button",
        targetStateNodeId: "",
        stateAction: "none",
      }),
    ).toThrow();

    expect(() =>
      componentRegistry.button.propsSchema.parse({
        text: "Unknown icon",
        href: "",
        openInNewTab: false,
        icon: "unregistered-icon",
        iconPosition: "start",
        iconAnimation: "none",
        behavior: "button",
        targetStateNodeId: "",
        stateAction: "none",
      }),
    ).toThrow();

    expect(() =>
      componentRegistry.button.propsSchema.parse({
        text: "Unknown animation",
        href: "",
        openInNewTab: false,
        icon: "arrow-right",
        iconPosition: "end",
        iconAnimation: "spin",
        behavior: "button",
        targetStateNodeId: "",
        stateAction: "none",
      }),
    ).toThrow();
  });

  it("should render an explicit form submit button without changing linked actions", () => {
    const Button = componentRegistry.button.render;

    render(
      <Button
        props={{
          text: "Send",
          href: "",
          openInNewTab: false,
          icon: null,
          iconPosition: "start",
          iconAnimation: "none",
          behavior: "submit",
          targetStateNodeId: "",
          stateAction: "none",
        }}
        style={{}}
      />,
    );

    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(() =>
      componentRegistry.button.propsSchema.parse({
        text: "Invalid linked submit",
        href: "/submit",
        openInNewTab: false,
        icon: null,
        iconPosition: "start",
        iconAnimation: "none",
        behavior: "submit",
        targetStateNodeId: "",
        stateAction: "none",
      }),
    ).toThrow();
  });

  it("should retain named descendant controls while suppressing preview submission", () => {
    const Form = componentRegistry.form.render;
    const Input = componentRegistry.input.render;
    const Textarea = componentRegistry.textarea.render;
    const Dropdown = componentRegistry.dropdown.render;
    const RadioGroup = componentRegistry["radio-group"].render;
    const Checkbox = componentRegistry.checkbox.render;
    const CheckboxGroup = componentRegistry["checkbox-group"].render;
    const Button = componentRegistry.button.render;
    render(
      <Form
        props={{
          label: "Contact form",
          name: "contactForm",
          successMessage: "Message received.",
          errorMessage: "Message failed.",
        }}
        runtime={{ mode: "preview", nodeId: "node-contact" }}
        style={{}}
      >
        <Input
          props={{
            label: "Email",
            controlId: "",
            name: "email",
            inputType: "email",
            allowPasswordReveal: false,
            placeholder: "you@example.com",
            defaultValue: "",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
        <Dropdown
          props={{
            label: "Country",
            controlId: "",
            name: "country",
            options: ["India", "Canada"],
            placeholder: "Choose a country",
            defaultValue: "",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
        <Textarea
          props={{
            label: "Message",
            controlId: "",
            name: "message",
            placeholder: "How can we help?",
            defaultValue: "",
            rows: 4,
            required: true,
            disabled: false,
          }}
          style={{}}
        />
        <RadioGroup
          props={{
            label: "Preferred contact method",
            name: "contactMethod",
            options: ["Email", "Phone"],
            defaultValue: "",
            orientation: "vertical",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
        <Checkbox
          props={{
            label: "Accept terms",
            name: "terms",
            value: "accepted",
            defaultChecked: false,
            required: true,
            disabled: false,
          }}
          style={{}}
        />
        <CheckboxGroup
          props={{
            label: "Interests",
            name: "interests",
            options: ["Design", "Research", "Development"],
            defaultValues: [],
            orientation: "vertical",
            required: false,
            disabled: false,
          }}
          style={{}}
        />
        <Button
          props={{
            text: "Send",
            href: "",
            openInNewTab: false,
            icon: null,
            iconPosition: "start",
            iconAnimation: "none",
            behavior: "submit",
            targetStateNodeId: "",
            stateAction: "none",
          }}
          style={{}}
        />
      </Form>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "ada@example.com" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Country" }), {
      target: { value: "India" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
      target: { value: "Please send more information." },
    });
    fireEvent.click(screen.getByRole("radio", { name: "Email" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Accept terms" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Design" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Development" }));
    const form = screen.getByRole("form", { name: "Contact form" });
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected the contact form to be a native form element");
    }

    const formData = new FormData(form);
    expect(formData.get("email")).toBe("ada@example.com");
    expect(formData.get("country")).toBe("India");
    expect(formData.get("message")).toBe("Please send more information.");
    expect(formData.get("contactMethod")).toBe("Email");
    expect(formData.get("terms")).toBe("accepted");
    expect(formData.getAll("interests")).toEqual(["Design", "Development"]);
    expect(fireEvent.submit(form)).toBe(false);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("should suppress native submissions and show preview availability guidance", () => {
    const Form = componentRegistry.form.render;
    const props = {
      label: "Contact form",
      name: "contactForm",
      successMessage: "Message received.",
      errorMessage: "Message failed.",
    };

    const view = render(
      <Form
        props={props}
        runtime={{ mode: "editor", nodeId: "node-contact" }}
        style={{}}
      >
        <button type="submit">Send</button>
      </Form>,
    );

    expect(
      fireEvent.submit(screen.getByRole("form", { name: "Contact form" })),
    ).toBe(false);

    view.rerender(
      <Form
        props={props}
        runtime={{
          formSubmissionNotice: "Submission is unavailable in preview.",
          mode: "preview",
          nodeId: "node-contact",
        }}
        style={{}}
      >
        <button type="submit">Send</button>
      </Form>,
    );
    expect(
      fireEvent.submit(screen.getByRole("form", { name: "Contact form" })),
    ).toBe(false);
    expect(screen.getByRole("note")).toHaveTextContent(
      "Submission is unavailable in preview.",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("should preserve saved response messages without exposing inactive controls", () => {
    expect(
      componentRegistry.form.propsSchema.parse({
        label: "Contact form",
        name: "contactForm",
        successMessage: "Message received.",
        errorMessage: "Message failed.",
      }),
    ).toMatchObject({
      successMessage: "Message received.",
      errorMessage: "Message failed.",
    });
    expect(
      componentRegistry.form.inspector.props.map(({ path }) => path),
    ).toEqual(["label", "name"]);
  });

  it("should render an accessible native input with text-like form semantics", () => {
    const Input = componentRegistry.input.render;

    render(
      <Input
        props={{
          label: "Email address",
          controlId: "",
          name: "email",
          inputType: "email",
          allowPasswordReveal: false,
          placeholder: "you@example.com",
          defaultValue: "ada@example.com",
          required: true,
          disabled: false,
        }}
        style={{ width: "100%" }}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("placeholder", "you@example.com");
    expect(input).toBeRequired();
    expect(input).toHaveValue("ada@example.com");
    expect(input).toHaveStyle({ width: "100%" });
  });

  it("should toggle password visibility without changing the visitor value", () => {
    const Input = componentRegistry.input.render;

    render(
      <Input
        props={{
          label: "Account password",
          controlId: "",
          name: "password",
          inputType: "password",
          allowPasswordReveal: true,
          placeholder: "Enter password",
          defaultValue: "initial-secret",
          required: true,
          disabled: false,
        }}
        runtime={{ mode: "preview", nodeId: "node-password" }}
        style={{ width: "100%" }}
      />,
    );
    const input = screen.getByLabelText("Account password");

    fireEvent.change(input, { target: { value: "visitor-secret" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Show Account password" }),
    );

    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("visitor-secret");
    fireEvent.click(
      screen.getByRole("button", { name: "Hide Account password" }),
    );
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("visitor-secret");
  });

  it("should omit the password control for other input types", () => {
    const Input = componentRegistry.input.render;

    render(
      <Input
        props={{
          label: "Email",
          controlId: "",
          name: "email",
          inputType: "email",
          allowPasswordReveal: true,
          placeholder: "you@example.com",
          defaultValue: "",
          required: false,
          disabled: false,
        }}
        style={{}}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Show Email" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "type",
      "email",
    );
  });

  it("should disable password visibility when the input is disabled", () => {
    const Input = componentRegistry.input.render;

    render(
      <Input
        props={{
          label: "Password",
          controlId: "",
          name: "password",
          inputType: "password",
          allowPasswordReveal: true,
          placeholder: "Enter password",
          defaultValue: "",
          required: false,
          disabled: true,
        }}
        style={{}}
      />,
    );

    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Show Password" }),
    ).toBeDisabled();
  });

  it("should not submit a Form when password visibility changes", () => {
    const Form = componentRegistry.form.render;
    const Input = componentRegistry.input.render;

    render(
      <Form
        props={{
          label: "Sign-in form",
          name: "signIn",
          successMessage: "Signed in.",
          errorMessage: "Sign-in failed.",
        }}
        runtime={{ mode: "preview", nodeId: "node-sign-in" }}
        style={{}}
      >
        <Input
          props={{
            label: "Password",
            controlId: "",
            name: "password",
            inputType: "password",
            allowPasswordReveal: true,
            placeholder: "Enter password",
            defaultValue: "visitor-secret",
            required: true,
            disabled: false,
          }}
          runtime={{ mode: "preview", nodeId: "node-password" }}
          style={{}}
        />
      </Form>,
    );

    const form = screen.getByRole("form", { name: "Sign-in form" });
    const handleSubmit = vi.fn();
    form.addEventListener("submit", handleSubmit);

    fireEvent.click(screen.getByRole("button", { name: "Show Password" }));

    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("should preserve a live input value and adopt changed authored defaults or types", async () => {
    const Input = componentRegistry.input.render;
    const props = {
      label: "Contact",
      controlId: "",
      name: "contact",
      inputType: "text" as const,
      allowPasswordReveal: false,
      placeholder: "Your contact",
      defaultValue: "Initial value",
      required: false,
      disabled: false,
    };
    const view = render(<Input props={props} style={{}} />);
    const input = screen.getByRole("textbox", { name: "Contact" });

    fireEvent.change(input, { target: { value: "Visitor value" } });
    view.rerender(<Input props={{ ...props, required: true }} style={{}} />);

    expect(input).toHaveValue("Visitor value");

    view.rerender(
      <Input
        props={{
          ...props,
          defaultValue: "author@example.com",
          inputType: "email",
          required: true,
        }}
        style={{}}
      />,
    );

    await waitFor(() => expect(input).toHaveValue("author@example.com"));
    expect(input).toHaveAttribute("type", "email");
  });

  it("should reject inaccessible or unsupported input contracts", () => {
    expect(() =>
      componentRegistry.input.propsSchema.parse({
        label: "",
        controlId: "",
        name: "attachment",
        inputType: "file",
        allowPasswordReveal: false,
        placeholder: "",
        defaultValue: "",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should render an accessible native Textarea with multiline form semantics", () => {
    const Textarea = componentRegistry.textarea.render;

    render(
      <Textarea
        props={{
          label: "Message",
          controlId: "",
          name: "message",
          placeholder: "How can we help?",
          defaultValue: "Line one\nLine two",
          rows: 6,
          required: true,
          disabled: false,
        }}
        style={{ width: "100%" }}
      />,
    );

    const textarea = screen.getByRole("textbox", { name: "Message" });

    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea).toHaveAttribute("name", "message");
    expect(textarea).toHaveAttribute("placeholder", "How can we help?");
    expect(textarea).toHaveAttribute("rows", "6");
    expect(textarea).toBeRequired();
    expect(textarea).toHaveValue("Line one\nLine two");
    expect(textarea).toHaveStyle({ resize: "none", width: "100%" });
  });

  it("should preserve a live Textarea value and adopt a changed authored default", async () => {
    const Textarea = componentRegistry.textarea.render;
    const props = {
      label: "Message",
      controlId: "",
      name: "message",
      placeholder: "How can we help?",
      defaultValue: "Initial message",
      rows: 4,
      required: false,
      disabled: false,
    };
    const view = render(<Textarea props={props} style={{}} />);
    const textarea = screen.getByRole("textbox", { name: "Message" });

    fireEvent.change(textarea, { target: { value: "Visitor message" } });
    view.rerender(
      <Textarea props={{ ...props, required: true, rows: 6 }} style={{}} />,
    );

    expect(textarea).toHaveValue("Visitor message");
    expect(textarea).toHaveAttribute("rows", "6");

    view.rerender(
      <Textarea
        props={{ ...props, defaultValue: "Updated authored message", rows: 6 }}
        style={{}}
      />,
    );

    await waitFor(() =>
      expect(textarea).toHaveValue("Updated authored message"),
    );
  });

  it.each([1, 21, 2.5])(
    "should reject the invalid Textarea row count %s",
    (rows) => {
      expect(() =>
        componentRegistry.textarea.propsSchema.parse({
          label: "Message",
          controlId: "",
          name: "message",
          placeholder: "How can we help?",
          defaultValue: "",
          rows,
          required: false,
          disabled: false,
        }),
      ).toThrow();
    },
  );

  it("should render an accessible native dropdown with form semantics", () => {
    const Dropdown = componentRegistry.dropdown.render;

    render(
      <Dropdown
        props={{
          label: "Country",
          controlId: "",
          name: "country",
          options: ["India", "Canada"],
          placeholder: "Choose a country",
          defaultValue: "Canada",
          required: true,
          disabled: false,
        }}
        style={{ width: "100%" }}
      />,
    );

    const dropdown = screen.getByRole("combobox", { name: "Country" });

    expect(dropdown).toHaveAttribute("name", "country");
    expect(dropdown).toBeRequired();
    expect(dropdown).toHaveValue("Canada");
    expect(dropdown).toHaveStyle({ width: "100%" });
    expect(
      screen.getByRole("option", { name: "Choose a country" }),
    ).toBeDisabled();
  });

  it("should preserve a live dropdown choice and adopt a changed authored default", async () => {
    const Dropdown = componentRegistry.dropdown.render;
    const options = ["India", "Canada", "Japan"];
    const props = {
      label: "Country",
      controlId: "",
      name: "country",
      options,
      placeholder: "Choose a country",
      defaultValue: "Canada",
      required: false,
      disabled: false,
    };
    const view = render(<Dropdown props={props} style={{}} />);
    const dropdown = screen.getByRole("combobox", { name: "Country" });

    fireEvent.change(dropdown, { target: { value: "Japan" } });
    view.rerender(
      <Dropdown props={{ ...props, required: true }} style={{}} />,
    );

    expect(dropdown).toHaveValue("Japan");

    view.rerender(
      <Dropdown
        props={{ ...props, defaultValue: "India", required: true }}
        style={{}}
      />,
    );

    await waitFor(() => expect(dropdown).toHaveValue("India"));
  });

  it("should reject duplicate dropdown options", () => {
    expect(() =>
      componentRegistry.dropdown.propsSchema.parse({
        label: "Country",
        controlId: "",
        name: "country",
        options: ["India", "India"],
        placeholder: "Choose a country",
        defaultValue: "",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should reject a dropdown default value that is not an option", () => {
    expect(() =>
      componentRegistry.dropdown.propsSchema.parse({
        label: "Country",
        controlId: "",
        name: "country",
        options: ["India", "Japan"],
        placeholder: "Choose a country",
        defaultValue: "Canada",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should associate a visible Label with a control ID", () => {
    const Label = componentRegistry.label.render;
    const Input = componentRegistry.input.render;
    const rootRef = vi.fn();

    render(
      <>
        <Label
          className="published-label"
          props={{ text: "Email address", forId: "email-field" }}
          rootRef={rootRef}
          style={{ color: "rgb(15, 23, 42)" }}
        />
        <Input
          props={{
            label: "Fallback email label",
            controlId: "email-field",
            name: "email",
            inputType: "email",
            allowPasswordReveal: false,
            placeholder: "you@example.com",
            defaultValue: "",
            required: false,
            disabled: false,
          }}
          style={{}}
        />
      </>,
    );

    const label = screen.getByText("Email address");
    const input = screen.getByRole("textbox", { name: "Email address" });

    expect(label).toHaveAttribute("for", "email-field");
    expect(label).toHaveClass("published-label");
    expect(label).toHaveStyle({ color: "rgb(15, 23, 42)" });
    expect(input).toHaveAttribute("id", "email-field");
    expect(input).not.toHaveAttribute("aria-label");
    expect(rootRef).toHaveBeenCalledWith(label);
  });

  it.each([
    { text: "", forId: "field" },
    { text: "Email", forId: "" },
    { text: "Email", forId: "invalid id" },
  ])("should reject invalid Label configuration %#", (props) => {
    expect(() => componentRegistry.label.propsSchema.parse(props)).toThrow();
  });

  it.each(["invalid id", "1field"])(
    "should reject the invalid control ID %s",
    (controlId) => {
      expect(() =>
        componentRegistry.input.propsSchema.parse({
          ...componentRegistry.input.defaults.props,
          controlId,
        }),
      ).toThrow();
    },
  );

  it("should render a labeled native Radio Group with one selected option", () => {
    const RadioGroup = componentRegistry["radio-group"].render;

    render(
      <RadioGroup
        props={{
          label: "Preferred contact method",
          name: "contactMethod",
          options: ["Email", "Phone"],
          defaultValue: "Email",
          orientation: "horizontal",
          required: true,
          disabled: false,
        }}
        style={{ width: "100%" }}
      />,
    );

    const group = screen.getByRole("group", {
      name: "Preferred contact method",
    });
    const email = screen.getByRole("radio", { name: "Email" });
    const phone = screen.getByRole("radio", { name: "Phone" });

    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveStyle({ width: "100%" });
    expect(email).toHaveAttribute("name", "contactMethod");
    expect(email).toBeRequired();
    expect(email).toBeChecked();
    expect(phone).not.toBeChecked();
  });

  it("should preserve a live Radio Group choice and adopt a changed authored default", async () => {
    const RadioGroup = componentRegistry["radio-group"].render;
    const props = {
      label: "Preferred contact method",
      name: "contactMethod",
      options: ["Email", "Phone", "Post"],
      defaultValue: "Email",
      orientation: "vertical" as const,
      required: false,
      disabled: false,
    };
    const view = render(<RadioGroup props={props} style={{}} />);

    fireEvent.click(screen.getByRole("radio", { name: "Phone" }));
    view.rerender(
      <RadioGroup props={{ ...props, orientation: "horizontal" }} style={{}} />,
    );

    expect(screen.getByRole("radio", { name: "Phone" })).toBeChecked();

    view.rerender(
      <RadioGroup
        props={{ ...props, defaultValue: "Post", orientation: "horizontal" }}
        style={{}}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Post" })).toBeChecked(),
    );
  });

  it("should disable every option when the Radio Group is disabled", () => {
    const RadioGroup = componentRegistry["radio-group"].render;

    render(
      <RadioGroup
        props={{
          label: "Plan",
          name: "plan",
          options: ["Free", "Pro"],
          defaultValue: "",
          orientation: "vertical",
          required: false,
          disabled: true,
        }}
        style={{}}
      />,
    );

    expect(screen.getByRole("group", { name: "Plan" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Free" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Pro" })).toBeDisabled();
  });

  it("should reject duplicate Radio Group options", () => {
    expect(() =>
      componentRegistry["radio-group"].propsSchema.parse({
        label: "Plan",
        name: "plan",
        options: ["Free", "Free"],
        defaultValue: "",
        orientation: "vertical",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should reject a Radio Group default value that is not an option", () => {
    expect(() =>
      componentRegistry["radio-group"].propsSchema.parse({
        label: "Plan",
        name: "plan",
        options: ["Free", "Pro"],
        defaultValue: "Enterprise",
        orientation: "vertical",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should reject an empty Radio Group field name", () => {
    expect(() =>
      componentRegistry["radio-group"].propsSchema.parse({
        label: "Plan",
        name: "",
        options: ["Free", "Pro"],
        defaultValue: "",
        orientation: "vertical",
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should render a labeled native Checkbox with configured form semantics", () => {
    const Checkbox = componentRegistry.checkbox.render;

    render(
      <Checkbox
        className="published-checkbox"
        props={{
          label: "Accept terms",
          name: "terms",
          value: "accepted",
          defaultChecked: true,
          required: true,
          disabled: false,
        }}
        style={{ color: "rgb(15, 23, 42)" }}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });
    const label = checkbox.closest("label");

    expect(label).toHaveClass("checkbox-control", "published-checkbox");
    expect(label).toHaveStyle({ color: "rgb(15, 23, 42)" });
    expect(checkbox).toHaveAttribute("name", "terms");
    expect(checkbox).toHaveAttribute("value", "accepted");
    expect(checkbox).toBeChecked();
    expect(checkbox).toBeRequired();
  });

  it("should preserve a live Checkbox state and adopt a changed authored default", async () => {
    const Checkbox = componentRegistry.checkbox.render;
    const props = {
      label: "Accept terms",
      name: "terms",
      value: "accepted",
      defaultChecked: false,
      required: false,
      disabled: false,
    };
    const view = render(<Checkbox props={props} style={{}} />);
    const checkbox = screen.getByRole("checkbox", { name: "Accept terms" });

    fireEvent.click(checkbox);
    view.rerender(
      <Checkbox
        props={{ ...props, label: "Accept the terms", value: "yes" }}
        style={{}}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Accept the terms" })).toBeChecked();
    expect(checkbox).toHaveAttribute("value", "yes");

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();

    view.rerender(
      <Checkbox
        props={{ ...props, label: "Accept the terms", defaultChecked: true }}
        style={{}}
      />,
    );

    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "Accept the terms" }),
      ).toBeChecked(),
    );
  });

  it("should include a Checkbox value only while the named control is checked", () => {
    const Checkbox = componentRegistry.checkbox.render;

    render(
      <form aria-label="Preferences">
        <Checkbox
          props={{
            label: "Receive updates",
            name: "updates",
            value: "email",
            defaultChecked: false,
            required: false,
            disabled: false,
          }}
          style={{}}
        />
        <Checkbox
          props={{
            label: "Private preference",
            name: "",
            value: "private",
            defaultChecked: true,
            required: false,
            disabled: false,
          }}
          style={{}}
        />
        <Checkbox
          props={{
            label: "Disabled preference",
            name: "disabledPreference",
            value: "disabled",
            defaultChecked: true,
            required: false,
            disabled: true,
          }}
          style={{}}
        />
      </form>,
    );

    const form = screen.getByRole("form", { name: "Preferences" });
    const checkbox = screen.getByRole("checkbox", { name: "Receive updates" });
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected the preferences form to be a native form element");
    }

    expect(Array.from(new FormData(form).entries())).toEqual([]);

    fireEvent.click(checkbox);
    expect(Array.from(new FormData(form).entries())).toEqual([
      ["updates", "email"],
    ]);

    fireEvent.click(checkbox);
    expect(Array.from(new FormData(form).entries())).toEqual([]);
  });

  it.each([
    { label: "", value: "accepted" },
    { label: "Accept terms", value: "" },
  ])("should reject invalid Checkbox text props %#", ({ label, value }) => {
    expect(() =>
      componentRegistry.checkbox.propsSchema.parse({
        label,
        name: "terms",
        value,
        defaultChecked: false,
        required: false,
        disabled: false,
      }),
    ).toThrow();
  });

  it("should render a labeled native Checkbox Group with authored selections", () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;

    render(
      <CheckboxGroup
        className="published-checkbox-group"
        props={{
          label: "Interests",
          name: "interests",
          options: ["Design", "Research", "Development"],
          defaultValues: ["Design", "Development"],
          orientation: "horizontal",
          required: true,
          disabled: false,
        }}
        style={{ width: "100%" }}
      />,
    );

    const group = screen.getByRole("group", { name: "Interests" });
    const design = screen.getByRole("checkbox", { name: "Design" });
    const research = screen.getByRole("checkbox", { name: "Research" });
    const development = screen.getByRole("checkbox", { name: "Development" });

    expect(group).toHaveClass("checkbox-group", "published-checkbox-group");
    expect(group).toHaveAttribute("data-orientation", "horizontal");
    expect(group).toHaveAttribute("aria-required", "true");
    expect(group).toHaveStyle({ width: "100%" });
    expect(design).toHaveAttribute("name", "interests");
    expect(design).toHaveAttribute("value", "Design");
    expect(design).toBeChecked();
    expect(research).not.toBeChecked();
    expect(development).toBeChecked();
  });

  it("should preserve live Checkbox Group selections and adopt changed authored defaults", async () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;
    const props = {
      label: "Interests",
      name: "interests",
      options: ["Design", "Research", "Development"],
      defaultValues: ["Design"],
      orientation: "vertical" as const,
      required: false,
      disabled: false,
    };
    const view = render(<CheckboxGroup props={props} style={{}} />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Research" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Design" }));
    view.rerender(
      <CheckboxGroup
        props={{ ...props, label: "Topics", orientation: "horizontal" }}
        style={{}}
      />,
    );

    expect(screen.getByRole("checkbox", { name: "Research" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Design" })).not.toBeChecked();

    view.rerender(
      <CheckboxGroup
        props={{
          ...props,
          label: "Topics",
          defaultValues: ["Design", "Development"],
          orientation: "horizontal",
        }}
        style={{}}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Design" })).toBeChecked();
      expect(
        screen.getByRole("checkbox", { name: "Development" }),
      ).toBeChecked();
      expect(screen.getByRole("checkbox", { name: "Research" })).not.toBeChecked();
    });
  });

  it("should make an empty required Checkbox Group invalid", () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;

    render(
      <form aria-label="Preferences">
        <CheckboxGroup
          props={{
            label: "Interests",
            name: "interests",
            options: ["Design", "Research"],
            defaultValues: [],
            orientation: "vertical",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
      </form>,
    );

    const form = screen.getByRole("form", { name: "Preferences" });
    const design = screen.getByRole("checkbox", { name: "Design" });
    const research = screen.getByRole("checkbox", { name: "Research" });
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected the preferences form to be a native form element");
    }

    expect(form.checkValidity()).toBe(false);
    expect(design).toBeRequired();
    expect(research).not.toBeRequired();
  });

  it("should satisfy a required Checkbox Group when any option is selected", () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;

    render(
      <form aria-label="Preferences">
        <CheckboxGroup
          props={{
            label: "Interests",
            name: "interests",
            options: ["Design", "Research"],
            defaultValues: [],
            orientation: "vertical",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
      </form>,
    );

    const form = screen.getByRole("form", { name: "Preferences" });
    const design = screen.getByRole("checkbox", { name: "Design" });
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected the preferences form to be a native form element");
    }

    fireEvent.click(screen.getByRole("checkbox", { name: "Research" }));

    expect(form.checkValidity()).toBe(true);
    expect(design).not.toBeRequired();
  });

  it("should restore the required constraint when the last selection is removed", () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;

    render(
      <form aria-label="Preferences">
        <CheckboxGroup
          props={{
            label: "Interests",
            name: "interests",
            options: ["Design", "Research"],
            defaultValues: ["Research"],
            orientation: "vertical",
            required: true,
            disabled: false,
          }}
          style={{}}
        />
      </form>,
    );

    const form = screen.getByRole("form", { name: "Preferences" });
    const design = screen.getByRole("checkbox", { name: "Design" });
    if (!(form instanceof HTMLFormElement)) {
      throw new Error("Expected the preferences form to be a native form element");
    }

    fireEvent.click(screen.getByRole("checkbox", { name: "Research" }));

    expect(form.checkValidity()).toBe(false);
    expect(design).toBeRequired();
  });

  it("should disable every Checkbox Group option", () => {
    const CheckboxGroup = componentRegistry["checkbox-group"].render;

    render(
      <CheckboxGroup
        props={{
          label: "Interests",
          name: "interests",
          options: ["Design", "Research"],
          defaultValues: ["Research"],
          orientation: "vertical",
          required: false,
          disabled: true,
        }}
        style={{}}
      />,
    );

    expect(screen.getByRole("group", { name: "Interests" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Design" })).toBeDisabled();
    expect(screen.getByRole("checkbox", { name: "Research" })).toBeDisabled();
  });

  it.each([
    { name: "", options: ["Design", "Research"], defaultValues: [] },
    {
      name: "interests",
      options: ["Design", "Design"],
      defaultValues: [],
    },
    {
      name: "interests",
      options: ["Design", "Research"],
      defaultValues: ["Design", "Design"],
    },
    {
      name: "interests",
      options: ["Design", "Research"],
      defaultValues: ["Development"],
    },
  ])(
    "should reject invalid Checkbox Group configuration %#",
    ({ name, options, defaultValues }) => {
      expect(() =>
        componentRegistry["checkbox-group"].propsSchema.parse({
          label: "Interests",
          name,
          options,
          defaultValues,
          orientation: "vertical",
          required: false,
          disabled: false,
        }),
      ).toThrow();
    },
  );
});

describe("canPlaceType", () => {
  it("should allow root placement and placement inside container components", () => {
    expect(canPlaceType(null, "section")).toBe(true);
    expect(canPlaceType("section", "card")).toBe(true);
    expect(canPlaceType("card", "card")).toBe(true);
    expect(canPlaceType("container", "image")).toBe(true);
    expect(canPlaceType("container", "link")).toBe(true);
    expect(canPlaceType("container", "button")).toBe(true);
    expect(canPlaceType("container", "form")).toBe(true);
    expect(canPlaceType("container", "label")).toBe(true);
    expect(canPlaceType("container", "input")).toBe(true);
    expect(canPlaceType("container", "textarea")).toBe(true);
    expect(canPlaceType("container", "dropdown")).toBe(true);
    expect(canPlaceType("form", "input")).toBe(true);
    expect(canPlaceType("form", "label")).toBe(true);
    expect(canPlaceType("form", "textarea")).toBe(true);
    expect(canPlaceType("form", "dropdown")).toBe(true);
    expect(canPlaceType("form", "radio-group")).toBe(true);
    expect(canPlaceType("form", "checkbox")).toBe(true);
    expect(canPlaceType("form", "checkbox-group")).toBe(true);
    expect(canPlaceType("form", "button")).toBe(true);
  });

  it("should reject placement inside leaf components", () => {
    expect(canPlaceType("heading", "text")).toBe(false);
    expect(canPlaceType("link", "text")).toBe(false);
    expect(canPlaceType("button", "card")).toBe(false);
    expect(canPlaceType("form", "form")).toBe(false);
    expect(canPlaceType("form", "container")).toBe(false);
    expect(canPlaceType("form", "image")).toBe(false);
    expect(canPlaceType("input", "text")).toBe(false);
    expect(canPlaceType("textarea", "text")).toBe(false);
    expect(canPlaceType("dropdown", "text")).toBe(false);
    expect(canPlaceType("radio-group", "text")).toBe(false);
    expect(canPlaceType("checkbox", "text")).toBe(false);
    expect(canPlaceType("checkbox-group", "text")).toBe(false);
    expect(canPlaceType("label", "input")).toBe(false);
  });
});
