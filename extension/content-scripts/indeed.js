/**
 * indeed.js (content script)
 * ----------------------------
 * Same overall pattern as linkedin.js - see that file for the full
 * explanation of why content scripts work this way.
 *
 * IMPORTANT — this file was rewritten after the original version was found
 * to capture nothing at all. The root cause, found by directly inspecting
 * a real Indeed job page in DevTools rather than guessing:
 *
 * manifest.json's URL pattern was wrong. Real Indeed job URLs look like
 * "in.indeed.com/?vjk=e5f228a5150ad532" (a query param on the root path)
 * - NOT "in.indeed.com/viewjob..." like older tutorials assume. Because
 * of this, the content script never even injected into the page at all -
 * none of the selectors below ever got a chance to run, regardless of
 * whether they were correct. Fixed in manifest.json to match indeed.com/*
 * generally instead of a specific (and wrong) path.
 *
 * The selectors themselves (data-testid based) turned out to already be
 * correct once actually tested - confirmed against both a live DevTools
 * inspection AND an old working Python/Playwright scraper from an earlier
 * project, which used the same #jobDescriptionText id. Indeed still uses
 * semantic, readable `data-testid` attributes (unlike LinkedIn's
 * obfuscated hash classes), which is good news - these are typically
 * more stable since companies rely on them for their own test suites too.
 *
 * If this ever breaks again: open DevTools on a real job page (a URL
 * with "?vjk=" in it), inspect the job title, and check what
 * data-testid or class it and its siblings use now.
 */

function scrapeIndeedJob() {
  const role = findJobTitle();
  const company = findCompanyName();
  const description = findDescription();

  return {
    platform: "Indeed",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
    full_description: description ? description.trim() : "",
  };
}

function findJobTitle() {
  // Verified via DevTools: data-testid="jobsearch-JobInfoHeader-title"
  // sits on the real heading. Falling back to the older guessed class
  // in case Indeed shows a different layout (e.g. mobile web).
  const el =
    document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"]') ||
    document.querySelector(".jobsearch-JobInfoHeader-title");
  return el ? el.textContent : null;
}

function findCompanyName() {
  // Verified via DevTools: data-testid="inlineHeader-companyName" on a
  // div, containing the company name (often as a link). We scope to
  // this exact attribute rather than searching broadly, since the page
  // can have OTHER "company-name"-ish elements in unrelated job-list
  // cards elsewhere on the same page (Indeed shows a feed behind the
  // open job panel).
  const el = document.querySelector('[data-testid="inlineHeader-companyName"]');
  return el ? el.textContent : null;
}

function findDescription() {
  // #jobDescriptionText is a plain id, confirmed still present via
  // DevTools - this one didn't actually need fixing.
  const el = document.querySelector("#jobDescriptionText");
  return el ? el.textContent : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeIndeedJob());
  }
});