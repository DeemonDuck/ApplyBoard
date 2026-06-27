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
 *     Additional Information) inside #ai_summary-container (confirmed
 *     via console sweep - it's a MIX of underscore and hyphen, not
 *     consistently one or the other). We capture this whole container's
 *     text as one block for full_description.
 *
 *     CONFIRMED VIA LIVE TESTING (27 June 2026): this container exists
 *     in the DOM the instant the modal opens, but starts out holding
 *     only the "About the internship / Summarized by AI" header - the
 *     actual Role Overview/Requirements text streams in asynchronously
 *     a short time after. Reading it immediately on modal-open returns
 *     header-only text. findDescription() below polls every 200ms for
 *     up to 5s, waiting until the text is long enough to be the real
 *     summary rather than just the header.
 *   - Location: a <div class="row-1-item locations"> containing the
 *     city name (e.g. "Hyderabad"). Confirmed via DevTools AND matches
 *     the selector used in an earlier Playwright scraper of this same
 *     site - same independent-confirmation pattern as title/company.
 *
 * If this ever breaks: open the Easy Apply modal, DevTools > Elements,
 * find #easy_apply_modal, and check what's changed inside it.
 */

async function scrapeInternshalaJob() {
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
  // Description needs to be awaited - see findDescription's polling logic.
  const description = await findDescription(modal);

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

// Small helper: pause execution for `ms` milliseconds without blocking
// the rest of the page. `await sleep(200)` just waits 200ms then moves on.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// BUG FOUND (27 June 2026): the #ai_summary-container element exists in
// the DOM immediately when the modal opens, but Internshala streams the
// actual Role Overview/Requirements text into it asynchronously - so
// reading it right away only gets the "About the internship / Summarized
// by AI" header, never the real content. A wrong selector was NOT the
// problem here; the timing was.
//
// Fix: poll the container every 200ms, up to 5 seconds total (25 tries).
// Once the text is longer than ~50 characters (the header alone is much
// shorter than that), we treat it as "real content has loaded" and
// return it. If 5 seconds pass and it never grows past the header, we
// give up and return whatever's there (better than hanging forever).
async function findDescription(modal) {
  const MAX_ATTEMPTS = 25; // 25 * 200ms = 5 seconds total
  const MIN_CONTENT_LENGTH = 50; // header alone is well under this

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const el = modal.querySelector("#ai_summary-container");
    if (el && el.textContent.trim().length > MIN_CONTENT_LENGTH) {
      return el.textContent;
    }
    await sleep(200);
  }

  // Ran out of attempts - return whatever's there (could be header-only
  // text, or null if the container never appeared at all), rather than
  // silently returning nothing and giving no clue why.
  const el = modal.querySelector("#ai_summary-container");
  return el ? el.textContent : null;
}

// IMPORTANT: this listener used to call scrapeInternshalaJob() and
// sendResponse() synchronously in the same line. Now that
// scrapeInternshalaJob is async (because findDescription needs to poll
// and wait), we have to:
//   1. Call it, then call sendResponse() inside the .then() once the
//      promise actually resolves (not before).
//   2. Return `true` from the listener itself. This is a Chrome
//      extension-specific requirement - by default, Chrome assumes a
//      message listener is done as soon as it returns, and immediately
//      closes the communication channel. Returning `true` tells Chrome
//      "I'm not done yet, keep the channel open, I'll call sendResponse
//      later" - without this, the popup's listener would have nothing
//      waiting for it and chrome.tabs.sendMessage would hang or return
//      undefined.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    scrapeInternshalaJob().then(sendResponse);
    return true;
  }
});