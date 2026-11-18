"use client";

import { useEffect } from "react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

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
    const orbOne = root.querySelector<HTMLElement>(".orb-one");
    const orbTwo = root.querySelector<HTMLElement>(".orb-two");
    const floatCard = root.querySelector<HTMLElement>(".float-card");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
          entry.target.classList.add(entry.target.classList.contains("reveal") ? "is-visible" : "motion-visible");
          observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 }
    );

    for (const heading of reveals) {
      heading.classList.add("reveal");
      observer.observe(heading);
    }
    for (const item of items) observer.observe(item);

    let frame = 0;

    const feature = root.querySelector<HTMLElement>(".feature-section");
    const heroSection = heroVisual?.closest("section");

    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const width = window.innerWidth;
      const mobile = width < 650;
      const tablet = width < 1024;
      const heroDistance = heroSection ? -heroSection.getBoundingClientRect().top : 0;
      const featureBounds = feature?.getBoundingClientRect();

      const itemMotion = items.map((item) => {
        const rect = item.getBoundingClientRect();
        const enter = clamp((height * 0.95 - rect.top) / (height * 0.5));
        const leave = clamp((rect.bottom - height * 0.05) / (height * 0.35));
        const eased = 1 - Math.pow(1 - Math.min(enter, leave), 3);
        const direction = item.dataset.scrollMotion === "left" ? -1 : item.dataset.scrollMotion === "right" ? 1 : 0;
        const isHero = item.classList.contains("hero-visual");
        const isStep = item.classList.contains("step-card");
        const distance = mobile
          ? isHero ? Math.min(width * 0.2, 88) : isStep ? Math.min(width * 0.15, 64) : 48
          : isHero ? Math.min(width * 0.24, 340) : isStep ? (tablet ? 130 : 165) : (tablet ? 95 : 120);

        return {
          item,
          x: (1 - eased) * distance * direction,
          y: (1 - eased) * (direction ? (mobile ? 28 : tablet ? 52 : 75) : distance),
          opacity: Math.max(0.1, eased),
          scale: (isHero ? 0.9 : isStep ? 0.94 : 0.96) + eased * (isHero ? 0.1 : isStep ? 0.06 : 0.04),
          rotation: (1 - eased) * (isHero ? 3 : isStep ? 2 : 1.25) * direction,
        };
      });

      // Read every layout measurement before writing transforms to avoid frame-time layout thrashing.
      if (heroVisual) heroVisual.style.setProperty("--parallax-y", `${heroDistance * 0.18}px`);
      if (orbOne) orbOne.style.transform = `translate3d(0, ${heroDistance * 0.28}px, 0)`;
      if (orbTwo) orbTwo.style.transform = `translate3d(0, ${-heroDistance * 0.22}px, 0)`;
      if (floatCard) floatCard.style.transform = `translate3d(0, ${-heroDistance * 0.14}px, 0)`;

      for (const motion of itemMotion) {
        motion.item.style.setProperty("--scroll-x", `${motion.x}px`);
        motion.item.style.setProperty("--scroll-y", `${motion.y}px`);
        motion.item.style.setProperty("--scroll-opacity", `${motion.opacity}`);
        motion.item.style.setProperty("--scroll-scale", `${motion.scale}`);
        motion.item.style.setProperty("--scroll-rotate", `${motion.rotation}deg`);
      }

      if (feature && featureBounds) {
        const total = Math.max(1, featureBounds.height - height);
        feature.style.setProperty("--section-progress", `${clamp(-featureBounds.top / total)}`);
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    root.classList.add("scroll-motion-ready");
    update();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      for (const heading of reveals) {
        heading.classList.remove("reveal", "is-visible");
      }
      for (const item of items) item.classList.remove("motion-visible");
      root.classList.remove("scroll-motion-ready");
    };
  }, []);

  return null;
}
