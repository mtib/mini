# mini

CLI for managing tmux sessions on a remote machine via SSH.

## Setup

Set these environment variables (e.g. in `~/.zprofile`):

```bash
export MINI_USERNAME="youruser"
export MINI_HOST="your-host"
```

## Install

```bash
bun install
bun link
```

## Usage

```
mini list          # list tmux sessions
mini ls            # alias for list
mini new           # create claude-<n> session and attach
mini attach <name> # attach to existing session
mini a <name>      # alias for attach
mini <name>        # shorthand for attach
mini <n>           # shorthand for attach claude-<n>
```

`mini new` creates a tmux session with two panes in `~/workspace`:
- **Left**: `claude --enable-auto-mode`
- **Right**: shell

Session names follow `claude-<n>` where `n` is the smallest unused integer starting from 1.
