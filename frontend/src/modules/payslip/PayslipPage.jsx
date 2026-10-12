import { useEffect, useRef, useState } from "react";
import { useViewHistory } from "../../app/history.js";
import { useDialog } from "../../components/feedback/DialogProvider.jsx";
import { ResourcePage } from "../../components/resource/ResourcePage.jsx";
import { DocumentViewer } from "./DocumentViewer.jsx";
import { PayslipDocument, payslipMonthTitle } from "./PayslipDocument.jsx";
import { downloadElementAsPdf, safeFileName } from "./pdf.js";
import { payslipConfig } from "./payslip.config.js";

const YEARS_BACK = 6;
const payslipFileName = (payslip) => `Payslip_${safeFileName(payslip.employeeName)}_${safeFileName(payslipMonthTitle(payslip.date))}.pdf`;

// Renders a payslip off-screen and saves it as a PDF, then removes it.
function DirectDownload({ payslip, onDone }) {
  const ref = useRef(null);
  const dialog = useDialog();
  useEffect(() => {
    let cancelled = false;
    downloadElementAsPdf(ref.current, payslipFileName(payslip))
      .catch((error) => !cancelled && dialog.error("Download failed", error.message || "The PDF couldn't be created. Please try again."))
      .finally(() => !cancelled && onDone());
    return () => { cancelled = true; };
  }, []);
  return <div className="pd-offscreen" aria-hidden="true"><PayslipDocument ref={ref} payslip={payslip} /></div>;
}

function YearFilter({ value, onChange }) {
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: YEARS_BACK }, (_, index) => thisYear - index);
  return (
    <label className="year-filter">
      <span>Year</span>
      <select className="form-select" value={value} onChange={(event) => onChange(event.target.value)} aria-label="Filter payslips by year">
        <option value="">All years</option>
        {years.map((year) => <option key={year} value={year}>{year}</option>)}
      </select>
    </label>
  );
}

// Admin: "Payslip Generate" (form with live calculation + list).
// Everyone: View and Download buttons on each payslip, and a Year filter.
export function PayslipPage({ user }) {
  const [viewing, setViewing] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [year, setYear] = useState("");
  const closeView = useViewHistory(Boolean(viewing), () => setViewing(null));

  if (viewing) {
    return (
      <DocumentViewer
        title="Payslip"
        backLabel="Back to Payslips"
        onBack={closeView}
        filename={payslipFileName(viewing)}
        render={(ref) => <PayslipDocument ref={ref} payslip={viewing} />}
      />
    );
  }

  const rowActions = [
    { label: "View", icon: "bi-eye", onClick: setViewing },
    { label: downloading ? "Preparing..." : "Download", icon: "bi-download", className: "btn-download", onClick: (row) => !downloading && setDownloading(row) }
  ];

  return (
    <>
      <ResourcePage
        config={payslipConfig}
        user={user}
        rowActions={rowActions}
        filters={year ? { year } : {}}
        toolbar={<YearFilter value={year} onChange={setYear} />}
      />
      {downloading && <DirectDownload payslip={downloading} onDone={() => setDownloading(null)} />}
    </>
  );
}
