export const attendanceConfig = {
  resource: "attendance",
  fields: [
    { name: "emp_id", label: "Employee ID", employee: "id" },
    { name: "emp_name", label: "Employee Name", employee: "name" },
    { name: "attendance_date", label: "Attendance Date", type: "date" },
    { name: "punch_in", label: "Punch In", type: "datetime-local" },
    { name: "punch_out", label: "Punch Out", type: "datetime-local" },
    { name: "status", label: "Status", type: "select", options: ["Present", "Half Day", "Absent"] }
  ]
};

export const attendanceRequestsConfig = {
  resource: "attendanceRequests",
  selfService: true,
  approvable: true,
  fields: [
    { name: "empid", label: "Employee ID", employee: "id" },
    { name: "name", label: "Employee Name", employee: "name" },
    { name: "report_manager_id", label: "Report Manager ID", employee: "manager" },
    { name: "date", label: "Date", type: "date" },
    { name: "punch_in", label: "Punch In", type: "time" },
    { name: "punch_out", label: "Punch Out", type: "time" },
    { name: "reason", label: "Reason", type: "textarea" }
  ]
};
