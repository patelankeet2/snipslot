import { api } from './client';
import type { User } from '../types';

export const authApi = {
  loginWithGoogle: (credential: string) =>
    api.post<{ user: User }>('/auth/google', { credential }).then((r) => r.user),
  // null when nobody is signed in (no 401 noise on first load)
  session: () => api.get<{ user: User | null }>('/auth/session').then((r) => r.user),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.user),
  logout: () => api.post<void>('/auth/logout'),
};
