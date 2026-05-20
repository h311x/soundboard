import type { ElectrobunConfig } from "electrobun";

export default {
	app: {
		name: "Soundboard",
		identifier: "com.h311x.soundboard",
		version: "0.1.7",
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
} satisfies ElectrobunConfig;
