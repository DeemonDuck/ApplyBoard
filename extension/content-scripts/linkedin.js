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
  // We verified directly (DevTools inspection on a live page) that the
  // search-results layout has NO "#job-details" id at all - that id only
  // exists on the standalone /jobs/view/ page layout. On the search-results
  // layout, the description sits in an unlabeled div with obfuscated,
  // unstable classes - so instead we anchor on the "About the job" <h2>
  // heading, which LinkedIn shows above every job description regardless
  // of layout, and read its container.
  //
  // Before reading, we also click "see more" if it's present - otherwise
  // LinkedIn may only have the truncated preview text in the DOM, not the
  // full posting.
  expandSeeMore();

  // Try the old standalone-page id first (still valid on that layout).
  const standalonePageEl =
    document.querySelector("#job-details") ||
    document.querySelector(".jobs-description__content") ||
    document.querySelector(".jobs-box__html-content");
  if (standalonePageEl) {
    return standalonePageEl.textContent;
  }

  // Fall back to the heading-anchor approach for the search-results layout.
  const heading = [...document.querySelectorAll("h2, h3")].find(
    (el) => el.textContent.trim() === "About the job"
  );
  if (!heading) return null;

  // The description lives in the heading's grandparent container
  // (heading -> wrapping div -> container that also holds the body text).
  const container = heading.parentElement?.parentElement;
  if (!container) return null;

  // Strip the heading's own text back off the front, so we return just
  // the JD body, not "About the job" repeated at the start of every entry.
  const fullText = container.textContent.trim();
  const headingText = heading.textContent.trim();
  return fullText.startsWith(headingText) ? fullText.slice(headingText.length).trim() : fullText;
}

function expandSeeMore() {
  // LinkedIn's "see more" / "...more" button text varies slightly by
  // layout. We look for a button/link with short, matching text rather
  // than a specific class, since (as established) classes here are
  // unstable. This is a best-effort click - if no such button is found,
  // we just proceed with whatever text is already in the DOM.
  const candidates = [...document.querySelectorAll("button, a")];
  const seeMoreBtn = candidates.find((el) => {
    const text = el.textContent.trim().toLowerCase();
    return text === "see more" || text === "...see more" || text === "more";
  });
  if (seeMoreBtn) {
    seeMoreBtn.click();
  }
}

// Listen for the popup asking "what job is this?"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeLinkedInJob());
  }
});