import { Resvg } from "@resvg/resvg-js";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import pngToIco from "png-to-ico";

const ROOT = join(import.meta.dir, "..");
const SOURCE = join(ROOT, "assets/icon/app-icon.svg");
const ICONSET_DIR = join(ROOT, "icon.iconset");
const ICO_PATH = join(ROOT, "assets/icon/icon.ico");
const MASTER_PNG = join(ROOT, "assets/icon/app-icon-1024.png");

/** macOS AppIcon.iconset naming (see iconutil -c icns). */
const ICONSET = [
	{ file: "icon_16x16.png", size: 16 },
	{ file: "icon_16x16@2x.png", size: 32 },
	{ file: "icon_32x32.png", size: 32 },
	{ file: "icon_32x32@2x.png", size: 64 },
	{ file: "icon_128x128.png", size: 128 },
	{ file: "icon_128x128@2x.png", size: 256 },
	{ file: "icon_256x256.png", size: 256 },
	{ file: "icon_256x256@2x.png", size: 512 },
	{ file: "icon_512x512.png", size: 512 },
	{ file: "icon_512x512@2x.png", size: 1024 },
] as const;

const ICO_SIZES = [16, 32, 48, 256] as const;

function renderPng(svg: string, size: number): Uint8Array {
	const resvg = new Resvg(svg, {
		fitTo: { mode: "width", value: size },
	});
	return resvg.render().asPng();
}

async function writeMacIconset(svg: string): Promise<void> {
	await mkdir(ICONSET_DIR, { recursive: true });
	console.log("Rendering macOS icon.iconset…");
	for (const { file, size } of ICONSET) {
		const out = join(ICONSET_DIR, file);
		await Bun.write(out, renderPng(svg, size));
		console.log(`  ${file} (${size}px)`);
	}
	await Bun.write(MASTER_PNG, renderPng(svg, 1024));
	console.log(`Wrote ${MASTER_PNG}`);
}

async function writeWindowsIco(svg: string): Promise<void> {
	console.log("Rendering Windows icon.ico…");
	const icoPngs: string[] = [];
	const tmpDir = join(ROOT, "assets/icon/.ico-build");
	await mkdir(tmpDir, { recursive: true });
	for (const size of ICO_SIZES) {
		const p = join(tmpDir, `icon-${size}.png`);
		await Bun.write(p, renderPng(svg, size));
		icoPngs.push(p);
	}
	const ico = await pngToIco(icoPngs);
	await Bun.write(ICO_PATH, ico);
	console.log(`Wrote ${ICO_PATH}`);
}

async function main() {
	const svg = await Bun.file(SOURCE).text();
	if (!svg.trim()) throw new Error(`Empty SVG: ${SOURCE}`);

	await mkdir(join(ROOT, "assets/icon"), { recursive: true });
	await writeMacIconset(svg);
	await writeWindowsIco(svg);
	console.log("Done.");
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
