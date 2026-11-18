"use client";

import { useEffect } from "react";

/** Walk offsetParent chain to get stable document-relative top — avoids layout thrash on every frame. */
function getDocumentTop(el: HTMLElement): number {
  let top = 0;
  let cur: HTMLElement | null = el;
  while (cur && cur !== document.body) {
    top += cur.offsetTop;
    cur = cur.offsetParent as HTMLElement | null;
  }
  return top;
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

type Measurement = {
  el: HTMLElement;
  top: number;
  height: number;
  dir: number;      // -1 left | 1 right | 0 none
  isHero: boolean;
  skipOpacity: boolean; // true when this container holds reveal headings
};

type LenisInstance = {
  scroll: number;
  on(event: string, cb: () => void): void;
  off(event: string, cb: () => void): void;
};

export default function ScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".marketing");
    if (!root) return;

    // --- Collect targets ---
    const motionEls = Array.from(
      root.querySelectorAll<HTMLElement>("[data-scroll-motion]")
    );
    const revealEls = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".hero-copy h1, .section-intro h2, .feature-sticky h2, .pricing-section h2, .faq h2, .hero-copy > p, .section-intro > p"
      )
    );
    const heroVisual = root.querySelector<HTMLElement>(".hero-visual");
    const orbOne = root.querySelector<HTMLElement>(".orb-one");
    const orbTwo = root.querySelector<HTMLElement>(".orb-two");
    const floatCard = root.querySelector<HTMLElement>(".float-card");

    // --- Pre-measured positions ---
    let measurements: Measurement[] = [];

    function measure() {
      const revealSet = new Set<HTMLElement>(revealEls);
      measurements = motionEls.map((el) => {
        // If this element contains any reveal heading, skip the opacity fade
        // so the hidden-opacity parent never makes child headings invisible.
        const skipOpacity = revealEls.some((rev) => el.contains(rev));
        return {
          el,
          top: getDocumentTop(el),
          height: el.offsetHeight,
          dir:
            el.dataset.scrollMotion === "left"
              ? -1
              : el.dataset.scrollMotion === "right"
              ? 1
              : 0,
          isHero: el.classList.contains("hero-visual"),
          skipOpacity,
        };
      });
      // suppress unused var warning
      void revealSet;
    }

    // --- Per-frame update ---
    let frame = 0;

    function update() {
      frame = 0;
      const vh = window.innerHeight;
      const lenis = (window as unknown as { __lenis?: LenisInstance }).__lenis;
      const scrollY = lenis ? lenis.scroll : window.scrollY;

      for (const { el, top, height, dir, isHero, skipOpacity } of measurements) {
        // progress: 0 = element just entering bottom of viewport, 1 = fully scrolled past top
        const progress = clamp((scrollY + vh - top) / (vh + height));

        const enter = clamp(progress / 0.2);
        const exit  = clamp((progress - 0.78) / 0.22);

        // Y: starts below, rests at 0, drifts up on exit
        const startY = isHero ? 60 : 44;
        const endY   = isHero ? -50 : -36;
        const y = progress < 0.2 ? startY * (1 - enter) : progress > 0.78 ? endY * exit : 0;

        // X: gentle horizontal nudge on enter only
        const startX = Math.abs(dir) * (isHero ? 30 : 22);
        const x = dir * startX * (1 - enter);

        // Opacity: containers with reveal children keep opacity 1 always
        // so the IntersectionObserver reveal on the child heading can work
        const rawOpacity = progress < 0.2 ? enter : progress > 0.78 ? 1 - exit : 1;
        const opacity = skipOpacity ? 1 : Math.max(0, rawOpacity);

        // Scale: subtle enter-in / exit-shrink
        const scale = 0.965 + 0.035 * enter - 0.015 * exit;

        el.style.setProperty("--scroll-x", `${x}px`);
        el.style.setProperty("--scroll-y", `${y}px`);
        el.style.setProperty("--scroll-opacity", String(opacity));
        el.style.setProperty("--scroll-scale", String(Math.max(0.9, scale)));
      }

      // Orb parallax (native scroll position for smooth backdrop motion)
      if (heroVisual) {
        const heroSection = heroVisual.closest("section");
        const dist = heroSection ? -heroSection.getBoundingClientRect().top : 0;
        heroVisual.style.setProperty("--parallax-y", `${dist * 0.1}px`);
        if (orbOne)   orbOne.style.transform   = `translate3d(0,${dist * 0.22}px,0)`;
        if (orbTwo)   orbTwo.style.transform   = `translate3d(0,${-dist * 0.16}px,0)`;
        if (floatCard) floatCard.style.transform = `translate3d(0,${-dist * 0.1}px,0)`;
      }

      // Feature section scroll-linked progress bar
      const feature = root!.querySelector<HTMLElement>(".feature-section");
      if (feature) {
        const b = feature.getBoundingClientRect();
        feature.style.setProperty(
          "--section-progress",
          String(clamp(-b.top / Math.max(1, b.height - vh)))
        );
      }
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    // --- IntersectionObserver for text reveals ---
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );
    for (const el of revealEls) {
      el.classList.add("reveal");
      observer.observe(el);
    }

    // --- Hook into Lenis scroll event (prefers Lenis, falls back to native) ---
    function tryHookLenis(): boolean {
      const lenis = (window as unknown as { __lenis?: LenisInstance }).__lenis;
      if (lenis) {
        lenis.on("scroll", schedule);
        return true;
      }
      return false;
    }

    let lenisHooked = tryHookLenis();
    const retryTimer = !lenisHooked
      ? setTimeout(() => { lenisHooked = tryHookLenis(); }, 400)
      : null;

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", () => { measure(); schedule(); }, { passive: true });
    window.addEventListener("load", () => { measure(); schedule(); }, { once: true });

    // ResizeObserver re-measures when any target changes size
    let ro: ResizeObserver | null = null;
    if ("ResizeObserver" in window) {
      ro = new ResizeObserver(() => { measure(); schedule(); });
      ro.observe(document.body);
    }

    // Activate and do first paint
    root.classList.add("scroll-motion-ready");
    measure();
    if (ro) for (const { el } of measurements) ro.observe(el);
    update();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (retryTimer) clearTimeout(retryTimer);
      const lenis = (window as unknown as { __lenis?: LenisInstance }).__lenis;
      if (lenis) lenis.off("scroll", schedule);
      observer.disconnect();
      ro?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      for (const el of revealEls) el.classList.remove("reveal", "is-visible");
      root.classList.remove("scroll-motion-ready");
    };
  }, []);

  return null;
}
