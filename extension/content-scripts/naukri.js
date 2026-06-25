/**
 * naukri.js (content script)
 * Same pattern as linkedin.js — see that file for the detailed explanation.
 * Naukri's job listing pages use simpler, more semantic class names than
 * LinkedIn, so fewer fallback selectors are needed here.
 */

function scrapeNaukriJob() {
  const titleSelectors = [".jd-header-title", "h1.title", "h1"];
  const companySelectors = [".jd-header-comp-name", ".comp-name a", ".comp-name"];
  const descriptionSelectors = [".job-desc", ".dang-inner-html"];

  const role = querySelectorFirst(titleSelectors);
  const company = querySelectorFirst(companySelectors);
  const description = querySelectorFirst(descriptionSelectors);

  return {
    platform: "Naukri",
    role: role ? role.trim() : "",
    company: company ? company.trim() : "",
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_JOB_DATA") {
    sendResponse(scrapeNaukriJob());
  }
});
