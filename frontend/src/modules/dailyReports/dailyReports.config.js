export const dailyReportsConfig = {
  resource: "dprs",
  selfService: true,
  fields: [
    { name: "empid", label: "Employee ID", employee: "id" },
    { name: "emp_name", label: "Employee Name", employee: "name" },
    { name: "workmode", label: "Work Mode", type: "select", options: ["Office", "Remote", "Hybrid"] },
    { name: "pname", label: "Project Name" },
    { name: "wout", label: "Work Output", type: "textarea" },
    { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed"] }
  ]
};
