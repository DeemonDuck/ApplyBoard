/**
 * constants.js
 * -------------
 * Single source of truth for the status pipeline. If you ever want to
 * add a stage (e.g. "Withdrawn"), this is the only file you touch on
 * the frontend — the column layout, badges, and dropdown all read from here.
 */

export const STATUSES = [
  {
    key: "Applied",
    label: "Applied",
    color: "var(--status-applied)",
    backgroundImage: "/growth-stages/applied.png",
  },
  {
    key: "Screening",
    label: "Screening",
    color: "var(--status-screening)",
    backgroundImage: "/growth-stages/screening.png",
  },
  {
    key: "Interview",
    label: "Interview",
    color: "var(--status-interview)",
    backgroundImage: "/growth-stages/interview.png",
  },
  {
    key: "Offer",
    label: "Offer",
    color: "var(--status-offer)",
    backgroundImage: "/growth-stages/offer.png",
  },
  {
    key: "Rejected",
    label: "Rejected",
    color: "var(--status-rejected)",
    backgroundImage: "/growth-stages/rejected.png",
  },
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