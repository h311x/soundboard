/**
 * Embed Soundboard icon + PE metadata on Windows executables.
 *
 * Electrobun's built-in rcedit step fails on Windows CI (electrobun#429): the
 * downloaded CLI resolves rcedit from Bun's temp bundle, not this project.
 * This script runs from postBuild/postPackage with our rcedit dependency instead.
 */
import { execFileSync, execSync } from "node:child_process";
import {
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
} from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";

const require = createRequire(import.meta.url);

const APP_NAME = "Soundboard";
const ROOT = join(import.meta.dir, "..");
const BUILD_DIR = process.env.ELECTROBUN_BUILD_DIR ?? join(ROOT, "build");
const ARTIFACT_DIR = process.env.ELECTROBUN_ARTIFACT_DIR ?? join(ROOT, "artifacts");
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

function resolveRceditExe(): string {
	const rceditDir = dirname(require.resolve("rcedit/package.json"));
	const rceditX64 = join(rceditDir, "bin", "rcedit-x64.exe");
	const rceditExe = existsSync(rceditX64)
		? rceditX64
		: join(rceditDir, "bin", "rcedit.exe");
	if (!existsSync(rceditExe)) {
		throw new Error(`rcedit not found (looked in ${rceditDir})`);
	}
	return rceditExe;
}

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

function isBundleExe(base: string): boolean {
	const lower = base.toLowerCase();
	return lower === "launcher.exe" || lower === "bun.exe";
}

function isInstallerExe(base: string): boolean {
	const lower = base.toLowerCase();
	return lower.endsWith("-setup.exe") || lower === "soundboard-setup.exe";
}

function patchExe(exePath: string, rceditExe: string): void {
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

function patchBundleExes(rceditExe: string): number {
	const targets = findExes(BUILD_DIR).filter((exe) =>
		isBundleExe(basename(exe)),
	);
	for (const exe of targets) {
		patchExe(exe, rceditExe);
	}
	return targets.length;
}

function patchInstallerExes(rceditExe: string): number {
	let count = 0;
	for (const exe of findExes(BUILD_DIR)) {
		if (!isInstallerExe(basename(exe))) continue;
		patchExe(exe, rceditExe);
		count += 1;
	}
	return count;
}

function patchSetupZip(zipPath: string, rceditExe: string): boolean {
	if (process.platform !== "win32") return false;

	const staging = join(BUILD_DIR, `.patch-setup-${basename(zipPath).replace(/[^\w.-]/g, "_")}`);
	if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });

	try {
		execSync(
			`powershell -NoProfile -Command "Expand-Archive -Path '${zipPath.replace(/'/g, "''")}' -DestinationPath '${staging.replace(/'/g, "''")}' -Force"`,
			{ stdio: "inherit" },
		);
		const setupExe = findExes(staging).find((exe) =>
			isInstallerExe(basename(exe)),
		);
		if (!setupExe) {
			console.warn(`No Setup.exe found inside ${zipPath}`);
			return false;
		}
		patchExe(setupExe, rceditExe);
		execSync(
			`powershell -NoProfile -Command "Compress-Archive -Path '${join(staging, "*").replace(/'/g, "''")}' -DestinationPath '${zipPath.replace(/'/g, "''")}' -Force"`,
			{ stdio: "inherit" },
		);
		return true;
	} finally {
		if (existsSync(staging)) rmSync(staging, { recursive: true, force: true });
	}
}

function patchSetupZips(rceditExe: string): number {
	if (!existsSync(ARTIFACT_DIR)) return 0;
	let count = 0;
	for (const entry of readdirSync(ARTIFACT_DIR)) {
		if (!entry.toLowerCase().endsWith("-setup.zip")) continue;
		if (patchSetupZip(join(ARTIFACT_DIR, entry), rceditExe)) count += 1;
	}
	return count;
}

function main(): void {
	if (process.env.ELECTROBUN_OS && process.env.ELECTROBUN_OS !== "win") {
		console.log("Skipping Windows icon patch (not a Windows build).");
		return;
	}

	const rceditExe = resolveRceditExe();
	const bundleCount = patchBundleExes(rceditExe);
	const installerCount = patchInstallerExes(rceditExe);
	const zipCount = patchSetupZips(rceditExe);

	if (bundleCount + installerCount + zipCount === 0) {
		console.warn(
			`No Windows executables patched under ${BUILD_DIR} / ${ARTIFACT_DIR}`,
		);
		return;
	}

	console.log(
		`Patched ${bundleCount} bundle exe(s), ${installerCount} installer exe(s), ${zipCount} setup zip(s) (v${VERSION}).`,
	);
}

try {
	main();
} catch (err) {
	console.error(err);
	process.exit(1);
}
