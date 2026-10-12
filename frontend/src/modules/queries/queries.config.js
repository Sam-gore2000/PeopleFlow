export const queriesConfig = {
  resource: "queries",
  selfService: true,
  approvable: true,
  fields: [
    { name: "emp_id", label: "Employee ID", employee: "id" },
    { name: "emp_name", label: "Employee Name", employee: "name" },
    { name: "date", label: "Date", type: "date" },
    { name: "subject", label: "Subject" },
    { name: "message", label: "Message", type: "textarea" }
  ]
};
