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
bun run dev          # Vite HMR + Electrobun dev app
bun run lint         # ESLint (TypeScript + React)
bun run lint:fix     # ESLint with auto-fix
bun run typecheck    # TypeScript (tsc --noEmit)
bun run fallow       # Dead code, duplication, complexity (strict)
bun run fallow:fix   # Auto-fix where Fallow supports it
bun run check        # lint + typecheck + fallow
bun run test         # Unit tests (Bun)
bun run icons        # Regenerate app icons from assets/icon/
```

## Build

```bash
bun run build        # Production build → artifacts/
```

Artifacts land in `artifacts/` for upload to GitHub Releases.

## Releases

Push a tag `v*` to trigger [.github/workflows/release.yml](.github/workflows/release.yml) (pushes to `master` alone do **not** run it). You can also run it manually under **Actions → Build and Release → Run workflow**.

**Currently enabled** (to save CI minutes):

- macOS arm64 (`macos-14`)
- Windows x64

**Temporarily disabled** in the workflow (commented out, easy to re-enable): macOS x64, Linux x64, Linux arm64.

Updates are configured in `electrobun.config.ts` (`release.baseUrl` → GitHub Releases). Stable builds check:

`https://github.com/h311x/soundboard/releases/latest/download/stable-<platform>-<arch>-update.json`

### Cut a release

1. Bump `version` in `package.json` and `electrobun.config.ts` **in the same commit** as the code you are shipping.
2. Push `master`, then create and push the tag **once**:

```bash
git push origin master
git tag v0.1.0
git push origin v0.1.0
```

3. GitHub Actions builds enabled platforms and publishes assets to the Release.
4. Installed apps on the **stable** channel pick up updates automatically (in-app banner + restart).

**Avoid duplicate CI runs:** the release workflow runs on every `v*` tag push. If you tag the wrong commit and then `git push -f origin v0.1.0` to move the tag, GitHub starts a **second** pipeline even though the tag name is unchanged. Fix the commit first, then tag once; or cancel the extra run in Actions.

### macOS install (unsigned builds)

Release builds are **not code-signed**. After downloading from GitHub, macOS may say the app is **“damaged”** — that is Gatekeeper, not a corrupt file.

**Option A — Remove quarantine (recommended)**

```bash
xattr -cr /path/to/Soundboard.app
```

Then open normally (double-click or from Applications).

**Option B — First open via right-click**

Right-click `Soundboard.app` → **Open** → confirm **Open** in the dialog. You only need to do this once.

**Option C — System Settings**

If macOS still blocks it: **System Settings → Privacy & Security** → **Open Anyway** (shown after a blocked launch attempt).

### Windows icon after update

Windows caches app icons aggressively. The in-app updater replaces the app files (including `launcher.exe` with the embedded icon), but **pinned taskbar / Start menu shortcuts** may still show the old image until the cache refreshes.

Try, in order:

1. **Unpin** Soundboard from the taskbar, then launch it again from the Start menu or install folder and **pin again**.
2. Restart **File Explorer** (Task Manager → Windows Explorer → Restart), or sign out and back in.
3. Delete any old desktop shortcut and create a new one from the updated `launcher.exe` under your Electrobun app data folder.

Download `stable-macos-arm64-Soundboard.dmg` or extract the `.tar.zst` (e.g. double-click, or `tar -xf` in Terminal).

### Apple code signing (optional)

Add GitHub secrets for signed/notarized macOS builds:

- `ELECTROBUN_DEVELOPER_ID`
- `APPLE_ID`
- `APPLE_APP_SPECIFIC_PASSWORD`
- `APPLE_TEAM_ID`

Then set `mac.codesign` and `mac.notarize` to `true` in `electrobun.config.ts`.

## Audio routing

Soundboard plays to the **system default output**. To send audio into calls (Discord, Zoom, etc.), use a virtual audio device such as [BlackHole](https://existential.audio/blackhole/) (macOS) or VB-Cable (Windows).

### Windows: app name in volume mixer / routing tools

On Windows, the UI uses **WebView2**. If sounds were played only inside the webview, Windows would list the audio source as **Microsoft Edge WebView2** or **Windows Feature Experience Pack** (a common label for WebView2’s audio session), not **Soundboard**.

**Soundboard 0.1.5+** plays clips from the main app process (`bun.exe` / `launcher.exe`) on Windows so routing apps (Voicemeeter, OBS, etc.) should show **Soundboard**. Host playback supports **MP3 and WAV**; other formats (OGG, M4A, AAC, WebM) still use WebView audio and may show the generic Windows label.

After building on Windows, `scripts/patch-win-metadata.ts` re-embeds the app icon and sets **ProductName** / **FileDescription** on `launcher.exe`, `bun.exe`, and `Soundboard.exe`.

If the taskbar icon is still stale after updating: unpin Soundboard, quit the app, relaunch from the updated install folder, then pin again (Windows icon cache).

### Windows window chrome

Soundboard uses the **native Windows title bar** (minimize, maximize, close, resize). Electrobun/WebView2 does not expose deep DWM/title-bar theming; customization is mainly the **app icon** and **window title** (“Soundboard”). The in-app toolbar is not a drag region on Windows so volume sliders work correctly.

### Windows: startup layout (right/bottom crop)

On first launch, the webview can look slightly **cropped on the right and bottom** until you resize the window. That is not a CSS bug in Soundboard — it is a known Electrobun/WebView2 issue: with a default frame, the initial `window.innerWidth` / `innerHeight` include the native title bar chrome, so the page is laid out ~16px too wide and ~28px too tall until the first resize syncs the webview to the real client area.

- **Upstream:** [blackboardsh/electrobun#431](https://github.com/blackboardsh/electrobun/issues/431)
- **Workaround in this repo:** on `dom-ready`, Bun runs a one-pixel `setSize` nudge so Electrobun’s `autoResize` recalculates bounds before the UI paints (`src/bun/webview-layout.ts`). The UI uses `position: fixed; inset: 0` only — no `100vw`/`100vh` scaling hacks.
- **Do not** use `<meta name="viewport" content="width=device-width">` in the bundled HTML; it fights the desktop host viewport.

## Data

User data is stored under Electrobun’s app data directory:

- `board.json` — clips and volumes
- `settings.json` — accent preset, window bounds, always-on-top
- `sounds/` — imported audio files

## Stack

- Electrobun (Bun + system webview / CEF on Linux)
- React + Vite + Tailwind
- Web Audio API
