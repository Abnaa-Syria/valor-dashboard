import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Flex, Form, Input, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { get, patch, post } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { roleLabels, type AdminRole } from '../../lib/types';
import { EditModal } from '../../components/EditModal';
import { useCurrentAdmin } from '../auth/api';

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

type AdminForm = { name: string; email: string; role: AdminRole; isActive: boolean; password?: string };

const adminsKey = ['admins'] as const;
const roleOptions = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));
const roleHelp: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Everything, including admins and app settings',
  ADMIN: 'Players, credits, store, games, battles, moderation',
  MODERATOR: 'Moderation only: clips, reports, viewing players and battles',
};

export function AdminsPage() {
  const queryClient = useQueryClient();
  const { data: me } = useCurrentAdmin();
  const { data, isFetching } = useQuery({ queryKey: adminsKey, queryFn: () => get<AdminRow[]>('/admin/admins') });
  const [editing, setEditing] = useState<AdminRow | 'new' | null>(null);

  if (me && me.role !== 'SUPER_ADMIN') {
    return <Alert type="warning" showIcon message="Only a super admin can manage admin accounts." />;
  }

  const columns: TableProps<AdminRow>['columns'] = [
    { title: 'Name', key: 'name', render: (_, a) => <Flex vertical><Typography.Text strong>{a.name}{a.id === me?.id && ' (you)'}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{a.email}</Typography.Text></Flex> },
    { title: 'Role', dataIndex: 'role', render: (role: AdminRole) => <Tag color={role === 'SUPER_ADMIN' ? 'purple' : role === 'ADMIN' ? 'blue' : 'default'}>{roleLabels[role]}</Tag> },
    { title: 'Status', dataIndex: 'isActive', render: (active: boolean) => (active ? <Tag color="green">Active</Tag> : <Tag color="red">Disabled</Tag>) },
    { title: 'Last login', dataIndex: 'lastLoginAt', render: formatDateTime },
    { key: 'edit', render: (_, a) => <Button size="small" onClick={() => setEditing(a)}>Edit</Button> },
  ];

  const isNew = editing === 'new';

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Admins
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>
          Add admin
        </Button>
      </Flex>
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} />

      <EditModal<AdminForm>
        open={editing !== null}
        title={isNew ? 'Add admin' : 'Edit admin'}
        initialValues={isNew ? { role: 'MODERATOR', isActive: true } : editing ? { name: editing.name, email: editing.email, role: editing.role, isActive: editing.isActive } : {}}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: adminsKey })}
        onSave={(values) => {
          if (isNew) return post('/admin/admins', { name: values.name, email: values.email, role: values.role, password: values.password });
          const { email: _email, password, ...rest } = values;
          return patch(`/admin/admins/${(editing as AdminRow).id}`, { ...rest, ...(password && { password }) });
        }}
      >
        {() => (
          <>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input disabled={!isNew} /></Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]} extra={<Form.Item noStyle shouldUpdate>{({ getFieldValue }) => roleHelp[getFieldValue('role') as AdminRole]}</Form.Item>}>
              <Select options={roleOptions} />
            </Form.Item>
            <Form.Item
              name="password"
              label={isNew ? 'Password' : 'New password (optional)'}
              extra="At least 10 characters. Share it privately; they can change it after logging in."
              rules={[{ required: isNew, min: 10, message: 'At least 10 characters' }]}
            >
              <Input.Password autoComplete="new-password" />
            </Form.Item>
            {!isNew && <Form.Item name="isActive" label="Can log in" valuePropName="checked"><Switch /></Form.Item>}
          </>
        )}
      </EditModal>
    </>
  );
}
