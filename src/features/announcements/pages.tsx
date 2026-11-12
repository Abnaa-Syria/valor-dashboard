import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input, Radio, Select, Table, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { get, getErrorMessage, post } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useUrlParams } from '../../lib/params';
import type { Paginated } from '../../lib/types';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { PlayerLink } from '../../components/common';
import { useCurrentAdmin } from '../auth/api';
import { listUsers } from '../users/api';

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'ALL' | 'PLAYER';
  userId: string | null;
  username: string | null;
  recipients: number;
  createdAt: string;
  createdBy: { id: string; name: string };
};

export function AnnouncementsListPage() {
  const navigate = useNavigate();
  const { data: admin } = useCurrentAdmin();
  const [params, setParams] = useUrlParams();
  const { data, isFetching } = useQuery({
    queryKey: ['announcements', params],
    queryFn: () => get<Paginated<Announcement>>('/admin/announcements', params),
    placeholderData: keepPreviousData,
  });
  return (
    <>
      <PageHeader
        title="Announcements"
        subtitle="Messages from VALOR that land in players' notification centre."
        actions={admin?.role !== 'MODERATOR' && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/announcements/new')}>New announcement</Button>}
      />
      <Table<Announcement>
        rowKey="id"
        loading={isFetching}
        dataSource={data?.items}
        locale={{ emptyText: 'No announcements sent yet' }}
        scroll={{ x: 'max-content' }}
        columns={[
          { title: 'Sent', dataIndex: 'createdAt', render: formatDateTime },
          { title: 'Message', key: 'msg', render: (_, a) => <><Typography.Text strong>{a.title}</Typography.Text><div><Typography.Text type="secondary">{a.body}</Typography.Text></div></> },
          { title: 'To', key: 'to', render: (_, a) => (a.audience === 'ALL' ? <Tag color="purple">All players</Tag> : <PlayerLink player={a.userId ? { id: a.userId, username: a.username ?? 'Player', avatarUrl: null } : null} />) },
          { title: 'Recipients', dataIndex: 'recipients', render: formatNumber },
          { title: 'By', key: 'by', render: (_, a) => a.createdBy.name },
        ]}
        pagination={{ current: params.page, pageSize: params.pageSize, total: data?.meta.total, onChange: (page, pageSize) => setParams({ page, pageSize }) }}
      />
    </>
  );
}

type AnnouncementForm = { title: string; body: string; audience: 'ALL' | 'PLAYER'; userId?: string };

export function AnnouncementNewPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [search] = useSearchParams();
  const [form] = Form.useForm<AnnouncementForm>();
  const [error, setError] = useState<string | null>(null);
  const [playerQuery, setPlayerQuery] = useState('');
  const presetId = search.get('userId');
  const presetName = search.get('username');
  const players = useQuery({
    queryKey: ['users', 'picker', playerQuery],
    queryFn: () => listUsers({ page: 1, pageSize: 20, q: playerQuery || undefined, status: 'ACTIVE' }),
  });

  const send = useMutation({
    mutationFn: (values: AnnouncementForm) => post<Announcement>('/admin/announcements', values),
    onSuccess: (sent) => {
      message.success(`Sent to ${formatNumber(sent.recipients)} player${sent.recipients === 1 ? '' : 's'}`);
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      navigate('/announcements');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const playerOptions = [
    ...(presetId && presetName ? [{ value: presetId, label: presetName }] : []),
    ...(players.data?.items ?? []).filter((p) => p.id !== presetId).map((p) => ({ value: p.id, label: `${p.username} · ${p.email}` })),
  ];

  return (
    <>
      <PageHeader title="New announcement" crumbs={[{ label: 'Announcements', to: '/announcements' }, { label: 'New' }]} backTo="/announcements" />
      <FormPage
        form={form}
        onFinish={(values) => {
          setError(null);
          send.mutate(values);
        }}
        saving={send.isPending}
        error={error}
        cancelTo="/announcements"
        submitLabel="Send"
        initialValues={presetId ? { audience: 'PLAYER', userId: presetId } : { audience: 'ALL' }}
      >
        <Form.Item name="audience" label="Send to">
          <Radio.Group options={[{ value: 'ALL', label: 'All active players' }, { value: 'PLAYER', label: 'One player' }]} />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.audience !== b.audience}>
          {({ getFieldValue }) =>
            getFieldValue('audience') === 'PLAYER' && (
              <Form.Item name="userId" label="Player" rules={[{ required: true, message: 'Choose the player' }]}>
                <Select showSearch filterOption={false} onSearch={setPlayerQuery} options={playerOptions} loading={players.isFetching} placeholder="Search username or email" />
              </Form.Item>
            )
          }
        </Form.Item>
        <Form.Item name="title" label="Title" rules={[{ required: true, max: 120 }]}>
          <Input maxLength={120} showCount />
        </Form.Item>
        <Form.Item name="body" label="Message" rules={[{ required: true, max: 255 }]}>
          <Input.TextArea maxLength={255} showCount autoSize={{ minRows: 3 }} />
        </Form.Item>
        <Alert type="warning" showIcon message="Sent messages can't be edited or recalled. Phone push notifications come with the mobile app; for now this goes to the in-app notification centre." style={{ marginBottom: 16 }} />
      </FormPage>
    </>
  );
}
