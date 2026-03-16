const { spawn } = require("node:child_process");

const isWindows = process.platform === "win32";
const children = [];

function startProcess(name, script, color) {
  const command = isWindows ? "cmd.exe" : "sh";
  const args = isWindows ? ["/d", "/s", "/c", `npm run ${script}`] : ["-lc", `npm run ${script}`];

  const child = spawn(command, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false
  });

  const prefix = `\x1b[${color}m[${name}]\x1b[0m`;

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`${prefix} ${chunk}`);
  });

  child.stderr.on("data", (chunk) => {
    process.stderr.write(`${prefix} ${chunk}`);
  });

  child.on("exit", (code) => {
    const normalized = code ?? 0;
    console.log(`${prefix} exited with code ${normalized}`);

    if (normalized !== 0) {
      shutdown(normalized);
    }
  });

  children.push(child);
}

function shutdown(code) {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }

  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

startProcess("api", "dev:api", "36");
startProcess("web", "dev:web", "35");
