// Service layer contracts. Pages should depend on these, not on demo data directly,
// once backend integration begins. Planned implementations:
// - auth: Lovable Cloud authentication
// - receipts / storage: database + private file storage
// - analysis: server functions calling AI models server-side (never from the browser)
// No secrets or API keys belong in this folder.

import type { Receipt, Investigation } from "@/lib/demo-data";

export interface ReceiptService {
  list(): Promise<Receipt[]>;
  upload(file: File): Promise<{ id: string }>;
}

export interface InvestigationService {
  list(): Promise<Investigation[]>;
  get(id: string): Promise<Investigation | null>;
}

export const BACKEND_CONNECTED = false;
