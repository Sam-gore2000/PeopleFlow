import { useState } from "react";
import { NOTICE_PREVIEW_COUNT } from "../dashboard.data.js";
import { NoticeItem } from "./NoticeItem.jsx";
import { NoticePopup } from "./NoticePopup.jsx";

export function NoticeBoard({ notices }) {
  const [expanded, setExpanded] = useState(false);
  const [open, setOpen] = useState(null);
  const visible = expanded ? notices : notices.slice(0, NOTICE_PREVIEW_COUNT);

  return (
    <div className="card notice-board">
      <div className="card-body notice-board-body">
        <div className="notice-board-header">
          <div>
            <h5 className="card-title mb-1 notice-board-title">Notice Board</h5>
            <p className="notice-subtitle">Latest HR updates</p>
          </div>
          <div className="notice-bell"><i className="bi bi-bell" /><span className="notice-dot" /></div>
        </div>
        <div className="notice-list">
          {visible.length === 0 && <p className="text-muted">No notices available</p>}
          {visible.map((notice) => <NoticeItem key={notice._id || notice.id} notice={notice} onOpen={setOpen} />)}
        </div>
        {notices.length > NOTICE_PREVIEW_COUNT && !expanded && (
          <div className="notice-footer"><button onClick={() => setExpanded(true)}>View All Notices <i className="bi bi-arrow-right" /></button></div>
        )}
      </div>
      {open && <NoticePopup notice={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
