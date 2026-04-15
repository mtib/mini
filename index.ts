#!/usr/bin/env bun

const username = process.env.MINI_USERNAME || process.env.USER;
const host = process.env.MINI_HOST;
if (!username || !host) {
  console.error("Missing MINI_HOST environment variable.");
  process.exit(1);
}
const SSH_HOST = `${username}@${host}`;

async function ssh(...args: string[]): Promise<string> {
  const proc = Bun.spawn(["ssh", SSH_HOST, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const stdout = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    throw new Error(`ssh failed (exit ${exitCode}): ${stderr.trim()}`);
  }
  return stdout.trim();
}

function parseSessions(output: string): string[] {
  if (!output) return [];
  return output
    .split("\n")
    .map((line) => line.split(":")[0]!.trim())
    .filter(Boolean);
}

async function list() {
  try {
    const output = await ssh("tmux", "list-sessions");
    console.log(output);
  } catch (e: any) {
    if (e.message.includes("no server running") || e.message.includes("no sessions")) {
      console.log("No tmux sessions.");
    } else {
      throw e;
    }
  }
}

async function connect(name: string) {
  let sessions: string[] = [];
  try {
    const output = await ssh("tmux", "list-sessions");
    sessions = parseSessions(output);
  } catch {}

  if (!sessions.includes(name)) {
    if (name.startsWith("claude")) {
      await ssh(`tmux new-session -d -s ${name} -c ~/workspace 'claude --enable-auto-mode'`);
    } else {
      await ssh(`tmux new-session -d -s ${name} -c ~/workspace`);
    }
  }

  process.stdout.write(`\x1b]0;mini - ${name}\x07`);
  const proc = Bun.spawn(
    ["ssh", "-t", SSH_HOST, "tmux", "attach-session", "-t", name],
    { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Failed to attach to session "${name}".`);
    process.exit(1);
  }
}

const [command] = process.argv.slice(2);

if (!command) {
  console.log(`Usage: mini <command>

Commands:
  list        List tmux sessions
  ls          Alias for list
  <name>      Connect to session (creates if needed)

Sessions starting with "claude" run claude --enable-auto-mode.`);
} else if (command === "list" || command === "ls") {
  await list();
} else {
  await connect(command);
}
