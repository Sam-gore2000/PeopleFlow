import { api } from "../../services/api.js";
import { calculatePayslip } from "./payslipCalc.js";

// Compensation fields copied into a new payslip when the admin picks an employee
// (the old fetch_employee.php did the same from bank_details).
const FROM_COMPENSATION = ["designation", "department", "tsalary", "attendanceb", "conveyance", "medicalallowance", "ptax", "accountNumber", "bankName", "branchName", "ifscCode"];

async function loadCompensation(employee) {
  const result = await api(`/resources/bankDetails?empid=${encodeURIComponent(employee.empid)}&limit=1`);
  const compensation = result.data?.[0];
  if (!compensation) return null;
  return Object.fromEntries(FROM_COMPENSATION.filter((field) => compensation[field] !== undefined && compensation[field] !== "").map((field) => [field, compensation[field]]));
}

export const payslipConfig = {
  resource: "payslips",
  columnLabels: { empid: "Employee ID", employeeName: "Employee Name", tsalary: "Total Salary", netSalary: "Net Salary", createdAt: "Generated On" },
  compute: calculatePayslip,
  onEmployeeSelected: loadCompensation,
  fields: [
    { name: "empid", label: "EMP ID", employee: "id" },
    { name: "employeeName", label: "EMP Name", employee: "name" },
    { name: "date", label: "Date", type: "date" },
    { name: "workday", label: "Working Day", type: "number" },
    { name: "pday", label: "Present Day", type: "number" },
    { name: "pl", label: "Paid Leave", type: "number" },
    { name: "lwp", label: "Leave Without Pay", type: "number" },
    { name: "designation", label: "Designation", employee: "position" },
    { name: "department", label: "Department", employee: "department" },
    { name: "tsalary", label: "Total Salary (Monthly)", type: "number" },
    { name: "bsalary", label: "Basic Salary", type: "number", computed: true },
    { name: "houserent", label: "House Rent Allowance", type: "number", computed: true },
    { name: "attendanceb", label: "Attendance Bonus", type: "number" },
    { name: "conveyance", label: "Conveyance Allowance", type: "number" },
    { name: "medicalallowance", label: "Medical Allowance", type: "number" },
    { name: "specialallowance", label: "Special Allowance", type: "number", computed: true },
    { name: "gsalary", label: "Gross Salary", type: "number", computed: true },
    { name: "ptax", label: "Professional Tax", type: "number" },
    { name: "advance_salary", label: "Advance Salary", type: "number" },
    { name: "prev_income", label: "Previous Month Income", type: "number" },
    { name: "NetAmount", label: "Net Payable Amount", type: "number", computed: true },
    { name: "NetAmountw", label: "Amount In Word", computed: true },
    { name: "accountNumber", label: "Account Number" },
    { name: "bankName", label: "Bank Name" },
    { name: "branchName", label: "Branch Name" },
    { name: "ifscCode", label: "IFSC Code" }
  ]
};
