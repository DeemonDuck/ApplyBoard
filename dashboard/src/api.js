/**
 * api.js
 * -------
 * Thin wrapper around fetch() for talking to the FastAPI backend.
 * Centralizing this here means if the backend URL changes later
 * (e.g. moving from localhost to a deployed Railway URL), it's a
 * one-line change instead of hunting through every component.
 */

import { supabase } from "./supabase";

// Offline when the dashboard is served from localhost (vite dev server),
// online (deployed backend) otherwise. No config to flip — it just follows
// wherever the page is running.
const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal
  ? "http://127.0.0.1:8000"
  : "https://applyboard-rmxl.onrender.com";

async function request(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${res.status}`);
  }

  // DELETE responses have a body too, but some callers won't need it
  return res.status === 204 ? null : res.json();
}

export const api = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters);
    const query = params.toString() ? `?${params.toString()}` : "";
    return request(`/applications${query}`);
  },

  get: (id) => request(`/applications/${id}`),

  create: (data) =>
    request("/applications", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id, data) =>
    request(`/applications/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  remove: (id) =>
    request(`/applications/${id}`, {
      method: "DELETE",
    }),

  stats: () => request("/stats"),
};
