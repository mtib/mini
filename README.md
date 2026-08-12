# mini

CLI for managing tmux sessions on a remote machine via SSH.

## Setup

Set these environment variables (e.g. in `~/.zprofile`):

```bash
export MINI_HOST="your-host"
export MINI_USERNAME="youruser"    # optional, defaults to $USER
export MINI_WORKSPACE="~/projects" # optional, defaults to ~/workspace
```

## Install

### macOS — Homebrew

```sh
brew tap mtib/tap
brew trust mtib/tap   # Homebrew 6+ refuses to load formulae from untrusted taps
brew install mini
```

Upgrade:

```sh
brew update && brew upgrade mini
```

Every push to `main` publishes a release and bumps the tap formula, so upgrades track `main`.

### Pre-built binary

Download the latest binary for your platform from the [releases page](https://github.com/mtib/mini/releases/tag/latest), extract it, and place `mini` on your `PATH`.

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `mini-aarch64-apple-darwin.tar.gz` |
| macOS (Intel) | `mini-x86_64-apple-darwin.tar.gz` |
| Linux x86_64 | `mini-x86_64-unknown-linux-gnu.tar.gz` |
| Linux aarch64 | `mini-aarch64-unknown-linux-gnu.tar.gz` |
| Windows x86_64 | `mini-x86_64-pc-windows-msvc.zip` |

### From source

```sh
bun install
bun link
```

## Usage

```
mini list                 # list tmux sessions
mini ls                   # alias for list
mini <name>               # connect to session (creates if needed)
mini -w ~/other <name>    # create the session in ~/other instead
```

New sessions start in, in order of priority: the `-w` / `--workspace` argument, `$MINI_WORKSPACE`, or `~/workspace`. The path is expanded by the remote shell, so `~` works.

If the name starts with `claude`, `claude --enable-auto-mode` runs as the session command (session closes when claude exits).

On connect, the terminal tab title is set to `mini - <name>`.

## Completions

Add to `~/.zshrc` for tab completion of commands and session names:

```bash
eval "$(mini completions)"
```

## Warp

For the best experience using Warp as your terminal, see [this gist](https://gist.github.com/mtib/4d2f595963b1635fbca9ed550a630357) for remote machine configuration.

## Brew tap setup (for contributors)

The Homebrew formula lives in [mtib/homebrew-tap](https://github.com/mtib/homebrew-tap) and is updated automatically by CI on every push to `main`. To replicate this setup:

1. Create a GitHub repo named `homebrew-tap`.
2. Add a `TAP_TOKEN` secret to the `mini` repo — a fine-grained PAT with `Contents: Read and write` on the tap repo.
