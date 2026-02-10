"use client";

import { useState } from "react";

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false;

  const storedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldBeDark = storedTheme === "dark" || (!storedTheme && prefersDark);

  document.documentElement.classList.toggle("dark", shouldBeDark);
  return shouldBeDark;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);

  const toggleTheme = () => {
    const html = document.documentElement;
    const nextIsDark = !html.classList.contains("dark");

    html.classList.toggle("dark", nextIsDark);
    localStorage.setItem("theme", nextIsDark ? "dark" : "light");
    setIsDark(nextIsDark);
  };

  return (
    <button
      onClick={toggleTheme}
      className="rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary hover:bg-muted transition"
    >
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
