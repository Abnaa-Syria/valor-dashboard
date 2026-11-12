import { createBrowserRouter, Navigate } from 'react-router';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RequireAuth } from './features/auth/RequireAuth';
import { OverviewPage } from './features/overview/OverviewPage';
import { PlayersListPage } from './features/users/PlayersListPage';
import { PlayerDetailPage } from './features/users/PlayerDetailPage';
import { PlayerFormPage } from './features/users/PlayerFormPage';
import { ClipDetailPage, ClipEditPage, ClipsListPage, CommentsListPage } from './features/clips/pages';
import { BattleDetailPage, BattlesListPage, EntriesListPage, RematchesListPage } from './features/battles/pages';
import { ReportDetailPage, ReportsListPage } from './features/reports/pages';
import { PurchaseDetailPage, PurchasesListPage } from './features/store/purchases';
import { GiftFormPage, GiftsListPage, PackFormPage, PacksListPage } from './features/store/catalog';
import { AvatarFormPage, AvatarsListPage, FrameFormPage, FramesListPage, ThemeFormPage, ThemesListPage } from './features/store/customization';
import { GameDetailPage, GameFormPage, GamesListPage } from './features/games/pages';
import { BadgeDetailPage, BadgeFormPage, BadgesListPage } from './features/badges/pages';
import { AnnouncementNewPage, AnnouncementsListPage } from './features/announcements/pages';
import { SettingsPage } from './features/settings/SettingsPage';
import { AdminDetailPage, AdminFormPage, AdminsListPage, AuditLogPage } from './features/admins/pages';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <OverviewPage /> },

          { path: 'players', element: <PlayersListPage /> },
          { path: 'players/new', element: <PlayerFormPage /> },
          { path: 'players/:id', element: <PlayerDetailPage /> },
          { path: 'players/:id/edit', element: <PlayerFormPage /> },

          { path: 'clips', element: <ClipsListPage /> },
          { path: 'clips/:id', element: <ClipDetailPage /> },
          { path: 'clips/:id/edit', element: <ClipEditPage /> },
          { path: 'comments', element: <CommentsListPage /> },

          { path: 'battles', element: <BattlesListPage /> },
          { path: 'battles/:id', element: <BattleDetailPage /> },
          { path: 'entries', element: <EntriesListPage /> },
          { path: 'rematches', element: <RematchesListPage /> },

          { path: 'reports', element: <ReportsListPage /> },
          { path: 'reports/:id', element: <ReportDetailPage /> },

          { path: 'purchases', element: <PurchasesListPage /> },
          { path: 'purchases/:id', element: <PurchaseDetailPage /> },
          { path: 'store/packs', element: <PacksListPage /> },
          { path: 'store/packs/new', element: <PackFormPage /> },
          { path: 'store/packs/:id', element: <PackFormPage /> },
          { path: 'store/gifts', element: <GiftsListPage /> },
          { path: 'store/gifts/new', element: <GiftFormPage /> },
          { path: 'store/gifts/:id', element: <GiftFormPage /> },

          { path: 'customization/frames', element: <FramesListPage /> },
          { path: 'customization/frames/new', element: <FrameFormPage /> },
          { path: 'customization/frames/:id', element: <FrameFormPage /> },
          { path: 'customization/themes', element: <ThemesListPage /> },
          { path: 'customization/themes/new', element: <ThemeFormPage /> },
          { path: 'customization/themes/:id', element: <ThemeFormPage /> },
          { path: 'customization/avatars', element: <AvatarsListPage /> },
          { path: 'customization/avatars/new', element: <AvatarFormPage /> },
          { path: 'customization/avatars/:id', element: <AvatarFormPage /> },

          { path: 'games', element: <GamesListPage /> },
          { path: 'games/new', element: <GameFormPage /> },
          { path: 'games/:id', element: <GameDetailPage /> },
          { path: 'games/:id/edit', element: <GameFormPage /> },

          { path: 'badges', element: <BadgesListPage /> },
          { path: 'badges/new', element: <BadgeFormPage /> },
          { path: 'badges/:id', element: <BadgeDetailPage /> },
          { path: 'badges/:id/edit', element: <BadgeFormPage /> },

          { path: 'announcements', element: <AnnouncementsListPage /> },
          { path: 'announcements/new', element: <AnnouncementNewPage /> },

          { path: 'settings', element: <SettingsPage /> },

          { path: 'admins', element: <AdminsListPage /> },
          { path: 'admins/new', element: <AdminFormPage /> },
          { path: 'admins/:id', element: <AdminDetailPage /> },
          { path: 'admins/:id/edit', element: <AdminFormPage /> },
          { path: 'audit', element: <AuditLogPage /> },

          { path: 'users/*', element: <Navigate to="/players" replace /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
