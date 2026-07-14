import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { FlowRoute } from './flow-meta';

// `data.flow` is the single source of truth for the user-flow graph AND the runtime navbar.
// Every navigable UI state is reachable by URL (deep-linkable). Delete confirmation on the
// recipe list is expressed as `?modal=delete&id=` read on init.
export const routes: Routes = ([
  { path: '', redirectTo: 'recipes', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
    data: { flow: { flowId: 'login', node: 'login', entry: true, edgesTo: ['recipes', 'signup'], label: 'Login' } },
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/signup/signup.component').then((m) => m.SignupComponent),
    data: { flow: { flowId: 'signup', node: 'signup', edgesTo: ['recipes', 'login'], label: 'Sign up' } },
  },
  {
    path: 'recipes',
    loadComponent: () =>
      import('./features/recipe-list/recipe-list.component').then((m) => m.RecipeListComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipes', node: 'recipes', showInNavbar: true, label: 'Recipes', scope: 'all', edgesTo: ['recipe-new', 'recipe-edit'] } },
  },
  {
    path: 'recipes/new',
    loadComponent: () =>
      import('./features/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipe-new', node: 'recipe-new', showInNavbar: true, label: 'Add Recipe', scope: 'all', edgesTo: ['recipes'] } },
  },
  {
    path: 'recipes/:id/edit',
    loadComponent: () =>
      import('./features/recipe-form/recipe-form.component').then((m) => m.RecipeFormComponent),
    canActivate: [authGuard],
    data: { flow: { flowId: 'recipe-edit', node: 'recipe-edit', label: 'Edit Recipe', edgesTo: ['recipes'] } },
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin-overview/admin-overview.component').then((m) => m.AdminOverviewComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'admin', node: 'admin', showInNavbar: true, label: 'Admin', scope: 'admin', edgesTo: ['admin-settings'] } },
  },
  {
    path: 'admin/settings',
    loadComponent: () =>
      import('./features/admin-settings/admin-settings.component').then((m) => m.AdminSettingsComponent),
    canActivate: [adminGuard],
    data: { flow: { flowId: 'admin-settings', node: 'admin-settings', showInNavbar: true, label: 'Settings', scope: 'admin', edgesTo: ['admin'] } },
  },
  { path: '**', redirectTo: 'recipes' },
] satisfies FlowRoute[]) as Routes;
