import { useEffect, useRef, useState } from "react";
import { PageTitle } from "../../components/common/PageTitle.jsx";
import { useDialog } from "../../components/feedback/DialogProvider.jsx";
import { downloadElementAsPdf } from "./pdf.js";

// Shows a payslip / compensation statement with Back and Download PDF.
// With autoDownload, the PDF downloads as soon as the document is on screen.
export function DocumentViewer({ title, backLabel = "Back", onBack, filename, autoDownload = false, render }) {
  const documentRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const dialog = useDialog();

  async function download() {
    if (busy || !documentRef.current) return;
    setBusy(true);
    try {
      await downloadElementAsPdf(documentRef.current, filename);
    } catch (error) {
      dialog.error("Download failed", error.message || "The PDF couldn't be created. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);
  useEffect(() => {
    if (autoDownload && !started.current) {
      started.current = true;
      download();
    }
  }, [autoDownload]);

  return (
    <>
      <div className="pd-toolbar">
        <PageTitle>{title}</PageTitle>
        <div className="pd-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}><i className="bi bi-arrow-left" /> {backLabel}</button>
          <button type="button" className="btn btn-success" onClick={download} disabled={busy}>
            <i className={`bi ${busy ? "bi-arrow-repeat spin" : "bi-download"}`} /> {busy ? "Preparing PDF..." : "Download PDF"}
          </button>
        </div>
      </div>
      <div className="pd-scroll">{render(documentRef)}</div>
    </>
  );
}
