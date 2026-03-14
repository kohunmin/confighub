#!/usr/bin/env node

const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const pkgDir = path.join(__dirname, "..");
const nextBin = path.join(pkgDir, "node_modules", "next", "dist", "bin", "next");
const buildDir = path.join(pkgDir, ".next");
const port = process.env.PORT || 3000;

console.log("⚙  ConfigHub — AI tool config manager");
console.log("");

// Build on first run if .next doesn't exist
if (!fs.existsSync(buildDir)) {
  console.log("Building for first run (this takes ~30 seconds)...");
  try {
    execSync(`node "${nextBin}" build`, { cwd: pkgDir, stdio: "inherit" });
  } catch (e) {
    console.error("Build failed:", e.message);
    process.exit(1);
  }
}

// Start Next.js production server
const server = spawn("node", [nextBin, "start", "-p", String(port)], {
  cwd: pkgDir,
  stdio: "inherit",
});

server.on("error", (err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});

// Open browser after server is ready
setTimeout(() => {
  const url = `http://localhost:${port}`;
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "${url}"`
        : `xdg-open "${url}"`;
  require("child_process").exec(cmd);
  console.log(`\n  ✓ ConfigHub running at ${url}\n`);
  console.log("  Press Ctrl+C to stop.\n");
}, 3000);

process.on("SIGINT", () => {
  server.kill();
  process.exit(0);
});
