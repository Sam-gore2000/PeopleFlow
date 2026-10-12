export const projectsConfig = {
  resource: "projects",
  fields: [
    { name: "project", label: "Project" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "date", label: "Start Date", type: "date" },
    { name: "duedate", label: "Due Date", type: "date" },
    { name: "budget", label: "Budget", type: "number" },
    { name: "projectclient", label: "Client" },
    { name: "status", label: "Status", type: "select", options: ["Not Started", "In Progress", "Completed", "On Hold"] },
    { name: "app_type", label: "App Type" }
  ]
};
