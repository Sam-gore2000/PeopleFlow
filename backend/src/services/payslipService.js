import { httpError } from "../utils/httpError.js";
import { PAYSLIP_INPUTS, calculatePayslip } from "../utils/payslipCalc.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Runs before a payslip is saved (admin "Payslip Generate"):
//  - recalculates Basic, HRA, Special Allowance, Gross, Net and Amount in Words (same logic as the old PHP page);
//  - fills Month / Year / Net Salary for the payslip table;
//  - one payslip per employee per month.
export async function preparePayslip(body, { model, id, existing }) {
  const values = { ...(existing || {}), ...body };
  if (!values.empid) throw httpError(400, "Employee ID is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(values.date || ""))) throw httpError(400, "Please choose the payslip date.");
  if (!(parseFloat(values.workday) > 0)) throw httpError(400, "Working days must be more than 0.");

  for (const field of PAYSLIP_INPUTS) {
    if (body[field] !== undefined && body[field] !== "") body[field] = parseFloat(body[field]) || 0;
  }
  Object.assign(body, calculatePayslip(values));

  const [year, month] = values.date.split("-").map(Number);
  body.month = MONTHS[month - 1];
  body.year = year;
  body.netSalary = body.NetAmount;

  const monthKey = values.date.slice(0, 7);
  const duplicate = await model.findOne({
    empid: values.empid,
    date: { $regex: `^${monthKey}` },
    ...(id ? { _id: { $ne: id } } : {})
  }).lean();
  if (duplicate) throw httpError(409, `A payslip for ${values.empid} for ${body.month} ${year} already exists. Edit that one instead.`);
  return body;
}
