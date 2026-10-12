export const LEAVE_TYPES = ["Sick Leave", "Casual Leave", "Paid Leave", "Emergency Leave"];
export const LEAVE_DURATIONS = ["Full Day", "Half Day - First Half", "Half Day - Second Half"];

const isHalfDay = (values) => /^Half/.test(values.leave_duration || "");

export const leaveConfig = {
  resource: "leaves",
  selfService: true,
  approvable: true,
  defaults: { leave_duration: "Full Day" },
  columnLabels: { leave_duration: "Duration", total_leave: "Days" },
  // A half-day leave is a single date (counted as 0.5 day): End Date follows Start Date.
  compute: (values) => (isHalfDay(values) ? { leave2: values.leave1 || "" } : {}),
  fields: [
    { name: "empid", label: "Employee ID", employee: "id" },
    { name: "fname", label: "Employee Name", employee: "name" },
    { name: "report_manager_id", label: "Report Manager ID", employee: "manager" },
    { name: "leavet", label: "Leave Type", type: "select", options: LEAVE_TYPES, required: true },
    { name: "leave_duration", label: "Leave Duration", type: "select", options: LEAVE_DURATIONS, required: true },
    { name: "leave1", label: "Start Date", type: "date", required: true },
    { name: "leave2", label: "End Date", type: "date", required: true, readOnlyWhen: (values) => isHalfDay(values) && "Half-day leave is for one date - same as the Start Date" },
    { name: "reason", label: "Reason", type: "textarea" },
    { name: "response", label: "Response", type: "textarea", approverOnly: true }
  ]
};
