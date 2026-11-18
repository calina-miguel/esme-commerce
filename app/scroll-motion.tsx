"use client";

import { useEffect } from "react";

export default function ScrollMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".marketing");
    if (!root) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-motion]"));
    const reveals = Array.from(
      root.querySelectorAll<HTMLElement>(
        ".hero-copy h1, .section-intro h2, .feature-sticky h2, .pricing-section h2, .faq h2, .hero-copy > p, .section-intro > p"
      )
    );
    const heroVisual = root.querySelector<HTMLElement>(".hero-visual");
    const heroSection = heroVisual?.closest("section");
    const feature = root.querySelector<HTMLElement>(".feature-section");
    const nativeViewTimeline = CSS.supports("animation-timeline", "view()");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const target = entry.target as HTMLElement;
          target.classList.add(target.classList.contains("reveal") ? "is-visible" : "motion-visible");
          observer.unobserve(target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" }
    );

    for (const heading of reveals) {
      heading.classList.add("reveal");
      observer.observe(heading);
    }
    for (const item of items) observer.observe(item);

    root.classList.add("scroll-motion-ready");

    let frame = 0;
    const updateFallback = () => {
      frame = 0;
      if (heroSection) {
        const distance = -heroSection.getBoundingClientRect().top;
        heroVisual?.style.setProperty("--parallax-y", `${distance * 0.18}px`);
        root.querySelector<HTMLElement>(".orb-one")?.style.setProperty("transform", `translate3d(0, ${distance * 0.28}px, 0)`);
        root.querySelector<HTMLElement>(".orb-two")?.style.setProperty("transform", `translate3d(0, ${-distance * 0.22}px, 0)`);
      }
      if (feature) {
        const bounds = feature.getBoundingClientRect();
        const total = Math.max(1, bounds.height - window.innerHeight);
        const progress = Math.min(1, Math.max(0, -bounds.top / total));
        feature.style.setProperty("--section-progress", `${progress}`);
      }
    };
    const scheduleFallback = () => {
      if (!frame) frame = window.requestAnimationFrame(updateFallback);
    };

    if (!nativeViewTimeline && !reducedMotion) {
      updateFallback();
      window.addEventListener("scroll", scheduleFallback, { passive: true });
      window.addEventListener("resize", scheduleFallback);
    }

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleFallback);
      window.removeEventListener("resize", scheduleFallback);
      for (const heading of reveals) heading.classList.remove("reveal", "is-visible");
      for (const item of items) item.classList.remove("motion-visible");
      root.classList.remove("scroll-motion-ready");
    };
  }, []);

  return null;
}
