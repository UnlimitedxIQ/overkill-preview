// Temporary in-memory job store — will be replaced with Supabase later

export type JobStatus =
  | "processing"
  | "completed"
  | "failed";

export type PageStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface JobPage {
  url: string;
  status: PageStatus;
  previewUrl?: string;
}

export interface Job {
  id: string;
  status: JobStatus;
  pages: JobPage[];
  features: string[];
  themeDirection?: string;
  email: string;
  progress: number; // 0-100
  stage?: string; // Current pipeline stage label for display
  createdAt: string;
}

const store = new Map<string, Job>();

export function createJob(params: {
  id: string;
  pages: string[];
  features: string[];
  themeDirection?: string;
  email: string;
}): Job {
  const job: Job = {
    id: params.id,
    status: "processing",
    pages: params.pages.map((url) => ({ url, status: "pending" })),
    features: params.features,
    themeDirection: params.themeDirection,
    email: params.email,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
  store.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return store.get(id);
}

export function updateJob(
  id: string,
  updates: Partial<Omit<Job, "id" | "createdAt">>,
): Job | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;

  // Immutable update — create new object instead of mutating
  const updated: Job = { ...existing, ...updates };
  store.set(id, updated);
  return updated;
}
