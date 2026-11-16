import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

// Each role only sees the screens it can actually use
const NAV: Record<Role, NavItem[]> = {
  customer: [
    { to: '/book', label: 'Book', icon: '✂' },
    { to: '/bookings', label: 'My bookings', icon: '▤' },
    { to: '/profile', label: 'Profile', icon: '●' },
  ],
  owner: [
    { to: '/owner/today', label: 'Schedule', icon: '▤' },
    { to: '/owner/services', label: 'Services', icon: '✂' },
    { to: '/owner/barbers', label: 'Barbers', icon: '☺' },
    { to: '/profile', label: 'Profile', icon: '●' },
  ],
};

export function Layout() {
  const { user } = useAuth();
  if (!user) return null;
  const items = NAV[user.role];

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="" width={32} height={32} />
          <span>SnipSlot</span>
          {user.role === 'owner' && <span className="badge badge-owner">Owner</span>}
        </Link>

        <nav className="topnav" aria-label="Main">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/profile" className="avatar-link" aria-label="Your profile">
          {user.picture ? (
            <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span className="avatar avatar-fallback">{user.name.charAt(0)}</span>
          )}
        </Link>
      </header>

      <main className="content">
        <Outlet />
      </main>

      {/* thumb friendly tab bar on phones, hidden on wider screens */}
      <nav className="tabbar" aria-label="Main">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <span className="tab-icon" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
