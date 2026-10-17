#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Translate arguments for Next.js CLI
// Next.js uses -p/--port and -H/--hostname (it does not recognize --host)
const rawArgs = process.argv.slice(2);
const filteredArgs = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--host") {
    const nextArg = rawArgs[i + 1];
    filteredArgs.push("-H", nextArg && !nextArg.startsWith("-") ? nextArg : "0.0.0.0");
    if (nextArg && !nextArg.startsWith("-")) {
      i++;
    }
  } else if (arg.startsWith("--host=")) {
    filteredArgs.push("-H", arg.split("=")[1]);
  } else {
    filteredArgs.push(arg);
  }
}

if (!filteredArgs.includes("-p") && !filteredArgs.includes("--port")) {
  filteredArgs.push("-p", process.env.PORT || "3000");
}
if (!filteredArgs.includes("-H") && !filteredArgs.includes("--hostname")) {
  filteredArgs.push("-H", process.env.HOSTNAME || "0.0.0.0");
}

const nextBin = path.resolve(__dirname, "../node_modules/.bin/next");

const child = spawn(nextBin, ["dev", ...filteredArgs], {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});

child.on("error", (err) => {
  console.error("Failed to start Next.js dev server:", err);
  process.exit(1);
});
