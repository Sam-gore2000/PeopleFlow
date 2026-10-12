import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./forgotPassword.css";
import { passwordResetApi } from "./passwordResetApi.js";

const STEPS = { REQUEST: 1, VERIFY: 2, RESET: 3, DONE: 4 };
const MIN_PASSWORD_LENGTH = 6;

// Forgot password in three steps: username / Employee ID / email -> 6-digit code from email -> new password.
// onClose(usernameToPrefill?) is called when the window closes.
// startAtCode: open straight at "Enter the code" (when another page has already sent the code).
// Rendered on <body> (portal) and without <form> elements, so wherever it is placed - even inside the
// login page's <form> - the browser can never do a page-reloading form submit.
export function ForgotPasswordModal({ initialUsername = "", startAtCode = false, onClose }) {
  const [step, setStep] = useState(startAtCode && initialUsername ? STEPS.VERIFY : STEPS.REQUEST);
  const [devHint, setDevHint] = useState("");
  const [username, setUsername] = useState(initialUsername);
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resendIn, setResendIn] = useState(startAtCode ? 60 : 0);
  const firstInput = useRef(null);

  useEffect(() => { firstInput.current?.focus(); }, [step]);
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !busy && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onClose]);
  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function run(action) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const sendCode = () => {
    if (!username.trim()) return setError("Enter your username, Employee ID or email.");
    return run(async () => {
      const result = await passwordResetApi.requestCode(username.trim());
      setInfo(result.message);
      setDevHint(result.dev_hint || "");
      setResendIn(result.resend_in || 60);
      setOtp("");
      setStep(STEPS.VERIFY);
    });
  };

  const verify = () => {
    if (otp.length !== 6) return setError("Enter the 6-digit code from the email.");
    return run(async () => {
      const result = await passwordResetApi.verifyCode(username.trim(), otp.trim());
      setResetToken(result.resetToken);
      setInfo("");
      setStep(STEPS.RESET);
    });
  };

  const reset = () => {
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirmPassword) return setError("The two passwords don't match.");
    return run(async () => {
      const result = await passwordResetApi.resetPassword(resetToken, password, confirmPassword);
      setInfo(result.message);
      setStep(STEPS.DONE);
    });
  };

  // Enter in any field runs the step's action (there is no <form> to submit).
  const onEnter = (action) => (event) => {
    if (event.key !== "Enter" || event.target.tagName === "BUTTON") return;
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const titles = { [STEPS.REQUEST]: "Forgot password", [STEPS.VERIFY]: "Enter the code", [STEPS.RESET]: "Set a new password", [STEPS.DONE]: "Password changed" };

  return createPortal(
    <div className="fp-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <div className="fp-card" role="dialog" aria-modal="true" aria-labelledby="fp-title">
        <button type="button" className="fp-close" onClick={() => onClose()} disabled={busy} aria-label="Close"><i className="bi bi-x-lg" /></button>
        <div className="fp-steps" aria-hidden="true">
          {[1, 2, 3].map((number) => <span key={number} className={step >= number ? "done" : ""} />)}
        </div>
        <h2 id="fp-title">{titles[step]}</h2>

        {step === STEPS.REQUEST && (
          <div className="fp-step" onKeyDown={onEnter(sendCode)}>
            <p className="fp-text">Enter your username, Employee ID or registered email. We'll email you a 6-digit code.</p>
            <label>
              <span>Username / Employee ID / Email</span>
              <input ref={firstInput} className="form-control" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
            </label>
            {error && <p className="fp-error" role="alert">{error}</p>}
            <button type="button" className="btn login-btn w-100" onClick={sendCode} disabled={busy || !username.trim()}>{busy ? "Sending..." : "Send code"}</button>
          </div>
        )}

        {step === STEPS.VERIFY && (
          <div className="fp-step" onKeyDown={onEnter(verify)}>
            <p className="fp-text">{info || "A 6-digit code has been sent to your registered email."} It's valid for 10 minutes - check your spam folder too.</p>
            {devHint && <p className="fp-dev" role="note"><i className="bi bi-tools" /> Development: {devHint}</p>}
            <label>
              <span>6-digit code</span>
              <input
                ref={firstInput}
                className="form-control fp-otp"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="------"
                required
              />
            </label>
            {error && <p className="fp-error" role="alert">{error}</p>}
            <button type="button" className="btn login-btn w-100" onClick={verify} disabled={busy || otp.length !== 6}>{busy ? "Checking..." : "Verify code"}</button>
            <div className="fp-row">
              <button type="button" className="fp-link" onClick={() => { setError(""); setStep(STEPS.REQUEST); }} disabled={busy}>Change username</button>
              <button type="button" className="fp-link" onClick={() => sendCode()} disabled={busy || resendIn > 0}>{resendIn > 0 ? `Resend code in ${resendIn}s` : "Resend code"}</button>
            </div>
          </div>
        )}

        {step === STEPS.RESET && (
          <div className="fp-step" onKeyDown={onEnter(reset)}>
            <p className="fp-text">Code verified. Choose a new password (at least {MIN_PASSWORD_LENGTH} characters).</p>
            <label>
              <span>New password</span>
              <div className="fp-password">
                <input ref={firstInput} className="form-control" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}><i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} /></button>
              </div>
            </label>
            <label>
              <span>Confirm new password</span>
              <input className="form-control" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required />
            </label>
            {error && <p className="fp-error" role="alert">{error}</p>}
            <button type="button" className="btn login-btn w-100" onClick={reset} disabled={busy}>{busy ? "Saving..." : "Change password"}</button>
          </div>
        )}

        {step === STEPS.DONE && (
          <div className="fp-done">
            <div className="fp-done-icon"><i className="bi bi-check-lg" /></div>
            <p className="fp-text">{info}</p>
            <button type="button" className="btn login-btn w-100" onClick={() => onClose(username.trim())}>Back to sign in</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
