export function Alert({ type = "success", className = "", children }) {
  if (!children) return null;
  return <div className={`alert alert-${type} ${className}`.trim()}>{children}</div>;
}
