/**
 * constants.js
 * -------------
 * Single source of truth for the status pipeline. If you ever want to
 * add a stage (e.g. "Withdrawn"), this is the only file you touch on
 * the frontend — the column layout, badges, and dropdown all read from here.
 */

export const STATUSES = [
  { key: "Applied", label: "Applied", color: "var(--status-applied)" },
  { key: "Screening", label: "Screening", color: "var(--status-screening)" },
  { key: "Interview", label: "Interview", color: "var(--status-interview)" },
  { key: "Offer", label: "Offer", color: "var(--status-offer)" },
  { key: "Rejected", label: "Rejected", color: "var(--status-rejected)" },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

export const PLATFORMS = [
  "LinkedIn",
  "Naukri",
  "Internshala",
  "Indeed",
  "Company Website",
  "Referral",
  "Other",
];
