// Saves an on-screen element as an A4 PDF (same approach as the old payslip-view.php: html2canvas + jsPDF).
// The libraries are loaded only when someone actually downloads.
async function waitForImages(element) {
  const images = [...element.querySelectorAll("img")];
  await Promise.all(images.map((img) => (img.complete ? null : new Promise((done) => { img.onload = done; img.onerror = done; }))));
  if (document.fonts?.ready) await document.fonts.ready;
}

export async function downloadElementAsPdf(element, filename) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
  await waitForImages(element);
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    // A document rendered off-screen (direct download) is moved into view in the capture copy only.
    onclone: (doc, clone) => {
      const holder = clone.closest(".pd-offscreen");
      if (holder) Object.assign(holder.style, { left: "0px", top: "0px" });
    }
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  let width = pageWidth;
  let height = (canvas.height * width) / canvas.width;
  if (height > pageHeight) { // keep it on one page
    height = pageHeight;
    width = (canvas.width * height) / canvas.height;
  }
  pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageWidth - width) / 2, 0, width, height);
  pdf.save(filename);
}

export function safeFileName(text) {
  return String(text || "").trim().replace(/[^\w-]+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "document";
}
