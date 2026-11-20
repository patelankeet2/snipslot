import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthContext, type AuthContextValue } from '../context/authContextValue';
import type { Role, User } from '../types';

const userWith = (role: Role): User => ({ id: '1', email: 'a@test.nz', name: 'Aroha', role });

// Render the owner page behind the guard, as a given user
function renderAt(path: string, value: Partial<AuthContextValue>) {
  const auth: AuthContextValue = {
    user: null,
    loading: false,
    signIn: async () => userWith('customer'),
    signOut: async () => undefined,
    ...value,
  };
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route element={<ProtectedRoute roles={['owner']} />}>
            <Route path="/owner/services" element={<p>Owner services</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('ProtectedRoute', () => {
  it('waits while the session is being checked', () => {
    renderAt('/owner/services', { loading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Checking your session');
  });

  it('sends signed out visitors to the login page', () => {
    renderAt('/owner/services', { user: null });
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });

  it('shows "No access" to a customer on an owner page', () => {
    renderAt('/owner/services', { user: userWith('customer') });
    expect(screen.getByRole('heading', { name: 'No access' })).toBeInTheDocument();
    expect(screen.queryByText('Owner services')).not.toBeInTheDocument();
  });

  it('lets the owner in', () => {
    renderAt('/owner/services', { user: userWith('owner') });
    expect(screen.getByText('Owner services')).toBeInTheDocument();
  });
});
