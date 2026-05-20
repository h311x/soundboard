/**
 * Embed "Soundboard" into Windows PE version info (launcher.exe + bun.exe).
 * Electrobun only sets icons via rcedit; this fixes Task Manager / some routing UIs.
 * Run after `electrobun build` on Windows (or via Wine on macOS CI if needed).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const APP_NAME = "Soundboard";
const VERSION = process.env.npm_package_version ?? "0.0.0";
const BUILD_DIR = join(import.meta.dir, "..", "build");

function findExes(dir: string, names: Set<string>, out: string[] = []): string[] {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		let st;
		try {
			st = statSync(full);
		} catch {
			continue;
		}
		if (st.isDirectory()) {
			findExes(full, names, out);
		} else if (names.has(entry.toLowerCase())) {
			out.push(full);
		}
	}
	return out;
}

function patchExe(exePath: string, rceditExe: string) {
	console.log(`Patching metadata: ${exePath}`);
	execFileSync(
		rceditExe,
		[
			exePath,
			"--set-version-string",
			"ProductName",
			APP_NAME,
			"--set-version-string",
			"FileDescription",
			APP_NAME,
			"--set-version-string",
			"InternalName",
			APP_NAME,
			"--set-version-string",
			"OriginalFilename",
			"Soundboard.exe",
			"--set-version-string",
			"CompanyName",
			"h311x",
			"--set-file-version",
			VERSION,
			"--set-product-version",
			VERSION,
		],
		{ stdio: "inherit" },
	);
}

const rceditPkg = require.resolve("rcedit/package.json");
const rceditDir = dirname(rceditPkg);
const rceditX64 = join(rceditDir, "bin", "rcedit-x64.exe");
const rceditExe = existsSync(rceditX64)
	? rceditX64
	: join(rceditDir, "bin", "rcedit.exe");

if (!existsSync(rceditExe)) {
	console.error("rcedit not found");
	process.exit(1);
}

const targets = findExes(BUILD_DIR, new Set(["launcher.exe", "bun.exe"]));
if (targets.length === 0) {
	console.warn(`No launcher.exe/bun.exe under ${BUILD_DIR} — skip metadata patch`);
	process.exit(0);
}

for (const exe of targets) {
	patchExe(exe, rceditExe);
}

console.log(`Patched ${targets.length} executable(s).`);
