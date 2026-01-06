import type { Config } from "tailwindcss";

export default {
  darkMode: ["selector", '[data-theme*="dark"]'],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          light: "hsl(var(--secondary-light))",
          dark: "hsl(var(--secondary-dark))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          light: "hsl(var(--destructive-light))",
          dark: "hsl(var(--destructive-dark))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Status Colors from Color Guide
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
          dark: "hsl(var(--success-dark))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
          dark: "hsl(var(--warning-dark))",
        },
        error: {
          DEFAULT: "hsl(var(--error))",
          light: "hsl(var(--error-light))",
          dark: "hsl(var(--error-dark))",
        },
        // RCSA Design System
        "first-line": {
          DEFAULT: "hsl(var(--first-line))",
          light: "hsl(var(--first-line-light))",
          foreground: "hsl(var(--first-line-foreground))",
        },
        "second-line": {
          DEFAULT: "hsl(var(--second-line))",
          light: "hsl(var(--second-line-light))",
          foreground: "hsl(var(--second-line-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Chart Colors from Color Guide
        chart: {
          blue: "#25A0BE",
          malibu: "#86C1F3",
          moody: "#6A75D8",
          portage: "#979FE4",
          amethyst: "#A361CF",
          lavender: "#BF90D0",
          mulberry: "#CB41A2",
          orchid: "#D874AE",
          sienna: "#8B5993",
          apricot: "#F1BB87",
          jaffa: "#F1BA50",
          tacao: "#F5ADB5",
          california: "#F59D02",
          casablanca: "#FBBAA8",
          supernova: "#F3BF39",
          golden: "#F7D274",
          dollar: "#98BD55",
          conifer: "#BED963",
          chateau: "#46AF6A",
          emerald: "#7DC797",
          meadow: "#13C8A5",
          viking: "#5AD8C0",
          havelock: "#4883CF",
          danube: "#7FA8DD",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "tab-flash": {
          "0%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.7)" },
          "50%": { boxShadow: "0 0 0 8px rgba(59, 130, 246, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
        },
        "tab-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "tab-flash": "tab-flash 0.6s ease-out",
        "tab-pulse": "tab-pulse 0.3s ease-in-out 2",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
