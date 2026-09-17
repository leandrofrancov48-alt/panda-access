"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function ConfettiTrigger() {
  useEffect(() => {
    try {
      // Golden, red and blue confetti explosion
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFE600", "#FF2E4C", "#2563EB", "#FFFFFF"],
      });
    } catch {
      // ignore
    }
  }, []);

  return null;
}
