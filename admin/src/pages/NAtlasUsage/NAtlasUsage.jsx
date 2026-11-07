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
    if (usage.status === "blocked") return { title: "N-ATLaS access is blocked", detail: "The rolling 30-day unique-user limit has been reached. All N-ATLaS requests are paused." };
    if (usage.status === "new-user-admission-paused") return { title: "New-user admission paused", detail: "The service is below 1,000 users. Existing active users can continue, but no new unique users are admitted." };
    if (usage.activeUsers >= 950) return { title: "Critical: close to the limit", detail: "Only a small number of new users can be admitted." };
    if (usage.activeUsers >= 900) return { title: "High usage", detail: "Monitor new Elevoni Assistant users closely." };
    if (usage.activeUsers >= 800) return { title: "Usage warning", detail: "N-ATLaS has passed 80% of its allowance." };
    return null;
  }, [usage]);

  return <main className="natlas-usage-page">
    <header className="natlas-usage-header">
      <div><p className="natlas-usage-eyebrow">AI service governance</p><h1>N-ATLaS Usage Monitor</h1><p>Unique people who have sent a request to the N-ATLaS language model through Elevoni Assistant or the approved vendor assistant in the rolling 30-day window.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading}>{loading ? "Refreshing…" : "Refresh report"}</button>
    </header>
    {error && <p className="natlas-usage-error" role="alert">{error}</p>}
    {loading && !usage ? <p role="status">Loading usage report…</p> : usage && <>
      {warning && <section className={`natlas-usage-warning ${usage.status === "blocked" ? "blocked" : ""}`}><strong>{warning.title}</strong><span>{warning.detail}</span></section>}
      <section className="natlas-usage-grid" aria-label="N-ATLaS usage summary">
        <article className="natlas-usage-card primary"><span>Unique users · last 30 days</span><strong>{number(usage.activeUsers)} <small>/ {number(usage.limit)}</small></strong><div className="natlas-usage-progress"><span style={{ width: `${Math.min(100, usage.percentUsed)}%` }} /></div><small>{usage.percentUsed}% of the allowance used</small></article>
        <article className="natlas-usage-card"><span>Remaining places</span><strong>{number(usage.remaining)}</strong><small>New unique users allowed before the cap</small></article>
        <article className="natlas-usage-card"><span>Blocked requests</span><strong>{number(usage.blockedRequests)}</strong><small>Requests denied at the usage gate</small></article>
        <article className="natlas-usage-card"><span>Users expiring within 24 hours</span><strong>{number(usage.expiringWithin24h)}</strong><small>Will leave the rolling window if they do not return</small></article>
        <article className="natlas-usage-card"><span>Peak daily active users</span><strong>{number(usage.peakDailyActiveUsers)}</strong><small>Highest daily unique count in the window</small></article>
      </section>
      <section className="natlas-usage-panel">
        <div className="natlas-usage-panel-heading"><div><h2>Daily activity</h2><p>Unique users who interacted with N-ATLaS on each UTC date, including first-time users.</p></div><span className={`natlas-usage-status ${usage.status === "blocked" ? "blocked" : ""}`}>{usage.status === "enabled" ? "Service enabled" : usage.status === "new-user-admission-paused" ? "New users paused" : "Access blocked"}</span></div>
        {usage.dailyUsage?.length ? <div className="natlas-usage-table-wrap"><table><thead><tr><th>Date (UTC)</th><th>Daily active users</th><th>New users</th></tr></thead><tbody>{usage.dailyUsage.map((item) => <tr key={item.day}><td>{dateLabel(item.day)}</td><td>{number(item.activeUsers)}</td><td>{number(item.newUsers)}</td></tr>)}</tbody></table></div> : <p className="natlas-usage-empty">No activity has been recorded in this window.</p>}
      </section>
      <section className="natlas-usage-panel natlas-usage-meta"><div><span>Rolling window begins</span><strong>{dateTime(usage.windowStart)}</strong></div><div><span>Last measured</span><strong>{dateTime(usage.measuredAt)}</strong></div><div><span>Last blocked request</span><strong>{dateTime(usage.lastBlockedAt)}</strong></div><div><span>Dashboard refreshed</span><strong>{dateTime(updatedAt)}</strong></div></section>
      <p className="natlas-usage-footnote">Identity values are HMAC-hashed before storage. This report does not include message content, names, email addresses or phone numbers. Anonymous browser identities may change if a visitor clears site storage or changes browsers/devices.</p>
    </>}
  </main>;
}
