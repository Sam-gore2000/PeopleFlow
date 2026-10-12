import { forwardRef } from "react";
import { numberToWords } from "../payslip/payslipCalc.js";
import { DocumentHeader } from "../payslip/PayslipDocument.jsx";

const amount = (value) => parseFloat(value) || 0;
const show = (value) => (value === undefined || value === null ? "" : String(value));
const EARNINGS = [
  ["Basic Salary", "bsalary"],
  ["HRA", "houserent"],
  ["Attendance Bonus", "attendanceb"],
  ["Conveyance Allowance", "conveyance"],
  ["Medical Allowance", "medicalallowance"],
  ["Special Allowance", "specialallowance"]
];

// Monthly salary structure from Compensation Details, in the payslip layout (old componsation.php).
export const CompensationDocument = forwardRef(function CompensationDocument({ compensation: c }, ref) {
  const gross = Math.round(EARNINGS.reduce((sum, [, field]) => sum + amount(c[field]), 0));
  const deductions = Math.round(amount(c.ptax));
  const net = gross - deductions;
  return (
    <div className="pd-page" ref={ref}>
      <DocumentHeader />
      <table className="pd-table">
        <thead><tr><th colSpan="4">COMPENSATION STRUCTURE (MONTHLY)</th></tr></thead>
      </table>

      <table className="pd-table">
        <thead><tr><th colSpan="4">ATTRIBUTES</th></tr></thead>
        <tbody>
          <tr><td>Name:</td><td colSpan="3">{show(c.employeeName)}</td></tr>
          <tr><td>Employee ID:</td><td colSpan="3">{show(c.empid)}</td></tr>
          <tr><td>Designation:</td><td>{show(c.designation)}</td><td>Bank Account:</td><td>{show(c.accountNumber)}</td></tr>
          <tr><td style={{ width: "20%" }}>Department:</td><td style={{ width: "35%" }}>{show(c.department)}</td><td style={{ width: "15%" }}>IFSC Code:</td><td style={{ width: "30%" }}>{show(c.ifscCode)}</td></tr>
          <tr><td>Bank Name:</td><td>{show(c.bankName)}</td><td>Branch:</td><td>{show(c.branchName)}</td></tr>
        </tbody>
      </table>

      <table className="pd-table">
        <thead><tr><th style={{ width: "30%" }}>EARNINGS</th><th style={{ width: "20%" }}>AMOUNT (₹)</th><th style={{ width: "30%" }}>DEDUCTIONS</th><th style={{ width: "20%" }}>Amount (₹)</th></tr></thead>
        <tbody>
          {EARNINGS.map(([label, field], index) => (
            <tr key={field}>
              <td>{label}</td><td>{show(c[field])}</td>
              {index === 0 ? <><td>Professional Tax</td><td>{show(c.ptax)}</td></> : <><td /><td /></>}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><th>Gross Salary</th><th>{gross}</th><th>Total Deductions</th><th>{deductions}</th></tr>
        </tfoot>
      </table>

      <table className="pd-table">
        <tbody>
          <tr><td className="pd-small" style={{ width: "30%" }}>TOTAL SALARY:</td><td style={{ width: "70%" }}>{show(c.tsalary)}</td></tr>
          <tr><td className="pd-small">NET PAYABLE AMOUNT:</td><td>{net}</td></tr>
          <tr><td className="pd-small">AMOUNT IN WORDS:</td><td>{numberToWords(net)} Only</td></tr>
        </tbody>
      </table>

      <div className="pd-footer"><p>This is a system generated compensation statement</p></div>
    </div>
  );
});
