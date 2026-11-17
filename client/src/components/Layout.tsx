import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon, type IconName } from './Icon';
import { OfflineBanner } from './OfflineBanner';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
}

// Each role only sees the screens it can actually use
const NAV: Record<Role, NavItem[]> = {
  customer: [
    { to: '/book', label: 'Book', icon: 'scissors' },
    { to: '/bookings', label: 'My bookings', icon: 'calendar' },
    { to: '/profile', label: 'Profile', icon: 'user' },
  ],
  owner: [
    { to: '/owner/today', label: 'Schedule', icon: 'calendar' },
    { to: '/owner/services', label: 'Services', icon: 'scissors' },
    { to: '/owner/barbers', label: 'Barbers', icon: 'users' },
    { to: '/profile', label: 'Profile', icon: 'user' },
  ],
};

export function Layout() {
  const { user } = useAuth();
  if (!user) return null;
  const items = NAV[user.role];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="topbar">
        <Link to="/" className="brand">
          <img src="/logo.svg" alt="" width={34} height={34} />
          <span className="brand-name">SnipSlot</span>
          {user.role === 'owner' && <span className="badge badge-owner">Owner</span>}
        </Link>

        <nav className="topnav" aria-label="Main">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <Icon name={item.icon} size={18} />
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

      <OfflineBanner />

      <main className="content" id="main">
        <Outlet />
      </main>

      {/* thumb friendly tab bar on phones, hidden on wider screens */}
      <nav className="tabbar" aria-label="Main">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <Icon name={item.icon} size={22} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
