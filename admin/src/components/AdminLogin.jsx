import { useState } from "react";
import { useAuth } from "../context/useAuth";
import "./AdminLogin.css";
const AdminLogin = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { await login(email, password); }
    catch (loginError) { setError(loginError.response?.data?.message || loginError.message || "Unable to log in"); }
    finally { setSubmitting(false); }
  };
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}>
    <h1>Elevoni Admin</h1><p>Sign in with an authorized admin account.</p>
    <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
    <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
    {error && <p className="admin-login-error" role="alert">{error}</p>}
    <button type="submit" disabled={submitting}>{submitting ? "Signing in?" : "Sign in"}</button>
  </form></main>;
};
export default AdminLogin;
