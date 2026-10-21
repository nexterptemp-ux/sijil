/// <reference types="vitest" />
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

// Production build is served by Frappe from the app's public folder:
//   sijil/public/frontend  ->  /assets/sijil/frontend/
// The entry file names are stable (no hash) so sijil/www/sijil.html can reference them;
// sijil/www/sijil.py appends a cache-busting version.
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const bench = env.SIJIL_BENCH_URL || "http://sijil.localhost:8000";

	return {
		plugins: [react()],
		base: mode === "production" ? "/assets/sijil/frontend/" : "/sijil/",
		resolve: { alias: { "@": path.resolve(__dirname, "src") } },
		server: {
			port: 8080,
			// ar.csv lives in the Frappe app, one level up.
			fs: { allow: [path.resolve(__dirname, "..")] },
			proxy:
				mode === "mock"
					? undefined
					: Object.fromEntries(
							["/api", "/assets", "/files", "/private", "/login", "/app"].map((p) => [
								p,
								{ target: bench, changeOrigin: false },
							]),
						),
		},
		build: {
			outDir: path.resolve(__dirname, "../sijil/public/frontend"),
			emptyOutDir: true,
			sourcemap: false,
			rollupOptions: {
				output: {
					entryFileNames: "assets/index.js",
					assetFileNames: (info) =>
						info.names?.some((n) => n.endsWith(".css")) ? "assets/index.css" : "assets/[name]-[hash][extname]",
					chunkFileNames: "assets/[name]-[hash].js",
				},
			},
		},
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: ["./src/test/setup.ts"],
			css: false,
		},
	};
});
