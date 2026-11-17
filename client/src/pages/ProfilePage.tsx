import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { InstallCard } from '../components/InstallCard';
import { useAuth } from '../hooks/useAuth';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <section className="page narrow">
      <PageHeader title="Profile" subtitle="Your account and app settings." />

      <div className="card profile-card">
        {user.picture ? (
          <img
            className="avatar avatar-lg"
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="avatar avatar-lg avatar-fallback">{user.name.charAt(0)}</span>
        )}
        <div className="profile-details">
          <h2>{user.name}</h2>
          <p className="muted">{user.email}</p>
          <span className={`badge ${user.role === 'owner' ? 'badge-owner' : 'badge-customer'}`}>
            {user.role === 'owner' ? 'Shop owner' : 'Customer'}
          </span>
        </div>
      </div>

      <InstallCard />

      <button
        type="button"
        className="btn btn-ghost btn-block"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        <Icon name="logout" size={18} />
        {signingOut ? 'Signing out...' : 'Sign out'}
      </button>
    </section>
  );
}
