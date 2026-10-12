import { forwardRef } from "react";
import { COMPANY } from "./company.js";

// Like PHP's !empty(): blank, null and 0 count as empty.
export const hasValue = (value) => value !== undefined && value !== null && value !== "" && Number(value) !== 0;
const show = (value) => (value === undefined || value === null ? "" : String(value));

export function payslipMonthTitle(date) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(String(date || "")) ? new Date(`${date}T00:00:00`) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase() : "";
}

export function DocumentHeader() {
  return (
    <div className="pd-header">
      <img src={COMPANY.logo} alt={COMPANY.name} />
      <h3>{COMPANY.addressLines[0]}<br />{COMPANY.addressLines[1]}</h3>
      <h4>{COMPANY.email}</h4>
      <h4>{COMPANY.phone}</h4>
    </div>
  );
}

// The payslip, laid out like the old payslip-view.php.
export const PayslipDocument = forwardRef(function PayslipDocument({ payslip: p }, ref) {
  return (
    <div className="pd-page" ref={ref}>
      <DocumentHeader />
      <table className="pd-table">
        <thead><tr><th colSpan="4">PAYSLIP FOR THE MONTH OF {payslipMonthTitle(p.date)}</th></tr></thead>
      </table>

      <table className="pd-table">
        <thead><tr><th colSpan="4">ATTRIBUTES</th></tr></thead>
        <tbody>
          <tr><td>Name:</td><td colSpan="3">{show(p.employeeName)}</td></tr>
          <tr><td>Employee ID:</td><td colSpan="3">{show(p.empid)}</td></tr>
          <tr><td>Pay Date:</td><td colSpan="3">{show(p.date)}</td></tr>
          <tr><td>Designation:</td><td>{show(p.designation)}</td><td>Bank Account:</td><td>{show(p.accountNumber)}</td></tr>
          <tr><td>Department:</td><td>{show(p.department)}</td><td>IFSC Code:</td><td>{show(p.ifscCode)}</td></tr>
        </tbody>
      </table>

      <table className="pd-table">
        <tbody>
          <tr><td className="pd-small pd-half">WORKING DAYS:</td><td className="pd-half">{show(p.workday)}</td><td>PL:</td><td>{show(p.pl)}</td></tr>
          <tr><td className="pd-small">NO OF PRESENT DAYS:</td><td>{show(p.pday)}</td><td>LWP:</td><td>{show(p.lwp)}</td></tr>
        </tbody>
      </table>

      <table className="pd-table">
        <thead><tr><th>EARNINGS</th><th>AMOUNT (₹)</th><th>DEDUCTIONS</th><th>Amount (₹)</th></tr></thead>
        <tbody>
          <tr><td>Basic Salary</td><td>{show(p.bsalary)}</td><td>Professional Tax</td><td>{show(p.ptax)}</td></tr>
          <tr>
            <td>HRA</td><td>{show(p.houserent)}</td>
            {hasValue(p.advance_salary) ? <><td>Advance Salary</td><td>{show(p.advance_salary)}</td></> : <><td /><td /></>}
          </tr>
          <tr><td>Attendance Bonus</td><td>{show(p.attendanceb)}</td><td /><td /></tr>
          <tr><td>Conveyance Allowance</td><td>{show(p.conveyance)}</td><td /><td /></tr>
          <tr><td>Medical Allowance</td><td>{show(p.medicalallowance)}</td><td /><td /></tr>
          <tr><td>Special Allowance</td><td>{show(p.specialallowance)}</td><td /><td /></tr>
          {hasValue(p.prev_income) && <tr><td>Previous Month Income</td><td>{show(p.prev_income)}</td><td /><td /></tr>}
        </tbody>
        <tfoot>
          {/* As on the old payslip, Total Deductions shows Professional Tax. */}
          <tr><th>Gross Salary</th><th>{show(p.gsalary)}</th><th>Total Deductions</th><th>{show(p.ptax)}</th></tr>
        </tfoot>
      </table>

      <table className="pd-table">
        <tbody>
          <tr><td className="pd-small">NET PAYABLE AMOUNT:</td><td>{show(p.NetAmount)}</td></tr>
          <tr><td className="pd-small">AMOUNT IN WORDS:</td><td>{show(p.NetAmountw)}</td></tr>
        </tbody>
      </table>

      <div className="pd-footer"><p>This is a system generated payslip</p></div>
    </div>
  );
});
