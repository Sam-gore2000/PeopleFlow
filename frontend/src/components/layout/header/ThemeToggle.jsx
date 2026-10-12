export function ThemeToggle({ onToggle }) {
  return (
    <li className="nav-item d-flex align-items-center">
      <button id="themeToggle" className="theme-toggle" title="Toggle theme" onClick={onToggle}><i className="bi bi-moon-stars" /></button>
    </li>
  );
}
