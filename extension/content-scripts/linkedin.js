/**
 * linkedin.js (content script)
 * ------------------------------
 * Runs automatically on any LinkedIn job posting page (per the "matches"
 * pattern in manifest.json). It does nothing visible — it just sits and
 * waits for the popup to ask it for data via chrome.runtime.onMessage.
 *
 * Why this approach instead of grabbing data immediately on page load:
 * LinkedIn is a single-page app — the URL can change without a full page
 * reload as you click between job listings. Waiting until the popup
 * actually asks (i.e. you clicked the extension icon) guarantees we read
 * whatever job is on screen RIGHT NOW, not whatever was there when the
 * script first injected.
 *
 * NOTE ON SELECTORS: LinkedIn's class names are auto-generated build
 * artifacts (e.g. "jobs-unified-top-card__job-title") and DO change when
 * LinkedIn ships a redesign. If auto-fill stops working months from now,
 * this file — specifically the querySelector strings below — is the
 * first place to check. Right-click the job title on the page, Inspect,
 * and update the selector to match.
 */

function scrapeLinkedInJob() {
  // Multiple selector attempts per field — LinkedIn has shipped at least
  // 3 different DOM structures for the job title over the years depending
  // on which page layout you land on (search results pane vs. direct link).
  const titleSelectors = [
    "h1.job-details-jobs-unified-top-card__job-title",
    "h1.t-24",
    ".jobs-unified-top-card__job-title",
    "h1",
  ];

  const companySelectors = [
    ".job-details-jobs-unified-top-card__company-name a",
    ".jobs-unified-top-card__company-name",
    ".job-details-jobs-unified-top-card__company-name",
  ];

  const descriptionSelectors = [
    ".jobs-description__content",
    "#job-details",
    ".jobs-box__html-content",
  ];

  const role = querySelectorFirst(titleSelectors);
  const company = querySelectorFirst(companySelectors);
  const description = querySelectorFirst(descriptionSelectors);

  return {
    platform: "LinkedIn",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
    // Truncate — the full JD is often 2000+ words, we just want a useful
    // snippet for the "criteria" field, not the whole posting.
    criteria: description ? description.trim().slice(0, 500) : "",
  };
}

function querySelectorFirst(selectors) {
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el && el.textContent.trim()) {
      return el.textContent;
    }
  }
  return null;
}

// Listen for the popup asking "what job is this?"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeLinkedInJob());
  }
});
