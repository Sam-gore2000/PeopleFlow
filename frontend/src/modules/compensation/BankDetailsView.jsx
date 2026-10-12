import { useEffect, useState } from "react";
import { PageTitle } from "../../components/common/PageTitle.jsx";
import { ScrollTable } from "../../components/tables/ScrollTable.jsx";

const show = (value) => (value === undefined || value === null || value === "" ? "" : String(value));
const amount = (value) => {
  const number = parseFloat(value);
  return Number.isFinite(number) ? `₹ ${number.toLocaleString("en-IN")}` : "";
};

function mask(account) {
  const text = show(account).replace(/\s+/g, "");
  return text.length > 4 ? `${"•".repeat(Math.min(8, text.length - 4))} ${text.slice(-4)}` : text;
}

function InfoItem({ icon, label, value, action }) {
  return (
    <div className="profile-info">
      <div className="profile-info-icon"><i className={`bi ${icon}`} /></div>
      <div className="profile-info-text">
        <span>{label}</span>
        <strong className={value ? "" : "is-empty"}>{value || "Not added"}</strong>
      </div>
      {action}
    </div>
  );
}

const SALARY = [
  ["Total Salary (Monthly)", "tsalary"],
  ["Basic Salary", "bsalary"],
  ["House Rent Allowance", "houserent"],
  ["Attendance Bonus", "attendanceb"],
  ["Conveyance Allowance", "conveyance"],
  ["Medical Allowance", "medicalallowance"],
  ["Special Allowance", "specialallowance"],
  ["Professional Tax", "ptax"]
];

// Bank details of one compensation record (all panels); admins also see the salary structure.
export function BankDetailsView({ record, showSalary = false, title = "Bank Details", onBack }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <>
      <div className="profile-view-header">
        <PageTitle>{title}</PageTitle>
        <button type="button" className="btn btn-outline-secondary profile-back" onClick={onBack}><i className="bi bi-arrow-left" /> Back</button>
      </div>
      <div className="card bank-view">
        <div className="card-body">
          <h6 className="profile-section-title">Employee</h6>
          <div className="profile-info-grid">
            <InfoItem icon="bi-person" label="Name" value={show(record.employeeName)} />
            <InfoItem icon="bi-person-vcard" label="Employee ID" value={show(record.empid)} />
            <InfoItem icon="bi-briefcase" label="Designation" value={show(record.designation)} />
            <InfoItem icon="bi-diagram-3" label="Department" value={show(record.department)} />
          </div>

          <h6 className="profile-section-title">Bank Account</h6>
          <div className="profile-info-grid">
            <InfoItem
              icon="bi-credit-card-2-front"
              label="Account Number"
              value={revealed ? show(record.accountNumber) : mask(record.accountNumber)}
              action={record.accountNumber ? (
                <button type="button" className="bank-reveal" onClick={() => setRevealed((value) => !value)} aria-label={revealed ? "Hide account number" : "Show account number"}>
                  <i className={`bi ${revealed ? "bi-eye-slash" : "bi-eye"}`} /> {revealed ? "Hide" : "Show"}
                </button>
              ) : null}
            />
            <InfoItem icon="bi-bank" label="Bank Name" value={show(record.bankName)} />
            <InfoItem icon="bi-geo-alt" label="Branch" value={show(record.branchName)} />
            <InfoItem icon="bi-upc" label="IFSC Code" value={show(record.ifscCode)} />
          </div>

          {showSalary && (
            <>
              <h6 className="profile-section-title">Salary Structure</h6>
              <ScrollTable>
                <table className="table bank-salary">
                  <tbody>
                    {SALARY.map(([label, field]) => (
                      <tr key={field}><td>{label}</td><td>{amount(record[field]) || "-"}</td></tr>
                    ))}
                  </tbody>
                </table>
              </ScrollTable>
            </>
          )}
        </div>
      </div>
    </>
  );
}
