export type UserRole = 'ADMIN' | 'USER';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  steps: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewRow {
  email: string;
  recipeCount: number;
}

export interface AdminSetting {
  key: string;
  label: string;
  service: string;
  value: string;      // masked value for display
  configured: boolean;
}
