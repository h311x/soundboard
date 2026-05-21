import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Soundboard",
		identifier: "com.h311x.soundboard",
		version: "0.1.14",
	},
	runtime: {
		exitOnLastWindowClosed: true,
	},
	build: {
		bun: {
			entrypoint: "src/bun/index.ts",
		},
		copy: {
			"dist/index.html": "views/mainview/index.html",
			"dist/assets": "views/mainview/assets",
		},
		watchIgnore: ["dist/**"],
		mac: {
			bundleCEF: false,
			codesign: false,
			notarize: false,
			icons: "icon.iconset",
		},
		linux: {
			bundleCEF: true,
			defaultRenderer: "cef",
		},
		win: {
			bundleCEF: false,
			icon: "assets/icon/icon.ico",
		},
	},
	release: {
		baseUrl:
			"https://github.com/h311x/soundboard/releases/latest/download",
	},
	// postBuild: patch launcher/bun before tarball (Electrobun CI rcedit is broken — #429)
	// postPackage: patch Soundboard-Setup.exe + release zip
	scripts: {
		postBuild: "scripts/patch-win-metadata.ts",
		postPackage: "scripts/patch-win-metadata.ts",
	},
} satisfies ElectrobunConfig;
