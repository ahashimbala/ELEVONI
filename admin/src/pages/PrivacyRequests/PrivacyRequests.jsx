import { useCallback, useEffect, useState } from "react";
import api from "../../api";
import "./PrivacyRequests.css";

const STATUSES = ["received", "verification_required", "in_progress", "completed", "declined"];
const label = (value) => String(value || "").replaceAll("_", " ");
const dateTime = (value) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—";

export default function PrivacyRequests({ url }) {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get(`${url}/api/admin/privacy-requests`);
      const records = response.data?.data || [];
      setItems(records);
      setDrafts(Object.fromEntries(records.map((item) => [item._id, { status: item.status, operatorNotes: item.operatorNotes || "" }])));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load privacy requests.");
    } finally { setLoading(false); }
  }, [url]);

  useEffect(() => { void load(); }, [load]);

  const updateDraft = (id, key, value) => setDrafts((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  const save = async (id) => {
    const draft = drafts[id];
    if (!draft || savingId) return;
    setSavingId(id); setError(""); setNotice("");
    try {
      await api.patch(`${url}/api/admin/privacy-requests/${id}`, draft);
      setNotice("Privacy request updated.");
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update this request.");
    } finally { setSavingId(""); }
  };

  return <main className="privacy-requests-page">
    <header className="privacy-requests-header">
      <div><p>Data protection operations</p><h1>Privacy requests</h1><span>Verify the requester before disclosing or changing personal data. Keep notes of decisions and lawful retention exceptions.</span></div>
      <button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh"}</button>
    </header>
    {error && <p className="privacy-requests-error" role="alert">{error}</p>}
    {notice && <p className="privacy-requests-notice" role="status">{notice}</p>}
    {loading ? <p>Loading privacy requests…</p> : !items.length ? <p>No privacy requests have been submitted.</p> : <div className="privacy-requests-list">
      {items.map((item) => <article className="privacy-request-card" key={item._id}>
        <div className="privacy-request-card-heading"><div><strong>{item.requesterName}</strong><span>{item.requesterEmail}</span></div><small>{dateTime(item.createdAt)}</small></div>
        <p><b>Request:</b> {label(item.requestType)} {item.accountEmail && <>· <b>Account:</b> {item.accountEmail}</>}</p>
        {item.details && <p className="privacy-request-details">{item.details}</p>}
        <div className="privacy-request-controls">
          <label>Status<select value={drafts[item._id]?.status || item.status} onChange={(event) => updateDraft(item._id, "status", event.target.value)}>{STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
          <label className="privacy-request-notes">Operator notes<textarea rows={2} maxLength={2000} value={drafts[item._id]?.operatorNotes || ""} onChange={(event) => updateDraft(item._id, "operatorNotes", event.target.value)} placeholder="Record verification, action taken, legal retention reason or response date." /></label>
          <button type="button" onClick={() => void save(item._id)} disabled={savingId === item._id}>{savingId === item._id ? "Saving…" : "Save update"}</button>
        </div>
      </article>)}
    </div>}
    <p className="privacy-requests-footnote">This dashboard records and tracks requests; it does not automatically delete customer or vendor records. Complete the verified request across all relevant systems and record any lawful retention exception before marking it completed.</p>
  </main>;
}
