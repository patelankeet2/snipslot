export type Role = 'customer' | 'owner';

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: Role;
}
