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
 * IMPORTANT — why this file looks different from a "normal" scraper:
 * LinkedIn now generates obfuscated, hashed CSS class names (e.g. "_3a0901f3",
 * "b3e312d2") that appear to change across builds/sessions. Selecting by
 * class name, which is what most scraping tutorials show, simply does not
 * work here — we verified this directly by inspecting a live page.
 *
 * Instead, this targets the one thing LinkedIn can't obfuscate: the
 * structure of their URLs.
 *   - The job title is an <a> whose href contains "/jobs/view/<id>"
 *   - The company name is an <a> whose href contains "/company/"
 *   - The description sits in a container with id="job-details"
 *     (this one stable id has survived multiple LinkedIn redesigns)
 *
 * This is more resilient than class-name selectors because URL structure
 * is tied to LinkedIn's routing/backend, which changes far less often
 * than their CSS. If this ever stops working, the fix is the same
 * process we used to find it: open DevTools on a job page, find the
 * title text, and check what its href or id looks like now.
 */

function scrapeLinkedInJob() {
  const role = findJobTitle();
  const company = findCompanyName();
  const description = findDescription();

  return {
    platform: "LinkedIn",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
    // Full, untouched JD text - stored separately from `criteria` (which is
    // for your own short manual notes) so the complete posting is preserved
    // for later offline processing, e.g. extracting emails/phone numbers.
    full_description: description ? description.trim() : "",
  };
}

function findJobTitle() {
  // The job title link's href always contains "/jobs/view/<digits>".
  // We match on the URL pattern, not the (unstable) class name.
  const links = [...document.querySelectorAll('a[href*="/jobs/view/"]')];
  // The same job often appears more than once (e.g. a "similar jobs"
  // sidebar) - the real title is usually the first one with real text
  // that isn't just whitespace or an icon-only link.
  const titleLink = links.find((el) => el.textContent.trim().length > 3);
  return titleLink ? titleLink.textContent : null;
}

function findCompanyName() {
  // Same idea: company link's href contains "/company/<slug>".
  const links = [...document.querySelectorAll('a[href*="/company/"]')];
  const companyLink = links.find((el) => el.textContent.trim().length > 0);
  return companyLink ? companyLink.textContent : null;
}

function findDescription() {
  // "job-details" is a plain HTML id (not a generated class), which has
  // stayed stable across the redesigns we've checked. Falling back to a
  // couple of older known selectors in case LinkedIn shows a different
  // layout (e.g. mobile web, A/B test).
  const el =
    document.querySelector("#job-details") ||
    document.querySelector(".jobs-description__content") ||
    document.querySelector(".jobs-box__html-content");
  return el ? el.textContent : null;
}

// Listen for the popup asking "what job is this?"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeLinkedInJob());
  }
});

