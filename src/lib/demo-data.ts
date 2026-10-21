// DEMONSTRATION DATA ONLY.
// Every record here is fabricated sample content used to render the UI.
// Replace with calls in src/services/* once backend services are connected.

export type RiskLevel = "low" | "medium" | "high" | "critical";
export type ReceiptStatus = "verified" | "flagged" | "pending" | "rejected";

export interface Receipt {
  id: string;
  merchant: string;
  category: string;
  date: string;
  amount: number;
  currency: string;
  location: string;
  submittedBy: string;
  status: ReceiptStatus;
  risk: RiskLevel;
}

export const receipts: Receipt[] = [
  { id: "RC-10482", merchant: "Taj Coromandel", category: "Lodging", date: "2026-10-18", amount: 18450, currency: "INR", location: "Chennai", submittedBy: "Priya Menon", status: "flagged", risk: "high" },
  { id: "RC-10481", merchant: "IndiGo Airlines", category: "Travel", date: "2026-10-17", amount: 7820, currency: "INR", location: "Bengaluru", submittedBy: "Rahul Iyer", status: "verified", risk: "low" },
  { id: "RC-10480", merchant: "Café Mocha", category: "Meals", date: "2026-10-17", amount: 1240, currency: "INR", location: "Mumbai", submittedBy: "Ananya Rao", status: "pending", risk: "medium" },
  { id: "RC-10479", merchant: "Uber India", category: "Transport", date: "2026-10-16", amount: 640, currency: "INR", location: "Delhi", submittedBy: "Vikram Shah", status: "verified", risk: "low" },
  { id: "RC-10478", merchant: "Café Mocha", category: "Meals", date: "2026-10-16", amount: 1240, currency: "INR", location: "Mumbai", submittedBy: "Ananya Rao", status: "flagged", risk: "critical" },
  { id: "RC-10477", merchant: "Croma Electronics", category: "Equipment", date: "2026-10-15", amount: 42999, currency: "INR", location: "Pune", submittedBy: "Karan Mehta", status: "pending", risk: "medium" },
  { id: "RC-10476", merchant: "The Leela Palace", category: "Lodging", date: "2026-10-14", amount: 22300, currency: "INR", location: "Bengaluru", submittedBy: "Priya Menon", status: "rejected", risk: "high" },
  { id: "RC-10475", merchant: "Starbucks", category: "Meals", date: "2026-10-14", amount: 520, currency: "INR", location: "Hyderabad", submittedBy: "Sneha Pillai", status: "verified", risk: "low" },
  { id: "RC-10474", merchant: "Ola Cabs", category: "Transport", date: "2026-10-13", amount: 890, currency: "INR", location: "Kolkata", submittedBy: "Arjun Das", status: "verified", risk: "low" },
  { id: "RC-10473", merchant: "Office Depot", category: "Supplies", date: "2026-10-12", amount: 3150, currency: "INR", location: "Chennai", submittedBy: "Meera Nair", status: "flagged", risk: "medium" },
  { id: "RC-10472", merchant: "Marriott Goa", category: "Lodging", date: "2026-10-11", amount: 15600, currency: "INR", location: "Goa", submittedBy: "Rahul Iyer", status: "verified", risk: "low" },
  { id: "RC-10471", merchant: "Barbeque Nation", category: "Meals", date: "2026-10-10", amount: 4860, currency: "INR", location: "Delhi", submittedBy: "Vikram Shah", status: "pending", risk: "medium" },
];

export const monthlySpend = [
  { month: "May", spend: 412000, flagged: 21000 },
  { month: "Jun", spend: 455000, flagged: 34000 },
  { month: "Jul", spend: 398000, flagged: 18000 },
  { month: "Aug", spend: 521000, flagged: 46000 },
  { month: "Sep", spend: 487000, flagged: 29000 },
  { month: "Oct", spend: 534000, flagged: 52000 },
];

export const categorySpend = [
  { name: "Lodging", value: 38 },
  { name: "Travel", value: 24 },
  { name: "Meals", value: 18 },
  { name: "Equipment", value: 12 },
  { name: "Other", value: 8 },
];

export const extractedReceipt = {
  merchant: "Café Mocha",
  address: "14 Hill Road, Bandra West, Mumbai 400050",
  gstin: "27AABCC1234D1Z5",
  invoice: "CM-2026-88412",
  date: "2026-10-17 13:42",
  payment: "Visa •••• 4417",
  items: [
    { name: "Cappuccino (L)", qty: 2, price: 240 },
    { name: "Club Sandwich", qty: 1, price: 380 },
    { name: "Blueberry Muffin", qty: 2, price: 120 },
  ],
  subtotal: 1100,
  taxRate: 0.05,
  tax: 55,
  serviceCharge: 85,
  total: 1240,
  confidence: 0.94,
};

export const auditRows = [
  { id: "RC-10480", merchant: "Café Mocha", lineSum: 1100, statedSubtotal: 1100, taxExpected: 55, taxStated: 55, totalExpected: 1240, totalStated: 1240, result: "pass" as const },
  { id: "RC-10473", merchant: "Office Depot", lineSum: 2670, statedSubtotal: 2670, taxExpected: 480.6, taxStated: 480, totalExpected: 3150.6, totalStated: 3150, result: "pass" as const },
  { id: "RC-10471", merchant: "Barbeque Nation", lineSum: 4200, statedSubtotal: 4200, taxExpected: 210, taxStated: 420, totalExpected: 4410, totalStated: 4860, result: "fail" as const },
  { id: "RC-10482", merchant: "Taj Coromandel", lineSum: 15000, statedSubtotal: 15600, taxExpected: 2808, taxStated: 2850, totalExpected: 18408, totalStated: 18450, result: "review" as const },
  { id: "RC-10477", merchant: "Croma Electronics", lineSum: 36440, statedSubtotal: 36440, taxExpected: 6559.2, taxStated: 6559, totalExpected: 42999.2, totalStated: 42999, result: "pass" as const },
];

