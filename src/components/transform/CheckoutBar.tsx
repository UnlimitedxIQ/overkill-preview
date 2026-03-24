"use client";

import { MagneticButton } from "@/components/MagneticButton";

interface CheckoutBarProps {
  email: string;
  onEmailChange: (email: string) => void;
  totalPrice: number;
  pageCount: number;
  loading: boolean;
  disabled: boolean;
  error: string | null;
  onFreePreview: () => void;
  onCheckout: () => void;
}

export function CheckoutBar({
  email,
  onEmailChange,
  totalPrice,
  pageCount,
  loading,
  disabled,
  error,
  onFreePreview,
  onCheckout,
}: CheckoutBarProps) {
  return (
    <section className="sticky bottom-0 z-20 bg-[var(--ok-bg)]/95 backdrop-blur-md border-t border-[var(--ok-border)] -mx-6 px-6 py-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="Your email (for download link)"
            className="w-full p-3 rounded-lg border border-[var(--ok-border)] bg-[var(--ok-bg-card)] text-[var(--ok-text)] placeholder:text-[var(--ok-muted)] outline-none focus:border-[var(--ok-gold)]/40 transition-colors text-sm"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold font-[family-name:var(--font-geist-mono)] text-[var(--ok-gold)]">
              ${totalPrice.toFixed(2)}
            </p>
            <p className="text-[11px] text-[var(--ok-muted)]">
              {pageCount} page{pageCount !== 1 ? "s" : ""} &times; $1.99
            </p>
          </div>

          <MagneticButton
            onClick={onFreePreview}
            disabled={loading || disabled}
            strength={10}
            glowColor="rgba(201,168,76,0.3)"
            className="px-6 py-3.5 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed border border-[var(--ok-gold)]/30 text-[var(--ok-gold)] whitespace-nowrap"
          >
            {loading ? "Processing..." : "Free Preview"}
          </MagneticButton>

          <MagneticButton
            onClick={onCheckout}
            disabled={loading || disabled}
            strength={10}
            glowColor="rgba(201,168,76,0.5)"
            className="px-8 py-3.5 rounded-xl font-semibold text-sm tracking-wide disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, var(--ok-gold), var(--ok-gold-light))",
              color: "#050505",
            }}
          >
            {loading ? "Processing..." : "Pay & Transform"}
          </MagneticButton>
        </div>
      </div>

      {error && (
        <p className="text-center text-sm text-red-400 mt-3">{error}</p>
      )}
    </section>
  );
}
