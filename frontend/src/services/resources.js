export const resourceForms = {
  admins: [
    ["username", "Username", "text"],
    ["password", "Password", "password"],
    ["email", "Email", "email"]
  ],
  employees: [
    ["fname", "Employee Name", "text"],
    ["empid", "Employee ID", "text"],
    ["email", "Email", "email"],
    ["phno", "Phone", "text"],
    ["username", "Username", "text"],
    ["pass", "Password", "password"],
    ["department", "Department", "text"],
    ["position", "Position", "text"],
    ["jdate", "Joining Date", "date"],
    ["bdate", "Birth Date", "date"],
    ["add", "Address", "textarea"],
    ["edu", "Education", "text"],
    ["skills", "Skills", "text"],
    ["report_manager", "Report Manager", "text"],
    ["report_manager_id", "Report Manager ID", "text"],
    ["offer_ctc", "Offer CTC", "text"],
    ["prev_company", "Previous Company", "text"],
    ["prev_exp", "Previous Experience", "text"],
    ["padd", "Permanent Address", "textarea"]
  ],
  leaves: [
    ["empid", "Employee ID", "text"],
    ["fname", "Employee Name", "text"],
    ["report_manager_id", "Report Manager ID", "text"],
    ["leavet", "Leave Type", "select", ["Sick Leave", "Casual Leave", "Paid Leave", "Emergency Leave"]],
    ["leave1", "Start Date", "date"],
    ["leave2", "End Date", "date"],
    ["reason", "Reason", "textarea"],
    ["response", "Response", "textarea"]
  ],
  attendance: [
    ["emp_id", "Employee ID", "text"],
    ["emp_name", "Employee Name", "text"],
    ["attendance_date", "Attendance Date", "date"],
    ["punch_in", "Punch In", "datetime-local"],
    ["punch_out", "Punch Out", "datetime-local"],
    ["status", "Status", "select", ["Present", "Half Day", "Absent"]]
  ],
  bankDetails: [
    ["empid", "Employee ID", "text"],
    ["employeeName", "Employee Name", "text"],
    ["designation", "Designation", "text"],
    ["department", "Department", "text"],
    ["tsalary", "Total Salary", "number"],
    ["bsalary", "Basic Salary", "number"],
    ["houserent", "House Rent", "number"],
    ["attendanceb", "Attendance Bonus", "number"],
    ["conveyance", "Conveyance", "number"],
    ["medicalallowance", "Medical Allowance", "number"],
    ["specialallowance", "Special Allowance", "number"],
    ["ptax", "Professional Tax", "number"],
    ["accountNumber", "Account Number", "text"],
    ["bankName", "Bank Name", "text"],
    ["branchName", "Branch Name", "text"],
    ["ifscCode", "IFSC Code", "text"]
  ],
  payslips: [
    ["empid", "Employee ID", "text"],
    ["employeeName", "Employee Name", "text"],
    ["month", "Month", "text"],
    ["year", "Year", "number"],
    ["tsalary", "Total Salary", "number"],
    ["bsalary", "Basic Salary", "number"],
    ["netSalary", "Net Salary", "number"],
    ["deductions", "Deductions", "number"],
    ["remarks", "Remarks", "textarea"]
  ],
  holidays: [
    ["hdname", "Holiday Name", "text"],
    ["hddate", "Holiday Date", "date"],
    ["descr", "Description", "textarea"]
  ],
  notices: [
    ["heading", "Heading", "text"],
    ["descr", "Description", "textarea"]
  ],
  queries: [
    ["emp_id", "Employee ID", "text"],
    ["emp_name", "Employee Name", "text"],
    ["date", "Date", "date"],
    ["subject", "Subject", "text"],
    ["message", "Message", "textarea"]
  ],
  projects: [
    ["project", "Project", "text"],
    ["description", "Description", "textarea"],
    ["date", "Start Date", "date"],
    ["duedate", "Due Date", "date"],
    ["budget", "Budget", "number"],
    ["projectclient", "Client", "text"],
    ["status", "Status", "select", ["Not Started", "In Progress", "Completed", "On Hold"]],
    ["app_type", "App Type", "text"]
  ],
  teams: [
    ["team_name", "Team Name", "text"],
    ["team_lead", "Team Lead", "text"],
    ["tmember_1", "Member 1", "text"],
    ["tmember_2", "Member 2", "text"],
    ["tmember_3", "Member 3", "text"],
    ["tmember_4", "Member 4", "text"],
    ["tmember_5", "Member 5", "text"],
    ["tmember_6", "Member 6", "text"],
    ["tmember_7", "Member 7", "text"],
    ["tmember_8", "Member 8", "text"],
    ["tmember_9", "Member 9", "text"],
    ["tmember_10", "Member 10", "text"]
  ],
  tasks: [
    ["emp_id", "Employee ID", "text"],
    ["emp_project", "Project", "text"],
    ["emp_team", "Team", "text"],
    ["task", "Task", "textarea"],
    ["start_date", "Start Date", "date"],
    ["due_date", "Due Date", "date"],
    ["status", "Status", "select", ["Pending", "In Progress", "Completed"]],
    ["priority", "Priority", "select", ["Low", "Medium", "High"]]
  ],
  meetings: [
    ["organiser", "Organiser", "text"],
    ["team", "Team", "text"],
    ["emp", "Employee", "text"],
    ["date", "Date", "date"],
    ["time", "Time", "time"],
    ["link", "Link", "url"],
    ["message", "Message", "textarea"]
  ],
  dprs: [
    ["empid", "Employee ID", "text"],
    ["workmode", "Work Mode", "select", ["Office", "Remote", "Hybrid"]],
    ["pname", "Project Name", "text"],
    ["wout", "Work Output", "textarea"],
    ["status", "Status", "select", ["Pending", "In Progress", "Completed"]]
  ],
  timesheets: [
    ["team", "Team", "text"],
    ["project", "Project", "text"],
    ["task", "Task", "text"],
    ["date", "Start Date", "date"],
    ["enddate", "End Date", "date"],
    ["note", "Note", "textarea"]
  ],
  attendanceRequests: [
    ["empid", "Employee ID", "text"],
    ["name", "Employee Name", "text"],
    ["report_manager_id", "Report Manager ID", "text"],
    ["date", "Date", "date"],
    ["punch_in", "Punch In", "time"],
    ["punch_out", "Punch Out", "time"],
    ["reason", "Reason", "textarea"]
  ]
};

