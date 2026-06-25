/**
 * popup.js
 * ---------
 * Runs when the popup opens. Two jobs:
 *   1. Ask the active tab's content script (if any) for auto-detected data
 *   2. Submit the form to the FastAPI backend
 *
 * Note: this file can't import anything (no ES modules in a popup script
 * loaded via plain <script> tag), so BASE_URL is just redeclared here
 * rather than shared with the dashboard's api.js. Small duplication,
 * but keeps the extension dependency-free.
 */

const BASE_URL = "http://127.0.0.1:8000";

const form = document.getElementById("capture-form");
const statusMsg = document.getElementById("status-msg");
const detectedBadge = document.getElementById("detected-badge");
const saveBtn = document.getElementById("save-btn");

// --- Step 1: try to get auto-detected data from the content script ---
//
// chrome.tabs.sendMessage talks to the content script running in the
// CURRENT tab. If no content script is injected on this page (e.g. you're
// on a random company careers page, not LinkedIn/Naukri/etc.), this will
// just fail silently and we fall back to a blank form + the tab's URL/title.
async function tryAutoFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_JOB_DATA" });

    if (response && response.company) {
      document.getElementById("company").value = response.company || "";
      document.getElementById("role").value = response.role || "";
      document.getElementById("criteria").value = response.criteria || "";
      if (response.platform) {
        document.getElementById("platform").value = response.platform;
      }
      detectedBadge.classList.remove("hidden");
    }

    document.getElementById("url").value = tab.url || "";
  } catch (err) {
    // No content script on this page — that's expected on unsupported
    // sites, not a bug. We still grab the tab URL as a manual fallback.
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    document.getElementById("url").value = tab.url || "";
  }
}

// --- Step 2: handle form submission ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const payload = {
    company: document.getElementById("company").value.trim(),
    role: document.getElementById("role").value.trim(),
    platform: document.getElementById("platform").value,
    url: document.getElementById("url").value.trim(),
    criteria: document.getElementById("criteria").value.trim(),
    status: "Applied",
  };

  if (!payload.company || !payload.role) {
    showStatus("Company and role are required.", "error");
    return;
  }

  saveBtn.disabled = true;
  showStatus("Saving...", "");

  try {
    const res = await fetch(`${BASE_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Server returned ${res.status}`);
    }

    showStatus("Saved! Check your dashboard.", "success");
    form.reset();
    setTimeout(() => window.close(), 1200);
  } catch (err) {
    // Most common cause of failure here: the FastAPI backend isn't running.
    // fetch() throws a generic "Failed to fetch" with no useful detail in
    // that case, so we give a more actionable message instead.
    if (err.message.includes("Failed to fetch")) {
      showStatus("Can't reach backend — is uvicorn running on port 8000?", "error");
    } else {
      showStatus(err.message, "error");
    }
  } finally {
    saveBtn.disabled = false;
  }
});

function showStatus(text, type) {
  statusMsg.textContent = text;
  statusMsg.className = "status-msg" + (type ? ` ${type}` : "");
}

tryAutoFill();
