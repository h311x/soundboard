# Soundboard

Cross-platform desktop soundboard built with [Electrobun](https://blackboard.sh/electrobun). Play sounds from a liquid-glass UI or global hotkeys.

**Repository:** [github.com/h311x/soundboard](https://github.com/h311x/soundboard)

## Features

- Import sounds via file dialog or drag-and-drop (mp3, wav, ogg, m4a, aac, webm)
- Custom display names, per-clip and master volume
- Global hotkeys (click-to-record per clip)
- Overlapping playback with Stop all
- Drag-to-reorder pads
- Accent color presets (default gray)
- Auto-updates via GitHub Releases (stable channel)

## Development

```bash
bun install
bun run dev          # Electrobun dev (bundled views)
bun run dev:hmr      # Vite HMR + Electrobun
```

## Build

```bash
bun run build:stable   # Production build + artifacts/
bun run build:canary   # Canary channel build
```

Artifacts land in `artifacts/` for upload to GitHub Releases.

## Releases

Push a tag `v*` to trigger [.github/workflows/release.yml](.github/workflows/release.yml). **Currently enabled** (to save CI minutes):

- macOS arm64 (`macos-14`)
- Windows x64

**Temporarily disabled** in the workflow (commented out, easy to re-enable): macOS x64, Linux x64, Linux arm64.

Updates are configured in `electrobun.config.ts` (`release.baseUrl` → GitHub Releases). Stable builds check:

`https://github.com/h311x/soundboard/releases/latest/download/stable-<platform>-<arch>-update.json`

### Cut a release

1. Bump `version` in `package.json` and `electrobun.config.ts`.
2. Commit and tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

3. GitHub Actions builds all platforms and publishes assets to the Release.
4. Installed apps on the **stable** channel pick up updates automatically (in-app banner + restart).

### macOS unsigned builds

v1 builds may be unsigned. On first launch: right-click the app → **Open**, or allow in **System Settings → Privacy & Security**.

### Apple code signing (optional)

Add GitHub secrets for signed/notarized macOS builds:

- `ELECTROBUN_DEVELOPER_ID`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Then set `mac.codesign` and `mac.notarize` to `true` in `electrobun.config.ts`.

## Audio routing

Soundboard plays to the **system default output**. To send audio into calls (Discord, Zoom, etc.), use a virtual audio device such as [BlackHole](https://existential.audio/blackhole/) (macOS) or VB-Cable (Windows).

## Data

User data is stored under Electrobun’s app data directory:

- `board.json` — clips and volumes
- `settings.json` — accent preset, window bounds, always-on-top
- `sounds/` — imported audio files

## Stack

- Electrobun (Bun + system webview / CEF on Linux)
- React + Vite + Tailwind
- Web Audio API
