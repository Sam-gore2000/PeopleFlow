export function noticeDate(notice) {
  return new Date(notice.created_at || Date.now());
}

export function NoticeItem({ notice, onOpen }) {
  return (
    <button className="notice-item notice-success" onClick={() => onOpen(notice)}>
      <div className="notice-icon"><i className="bi bi-exclamation-circle" /></div>
      <div className="notice-content">
        <h6>{notice.heading}</h6>
        <p>{notice.descr}</p>
        <span>{noticeDate(notice).toLocaleDateString()}</span>
      </div>
    </button>
  );
}
