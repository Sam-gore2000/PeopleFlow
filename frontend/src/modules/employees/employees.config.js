export const employeesConfig = {
  resource: "employees",
  // Table headings. Any column not listed here uses its form label above
  // (fname -> "Employee Name"), so only list the ones you want different.
  columnLabels: {
    report_manager_id: "Manager ID",
    status: "Status"
  },
  fields: [
    { name: "fname", label: "Employee Name" },
    { name: "empid", label: "Employee ID", required: true },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "phno", label: "Phone" },
    { name: "username", label: "Username" },
    { name: "pass", label: "Password", type: "password", requiredOnCreate: true },
    { name: "department", label: "Department", required: true },
    { name: "position", label: "Position", required: true },
    { name: "jdate", label: "Joining Date", type: "date" },
    { name: "bdate", label: "Birth Date", type: "date" },
    { name: "add", label: "Address", type: "textarea" },
    { name: "edu", label: "Education" },
    { name: "report_manager", label: "Report Manager" },
    { name: "report_manager_id", label: "Report Manager ID" },
    { name: "offer_ctc", label: "Offer CTC" },
    { name: "prev_company", label: "Previous Company" },
    { name: "prev_exp", label: "Previous Experience" },
    { name: "padd", label: "Permanent Address", type: "textarea" }
  ]
};
