/**
 * indeed.js (content script)
 * Same pattern as linkedin.js.
 */

function scrapeIndeedJob() {
  const titleSelectors = [".jobsearch-JobInfoHeader-title", "h1.jobsearch-JobInfoHeader-title", "h1"];
  const companySelectors = [
    "[data-testid='inlineHeader-companyName']",
    ".jobsearch-InlineCompanyRating div",
  ];
  const descriptionSelectors = ["#jobDescriptionText"];

  const role = querySelectorFirst(titleSelectors);
  const company = querySelectorFirst(companySelectors);
  const description = querySelectorFirst(descriptionSelectors);

  return {
    platform: "Indeed",
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
    sendResponse(scrapeIndeedJob());
  }
});
