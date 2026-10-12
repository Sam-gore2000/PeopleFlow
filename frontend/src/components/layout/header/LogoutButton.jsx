export function LogoutButton({ onLogout }) {
  return (
    <li className="nav-item dropdown">
      <button className="nav-link nav-profile d-flex align-items-center pe-0" onClick={onLogout}>
        <i className="bi bi-power" /><span className="d-none d-md-block ps-1">LOGOUT</span>
      </button>
    </li>
  );
}
