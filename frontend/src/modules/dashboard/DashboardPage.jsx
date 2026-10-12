import { useEffect, useState } from "react";
import { AttendanceCard } from "../attendance/index.js";
import { NoticeBoard } from "./components/NoticeBoard.jsx";
import { PoliciesCard } from "./components/PoliciesCard.jsx";
import { StatsRow } from "./components/StatsRow.jsx";
import { WeeklyCard } from "./components/WeeklyCard.jsx";
import { dashboardApi } from "./dashboardApi.js";

export function DashboardPage({ user, navigate, canOpen }) {
  const [data, setData] = useState({ stats: [], notices: [] });
  useEffect(() => { dashboardApi.summary().then(setData).catch(() => {}); }, []);

  return (
    <section className="section dashboard">
      <StatsRow stats={data.stats} navigate={navigate} canOpen={canOpen} />
      <div className="row">
        <div className="col-lg-8">
          <div className="row">
            <div className="col-12" id="zeropad-col"><AttendanceCard user={user} /></div>
            <div className="col-12 mt-4" id="zeropad-col"><WeeklyCard /></div>
          </div>
        </div>
        <div className="col-lg-4"><NoticeBoard notices={data.notices || []} /></div>
      </div>
      <div className="row mt-4"><div className="col-12"><PoliciesCard /></div></div>
    </section>
  );
}
