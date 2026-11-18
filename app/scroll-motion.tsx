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
            entry.target.classList.add("is-visible");
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

    let frame = 0;

    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      const scrollY = window.scrollY;
      const mobile = window.innerWidth < 650;
      const tablet = window.innerWidth < 1024;

      // Parallax effect on hero visual elements
      if (heroVisual) {
        const hero = heroVisual.closest("section");
        const distance = hero ? -hero.getBoundingClientRect().top : 0;
        heroVisual.style.setProperty("--parallax-y", `${distance * 0.18}px`);

        if (orbOne) {
          orbOne.style.transform = `translate3d(0, ${distance * 0.28}px, 0)`;
        }
        if (orbTwo) {
          orbTwo.style.transform = `translate3d(0, ${-distance * 0.22}px, 0)`;
        }
        if (floatCard) {
          floatCard.style.transform = `translate3d(0, ${-distance * 0.14}px, 0)`;
        }
      }

      // Parallax & reveal on scroll-motion items
      for (const item of items) {
        const rect = item.getBoundingClientRect();
        const enter = clamp((height * 0.95 - rect.top) / (height * 0.5));
        const leave = clamp((rect.bottom - height * 0.05) / (height * 0.35));
        const progress = Math.min(enter, leave);
        const eased = 1 - Math.pow(1 - progress, 3);
        const direction = item.dataset.scrollMotion === "left" ? -1 : item.dataset.scrollMotion === "right" ? 1 : 0;
        const isHero = item.classList.contains("hero-visual");
        const isStep = item.classList.contains("step-card");
        const distance = mobile
          ? isHero ? Math.min(window.innerWidth * 0.82, 340) : isStep ? Math.min(window.innerWidth * 0.62, 260) : 130
          : isHero ? Math.min(window.innerWidth * 0.38, 430) : isStep ? (tablet ? 240 : 290) : (tablet ? 175 : 240);

        item.style.setProperty("--scroll-x", `${(1 - eased) * distance * direction}px`);
        item.style.setProperty("--scroll-y", `${(1 - eased) * (direction ? (mobile ? 28 : tablet ? 52 : 75) : distance)}px`);
        item.style.setProperty("--scroll-opacity", `${Math.max(0.1, eased)}`);
        item.style.setProperty("--scroll-scale", `${(isHero ? 0.72 : isStep ? 0.8 : 0.85) + eased * (isHero ? 0.28 : isStep ? 0.2 : 0.15)}`);
        item.style.setProperty("--scroll-rotate", `${(1 - eased) * (isHero ? 8 : isStep ? 4 : 2) * direction}deg`);
      }

      // Section progress bar for feature sticky
      const feature = root.querySelector<HTMLElement>(".feature-section");
      if (feature) {
        const bounds = feature.getBoundingClientRect();
        const total = Math.max(1, bounds.height - height);
        feature.style.setProperty("--section-progress", `${clamp(-bounds.top / total)}`);
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
      root.classList.remove("scroll-motion-ready");
    };
  }, []);

  return null;
}
