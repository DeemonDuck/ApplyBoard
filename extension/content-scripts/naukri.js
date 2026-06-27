/**
 * naukri.js (content script)
 * --------------------------
 * Rewritten after live DevTools inspection (confirmed via screenshots,
 * 27 June 2026) showed Naukri redesigned this page. The OLD selectors
 * here (.jd-header-title, .comp-name, .job-desc) no longer exist at
 * all — that's the entire reason this stopped working. It's the same
 * root cause as linkedin.js: a site update changed the DOM out from
 * under a class-name-based scraper.
 *
 * Naukri's new build uses CSS Modules, which generate class names like
 * "styles_jd-header-title__rZwM1" - a stable semantic prefix
 * ("styles_jd-header-title") plus a build-specific hash suffix
 * ("__rZwM1") that can change on Naukri's next deploy. So instead of
 * matching the full class exactly, we match on the prefix using
 * [class*="..."] - this survives the hash changing, and only breaks if
 * Naukri renames the semantic part itself (less frequent).
 *
 * Confirmed live structure (see screenshots for full context):
 *   <h1 class="styles_jd-header-title__rZwM1" title="Artificial Intelligence Engineer">
 *   <div class="styles_jd-header-comp-name__MvqAI"><a title="Syansoft Careers">Syansoft</a></div>
 *   <span class="styles_jhc__location_W_pVs"><a title=" Jobs in Gurugram">Gurugram</a></span>
 *   <div class="styles_JDC__dang-inner-html__h0K4t">...full JD text...</div>
 *
 * If this breaks again: open DevTools on a real /job-listings-... page,
 * inspect the title/company/description, and update the [class*="..."]
 * prefixes below to match whatever the new semantic name is.
 */

function scrapeNaukriJob() {
  const role = findByClassPrefix("jd-header-title");
  const company = findByClassPrefix("jd-header-comp-name");
  const location = findByClassPrefix("jhc__location");
  const description = findByClassPrefix("JDC__dang-inner-html");

  return {
    platform: "Naukri",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
    location: location ? location.trim() : "",
    // Full JD text, same convention as linkedin.js/indeed.js - `criteria`
    // stays free for your own short manual notes, full text goes here.
    full_description: description ? description.trim() : "",
  };
}

// Shared lookup: find the first element whose class contains
// `classFragment` anywhere in it (survives the CSS-module hash suffix
// changing), and return its trimmed text. Using textContent rather than
// reading the <h1>/<a> specifically means this still works whether the
// real text sits directly on the matched element or one level down
// inside a child <a> (true for company name and location here).
function findByClassPrefix(classFragment) {
  const el = document.querySelector(`[class*="${classFragment}"]`);
  return el && el.textContent.trim() ? el.textContent : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeNaukriJob());
  }
});