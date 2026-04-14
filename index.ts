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

function usedNumbers(sessions: string[]): Set<number> {
  const nums = new Set<number>();
  for (const name of sessions) {
    const match = name.match(/^claude-(\d+)$/);
    if (match) nums.add(parseInt(match[1]!, 10));
  }
  return nums;
}

function smallestUnused(used: Set<number>): number {
  let n = 1;
  while (used.has(n)) n++;
  return n;
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

async function newSession() {
  let sessions: string[] = [];
  try {
    const output = await ssh("tmux", "list-sessions");
    sessions = parseSessions(output);
  } catch {
    // no sessions yet
  }

  const n = smallestUnused(usedNumbers(sessions));
  const name = `claude-${n}`;

  // Create session with claude in left pane, shell in right pane, both in ~/workspace.
  // Build as a single shell command string so SSH passes it correctly.
  const setup = [
    `tmux new-session -d -s ${name} -c ~/workspace`,
    `tmux send-keys -t ${name} 'claude --enable-auto-mode' Enter`,
    `tmux split-window -h -t ${name} -c ~/workspace`,
    `tmux select-pane -t ${name}:.0`,
    `tmux attach-session -t ${name}`,
  ].join(" && ");

  const proc = Bun.spawn(["ssh", "-t", SSH_HOST, setup], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await proc.exited;
}

function usedWarpNumbers(sessions: string[]): Set<number> {
  const nums = new Set<number>();
  for (const name of sessions) {
    const match = name.match(/^claude-warp-(\d+)$/);
    if (match) nums.add(parseInt(match[1]!, 10));
  }
  return nums;
}

async function warpNew() {
  let sessions: string[] = [];
  try {
    const output = await ssh("tmux", "list-sessions");
    sessions = parseSessions(output);
  } catch {
    // no sessions yet
  }

  const n = smallestUnused(usedWarpNumbers(sessions));
  const name = `claude-warp-${n}`;

  // Create session with two windows: "claude" and "shell", both in ~/workspace.
  const setup = [
    `tmux new-session -d -s ${name} -c ~/workspace -n claude`,
    `tmux send-keys -t ${name}:claude 'claude --enable-auto-mode' Enter`,
    `tmux new-window -t ${name} -c ~/workspace -n shell`,
  ].join(" && ");

  await ssh(setup);
  await warpAttach(name);
}

async function warpAttach(target: string) {
  const shellSshCmd = `ssh -t ${SSH_HOST} tmux attach-session -t '${target}:shell'`;

  // AppleScript: split Warp right (Cmd+D), then type SSH command for the shell window.
  const script = `
delay 1
tell application "System Events"
  keystroke "d" using {command down}
  delay 1
  keystroke "${shellSshCmd}"
  key code 36
end tell`;

  // Start SSH for claude window in current (left) pane.
  const proc = Bun.spawn(
    ["ssh", "-t", SSH_HOST, "tmux", "attach-session", "-t", `${target}:claude`],
    { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
  );

  // Launch Warp split script in background.
  Bun.spawn(["osascript", "-e", script], {
    stdout: "ignore",
    stderr: "ignore",
  });

  await proc.exited;
}

async function attach(target: string) {
  const proc = Bun.spawn(["ssh", "-t", SSH_HOST, "tmux", "attach-session", "-t", target], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    console.error(`Failed to attach to session "${target}".`);
    process.exit(1);
  }
}

const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "list":
  case "ls":
    await list();
    break;
  case "new":
    await newSession();
    break;
  case "warp": {
    const [warpCmd, ...warpArgs] = args;
    switch (warpCmd) {
      case "new":
        await warpNew();
        break;
      case "attach":
      case "at": {
        if (!warpArgs[0]) {
          console.error("Usage: mini warp attach <n>");
          process.exit(1);
        }
        const t = /^\d+$/.test(warpArgs[0]) ? `claude-warp-${warpArgs[0]}` : warpArgs[0];
        await warpAttach(t);
        break;
      }
      default:
        if (warpCmd && /^\d+$/.test(warpCmd)) {
          await warpAttach(`claude-warp-${warpCmd}`);
        } else if (warpCmd) {
          await warpAttach(warpCmd);
        } else {
          console.log(`Usage: mini warp <command>

Commands:
  new                Create & attach to a new claude-warp-<n> session
  attach, at <n>     Attach to an existing warp session
  <n>                Shorthand for attach claude-warp-<n>`);
        }
        break;
    }
    break;
  }
  case "attach":
  case "a":
    if (!args[0]) {
      console.error("Usage: mini attach <session-name>");
      process.exit(1);
    }
    await attach(args[0]);
    break;
  default:
    if (command) {
      const target = /^\d+$/.test(command) ? `claude-${command}` : command;
      await attach(target);
    } else {
      console.log(`Usage: mini <command>

Commands:
  list, ls          List tmux sessions on mac-mini-01
  new               Create & attach to a new claude-<n> session
  attach, a <name>  Attach to an existing session
  <name>            Shorthand for attach <name>
  <n>               Shorthand for attach claude-<n>
  warp new          Create & attach to a new claude-warp-<n> session
  warp [at] <n>     Attach to a warp session (Warp split: claude | shell)`);
    }
    break;
}
