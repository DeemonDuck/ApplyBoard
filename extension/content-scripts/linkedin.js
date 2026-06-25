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
 * structure of their URLs and a couple of fixed text anchors.
 *   - The job title is an <a> whose href contains "/jobs/view/<id>"
 *   - The company name is an <a> whose href contains "/company/"
 *   - The description container differs by LinkedIn's page layout:
 *       - Standalone job page (linkedin.com/jobs/view/...): has a plain
 *         id="job-details" on the description container.
 *       - Search-results layout (linkedin.com/jobs/search-results/...,
 *         i.e. clicking a job from a list, which shows it in a side
 *         panel): NO such id exists. We verified this directly by
 *         inspecting a real page. Instead we anchor on the "About the
 *         job" <h2> heading (present on every posting) and read its
 *         container.
 *   - "See more" is clicked first if present, since LinkedIn may only
 *     keep the truncated preview text in the DOM until expanded.
 *
 * This is more resilient than class-name selectors because URL structure
 * and visible heading text are tied to LinkedIn's product/content, which
 * changes far less often than their CSS. If this ever stops working, the
 * fix is the same process we used to find it: open DevTools on a job
 * page, find the description text, and check what id/heading/structure
 * it sits under now.
 */

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

function findDescriptionContainer() {
  // Shared by findDescription() and expandSeeMore() so both always agree
  // on which container is "the description" - this is also what fixes
  // the "see more click scrolls to a random job card" bug: that bug was
  // caused by searching the WHOLE page for a "see more" button, which
  // could match something in the job list sidebar instead of the open
  // detail panel. Scoping to this specific container fixes it.
  const standalonePageEl =
    document.querySelector("#job-details") ||
    document.querySelector(".jobs-description__content") ||
    document.querySelector(".jobs-box__html-content");
  if (standalonePageEl) return standalonePageEl;

  const heading = [...document.querySelectorAll("h2, h3")].find(
    (el) => el.textContent.trim() === "About the job"
  );
  return heading?.parentElement?.parentElement || null;
}

function findDescription(container) {
  if (!container) return null;

  const heading = [...container.querySelectorAll("h2, h3")].find(
    (el) => el.textContent.trim() === "About the job"
  );

  const fullText = container.textContent.trim();
  if (!heading) return fullText;

  const headingText = heading.textContent.trim();
  return fullText.startsWith(headingText) ? fullText.slice(headingText.length).trim() : fullText;
}

function expandSeeMore(container) {
  if (!container) return false;

  // Search ONLY inside the description container, not the whole page -
  // this is what prevents accidentally clicking an unrelated "see more"/
  // "show more" button elsewhere (e.g. in the job list sidebar).
  const candidates = [...container.querySelectorAll("button, a, span")];
  const seeMoreBtn = candidates.find((el) => {
    const text = el.textContent.trim().toLowerCase();
    return text === "see more" || text === "...see more" || text === "more";
  });

  if (seeMoreBtn) {
    seeMoreBtn.click();
    return true; // tells the caller a click happened, so it's worth waiting
  }
  return false;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeLinkedInJob() {
  const role = findJobTitle();
  const company = findCompanyName();

  const container = findDescriptionContainer();
  const didClick = expandSeeMore(container);

  // Only wait if we actually clicked something - otherwise the description
  // was already fully expanded (or there was nothing to expand), and we
  // can read it immediately with no artificial delay.
  if (didClick) {
    await sleep(400); // give LinkedIn's re-render time to finish
  }

  const description = findDescription(container);

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

// Listen for the popup asking "what job is this?"
// scrapeLinkedInJob is now async (it may wait ~400ms after clicking "see
// more"), so we can't just call sendResponse(scrapeLinkedInJob()) anymore -
// that would send a pending Promise object instead of the actual data.
// Chrome's extension messaging requires returning `true` from the listener
// to keep the message channel open, then calling sendResponse() later once
// the async work finishes.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    scrapeLinkedInJob().then(sendResponse);
    return true; // keep the channel open for the async response above
  }
});