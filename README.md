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
mini list       # list tmux sessions
mini ls         # alias for list
mini <name>     # connect to session (creates if needed)
```

Sessions are created in `~/workspace`. If the name starts with `claude`, `claude --enable-auto-mode` runs as the session command (session closes when claude exits).

On connect, the terminal tab title is set to `mini - <name>`.

## Completions

Add to `~/.zshrc` for tab completion of commands and session names:

```bash
eval "$(mini completions)"
```

## Warp

For the best experience using Warp as your terminal, see [this gist](https://gist.github.com/mtib/4d2f595963b1635fbca9ed550a630357) for remote machine configuration.
