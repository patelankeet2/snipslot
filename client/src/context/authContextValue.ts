import { createContext } from 'react';
import type { User } from '../types';

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (credential: string) => Promise<User>;
  signOut: () => Promise<void>;
}

// kept apart from the provider component so React fast refresh works
export const AuthContext = createContext<AuthContextValue | null>(null);