export const sidebarItems = {
  admin: [
    ["dashboard", "Dashboard", "bi-grid"],
    ["employees", "Employee Details", "bi-people"],
    ["leaves", "Leave Details", "bi-calendar4-week"],
    ["attendance", "Attendance Details", "bi-calendar-plus"],
    ["breaks", "Break Report", "bi-cup-hot"],
    ["queries", "Query", "bi-question-circle"],
    ["bankDetails", "Compensation Details", "bi-file-earmark-person"],
    ["payslips", "Payslip Generate", "bi-file-arrow-down"],
    ["handbook", "Employee Handbook", "bi-file-earmark-text"],
    ["holidays", "Holidays", "bi-calendar-check"],
    ["notices", "HR Notice", "bi-bell"],
    ["admins", "Admin Access", "bi-lock"],
    // ["projects", "Project Details", "bi-kanban"],
    // ["teams", "Department", "bi-diagram-3"],
    // ["tasks", "Task Details", "bi-list-task"],
    // ["meetings", "Team Meeting", "bi-camera-video"],
    // ["dprs", "Daily Report", "bi-journal-text"],
    // ["timesheets", "Timesheet", "bi-clock-history"],
    ["userLogs", "Login Details", "bi-stopwatch"]
  ],
  manager: [
    ["dashboard", "Dashboard", "bi-grid"],
    ["profile", "My Profile", "bi-person"],
    ["leaves", "Team Leave Details", "bi-calendar3"],
    ["attendance", "Team Attendance Details", "bi-record-circle"],
    ["bankDetails", "Bank Details", "bi-bank"],
    ["holidays", "Holidays", "bi-calendar-check"],
    ["queries", "Query", "bi-question-circle"],
    ["payslips", "Payslip", "bi-file-arrow-down"],
    // ["tasks", "Task Details", "bi-list-task"],
    // ["projects", "Projects", "bi-kanban"],
    // ["teams", "Team", "bi-diagram-3"],
    // ["meetings", "Meetings", "bi-camera-video"],
    // ["dprs", "Daily Report", "bi-journal-text"],
    ["handbook", "Employee Handbook", "bi-file-earmark-text"]
  ],
  employee: [
    ["dashboard", "Dashboard", "bi-grid"],
    ["profile", "My Profile", "bi-person"],
    ["leaves", "Leave Details", "bi-calendar4-week"],
    ["attendance", "Attendance Details", "bi-calendar-plus"],
    ["bankDetails", "Bank Details", "bi-bank"],
    ["holidays", "Holidays", "bi-calendar-check"],
    ["queries", "Query", "bi-question-circle"],
    ["payslips", "Payslip", "bi-file-arrow-down"],
    // ["tasks", "Task Details", "bi-list-task"],
    // ["projects", "Projects", "bi-kanban"],
    // ["teams", "Team", "bi-diagram-3"],
    // ["meetings", "Meetings", "bi-camera-video"],
    // ["dprs", "Daily Report", "bi-journal-text"],
    ["handbook", "Employee Handbook", "bi-file-earmark-text"]
  ]
};
