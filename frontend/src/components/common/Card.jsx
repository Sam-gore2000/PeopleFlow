export function Card({ title, children }) {
  return (
    <div className="card">
      <div className="card-body">
        {title && <h5 className="card-title">{title}</h5>}
        {children}
      </div>
    </div>
  );
}
