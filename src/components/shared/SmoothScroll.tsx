"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Initialises Lenis for buttery-smooth scrolling on the public surfaces.
 * Mounted by the (public) layout only — admin navigation keeps native scroll
 * so tables, long forms and drawers behave predictably.
 */
export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });

    let rafId = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
