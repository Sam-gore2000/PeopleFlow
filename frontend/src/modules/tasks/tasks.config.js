export const tasksConfig = {
  resource: "tasks",
  fields: [
    { name: "emp_id", label: "Employee ID", employee: "id" },
    { name: "emp_name", label: "Employee Name", employee: "name" },
    { name: "emp_project", label: "Project" },
    { name: "emp_team", label: "Team" },
    { name: "task", label: "Task", type: "textarea" },
    { name: "start_date", label: "Start Date", type: "date" },
    { name: "due_date", label: "Due Date", type: "date" },
    { name: "status", label: "Status", type: "select", options: ["Pending", "In Progress", "Completed"] },
    { name: "priority", label: "Priority", type: "select", options: ["Low", "Medium", "High"] }
  ]
};
