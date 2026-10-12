import { COMPANY_NAME, COPYRIGHT_YEAR } from "../../constants/app.js";

export function Footer() {
  return (
    <footer className="footer">
      <div className="copyright">© {COPYRIGHT_YEAR} <span>{COMPANY_NAME}</span>. All rights reserved</div>
      <div className="credits">HRMS Portal</div>
    </footer>
  );
}
