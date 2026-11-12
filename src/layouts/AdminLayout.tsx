import { useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Dropdown, Flex, Layout, Menu, Tag, type MenuProps } from 'antd';
import {
  AppstoreOutlined,
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
  const { data: stats } = useQuery({ queryKey: ['stats', 'overview'], queryFn: () => get<{ reports: { open: number } }>('/admin/stats/overview'), refetchInterval: 60_000 });
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

  return (
    <Layout style={{ minHeight: '100%' }}>
      <Layout.Sider breakpoint="lg" collapsible trigger={null} collapsed={collapsed} onCollapse={setCollapsed} width={232} style={{ overflowY: 'auto', height: '100vh', position: 'sticky', top: 0 }}>
        <Flex align="center" justify="center" style={{ height: 64 }}>
          <span className="brand" style={{ fontSize: collapsed ? 18 : 24 }}>
            {collapsed ? 'V' : 'VALOR'}
          </span>
        </Flex>
        <Menu theme="dark" mode="inline" style={{ paddingBottom: 16 }} selectedKeys={[selectedKey]} items={menuItems} onClick={({ key }) => navigate(key)} />
      </Layout.Sider>

      <Layout>
        <Layout.Header style={{ paddingInline: 24 }}>
          <Flex align="center" justify="space-between" style={{ height: '100%' }}>
            <Button type="text" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            <Dropdown menu={{ items: accountMenu }} trigger={['click']}>
              <Button type="text">
                <Flex align="center" gap={8}>
                  {admin?.name}
                  {admin && <Tag color="purple" style={{ margin: 0 }}>{roleLabels[admin.role]}</Tag>}
                  <DownOutlined style={{ fontSize: 10 }} />
                </Flex>
              </Button>
            </Dropdown>
          </Flex>
        </Layout.Header>

        <Layout.Content style={{ padding: 24 }}>
          <Outlet />
        </Layout.Content>
      </Layout>

      <ChangePasswordModal open={changingPassword} onClose={() => setChangingPassword(false)} />
    </Layout>
  );
}
