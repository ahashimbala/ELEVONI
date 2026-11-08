import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api";
import "./NAtlasUsage.css";

const number = (value) => Number(value || 0).toLocaleString("en-NG");
const dateTime = (value) => value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-NG", { day: "2-digit", month: "short" }) : value;

export default function NAtlasUsage({ url }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`${url}/api/admin/natlas-usage`);
      if (!response.data?.success || !response.data?.data) throw new Error("Usage report is unavailable.");
      setUsage(response.data.data);
      setUpdatedAt(new Date());
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Unable to load N-ATLaS usage.");
    } finally { setLoading(false); }
  }, [url]);

  useEffect(() => { void load(); }, [load]);

  const warning = useMemo(() => {
    if (!usage) return null;
    if (usage.status === "blocked") return { title: "Legacy N-ATLaS access was blocked", detail: "The historical rolling 30-day unique-user limit was reached. This gate is no longer used by the live assistant." };
    if (usage.status === "new-user-admission-paused") return { title: "Historical new-user admission was paused", detail: "The former 1,000-user allowance was full. This historical limit is not applied to OpenAI requests." };
    if (usage.activeUsers >= 950) return { title: "Critical: close to the limit", detail: "This is a historical warning and does not limit current assistant access." };
    if (usage.activeUsers >= 900) return { title: "High usage", detail: "Current assistant usage is governed by OpenAI project limits and Elevoni budget controls." };
    if (usage.activeUsers >= 800) return { title: "Usage warning", detail: "Historical N-ATLaS usage passed 80% of its former allowance." };
    return null;
  }, [usage]);

  return <main className="natlas-usage-page">
    <header className="natlas-usage-header">
      <div><p className="natlas-usage-eyebrow">AI service governance</p><h1>Legacy N-ATLaS Usage History</h1><p>Historical records from the retired N-ATLaS rolling 30-day user gate. This limit no longer applies to the live OpenAI-powered Elevoni Assistant.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh report"}</button>
    </header>
    {error && <p className="natlas-usage-error" role="alert">{error}</p>}
    {loading && !usage ? <p role="status">Loading usage report…</p> : usage && <>
      {warning && <section className={`natlas-usage-warning ${usage.status === "blocked" ? "blocked" : ""}`}><strong>{warning.title}</strong><span>{warning.detail}</span></section>}
      <section className="natlas-usage-grid" aria-label="N-ATLaS usage summary">
        <article className="natlas-usage-card primary"><span>Historical unique users · last 30 days</span><strong>{number(usage.activeUsers)} <small>/ {number(usage.limit)}</small></strong><div className="natlas-usage-progress"><span style={{ width: `${Math.min(100, usage.percentUsed)}%` }} /></div><small>{usage.percentUsed}% of the former allowance used</small></article>
        <article className="natlas-usage-card"><span>Former allowance remaining</span><strong>{number(usage.remaining)}</strong><small>Historical figure only; no longer a live cap</small></article>
        <article className="natlas-usage-card"><span>Blocked requests</span><strong>{number(usage.blockedRequests)}</strong><small>Historical requests denied at the retired usage gate</small></article>
        <article className="natlas-usage-card"><span>Historical identities expiring within 24 hours</span><strong>{number(usage.expiringWithin24h)}</strong><small>Will leave the rolling window if they do not return</small></article>
        <article className="natlas-usage-card"><span>Peak daily active users</span><strong>{number(usage.peakDailyActiveUsers)}</strong><small>Highest daily unique count in the window</small></article>
      </section>
      <section className="natlas-usage-panel">
        <div className="natlas-usage-panel-heading"><div><h2>Daily activity</h2><p>Unique users who interacted with the retired N-ATLaS service on each UTC date, including first-time users.</p></div><span className={`natlas-usage-status ${usage.status === "blocked" ? "blocked" : ""}`}>{usage.status === "enabled" ? "Service enabled" : usage.status === "new-user-admission-paused" ? "New users paused" : "Access blocked"}</span></div>
        {usage.dailyUsage?.length ? <div className="natlas-usage-table-wrap"><table><thead><tr><th>Date (UTC)</th><th>Daily active users</th><th>New users</th></tr></thead><tbody>{usage.dailyUsage.map((item) => <tr key={item.day}><td>{dateLabel(item.day)}</td><td>{number(item.activeUsers)}</td><td>{number(item.newUsers)}</td></tr>)}</tbody></table></div> : <p className="natlas-usage-empty">No activity has been recorded in this window.</p>}
      </section>
      <section className="natlas-usage-panel natlas-usage-meta"><div><span>Rolling window begins</span><strong>{dateTime(usage.windowStart)}</strong></div><div><span>Last measured</span><strong>{dateTime(usage.measuredAt)}</strong></div><div><span>Last blocked request</span><strong>{dateTime(usage.lastBlockedAt)}</strong></div><div><span>Dashboard refreshed</span><strong>{dateTime(updatedAt)}</strong></div></section>
      <p className="natlas-usage-footnote">This page is retained for historical audit purposes only. The former N-ATLaS usage gate no longer controls access to Elevoni Assistant.</p>
    </>}
  </main>;
}
