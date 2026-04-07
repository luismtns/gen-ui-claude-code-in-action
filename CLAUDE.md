# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps + Prisma generate + migrate
npm run dev            # Start dev server with Turbopack (http://localhost:3000)
npm run build          # Production build (requires NODE_OPTIONS node-compat.cjs shim)
npm run lint           # ESLint
npm run test           # Run all Vitest tests
npm run test -- src/lib/__tests__/file-system.test.ts  # Run a single test file
npm run db:reset       # Reset SQLite database (destructive)
npx prisma migrate dev # Apply schema changes and regenerate client
npx prisma generate    # Regenerate Prisma client after schema edits
```

Tests run in jsdom via Vitest. The `NODE_OPTIONS='--require ./node-compat.cjs'` wrapper in `build`/`start` scripts patches Node.js for Prisma compatibility on Windows—it's intentional.

## Architecture

### Virtual File System
The core abstraction is `VirtualFileSystem` (`src/lib/file-system.ts`) — an in-memory tree of `FileNode` objects. **No generated files are ever written to disk.** The VFS is serialized to/from JSON for persistence in the database (`Project.data`) and passed on every API request as `files: Record<string, FileNode>`.

### AI Generation Flow
1. **Chat API** (`src/app/api/chat/route.ts`): Receives messages + the serialized VFS, reconstructs it server-side, then calls `streamText` (Vercel AI SDK) with two tools:
   - `str_replace_editor` — create/str_replace/insert operations on the VFS
   - `file_manager` — rename/delete operations on the VFS
2. Tool call results are streamed back; the client's `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) handles incoming tool calls via `handleToolCall` to keep the client VFS in sync.
3. On finish, if the user is authenticated and has a `projectId`, the full message history and VFS snapshot are persisted to `Project.messages` / `Project.data`.

### Browser Preview
`PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders generated components inside a sandboxed `<iframe>` using `srcdoc`. The pipeline in `src/lib/transform/jsx-transformer.ts`:
1. Transforms JSX/TSX files via `@babel/standalone`
2. Creates blob URLs for each transformed file
3. Builds an ES module import map (local blob URLs + `esm.sh` CDN for third-party packages)
4. Injects Tailwind CSS via CDN and renders into `<div id="root">`

The entry point is `/App.jsx` by default; fallbacks scan for `App.tsx`, `index.jsx`, etc.

### Authentication
JWT-based sessions via `jose`, stored as an httpOnly cookie. Passwords are hashed with `bcrypt`. All auth logic is in `src/lib/auth.ts` (server-only). Middleware (`src/middleware.ts`) protects routes. Anonymous users can use the app without signing in; projects are only persisted for authenticated users.

### Mock Provider
When `ANTHROPIC_API_KEY` is not set, `getLanguageModel()` (`src/lib/provider.ts`) returns a `MockLanguageModel` that streams canned component code. This lets the app run without an API key. The real model is `claude-haiku-4-5`.

### Database
SQLite via Prisma. Schema at `prisma/schema.prisma`. The generated Prisma client outputs to `src/generated/prisma/` (not `node_modules`). Two models: `User` and `Project` (messages + data stored as JSON strings).

### Key Contexts
- `FileSystemContext` — owns the client-side VFS instance and exposes CRUD operations + `handleToolCall`
- `ChatContext` — manages message history and the `useChat` hook (Vercel AI SDK)

Both are provided at the project page level (`src/app/[projectId]/page.tsx`).
