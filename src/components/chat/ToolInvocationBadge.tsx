"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(
  toolName: string,
  args: Record<string, any>
): string {
  if (toolName === "str_replace_editor") {
    const { command, path = "" } = args;
    const displayPath = path.replace(/^\//, "") || "file";
    switch (command) {
      case "create":
        return `Creating ${displayPath}`;
      case "str_replace":
        return `Editing ${displayPath}`;
      case "insert":
        return `Editing ${displayPath}`;
      case "view":
        return `Reading ${displayPath}`;
      case "undo_edit":
        return `Undoing edit in ${displayPath}`;
      default:
        return `Editing ${displayPath}`;
    }
  }

  if (toolName === "file_manager") {
    const { command, path = "", new_path = "" } = args;
    const displayPath = path.replace(/^\//, "") || "file";
    switch (command) {
      case "rename": {
        const displayNewPath = new_path.replace(/^\//, "") || "new location";
        return `Renaming ${displayPath} → ${displayNewPath}`;
      }
      case "delete":
        return `Deleting ${displayPath}`;
      default:
        return toolName;
    }
  }

  return toolName;
}

export function ToolInvocationBadge({
  toolInvocation,
}: {
  toolInvocation: ToolInvocation;
}) {
  const { toolName, args, state } = toolInvocation;
  const result = "result" in toolInvocation ? toolInvocation.result : undefined;
  const label = getToolLabel(toolName, args as Record<string, any>);
  const isDone = state === "result" && result != null;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
