#!/usr/bin/env bun

const username = process.env.MINI_USERNAME;
const host = process.env.MINI_HOST;
if (!username || !host) {
  console.error("Missing MINI_USERNAME or MINI_HOST environment variables.");
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

async function newSession(name?: string) {
  if (!name) {
    let sessions: string[] = [];
    try {
      const output = await ssh("tmux", "list-sessions");
      sessions = parseSessions(output);
    } catch {}

    const used = new Set<number>();
    for (const s of sessions) {
      const m = s.match(/^claude-(\d+)$/);
      if (m) used.add(parseInt(m[1]!, 10));
    }
    let n = 1;
    while (used.has(n)) n++;
    name = `claude-${n}`;
  }

  if (name.startsWith("claude-")) {
    await ssh(`tmux new-session -d -s ${name} -c ~/workspace 'claude --enable-auto-mode'`);
  } else {
    await ssh(`tmux new-session -d -s ${name} -c ~/workspace`);
  }

  await attach(name);
}

async function attach(target: string) {
  process.stdout.write(`\x1b]0;mini - ${target}\x07`);
  const proc = Bun.spawn(
    ["ssh", "-t", SSH_HOST, "tmux", "attach-session", "-t", target],
    { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
  );
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Failed to attach to session "${target}".`);
    process.exit(1);
  }
}

const commands = ["list", "new", "attach"];
const aliases: Record<string, string> = { ls: "list" };

function resolveCommand(input: string): string | null {
  const matches = commands.filter((c) => c.startsWith(input));
  return matches.length === 1 ? matches[0]! : null;
}

const [rawCommand, ...args] = process.argv.slice(2);
const command = rawCommand ? aliases[rawCommand] ?? resolveCommand(rawCommand) ?? rawCommand : undefined;

switch (command) {
  case "list":
    await list();
    break;
  case "new":
    await newSession(args[0]);
    break;
  case "attach":
    if (!args[0]) {
      console.error("Usage: mini attach <name>");
      process.exit(1);
    }
    await attach(args[0]);
    break;
  default:
    if (rawCommand) {
      const target = /^\d+$/.test(rawCommand) ? `claude-${rawCommand}` : rawCommand;
      await attach(target);
    } else {
      console.log(`Usage: mini <command>

Commands:
  list              List tmux sessions
  new [name]        Create & attach (default: claude-<n>)
  attach <name>     Attach to an existing session
  <name>            Shorthand for attach
  <n>               Shorthand for attach claude-<n>

Any unambiguous prefix works (e.g. mini l, mini n, mini at).`);
    }
    break;
}
