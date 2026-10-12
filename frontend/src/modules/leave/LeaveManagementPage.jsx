import { useState } from "react";
import { EmployeePicker } from "../../components/forms/EmployeePicker.jsx";
import { ResourcePage } from "../../components/resource/ResourcePage.jsx";
import { ROLES } from "../../constants/app.js";
import { LeaveBalanceCard } from "./LeaveBalanceCard.jsx";
import { OpeningBalanceForm } from "./OpeningBalanceForm.jsx";
import { leaveConfig } from "./leave.config.js";

// Admin: pick an employee to see and adjust their paid leave balance; set opening balances.
function AdminLeaveBalance() {
  const [empId, setEmpId] = useState("");
  const [refresh, setRefresh] = useState(0);
  return (
    <>
    <OpeningBalanceForm onSaved={(savedId) => { if (savedId === empId) setRefresh((value) => value + 1); }} />
    <div className="card lb-admin">
      <div className="card-body">
        <div className="lb-admin-top">
          <div>
            <h5 className="cal-title">Leave Balance</h5>
            <p className="lb-note">Choose an employee to see or adjust their paid leave balance.</p>
          </div>
          <EmployeePicker onPick={(employee) => setEmpId(employee.empid)} id="leave-balance-employee-options" />
        </div>
        {empId && <LeaveBalanceCard empId={empId} editable refreshKey={refresh} />}
      </div>
    </div>
    </>
  );
}

// Leave Details. Employees and managers see their own balance; admins can look up and adjust anyone's.
export function LeaveManagementPage({ user }) {
  const intro = user.role === ROLES.ADMIN ? <AdminLeaveBalance /> : <LeaveBalanceCard />;
  return <ResourcePage config={leaveConfig} user={user} intro={intro} />;
}
