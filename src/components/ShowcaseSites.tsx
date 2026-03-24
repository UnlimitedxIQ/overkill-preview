"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ShowcaseSection } from "./showcase/ShowcaseSection";
import { CheckoutSection } from "./showcase/CheckoutSection";

export function ShowcaseSites() {
  const checkoutRef = useRef<HTMLDivElement>(null);
  const [showLogo, setShowLogo] = useState(false);

  return (
    <div className="relative">
      {/* Fixed logo — centered at top, hidden during preloader */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-opacity duration-700"
        style={{
          top: "-26px",
          opacity: showLogo ? 1 : 0,
          filter: "drop-shadow(0 0 20px rgba(201,168,76,0.2)) drop-shadow(0 0 40px rgba(201,168,76,0.08))",
        }}
      >
        <Image
          src="/overkill-logo.png"
          alt="OVERKILL"
          width={2048}
          height={2048}
          priority
          style={{ width: "140px", height: "auto" }}
        />
      </div>

      <ShowcaseSection checkoutRef={checkoutRef} onPreloaderDone={() => setShowLogo(true)} />
      <div ref={checkoutRef}>
        <CheckoutSection />
      </div>
    </div>
  );
}
