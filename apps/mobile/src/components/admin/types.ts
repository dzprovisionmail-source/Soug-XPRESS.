/**
 * Shared types for the Admin Control Center.
 * Imported by admin.tsx and every admin sub-component.
 */

export type AdminSection =
  | 'dashboard'
  | 'stores'
  | 'drivers'
  | 'users'
  | 'orders'
  | 'settings';

export interface Store {
  id: string;
  name: string;
  category: string;
  zone: string;
  is_approved: boolean | null;
}

export interface Driver {
  id: string;
  name: string;
  delivery_counter: number;
  total_owed_to_site: number;
  is_suspended: boolean;
}
