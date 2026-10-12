import { noticeDate } from "./NoticeItem.jsx";

export function NoticePopup({ notice, onClose }) {
  return (
    <div className="notice-popup visible">
      <div className="popup-content">
        <button className="close-btn" onClick={onClose}>x</button>
        <h5>{notice.heading}</h5>
        <p>{notice.descr}</p>
        <small>{noticeDate(notice).toLocaleString()}</small>
      </div>
    </div>
  );
}
