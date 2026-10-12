import { useState } from "react";
import { ResourcePage } from "../../components/resource/ResourcePage.jsx";
import { ROLES } from "../../constants/app.js";
import { attendanceConfig } from "./attendance.config.js";
import { AttendanceCalendar } from "./components/AttendanceCalendar.jsx";
import { RegularizationPanel } from "./regularization/RegularizationPanel.jsx";
import { RegularizeModal } from "./regularization/RegularizeModal.jsx";

// Attendance Details: month calendar, attendance regularization, then the records table.
//  - Employee: "Regularize Attendance" + their own requests.
//  - Manager: the same for themselves, plus their team's requests to approve / reject / correct.
//  - Admin: every employee's requests.
export function AttendancePage({ user }) {
  const [regularizing, setRegularizing] = useState(undefined); // undefined = closed, null = blank form, day = pre-filled
  const [refresh, setRefresh] = useState(0);
  const bump = () => setRefresh((value) => value + 1);
  const isAdmin = user.role === ROLES.ADMIN;
  const isManager = user.role === ROLES.MANAGER;

  const intro = (
    <>
      <AttendanceCalendar user={user} onRegularize={isAdmin ? null : (day) => setRegularizing(day || null)} refreshKey={refresh} />
      {(isManager || isAdmin) && <RegularizationPanel scope="team" title={isAdmin ? "Regularization Requests" : "Team Regularization Requests"} refreshKey={refresh} onChanged={bump} />}
      {!isAdmin && <RegularizationPanel scope="mine" title="My Regularization Requests" refreshKey={refresh} />}
      {regularizing !== undefined && <RegularizeModal day={regularizing} onClose={() => setRegularizing(undefined)} onSent={bump} />}
    </>
  );

  return <ResourcePage config={attendanceConfig} user={user} intro={intro} refreshKey={refresh} />;
}
