import { useState, type ReactNode } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Dropdown, Flex, Layout, Menu, type MenuProps } from 'antd';
import {
  AppstoreOutlined,
  BellOutlined,
  BgColorsOutlined,
  BorderOutlined,
  CommentOutlined,
  GiftOutlined,
  HistoryOutlined,
  HourglassOutlined,
  NotificationOutlined,
  RetweetOutlined,
  SmileOutlined,
  CrownOutlined,
  DashboardOutlined,
  DownOutlined,
  FlagOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { clearToken } from '../lib/auth-storage';
import { get } from '../lib/api';
import { roleLabels, type AdminRole } from '../lib/types';
import { useCurrentAdmin } from '../features/auth/api';
import { ChangePasswordModal } from '../features/auth/ChangePasswordModal';
import { ThemeSwitch } from '../components/ThemeSwitch';

type NavItem = { key: string; icon: ReactNode; label: string; roles?: AdminRole[] };
type NavGroup = { label: string; items: NavItem[] };

const navigation: NavGroup[] = [
  {
    label: 'Community',
    items: [
      { key: '/', icon: <DashboardOutlined />, label: 'Overview' },
      { key: '/players', icon: <TeamOutlined />, label: 'Players' },
      { key: '/clips', icon: <VideoCameraOutlined />, label: 'Clips' },
      { key: '/comments', icon: <CommentOutlined />, label: 'Comments' },
      { key: '/battles', icon: <ThunderboltOutlined />, label: 'Battles' },
      { key: '/entries', icon: <HourglassOutlined />, label: 'Battle entries' },
      { key: '/rematches', icon: <RetweetOutlined />, label: 'Rematches' },
      { key: '/reports', icon: <FlagOutlined />, label: 'Reports' },
    ],
  },
  {
    label: 'Economy',
    items: [
      { key: '/purchases', icon: <ShoppingCartOutlined />, label: 'Purchases' },
      { key: '/store/packs', icon: <ShopOutlined />, label: 'Credit packs' },
      { key: '/store/gifts', icon: <GiftOutlined />, label: 'Gifts' },
    ],
  },
  {
    label: 'Customization',
    items: [
      { key: '/customization/frames', icon: <BorderOutlined />, label: 'Frames' },
      { key: '/customization/themes', icon: <BgColorsOutlined />, label: 'Themes' },
      { key: '/customization/avatars', icon: <SmileOutlined />, label: 'Avatars' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { key: '/games', icon: <AppstoreOutlined />, label: 'Games' },
      { key: '/badges', icon: <CrownOutlined />, label: 'Badges' },
      { key: '/announcements', icon: <NotificationOutlined />, label: 'Announcements' },
      { key: '/settings', icon: <SettingOutlined />, label: 'App settings' },
      { key: '/admins', icon: <SafetyOutlined />, label: 'Admins', roles: ['SUPER_ADMIN'] },
      { key: '/audit', icon: <HistoryOutlined />, label: 'Activity log' },
    ],
  },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { data: admin } = useCurrentAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const visibleGroups = navigation.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || (admin && item.roles.includes(admin.role))),
  }));
  const allItems = visibleGroups.flatMap((group) => group.items);
  const selectedKey =
    allItems
      .filter((item) => item.key !== '/' && (pathname === item.key || pathname.startsWith(`${item.key}/`)))
      .sort((a, b) => b.key.length - a.key.length)[0]?.key ?? '/';
  const { data: stats } = useQuery({ queryKey: ['stats', 'overview'], queryFn: () => get<{ reports: { open: number }; battles: { active: number } }>('/admin/stats/overview'), refetchInterval: 60_000 });
  const openReports = stats?.reports.open ?? 0;

  const menuItems: MenuProps['items'] = visibleGroups.map((group) => ({
    type: 'group',
    label: collapsed ? null : group.label,
    children: group.items.map(({ key, icon, label }) => ({
      key,
      icon,
      label: key === '/reports' && openReports > 0 ? <Flex justify="space-between" align="center">{label}<Badge count={openReports} size="small" /></Flex> : label,
    })),
  }));

  function logout() {
    clearToken();
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  const accountMenu: MenuProps['items'] = [
    { key: 'password', icon: <KeyOutlined />, label: 'Change password', onClick: () => setChangingPassword(true) },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Log out', danger: true, onClick: logout },
  ];

  const current = allItems.find((item) => item.key === selectedKey);
  const currentGroup = visibleGroups.find((group) => group.items.some((item) => item.key === selectedKey));
  const initials = (admin?.name ?? 'A').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Layout.Sider className="v-sider" breakpoint="lg" collapsible trigger={null} collapsed={collapsed} onCollapse={setCollapsed} width={248} collapsedWidth={72} style={{ height: '100vh', position: 'sticky', top: 0 }}>
        <Link to="/" className="v-brand" aria-label="VALOR overview">
          {collapsed ? <img src="/brand/valor-emblem.png" alt="VALOR" width={44} height={44} /> : <img src="/brand/valor-logo.png" alt="VALOR" style={{ height: 40, width: 'auto' }} />}
        </Link>
        <nav className="v-nav">
          <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} onClick={({ key }) => navigate(key)} />
        </nav>
        {!collapsed && (
          <div className="v-sider-foot">
            <div className="v-eyebrow" style={{ fontSize: 10 }}>Admin console</div>
            <div style={{ marginTop: 4 }}>Blind 1v1 battles · v1</div>
          </div>
        )}
      </Layout.Sider>

      <Layout>
        <Layout.Header className="v-header">
          <Flex align="center" justify="space-between" gap={16} style={{ height: '100%' }}>
            <Flex align="center" gap={14} style={{ minWidth: 0 }}>
              <button type="button" className="v-icon-btn" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
              <div className="v-header-title" style={{ lineHeight: 1.25, minWidth: 0 }}>
                <div className="v-eyebrow" style={{ fontSize: 10 }}>{currentGroup?.label ?? 'Community'}</div>
                <div style={{ fontFamily: 'var(--v-display)', fontWeight: 600, fontSize: 15, color: 'var(--v-heading)' }}>{current?.label ?? 'Overview'}</div>
              </div>
            </Flex>
            <Flex align="center" gap={10}>
              {stats && (
                <Link to="/battles?status=ACTIVE" className="v-live" title="Battles open for voting right now">
                  <i />
                  {stats.battles.active} live {stats.battles.active === 1 ? 'battle' : 'battles'}
                </Link>
              )}
              <ThemeSwitch />
              <Link to="/reports" className="v-icon-btn" aria-label={`Open reports: ${openReports}`} title="Open reports">
                <Badge count={openReports} size="small" offset={[4, -4]}>
                  <BellOutlined style={{ fontSize: 16, color: 'inherit' }} />
                </Badge>
              </Link>
              <Dropdown menu={{ items: accountMenu }} trigger={['click']} placement="bottomRight">
                <div className="v-account" role="button" tabIndex={0}>
                  <div className="v-avatar-ring"><div>{initials}</div></div>
                  <div style={{ lineHeight: 1.2 }} className="v-account-text">
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--v-heading)' }}>{admin?.name}</div>
                    {admin && <div style={{ fontSize: 11, color: 'var(--v-violet)' }}>{roleLabels[admin.role]}</div>}
                  </div>
                  <DownOutlined style={{ fontSize: 10, color: 'var(--v-muted)' }} />
                </div>
              </Dropdown>
            </Flex>
          </Flex>
        </Layout.Header>

        <Layout.Content className="v-content">
          <Outlet />
        </Layout.Content>
      </Layout>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </Layout>
  );
}
