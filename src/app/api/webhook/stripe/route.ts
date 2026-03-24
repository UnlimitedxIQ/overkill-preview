import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { createJob, updateJob } from "@/lib/jobs";
import { processJob } from "@/lib/process-job";

export const runtime = "nodejs";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

// ---------------------------------------------------------------------------
// POST /api/webhook/stripe
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Stripe requires the raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (err) {
    console.error(
      "[api/webhook/stripe] Signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const metadata = session.metadata ?? {};
    let pages: string[] = [];
    let features: string[] = [];

    try {
      pages = JSON.parse(metadata.pages ?? "[]");
      features = JSON.parse(metadata.features ?? "[]");
    } catch {
      console.error(
        "[api/webhook/stripe] Failed to parse metadata:",
        metadata,
      );
      return NextResponse.json(
        { error: "Invalid metadata in checkout session." },
        { status: 400 },
      );
    }

    const themeDirection = metadata.themeDirection || undefined;
    const email = session.customer_email ?? "";

    // Use the Stripe session ID as the job ID
    const jobId = session.id;

    const job = createJob({
      id: jobId,
      pages,
      features,
      themeDirection,
      email,
    });

    console.log(
      `[api/webhook/stripe] Transformation job started: ${job.id} — ${pages.length} page(s)`,
    );

    // Trigger AI transformation pipeline (fire-and-forget after webhook response)
    processJob(job.id).catch((err) => {
      console.error(`[transform] Job ${job.id} failed:`, err);
      updateJob(job.id, { status: "failed" });
    });
  }

  // Acknowledge receipt — Stripe expects 200 for all handled events
  return NextResponse.json({ received: true });
}
