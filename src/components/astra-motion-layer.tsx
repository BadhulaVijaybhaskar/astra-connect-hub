import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const isHydrated = (el: Element) => Object.keys(el).some((k) => k.startsWith("__reactFiber"));

/** GSAP scroll reveals for every page section. */
export function AstraMotionLayer() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ctx: { revert: () => void } | undefined;
    const timer = window.setTimeout(async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("main section").forEach((sec, i) => {
          if (i === 0 || sec.getBoundingClientRect().top < innerHeight) return;
          const kids = sec.querySelectorAll(":scope h2, :scope .eyebrow");
          // Styles are only applied on entry, so nothing touches markup during hydration.
          ScrollTrigger.create({ trigger: sec, start: "top 85%", once: true, onEnter: () => isHydrated(sec) && gsap.fromTo(kids, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, clearProps: "all" }) });
        });
      });
      ScrollTrigger.refresh();
    }, 1800); // wait for streamed route hydration so GSAP never touches SSR markup early
    return () => { window.clearTimeout(timer); ctx?.revert(); };
  }, [path]);

  return null;
}
