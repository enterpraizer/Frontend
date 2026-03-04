export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  tenant_id: string | null;
  first_name?: string;
  last_name?: string;
}
