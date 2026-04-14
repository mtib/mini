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
mini new <name>    # create named session and attach
mini attach <name> # attach to existing session
mini a <name>      # alias for attach
mini <name>        # shorthand for attach
mini <n>           # shorthand for attach claude-<n>
```

Sessions are created in `~/workspace`. If the name starts with `claude-`, `claude --enable-auto-mode` runs as the session command (session closes when claude exits).
