/**
 * Patch Windows bundle executables: embed Soundboard icon + PE version strings.
 * Electrobun sets icons at build time; re-applying ensures updates refresh taskbar assets.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const APP_NAME = "Soundboard";
const ROOT = join(import.meta.dir, "..");
const BUILD_DIR = join(ROOT, "build");
const ICON_PATH = join(ROOT, "assets/icon/icon.ico");

function readVersion(): string {
	try {
		const pkg = JSON.parse(
			readFileSync(join(ROOT, "package.json"), "utf8"),
		) as { version?: string };
		if (pkg.version) return pkg.version;
	} catch {
		/* ignore */
	}
	return "0.0.0";
}

const VERSION = readVersion();

function findExes(dir: string, out: string[] = []): string[] {
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
			findExes(full, out);
		} else if (entry.toLowerCase().endsWith(".exe")) {
			out.push(full);
		}
	}
	return out;
}

function patchExe(exePath: string, rceditExe: string) {
	const args = [
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
	];

	if (existsSync(ICON_PATH)) {
		args.push("--set-icon", ICON_PATH);
	}

	console.log(`Patching ${exePath}`);
	execFileSync(rceditExe, args, { stdio: "inherit" });
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

const targets = findExes(BUILD_DIR).filter((exe) => {
	const base = exe.split(/[/\\]/).pop()?.toLowerCase() ?? "";
	return (
		base === "launcher.exe" ||
		base === "bun.exe" ||
		base === "soundboard.exe" ||
		base.startsWith("soundboard")
	);
});

if (targets.length === 0) {
	console.warn(`No patchable .exe under ${BUILD_DIR} — skip Windows bundle patch`);
	process.exit(0);
}

for (const exe of targets) {
	patchExe(exe, rceditExe);
}

console.log(`Patched ${targets.length} executable(s) (v${VERSION}).`);
