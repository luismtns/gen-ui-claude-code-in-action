import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge, getToolLabel } from "../ToolInvocationBadge";

afterEach(() => {
  cleanup();
});

// ---------------------------------------------------------------------------
// getToolLabel — pure unit tests
// ---------------------------------------------------------------------------

test("str_replace_editor: create returns Creating label", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("str_replace_editor: str_replace returns Editing label", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.jsx" })).toBe("Editing components/Card.jsx");
});

test("str_replace_editor: insert returns Editing label", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/index.tsx" })).toBe("Editing index.tsx");
});

test("str_replace_editor: view returns Reading label", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading App.jsx");
});

test("str_replace_editor: undo_edit returns Undoing edit label", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Undoing edit in App.jsx");
});

test("str_replace_editor: unknown command falls back to Editing label", () => {
  expect(getToolLabel("str_replace_editor", { command: "unknown_cmd", path: "/App.jsx" })).toBe("Editing App.jsx");
});

test("str_replace_editor: empty path falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "" })).toBe("Creating file");
});

test("str_replace_editor: missing path falls back to 'file'", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("file_manager: rename returns Renaming label with arrow", () => {
  expect(
    getToolLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })
  ).toBe("Renaming old.jsx → new.jsx");
});

test("file_manager: delete returns Deleting label", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/App.jsx" })).toBe("Deleting App.jsx");
});

test("file_manager: rename with empty new_path falls back to 'new location'", () => {
  expect(
    getToolLabel("file_manager", { command: "rename", path: "/App.jsx", new_path: "" })
  ).toBe("Renaming App.jsx → new location");
});

test("unknown tool returns toolName as-is", () => {
  expect(getToolLabel("some_other_tool", {})).toBe("some_other_tool");
});

// ---------------------------------------------------------------------------
// ToolInvocationBadge — component rendering tests
// ---------------------------------------------------------------------------

function makeInvocation(
  toolName: string,
  args: Record<string, any>,
  state: "call" | "result",
  result: any = "ok"
) {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result };
  }
  return { toolCallId: "1", toolName, args, state };
}

test("renders human-readable label for str_replace_editor create", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result") as any}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
});

test("renders human-readable label for file_manager delete", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", { command: "delete", path: "/App.jsx" }, "result") as any}
    />
  );
  expect(screen.getByText("Deleting App.jsx")).toBeDefined();
});

test("shows spinner when state is 'call' (pending)", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "call") as any}
    />
  );
  // Spinner uses animate-spin class
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  // Green dot should not be present
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("shows green dot when state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result") as any}
    />
  );
  expect(container.querySelector(".bg-emerald-500")).not.toBeNull();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("shows spinner when result is null even if state is 'result'", () => {
  const { container } = render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", { command: "create", path: "/App.jsx" }, "result", null) as any}
    />
  );
  expect(container.querySelector(".animate-spin")).not.toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders raw toolName for unknown tools", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("some_other_tool", {}, "result") as any}
    />
  );
  expect(screen.getByText("some_other_tool")).toBeDefined();
});
