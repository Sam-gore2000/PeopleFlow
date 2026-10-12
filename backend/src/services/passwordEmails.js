// Emails for forgot password, in the LionReach Deep Reef palette (table layout for email clients).
const LOGO_WHITE = "https://techpulseinsider.com/Logos/official/LRM_logowhite.png";
const FONT = "Poppins, 'Segoe UI', Arial, sans-serif";

const escapeHtml = (text) => String(text ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

function layout(title, body) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#EFF5F2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFF5F2;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;border-radius:16px;overflow:hidden;background:#ffffff;">
      <tr><td style="background:#03211F;padding:26px 32px;" align="left">
        <img src="${LOGO_WHITE}" alt="LionReach Media" width="170" style="display:block;border:0;width:170px;height:auto;">
      </td></tr>
      <tr><td style="padding:32px;font-family:${FONT};color:#03211F;">
        <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#03211F;">${escapeHtml(title)}</h1>
        ${body}
      </td></tr>
      <tr><td style="padding:18px 32px;background:#EFF5F2;font-family:${FONT};font-size:12px;color:#06322F;">
        LionReach Media &middot; HRMS. This is an automated message - please don't reply.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

export function otpEmail({ name, otp, minutes }) {
  const html = layout("Your password reset code", `
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#03211F;">Hi ${escapeHtml(name)}, use this code to reset your HRMS password:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;"><tr>
          <td style="background:#03211F;border-radius:12px;padding:16px 26px;font-family:${FONT};font-size:32px;font-weight:700;letter-spacing:10px;color:#CFFA39;">${escapeHtml(otp)}</td>
        </tr></table>
        <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#06322F;">The code expires in <strong>${minutes} minutes</strong> and works once.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#06322F;">Didn't ask for this? Ignore this email - your password stays the same. Never share this code with anyone, including HR.</p>`);
  const text = `Hi ${name},\n\nYour HRMS password reset code is: ${otp}\nIt expires in ${minutes} minutes and works once.\n\nIf you didn't ask for this, ignore this email - your password stays the same. Never share this code.\n\nLionReach Media HRMS`;
  return { subject: `${otp} is your HRMS password reset code`, html, text };
}

export function passwordChangedEmail({ name }) {
  const when = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const html = layout("Your password was changed", `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#03211F;">Hi ${escapeHtml(name)}, your HRMS password was reset on ${escapeHtml(when)}.</p>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#06322F;">If this wasn't you, contact HR straight away so your account can be secured.</p>`);
  const text = `Hi ${name},\n\nYour HRMS password was reset on ${when}.\nIf this wasn't you, contact HR straight away.\n\nLionReach Media HRMS`;
  return { subject: "Your HRMS password was changed", html, text };
}
