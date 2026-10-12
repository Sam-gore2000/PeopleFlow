import { useEffect, useState } from "react";
import { ForgotPasswordModal } from "./ForgotPasswordModal.jsx";

// Opens the forgot-password window from anywhere, with no changes to the login page:
//  - clicking any element with class "forgot-link" (the login page's "Forgot Password?");
//  - or: window.dispatchEvent(new CustomEvent("hrms:forgot-password", { detail: { username, codeSent: true } }))
//    from a custom page that already sent the code (opens at "Enter the code").
// Mounted once in App.jsx, outside the login check.
export function ForgotPasswordLauncher() {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    function currentUsername() {
      const input = document.querySelector('input[autocomplete="username"], input[name="username"]');
      return input?.value?.trim() || "";
    }
    function onClick(event) {
      const link = event.target.closest?.(".forgot-link");
      if (!link) return;
      event.preventDefault();
      // If the page opened its own window from the same click, don't open a second one.
      setTimeout(() => { if (!document.querySelector(".fp-backdrop")) setOpen({ username: currentUsername(), codeSent: false }); }, 0);
    }
    function onRequest(event) {
      setOpen({ username: event.detail?.username || currentUsername(), codeSent: Boolean(event.detail?.codeSent) });
    }
    document.addEventListener("click", onClick);
    window.addEventListener("hrms:forgot-password", onRequest);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hrms:forgot-password", onRequest);
    };
  }, []);

  function close(username) {
    setOpen(null);
    if (!username) return;
    // Put the username back into the login form so the person can sign in straight away.
    const input = document.querySelector('input[autocomplete="username"], input[name="username"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(input, username);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      document.querySelector('input[type="password"]')?.focus();
    }
  }

  return open ? <ForgotPasswordModal initialUsername={open.username} startAtCode={open.codeSent} onClose={close} /> : null;
}
