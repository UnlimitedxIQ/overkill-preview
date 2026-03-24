"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function RevealOnScroll({
  children,
  className = "",
  delay = 0,
  y = 40,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: "power2.out",
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
    };
  }, [delay, y]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
