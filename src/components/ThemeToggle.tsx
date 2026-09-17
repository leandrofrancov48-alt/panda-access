"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check current state from html class
    const isCurrentlyDark = document.documentElement.classList.contains("dark");
    setIsDark(isCurrentlyDark);
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);

    if (nextTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Alternar modo de color"
        className="p-2 sm:px-3 sm:py-2 rounded-xl border-[2px] border-black dark:border-[#3D362C] bg-white dark:bg-[#1E1B16] text-black dark:text-[#F4F0EA] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none transition-all flex items-center gap-2 cursor-pointer opacity-70"
      >
        <Moon className="w-4 h-4 opacity-60" />
        <span className="hidden sm:inline text-xs font-black uppercase tracking-wide opacity-60">Tema</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 sm:px-3 sm:py-2 rounded-xl border-[2px] border-black dark:border-[#3D362C] bg-white dark:bg-[#1E1B16] text-black dark:text-[#F4F0EA] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2 cursor-pointer"
      title={isDark ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Alternar modo de color"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-[#F7D7A7]" />
          <span className="hidden sm:inline text-xs font-black uppercase tracking-wide">Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-black" />
          <span className="hidden sm:inline text-xs font-black uppercase tracking-wide">Oscuro</span>
        </>
      )}
    </button>
  );
}
