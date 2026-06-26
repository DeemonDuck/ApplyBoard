/**
 * internshala.js (content script)
 * ----------------------------------
 * Rewritten after direct DevTools inspection of the actual popup you apply
 * from (confirmed via screenshots, not guessed from tutorials).
 *
 * IMPORTANT — Internshala has (at least) three different places the same
 * job's title/company/description can appear:
 *   1. A card on the listing page (many cards on one page)
 *   2. A standalone detail page (opens if you click the job title text)
 *   3. The "Easy Apply" modal/popup (opens if you click elsewhere on the
 *      card) - confirmed this is what you actually use to apply
 *
 * This file targets #3 specifically, since that's the one you apply from.
 * Everything is scoped to #easy_apply_modal so we never accidentally grab
 * data from a different card sitting elsewhere on the same listing page
 * behind the modal.
 *
 * Selectors confirmed via DevTools on a real "Easy Apply" modal:
 *   - Modal container: #easy_apply_modal (stable, semantic id)
 *   - Title: .job-internship-name (an <h2>) - also matches the class
 *     used in an earlier Playwright scraper of this same site, which is
 *     a good independent confirmation of stability across page contexts
 *   - Company: .company-name (a <p>) - same situation, matches the old
 *     scraper's selector too
 *   - Description: Internshala runs the JD through their own AI and
 *     shows a structured summary (Role Overview / Requirements /
 *     Additional Information) inside #ai-summary-container, rather than
 *     one raw text blob. We capture this whole container's text as one
 *     block for full_description - it's actually more useful pre-
 *     structured than raw text would be for later parsing.
 *   - Location: a <div class="row-1-item locations"> containing the
 *     city name (e.g. "Hyderabad"). Confirmed via DevTools AND matches
 *     the selector used in an earlier Playwright scraper of this same
 *     site - same independent-confirmation pattern as title/company.
 *
 * If this ever breaks: open the Easy Apply modal, DevTools > Elements,
 * find #easy_apply_modal, and check what's changed inside it.
 */

function scrapeInternshalaJob() {
  const modal = document.querySelector("#easy_apply_modal");

  // If the modal isn't open (e.g. you're just browsing the list, haven't
  // clicked into a specific job yet), there's nothing reliable to scope
  // to - return empty rather than risk grabbing the wrong card's data
  // from elsewhere on the page.
  if (!modal) {
    return { platform: "Internshala", role: "", company: "", location: "", full_description: "" };
  }

  const role = findJobTitle(modal);
  const company = findCompanyName(modal);
  const location = findLocation(modal);
  const description = findDescription(modal);

  return {
    platform: "Internshala",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
    location: location ? location.trim() : "",
    full_description: description ? description.trim() : "",
  };
}

function findJobTitle(modal) {
  const el = modal.querySelector(".job-internship-name");
  return el ? el.textContent : null;
}

function findCompanyName(modal) {
  const el = modal.querySelector(".company-name");
  return el ? el.textContent : null;
}

function findLocation(modal) {
  // Verified via DevTools: a div with both "row-1-item" and "locations"
  // classes wraps a map-pin icon and a city name link/span.
  const el = modal.querySelector(".row-1-item.locations");
  return el ? el.textContent : null;
}

function findDescription(modal) {
  // The AI-summarized container holds Role Overview, Requirements, and
  // Additional Information as separate sections - we grab the whole
  // thing as one text block rather than parsing each section out, since
  // the later offline-LLM step can handle structure parsing itself.
  const el = modal.querySelector("#ai-summary-container");
  return el ? el.textContent : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeInternshalaJob());
  }
});