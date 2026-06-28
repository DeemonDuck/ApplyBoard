import { useState, useEffect, useCallback } from "react";
import { api } from "./api";
import { STATUSES } from "./constants";
import StatsHeader from "./components/StatsHeader";
import StatusSection from "./components/StatusSection";
import ApplicationModal from "./components/ApplicationModal";

export default function App() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null); // null = creating new

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [apps, statsData] = await Promise.all([api.list(), api.stats()]);
      setApplications(apps);
      setStats(statsData);
    } catch (err) {
      setError(
        "Couldn't reach the backend. Is it running? Start it with: uvicorn main:app --reload --port 8000"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function openCreateModal() {
    setEditingApp(null);
    setModalOpen(true);
  }

  function openEditModal(app) {
    setEditingApp(app);
    setModalOpen(true);
  }

  async function handleSave(formData, existingId) {
    if (existingId) {
      await api.update(existingId, formData);
    } else {
      await api.create(formData);
    }
    setModalOpen(false);
    await refresh();
  }

  async function handleDelete(id) {
    await api.remove(id);
    setModalOpen(false);
    await refresh();
  }

  async function handleStatusChange(id, newStatus) {
    await api.update(id, { status: newStatus });
    await refresh();
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "var(--space-6) var(--space-5)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "var(--space-5)",
          flexWrap: "wrap",
          gap: "var(--space-4)",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-2)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8 }}>
              <path d="M12 22C12 22 12 16 12 12C12 8 8 6 8 6C8 6 10 10 12 12C14 10 16 6 16 6C16 6 12 8 12 12" 
                stroke="var(--status-offer)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <circle cx="12" cy="5" r="2" fill="var(--status-applied)" opacity="0.6"/>
            </svg>
            <h1 style={{ fontSize: "28px" }}>Job Tracker</h1>
          </div>
          <p style={{ color: "var(--paper-dim)", fontSize: "14px", margin: "4px 0 0" }}>
            Every application, every platform, one ledger.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-plant"
          style={{
            background: "var(--status-interview)",
            color: "var(--ink)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "10px 20px",
            fontWeight: 600,
            fontSize: "14px",
            whiteSpace: "nowrap",
          }}
        >
          + Log application
        </button>
      </header>

      <StatsHeader stats={stats} />

      {error && (
        <div
          style={{
            color: "var(--status-rejected)",
            background: "rgba(166, 107, 91, 0.1)",
            border: "1px solid var(--status-rejected)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            marginBottom: "var(--space-5)",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {loading && !error ? (
        <p style={{ color: "var(--paper-faint)" }}>Tending the garden...</p>
      ) : !error ? (
        <div>
          {STATUSES.map((status) => (
            <StatusSection
              key={status.key}
              status={status}
              applications={applications.filter((a) => a.status === status.key)}
              onRowClick={openEditModal}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : null}

      {modalOpen && (
        <ApplicationModal
          existing={editingApp}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}