import { createBrowserRouter, Navigate } from 'react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { OverviewPage } from './features/overview/OverviewPage';
import { UsersPage } from './features/users/UsersPage';
import { ClipsPage } from './features/clips/ClipsPage';
import { BattlesPage } from './features/battles/BattlesPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { PurchasesPage } from './features/store/PurchasesPage';
import { StorePage } from './features/store/StorePage';
import { GamesPage } from './features/games/GamesPage';
import { BadgesPage } from './features/badges/BadgesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AdminsPage } from './features/admins/AdminsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'users', element: <UsersPage /> },
          { path: 'clips', element: <ClipsPage /> },
          { path: 'battles', element: <BattlesPage /> },
          { path: 'reports', element: <ReportsPage /> },
          { path: 'purchases', element: <PurchasesPage /> },
          { path: 'store', element: <StorePage /> },
          { path: 'games', element: <GamesPage /> },
          { path: 'badges', element: <BadgesPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'admins', element: <AdminsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
