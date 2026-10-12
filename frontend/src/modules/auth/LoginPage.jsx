import { useState } from "react";
import { Alert } from "../../components/common/Alert.jsx";
import { COMPANY_NAME, COPYRIGHT_YEAR } from "../../constants/app.js";
import { authApi } from "./authApi.js";
import {ForgotPasswordModal} from "./ForgotPasswordModal.jsx"

export function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const [forgotOpen, setForgotOpen] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      onLogin(await authApi.login(form));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <img src="/img/hrm-white-logo.png" alt={COMPANY_NAME} className="login-logo" />
        {/* <h1>{COMPANY_NAME}</h1> */}
        <p>HRMS Portal</p>
        <form onSubmit={submit} className="row g-3">
          <label className="col-12">
            <span>Username</span>
            <input className="form-control" value={form.username} onChange={(e) => update("username", e.target.value)} required autoComplete="username" />
          </label>
          <label className="col-12">
            <span>Password</span>
            <input className="form-control" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required autoComplete="current-password" />
          </label>
          <div className="col-12 d-flex justify-content-between align-items-center">
            <label className="remember">
              <input type="checkbox" checked={form.remember} onChange={(e) => update("remember", e.target.checked)} />
              <span>Remember Me</span>
            </label>
           <button type="button" className="forgot-link" onClick={() => setForgotOpen(true)}>Forgot Password?</button>
           {forgotOpen && <ForgotPasswordModal initialUsername={form.username} onClose={(username) => { setForgotOpen(false); if (username) update("username", username); }} />}
          </div>
          <Alert type="danger" className="py-2">{error}</Alert>
          <button className="btn login-btn w-100" disabled={loading}>{loading ? "Signing In..." : "Sign In"}</button>
        </form>
        <small>© {COPYRIGHT_YEAR} {COMPANY_NAME}. All rights reserved</small>
      </section>
    </main>
  );
}
