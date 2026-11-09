import { useState } from "react";
import { resolveApiBaseUrl } from "../../utils/apiBase";

const API = resolveApiBaseUrl();

export default function PrivacyRequestForm() {
  const [form, setForm] = useState({ requesterName: "", requesterEmail: "", accountEmail: "", requestType: "deletion", details: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setResult("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/privacy-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { token } : {}) },
        body: JSON.stringify(form),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to submit your request.");
      setResult(`Request received. Reference: ${payload.data.reference}. We will verify your identity before taking action.`);
      setForm({ requesterName: "", requesterEmail: "", accountEmail: "", requestType: "deletion", details: "" });
    } catch (requestError) {
      setError(requestError.message || "Unable to submit your request. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <section className="privacy-request-panel" aria-labelledby="privacy-request-title">
      <h2 id="privacy-request-title">Submit a data protection request</h2>
      <p>Use this form to request access, correction, deletion or another data protection action. We will verify your identity before making changes. Some transaction or legal records may need to be retained by law.</p>
      <form onSubmit={submit} className="privacy-request-form">
        <label>Your name<input required maxLength={120} value={form.requesterName} onChange={(event) => update("requesterName", event.target.value)} /></label>
        <label>Contact email<input required type="email" maxLength={254} value={form.requesterEmail} onChange={(event) => update("requesterEmail", event.target.value)} /></label>
        <label>Account email, if different<input type="email" maxLength={254} value={form.accountEmail} onChange={(event) => update("accountEmail", event.target.value)} /></label>
        <label>Request type<select value={form.requestType} onChange={(event) => update("requestType", event.target.value)}>
          <option value="deletion">Account closure / data deletion</option>
          <option value="access">Access to my data</option>
          <option value="correction">Correct my data</option>
          <option value="restriction">Restrict processing</option>
          <option value="portability">Data portability</option>
          <option value="objection">Object to processing</option>
          <option value="other">Other privacy concern</option>
        </select></label>
        <label className="privacy-request-wide">Details (optional)<textarea rows={3} maxLength={2000} value={form.details} onChange={(event) => update("details", event.target.value)} placeholder="Describe the account or data involved. Do not include passwords or payment credentials." /></label>
        {error && <p className="privacy-request-error" role="alert">{error}</p>}
        {result && <p className="privacy-request-success" role="status">{result}</p>}
        <button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit privacy request"}</button>
      </form>
    </section>
  );
}
