import { RefObject, useEffect } from "react";

/**
 * `root` ichidagi `.reveal` elementlariga ekranga kirganda `.visible` klassini
 * qo'shadi. `deps` o'zgarsa (masalan, wizard'dagi jonli ko'rinishda ma'lumot
 * yangilansa) yangi paydo bo'lgan bo'limlar ham kuzatiladi.
 */
export function useReveal(root: RefObject<HTMLElement>, active: boolean, deps: unknown[] = []) {
  useEffect(() => {
    if (!active) return;
    const nodes = root.current?.querySelectorAll<HTMLElement>(".reveal:not(.visible)") ?? [];
    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach((node, i) => {
      node.style.transitionDelay = `${Math.min(i * 90, 360)}ms`;
      observer.observe(node);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, ...deps]);
}
