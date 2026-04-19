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

    // Native anchor navigation (<a href="#menu">) bypasses Lenis, so the
    // browser snaps to the target while Lenis keeps its own internal scroll
    // position. Intercept and route the click through lenis.scrollTo so the
    // scroll animates in sync.
    const handleAnchorClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const target = (event.target as HTMLElement | null)?.closest(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href === "#") return;
      const element = document.querySelector(href);
      if (!element) return;
      event.preventDefault();
      lenis.scrollTo(element as HTMLElement, { offset: -64 });
      // Keep the hash in the URL for shareability / back-button.
      history.replaceState(null, "", href);
    };

    document.addEventListener("click", handleAnchorClick);

    let rafId = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("click", handleAnchorClick);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
