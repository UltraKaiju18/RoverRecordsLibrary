import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: '🎤', title: 'Listen', end: true },
  { to: '/browse', label: '💿', title: 'Browse', end: false },
  { to: '/settings', label: '⚙️', title: 'Settings', end: false },
];

export default function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-logo">🎵 Rover Records</div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            id={`nav-${item.title.toLowerCase()}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.label}</span>
            <span className="nav-label">{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
