import { useState, type ReactNode } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Dropdown, Flex, Layout, Menu, Tag, type MenuProps } from 'antd';
import {
  AppstoreOutlined,
  CrownOutlined,
  DashboardOutlined,
  DownOutlined,
  FlagOutlined,
  KeyOutlined,
  LogoutOutlined,
  SafetyOutlined,
  SettingOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { clearToken } from '../lib/auth-storage';
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
      { key: '/users', icon: <TeamOutlined />, label: 'Players' },
      { key: '/clips', icon: <VideoCameraOutlined />, label: 'Clips' },
      { key: '/battles', icon: <ThunderboltOutlined />, label: 'Battles' },
      { key: '/reports', icon: <FlagOutlined />, label: 'Reports' },
    ],
  },
  {
    label: 'Economy',
    items: [
      { key: '/purchases', icon: <ShoppingCartOutlined />, label: 'Purchases' },
      { key: '/store', icon: <ShopOutlined />, label: 'Store & prices' },
    ],
  },
  {
    label: 'Setup',
    items: [
      { key: '/games', icon: <AppstoreOutlined />, label: 'Games' },
      { key: '/badges', icon: <CrownOutlined />, label: 'Badges' },
      { key: '/settings', icon: <SettingOutlined />, label: 'App settings' },
      { key: '/admins', icon: <SafetyOutlined />, label: 'Admins', roles: ['SUPER_ADMIN'] },
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
  const selectedKey = allItems.find((item) => item.key !== '/' && pathname.startsWith(item.key))?.key ?? '/';

  const menuItems: MenuProps['items'] = visibleGroups.map((group) => ({
    type: 'group',
    label: collapsed ? null : group.label,
    children: group.items.map(({ key, icon, label }) => ({ key, icon, label })),
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
      <Layout.Sider breakpoint="lg" collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220}>
        <Flex align="center" justify="center" style={{ height: 64 }}>
          <span className="brand" style={{ fontSize: collapsed ? 18 : 24 }}>
            {collapsed ? 'V' : 'VALOR'}
          </span>
        </Flex>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} onClick={({ key }) => navigate(key)} />
      </Layout.Sider>

      <Layout>
        <Layout.Header style={{ paddingInline: 24 }}>
          <Flex align="center" justify="flex-end" style={{ height: '100%' }}>
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
