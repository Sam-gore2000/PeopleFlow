export const compensationConfig = {
  resource: "bankDetails",
  fields: [
    { name: "empid", label: "Employee ID", employee: "id" },
    { name: "employeeName", label: "Employee Name", employee: "name" },
    { name: "designation", label: "Designation", employee: "position" },
    { name: "department", label: "Department", employee: "department" },
    { name: "tsalary", label: "Total Salary (Monthly)", type: "number" },
    { name: "bsalary", label: "Basic Salary", type: "number" },
    { name: "houserent", label: "House Rent Allowance", type: "number" },
    { name: "attendanceb", label: "Attendance Bonus", type: "number" },
    { name: "conveyance", label: "Conveyance Allowance", type: "number" },
    { name: "medicalallowance", label: "Medical Allowance", type: "number" },
    { name: "specialallowance", label: "Special Allowance", type: "number" },
    { name: "ptax", label: "Professional Tax", type: "number" },
    { name: "accountNumber", label: "Account Number" },
    { name: "bankName", label: "Bank Name" },
    { name: "branchName", label: "Branch Name" },
    { name: "ifscCode", label: "IFSC Code" }
  ]
};
