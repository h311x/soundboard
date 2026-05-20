# App icon

| File | Purpose |
|------|---------|
| `app-icon.svg` | **Source of truth** — edit this, then regenerate platform assets |
| `app-icon-1024.png` | Master raster (generated) |
| `icon.ico` | Windows build (generated) |

macOS uses `icon.iconset/` at the repo root (generated from the SVG).

Regenerate after changing the artwork:

```bash
bun run icons
```

Preview drafts live in `assets/previews/`.
