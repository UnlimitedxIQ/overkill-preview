export type SiteStatus =
  | "draft" | "queued" | "planning" | "building" | "testing"
  | "polishing" | "deploying" | "live" | "expired" | "failed";

export interface Section {
  name: string;
  description: string;
  backgroundVideo: boolean;
  videoUrl: string | null;
  threeDElements: boolean;
  scrollAnimation: boolean;
}

export interface PipelineLogEntry {
  stage: string;
  message: string;
  timestamp: string;
}

export interface Site {
  id: string;
  user_id: string;
  status: SiteStatus;
  prompt: string;
  vibes: string[];
  sections: Section[];
  user_assets: string[];
  deploy_url: string | null;
  source_zip_url: string | null;
  expires_at: string | null;
  pipeline_log: PipelineLogEntry[];
  error_message: string | null;
  vercel_project_id: string | null;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  google_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
}
