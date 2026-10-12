export const timesheetsConfig = {
  resource: "timesheets",
  selfService: true,
  fields: [
    { name: "emp_id", label: "Employee ID", employee: "id" },
    { name: "emp_name", label: "Employee Name", employee: "name" },
    { name: "team", label: "Team" },
    { name: "project", label: "Project" },
    { name: "task", label: "Task" },
    { name: "date", label: "Start Date", type: "date" },
    { name: "enddate", label: "End Date", type: "date" },
    { name: "note", label: "Note", type: "textarea" }
  ]
};
