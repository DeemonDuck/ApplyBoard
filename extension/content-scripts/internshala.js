/**
 * internshala.js (content script)
 * Same pattern as linkedin.js. You've already scraped Internshala in your
 * AI Job Assist project, so these selectors should look familiar — pulled
 * from the same general page structure.
 */

function scrapeInternshalaJob() {
  const titleSelectors = [".profile_on_detail_page", ".heading_4_5", "h1"];
  const companySelectors = [".company_name", ".heading_6 a", ".heading_6"];
  const descriptionSelectors = [".internship_details", "#about_company_id"];

  const role = querySelectorFirst(titleSelectors);
  const company = querySelectorFirst(companySelectors);
  const description = querySelectorFirst(descriptionSelectors);

  return {
    platform: "Internshala",
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
    sendResponse(scrapeInternshalaJob());
  }
});
