"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("capiclub-theme");

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function subscribeToTheme(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("capiclub-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("capiclub-theme-change", onStoreChange);
  };
}

function getThemeSnapshot(): Theme {
  return getInitialTheme();
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("capiclub-theme", nextTheme);
    window.dispatchEvent(new Event("capiclub-theme-change"));
  }

  const Icon = theme === "dark" ? Sun : Moon;

  return (
    <button
      aria-label={theme === "dark" ? "Usar tema claro" : "Usar tema oscuro"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-[var(--sidebar-foreground)] hover:bg-white/15"
      onClick={toggleTheme}
      title={theme === "dark" ? "Tema claro" : "Tema oscuro"}
      type="button"
    >
      <Icon size={17} />
    </button>
  );
}
