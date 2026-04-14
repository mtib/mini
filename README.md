# mini

CLI for managing tmux sessions on a remote machine via SSH.

## Setup

Set these environment variables (e.g. in `~/.zprofile`):

```bash
export MINI_HOST="your-host"
export MINI_USERNAME="youruser"  # optional, defaults to $USER
```

## Install

```bash
bun install
bun link
```

## Usage

```
mini list          # list tmux sessions
mini new           # create claude-<n> session and attach
mini new <name>    # create named session and attach
mini attach <name> # attach to existing session
mini <name>        # shorthand for attach
mini <n>           # shorthand for attach claude-<n>
```

Any unambiguous prefix works as a command (e.g. `mini l`, `mini n`, `mini a foo`). `ls` is an alias for `list`.

Sessions are created in `~/workspace`. If the name starts with `claude-`, `claude --enable-auto-mode` runs as the session command (session closes when claude exits).

On attach, the terminal tab title is set to `mini - <name>`.

## Warp

For the best experience using Warp as your terminal, see [this gist](https://gist.github.com/mtib/4d2f595963b1635fbca9ed550a630357) for remote machine configuration.
