export const meetingsConfig = {
  resource: "meetings",
  selfService: true,
  fields: [
    { name: "organiser", label: "Organiser" },
    { name: "team", label: "Team" },
    { name: "emp", label: "Employee" },
    { name: "date", label: "Date", type: "date" },
    { name: "time", label: "Time", type: "time" },
    { name: "link", label: "Link", type: "url" },
    { name: "message", label: "Message", type: "textarea" }
  ]
};
