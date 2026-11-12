import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Descriptions, Form, Input, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { del, get, getErrorMessage, patch, post } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useLocalParams, useUrlParams } from '../../lib/params';
import { roleLabels, type AdminRole } from '../../lib/types';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton, PageState } from '../../components/common';
import { useCurrentAdmin } from '../auth/api';
import { AuditTable } from '../audit/AuditTable';

type AdminRow = { id: string; name: string; email: string; role: AdminRole; isActive: boolean; lastLoginAt: string | null; createdAt: string };
type AdminDetail = AdminRow & { updatedAt: string; _count: { auditLogs: number } };
type AdminForm = { name: string; email: string; role: AdminRole; isActive: boolean; password?: string };

const adminsKey = ['admins'] as const;
const roleColor: Record<AdminRole, string> = { SUPER_ADMIN: 'purple', ADMIN: 'blue', MODERATOR: 'default' };
const roleHelp: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Everything, including admin accounts and app settings.',
  ADMIN: 'Players, credits, store, games, battles and moderation.',
  MODERATOR: 'Moderation: clips, comments and reports. Read-only elsewhere.',
};
const RoleTag = ({ role }: { role: AdminRole }) => <Tag color={roleColor[role]}>{roleLabels[role]}</Tag>;

function SuperAdminOnly({ children }: { children: React.ReactNode }) {
  const { data: me } = useCurrentAdmin();
  if (me && me.role !== 'SUPER_ADMIN') return <Alert type="warning" showIcon message="Only a super admin can manage admin accounts." />;
  return <>{children}</>;
}

export function AdminsListPage() {
  const navigate = useNavigate();
  const { data: me } = useCurrentAdmin();
  const { data, isFetching } = useQuery({ queryKey: adminsKey, queryFn: () => get<AdminRow[]>('/admin/admins'), enabled: me?.role === 'SUPER_ADMIN' });
  const columns: TableProps<AdminRow>['columns'] = [
    { title: 'Name', key: 'name', render: (_, a) => <><Typography.Text strong>{a.name}{a.id === me?.id && ' (you)'}</Typography.Text><div><Typography.Text type="secondary" style={{ fontSize: 12 }}>{a.email}</Typography.Text></div></> },
    { title: 'Role', dataIndex: 'role', render: (r: AdminRole) => <RoleTag role={r} /> },
    { title: 'Status', dataIndex: 'isActive', render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag color="red">Disabled</Tag>) },
    { title: 'Last login', dataIndex: 'lastLoginAt', render: formatDateTime },
    { title: 'Added', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
  ];
  return (
    <SuperAdminOnly>
      <PageHeader title="Admins" subtitle="Who can use this dashboard, and what they can do" actions={<Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/admins/new')}>Add admin</Button>} />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} onRow={(a) => ({ onClick: () => navigate(`/admins/${a.id}`), style: { cursor: 'pointer' } })} />
    </SuperAdminOnly>
  );
}

export function AdminDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentAdmin();
  const [params, setParams] = useLocalParams({ pageSize: 20 });
  const { data: admin, isPending, isError, error, refetch } = useQuery({ queryKey: [...adminsKey, id], queryFn: () => get<AdminDetail>(`/admin/admins/${id}`), enabled: me?.role === 'SUPER_ADMIN' });
  if (me && me.role !== 'SUPER_ADMIN') return <SuperAdminOnly>{null}</SuperAdminOnly>;
  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;
  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Admins', to: '/admins' }, { label: admin.name }]}
        backTo="/admins"
        title={<>{admin.name} <RoleTag role={admin.role} /> {!admin.isActive && <Tag color="red">Disabled</Tag>}</>}
        subtitle={admin.email}
        actions={
          <>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/admins/${id}/edit`)}>Edit</Button>
            {admin.id !== me?.id && (
              <ConfirmButton danger title={`Delete ${admin.name}?`} description="They can no longer log in. Their past actions stay in the log." successMessage="Admin deleted" onConfirm={async () => { await del(`/admin/admins/${id}`); queryClient.setQueryData<AdminRow[]>(adminsKey, (rows) => rows?.filter((r) => r.id !== id)); queryClient.invalidateQueries({ queryKey: adminsKey, refetchType: 'none' }); navigate('/admins'); }}>
                Delete
              </ConfirmButton>
            )}
          </>
        }
      />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 3 }} size="small">
          <Descriptions.Item label="Can do">{roleHelp[admin.role]}</Descriptions.Item>
          <Descriptions.Item label="Last login">{formatDateTime(admin.lastLoginAt)}</Descriptions.Item>
          <Descriptions.Item label="Actions logged">{formatNumber(admin._count.auditLogs)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="Activity" size="small">
        <AuditTable params={params} setParams={setParams} fixed={{ adminId: id }} />
      </Card>
    </>
  );
}

export function AdminFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: me } = useCurrentAdmin();
  const [form] = Form.useForm<AdminForm>();
  const [error, setError] = useState<string | null>(null);
  const admin = useQuery({ queryKey: [...adminsKey, id], queryFn: () => get<AdminDetail>(`/admin/admins/${id}`), enabled: !isNew && me?.role === 'SUPER_ADMIN' });

  useEffect(() => {
    if (admin.data) form.setFieldsValue({ name: admin.data.name, email: admin.data.email, role: admin.data.role, isActive: admin.data.isActive });
  }, [admin.data, form]);

  const save = useMutation({
    mutationFn: (values: AdminForm) => {
      if (isNew) return post<AdminRow>('/admin/admins', { name: values.name, email: values.email, role: values.role, password: values.password });
      return patch<AdminRow>(`/admin/admins/${id}`, { name: values.name, role: values.role, isActive: values.isActive, ...(values.password && { password: values.password }) });
    },
    onSuccess: (saved) => {
      message.success(isNew ? 'Admin created' : 'Admin saved');
      queryClient.invalidateQueries({ queryKey: adminsKey });
      navigate(`/admins/${saved.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <SuperAdminOnly>
      <PageHeader
        title={isNew ? 'Add admin' : `Edit ${admin.data?.name ?? 'admin'}`}
        crumbs={[{ label: 'Admins', to: '/admins' }, { label: isNew ? 'Add' : 'Edit' }]}
        backTo={isNew ? '/admins' : `/admins/${id}`}
      />
      <FormPage form={form} onFinish={(v) => { setError(null); save.mutate(v); }} saving={save.isPending} loading={!isNew && admin.isPending} error={error} cancelTo={isNew ? '/admins' : `/admins/${id}`} initialValues={{ role: 'MODERATOR', isActive: true }}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input disabled={!isNew} /></Form.Item>
        <Form.Item name="role" label="Role" rules={[{ required: true }]} extra={<Form.Item noStyle shouldUpdate>{({ getFieldValue }) => roleHelp[getFieldValue('role') as AdminRole]}</Form.Item>}>
          <Select options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <Form.Item name="password" label={isNew ? 'Password' : 'New password (optional)'} extra="At least 10 characters. Share it privately; they can change it after logging in." rules={[{ required: isNew, min: 10, message: 'At least 10 characters' }]}>
          <Input.Password autoComplete="new-password" />
        </Form.Item>
        {!isNew && <Form.Item name="isActive" label="Can log in" valuePropName="checked"><Switch /></Form.Item>}
      </FormPage>
    </SuperAdminOnly>
  );
}

export function AuditLogPage() {
  const [params, setParams] = useUrlParams({ pageSize: 50 });
  return (
    <>
      <PageHeader title="Admin activity log" subtitle="Every change made from this dashboard: who, what and when." />
      <AuditTable params={params} setParams={setParams} />
    </>
  );
}
