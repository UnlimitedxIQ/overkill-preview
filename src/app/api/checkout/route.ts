import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { PRICE_AMOUNT } from "@/lib/constants";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ---------------------------------------------------------------------------
// POST /api/checkout
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: {
    pages?: string[];
    features?: string[];
    themeDirection?: string;
    email?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { pages, features, themeDirection, email } = body;

  // Validate required fields
  if (!pages || !Array.isArray(pages) || pages.length === 0) {
    return NextResponse.json(
      { error: "At least one page is required." },
      { status: 400 },
    );
  }

  if (!features || !Array.isArray(features) || features.length === 0) {
    return NextResponse.json(
      { error: "At least one feature is required." },
      { status: 400 },
    );
  }

  if (!email || typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  if (pages.length > 20) {
    return NextResponse.json(
      { error: "Maximum of 20 pages per transaction." },
      { status: 400 },
    );
  }

  // Build origin for redirect URLs
  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Overkill Transformation",
              description: `${pages.length} page${pages.length > 1 ? "s" : ""} — full overkill treatment`,
            },
            unit_amount: PRICE_AMOUNT,
          },
          quantity: pages.length,
        },
      ],
      metadata: {
        pages: JSON.stringify(pages),
        features: JSON.stringify(features),
        themeDirection: themeDirection ?? "",
      },
      success_url: `${origin}/transform/status?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[api/checkout] Stripe session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 },
    );
  }
}
