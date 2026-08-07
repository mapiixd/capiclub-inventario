"use client";

import { useEffect } from "react";

function getStoredTheme() {
  const storedTheme = window.localStorage.getItem("capiclub-theme");

  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider() {
  useEffect(() => {
    document.documentElement.dataset.theme = getStoredTheme();
    window.dispatchEvent(new Event("capiclub-theme-change"));
  }, []);

  return null;
}
