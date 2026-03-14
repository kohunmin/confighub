# ConfigHub

A unified dashboard for managing AI coding tool configurations in one place.

![ConfigHub Screenshot](https://github.com/kohunmin/confighub/raw/main/public/screenshot.png)

## Overview

ConfigHub lets you view, edit, compare, and sync configuration files for **Claude Code**, **Cursor**, **Windsurf**, and **Devin** — all from a single VS Code-style dark UI running locally on your machine.

## Features

### ✏️ Edit
Browse and edit each tool's config files directly in a Monaco editor (the same editor as VS Code):

| Section | Claude Code | Cursor | Windsurf | Devin |
|---|---|---|---|---|
| MCP Servers | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.cursor/mcp.json` | — | `~/.config/cognition/config.json` |
| Agent Rules | `CLAUDE.md` | `.cursor/rules/*.md` | `.windsurf/rules/*.md` | `AGENTS.md` |
| Skills | `~/.claude/plugins/marketplaces/...` | — | — | `.cognition/skills/` |
| Settings | `~/.claude/settings.json` | `~/Library/Application Support/Cursor/User/settings.json` | — | — |

### ↕️ Sync
Copy MCP server configs from one tool to all others with the **↕ Apply All** button. Only the `mcpServers` key is replaced — other keys (like Claude's `preferences`) are preserved.

### ⚠️ Diff Detection
Yellow warning badges appear on any section where configs differ between tools. Works for both JSON (structural diff) and Markdown (text diff).

### 📊 Compare Panel
Expand the bottom panel to see a side-by-side table of MCP server differences across all tools, or a Monaco diff editor for Markdown rule files.

### 💾 Auto Backup
Every save creates a `.bak.timestamp` file next to the original, so you can always roll back.

### ↔️ Resizable Sidebar
Drag the handle between the sidebar and editor to resize. Width is saved to `localStorage`.

## Getting Started

```bash
git clone https://github.com/kohunmin/confighub.git
cd confighub
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects automatically to the Claude Code MCP view.

> **Note:** The app reads and writes real config files on your local filesystem via Next.js API routes. No data leaves your machine.

## Tech Stack

- **Next.js 14+** (App Router, TypeScript, Tailwind CSS)
- **Monaco Editor** (`@monaco-editor/react`) — VS Code dark theme
- **deep-diff** + **diff** — JSON structural diff and unified text diff
- **gray-matter** — YAML frontmatter parsing for `SKILL.md` files
- Node.js `fs` in API routes for real file I/O

## Project Structure

```
confighub/
├── app/
│   ├── tool/[tool]/page.tsx    # Main dashboard page
│   └── api/                   # File read/write/diff/sync endpoints
├── components/
│   ├── layout/                # TopBar, Sidebar
│   ├── editor/                # Monaco EditorPane
│   └── diff/                  # DiffBadge, ComparisonPanel
├── lib/                       # Config paths, reader, writer, diff engine
├── hooks/                     # useConfig, useDiff
└── types/                     # Shared TypeScript interfaces
```

## Roadmap

- [ ] Electron wrapper for native file system access without `npm run dev`
- [ ] Windsurf MCP config path support (once officially documented)
- [ ] Project switcher for Rules / Skills sections
- [ ] Real-time file watching with auto-refresh
