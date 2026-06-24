import { useState, useEffect } from "react";
import { STATUSES, PLATFORMS } from "../constants";

const EMPTY_FORM = {
  company: "",
  role: "",
  platform: PLATFORMS[0],
  url: "",
  status: "Applied",
  criteria: "",
  notes: "",
};

/**
 * Modal used for both creating a new application and editing an existing one.
 * If `existing` is passed, the form pre-fills and shows a Delete option.
 */
export default function ApplicationModal({ existing, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (existing) {
      setForm({
        company: existing.company || "",
        role: existing.role || "",
        platform: existing.platform || PLATFORMS[0],
        url: existing.url || "",
        status: existing.status || "Applied",
        criteria: existing.criteria || "",
        notes: existing.notes || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [existing]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) {
      setError("Company and role are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form, existing?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 11, 22, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "var(--space-4)",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--ink-raised)",
          border: "1px solid var(--ink-line)",
          borderRadius: "var(--radius-md)",
          padding: "var(--space-6)",
          width: "100%",
          maxWidth: "480px",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "var(--space-5)" }}>
          {existing ? "Edit application" : "Log a new application"}
        </h2>

        <Field label="Company">
          <input
            value={form.company}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="e.g. Razorpay"
            style={inputStyle}
          />
        </Field>

        <Field label="Role">
          <input
            value={form.role}
            onChange={(e) => handleChange("role", e.target.value)}
            placeholder="e.g. AI/ML Engineer"
            style={inputStyle}
          />
        </Field>

        <Field label="Platform">
          <select
            value={form.platform}
            onChange={(e) => handleChange("platform", e.target.value)}
            style={inputStyle}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Job posting URL">
          <input
            value={form.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>

        <Field label="Status">
          <select
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            style={inputStyle}
          >
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Criteria / JD notes">
          <textarea
            value={form.criteria}
            onChange={(e) => handleChange("criteria", e.target.value)}
            placeholder="Key requirements they asked for..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            placeholder="Referral name, follow-up date, salary talk..."
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Field>

        {error && (
          <div style={{ color: "var(--status-rejected)", fontSize: "13px", marginBottom: "var(--space-3)" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              background: "var(--status-interview)",
              color: "var(--ink)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              padding: "10px 16px",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            {saving ? "Saving..." : existing ? "Save changes" : "Add application"}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              color: "var(--paper-dim)",
              border: "1px solid var(--ink-line)",
              borderRadius: "var(--radius-sm)",
              padding: "10px 16px",
              fontSize: "14px",
            }}
          >
            Cancel
          </button>
        </div>

        {existing && (
          <button
            type="button"
            onClick={() => onDelete(existing.id)}
            style={{
              width: "100%",
              marginTop: "var(--space-3)",
              background: "transparent",
              color: "var(--status-rejected)",
              border: "none",
              fontSize: "12px",
              padding: "6px",
            }}
          >
            Delete this application
          </button>
        )}
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: "var(--space-4)" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: "var(--paper-faint)",
          marginBottom: "var(--space-2)",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "var(--ink)",
  border: "1px solid var(--ink-line)",
  borderRadius: "var(--radius-sm)",
  padding: "10px 12px",
  color: "var(--paper)",
  fontSize: "14px",
  fontFamily: "var(--font-body)",
};
