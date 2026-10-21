import type { Config } from "tailwindcss";

export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		container: { center: true, padding: "1rem" },
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				surface: "hsl(var(--surface))",
				primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))", soft: "hsl(var(--primary-soft))" },
				muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
				accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
				destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
				success: { DEFAULT: "hsl(var(--success))", soft: "hsl(var(--success-soft))" },
				warning: { DEFAULT: "hsl(var(--warning))", soft: "hsl(var(--warning-soft))" },
				danger: { DEFAULT: "hsl(var(--danger))", soft: "hsl(var(--danger-soft))" },
			},
			borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 4px)", sm: "calc(var(--radius) - 6px)" },
			fontFamily: { sans: ["Cairo", "Segoe UI", "Tahoma", "system-ui", "sans-serif"] },
			boxShadow: { card: "0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(30,46,84,.04)" },
		},
	},
	plugins: [],
} satisfies Config;
