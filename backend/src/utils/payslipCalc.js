// Payslip calculation - the same logic as the old PHP payslip.php (calculatePayslip).
// Used by the browser (live preview) and the server (the saved values), so they always match.
// Keep backend/src/utils/payslipCalc.js and frontend/src/modules/payslip/payslipCalc.js identical.

const num = (value) => parseFloat(value) || 0;

// Indian numbering (Crore / Lakh / Thousand / Hundred), e.g. 45250 -> "Forty Five Thousand Two Hundred and Fifty".
export function numberToWords(value) {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const text = String(value);
  if (text.length > 9) return "Overflow";
  const n = `000000000${text}`.slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return "";

  const twoDigits = (digits) => a[Number(digits)] || `${b[digits[0]]} ${a[digits[1]]}`;
  let words = "";
  words += Number(n[1]) !== 0 ? `${twoDigits(n[1])} Crore ` : "";
  words += Number(n[2]) !== 0 ? `${twoDigits(n[2])} Lakh ` : "";
  words += Number(n[3]) !== 0 ? `${twoDigits(n[3])} Thousand ` : "";
  words += Number(n[4]) !== 0 ? `${twoDigits(n[4])} Hundred ` : "";
  words += Number(n[5]) !== 0 ? `${words !== "" ? "and " : ""}${twoDigits(n[5])}` : "";
  return words.replace(/\s+/g, " ").trim();
}

// Inputs: tsalary (monthly total), workday, pday, lwp, attendanceb, conveyance, medicalallowance,
//         ptax, prev_income, advance_salary.
// Returns the calculated fields, rounded like the old payslip.
export function calculatePayslip(values = {}) {
  const tsalary = num(values.tsalary);
  const workday = num(values.workday);
  const pday = num(values.pday);
  const lwp = num(values.lwp);
  const attendanceb = num(values.attendanceb);
  const conveyance = num(values.conveyance);
  const medicalallowance = num(values.medicalallowance);
  const ptax = num(values.ptax);
  const prevIncome = num(values.prev_income);
  const advanceSalary = num(values.advance_salary);

  const perday = workday ? tsalary / workday : 0; // 1. per-day salary
  const lwpt = perday * lwp; // 2. leave-without-pay deduction
  const bsalary = perday * pday * 0.5; // 3. basic = 50% of salary for the present days
  const houserent = bsalary * 0.5; // 4. HRA = 50% of basic
  const specialallowance = tsalary - houserent - bsalary - attendanceb - conveyance - medicalallowance; // 5. the rest
  const grossSalary = bsalary + houserent + attendanceb + conveyance + medicalallowance + specialallowance - lwpt; // 6
  const netAmount = grossSalary - ptax + prevIncome - advanceSalary; // 7. net payable

  const net = Math.round(netAmount);
  return {
    bsalary: Math.round(bsalary),
    houserent: Math.round(houserent),
    specialallowance: Math.round(specialallowance),
    gsalary: Math.round(grossSalary),
    NetAmount: net,
    NetAmountw: `${numberToWords(net)} Only`
  };
}

export const PAYSLIP_INPUTS = ["tsalary", "workday", "pday", "lwp", "attendanceb", "conveyance", "medicalallowance", "ptax", "prev_income", "advance_salary"];