export const duplicatePairs = [
  {
    id: "DUP-031", similarity: 97, risk: "critical" as RiskLevel,
    a: receipts[2], b: receipts[4],
    evidence: [
      { label: "Merchant name", match: true },
      { label: "Total amount (₹1,240)", match: true },
      { label: "Line items", match: true },
      { label: "Invoice number", match: true },
      { label: "Submission date", match: false },
    ],
  },
  {
    id: "DUP-030", similarity: 81, risk: "high" as RiskLevel,
    a: receipts[0], b: receipts[6],
    evidence: [
      { label: "Submitter", match: true },
      { label: "Category (Lodging)", match: true },
      { label: "Stay dates overlap", match: true },
      { label: "Merchant", match: false },
      { label: "Amount", match: false },
    ],
  },
  {
    id: "DUP-029", similarity: 64, risk: "medium" as RiskLevel,
    a: receipts[3], b: receipts[8],
    evidence: [
      { label: "Similar amount range", match: true },
      { label: "Same category", match: true },
      { label: "Merchant", match: false },
      { label: "Submitter", match: false },
      { label: "City", match: false },
    ],
  },
];

export const authenticityChecks = [
  { id: "RC-10482", merchant: "Taj Coromandel", score: 41, label: "Possible alteration", risk: "high" as RiskLevel,
    indicators: [
      { name: "Font inconsistency in total field", severity: "high" as RiskLevel },
      { name: "Compression artefacts around amount", severity: "medium" as RiskLevel },
      { name: "Metadata edit timestamp after capture", severity: "high" as RiskLevel },
    ] },
  { id: "RC-10473", merchant: "Office Depot", score: 72, label: "Needs review", risk: "medium" as RiskLevel,
    indicators: [
      { name: "Misaligned text baseline on line 3", severity: "medium" as RiskLevel },
      { name: "GSTIN format valid", severity: "low" as RiskLevel },
    ] },
  { id: "RC-10481", merchant: "IndiGo Airlines", score: 96, label: "Likely authentic", risk: "low" as RiskLevel,
    indicators: [
      { name: "Consistent typography", severity: "low" as RiskLevel },
      { name: "Barcode / PNR structure consistent", severity: "low" as RiskLevel },
    ] },
];

export interface Investigation {
  id: string;
  title: string;
  subject: string;
  risk: RiskLevel;
  status: "open" | "in_review" | "escalated" | "closed";
  amount: number;
  opened: string;
  steps: { label: string; done: boolean }[];
  evidence: string[];
  summary: string;
}

export const investigations: Investigation[] = [
  {
    id: "INV-2041", title: "Repeated meal claims at Café Mocha", subject: "Ananya Rao", risk: "critical", status: "escalated", amount: 2480, opened: "2026-10-17",
    steps: [
      { label: "Receipts ingested", done: true },
      { label: "Duplicate match computed", done: true },
      { label: "Submitter history reviewed", done: true },
      { label: "Manager interview", done: false },
      { label: "Final determination", done: false },
    ],
    evidence: ["RC-10480 and RC-10478 share invoice CM-2026-88412", "Identical line items and totals", "Submitted 1 day apart"],
    summary: "Two receipts appear to describe the same transaction. Demonstration finding — requires human review.",
  },
  {
    id: "INV-2040", title: "Lodging total mismatch", subject: "Priya Menon", risk: "high", status: "in_review", amount: 18450, opened: "2026-10-18",
    steps: [
      { label: "Receipts ingested", done: true },
      { label: "Arithmetic audit", done: true },
      { label: "Authenticity scan", done: true },
      { label: "Hotel folio requested", done: false },
      { label: "Final determination", done: false },
    ],
    evidence: ["Line items sum to ₹15,000 vs stated subtotal ₹15,600", "Font inconsistency in total field"],
    summary: "Stated subtotal exceeds line-item sum by ₹600. Demonstration finding — requires verification.",
  },
  {
    id: "INV-2039", title: "Tax rate above expected GST slab", subject: "Vikram Shah", risk: "medium", status: "open", amount: 4860, opened: "2026-10-10",
    steps: [
      { label: "Receipts ingested", done: true },
      { label: "Tax check", done: true },
      { label: "Merchant verification", done: false },
      { label: "Final determination", done: false },
    ],
    evidence: ["Tax stated at 10% vs expected 5% for restaurant service"],
    summary: "Tax amount is double the expected rate. Demonstration finding.",
  },
  {
    id: "INV-2035", title: "Equipment purchase above policy limit", subject: "Karan Mehta", risk: "low", status: "closed", amount: 42999, opened: "2026-10-02",
    steps: [
      { label: "Receipts ingested", done: true },
      { label: "Policy check", done: true },
      { label: "Pre-approval located", done: true },
      { label: "Final determination", done: true },
    ],
    evidence: ["Pre-approval PA-772 found on file"],
    summary: "Closed — purchase was pre-approved.",
  },
];

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
