import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Flex, Form, Input, InputNumber, Radio, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton, PageState, PlayerLink } from '../../components/common';
import { ImageUpload } from '../../components/ImageUpload';
import { useCurrentAdmin } from '../auth/api';
import { badgesApi, badgesKey, metricLabels, ruleLabel, useBadges, type Badge, type BadgeMetric } from './api';

function useCanEdit() {
  const { data: admin } = useCurrentAdmin();
  return admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
}

const BadgeIcon = ({ url, size = 36 }: { url: string | null; size?: number }) =>
  url ? <img src={url} alt="" style={{ width: size, height: size, objectFit: 'contain' }} /> : <div style={{ width: size, height: size, borderRadius: size / 2, background: '#1b1729' }} />;

export function BadgesListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { data, isFetching } = useBadges();
  const columns: TableProps<Badge>['columns'] = [
    { title: 'Badge', key: 'name', render: (_, b) => <Flex align="center" gap={10}><BadgeIcon url={b.iconUrl} /><Flex vertical><Typography.Text strong>{b.name}</Typography.Text>{b.description && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{b.description}</Typography.Text>}</Flex></Flex> },
    { title: 'How it is earned', key: 'rule', render: (_, b) => <Tag color={b.criteria ? 'blue' : b.isCriteriaPending ? 'gold' : 'default'}>{ruleLabel(b)}</Tag> },
    { title: 'Players', dataIndex: 'holders', render: formatNumber },
    { title: 'Status', dataIndex: 'isActive', render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>) },
  ];
  return (
    <>
      <PageHeader
        title="Badges"
        subtitle="Automatic badges are given as soon as a player reaches the rule; others are awarded from a player's page. Badges don't add popularity."
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/badges/new')}>Add badge</Button>}
      />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} onRow={(b) => ({ onClick: () => navigate(`/badges/${b.id}`), style: { cursor: 'pointer' } })} />
    </>
  );
}

export function BadgeDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const { data: badge, isPending, isError, error, refetch } = useQuery({ queryKey: [...badgesKey, id], queryFn: () => badgesApi.get(id) });
  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Badges', to: '/badges' }, { label: badge.name }]}
        backTo="/badges"
        title={<Flex align="center" gap={10}><BadgeIcon url={badge.iconUrl} size={44} />{badge.name}{!badge.isActive && <Tag>Hidden</Tag>}</Flex>}
        subtitle={badge.description ?? undefined}
        actions={
          canEdit && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/badges/${id}/edit`)}>Edit</Button>
              <ConfirmButton danger title="Delete this badge?" description="Only badges nobody holds can be deleted; otherwise hide it." successMessage="Badge deleted" onConfirm={async () => { await badgesApi.remove(id); queryClient.setQueryData<Badge[]>(badgesKey, (rows) => rows?.filter((r) => r.id !== id)); queryClient.invalidateQueries({ queryKey: badgesKey, refetchType: 'none' }); navigate('/badges'); }}>
                Delete
              </ConfirmButton>
            </>
          )
        }
      />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Tag color={badge.criteria ? 'blue' : 'gold'}>{ruleLabel(badge)}</Tag>
        <Typography.Text type="secondary" style={{ marginInlineStart: 8 }}>{formatNumber(badge._count.holders)} players hold this badge</Typography.Text>
      </Card>
      <Card title="Players with this badge" size="small">
        <Table
          rowKey={(h) => h.user.id}
          size="small"
          dataSource={badge.holders}
          locale={{ emptyText: 'Nobody yet' }}
          columns={[
            { title: 'Player', key: 'user', render: (_, h) => <PlayerLink player={h.user} /> },
            { title: 'How', key: 'how', render: (_, h) => (h.awardedById ? <Tag>By admin</Tag> : <Tag color="blue">Automatic</Tag>) },
            { title: 'Earned', dataIndex: 'earnedAt', render: formatDateTime },
            {
              title: '',
              key: 'remove',
              render: (_, h) =>
                canEdit && (
                  <ConfirmButton size="small" danger title={`Remove from ${h.user.username}?`} successMessage="Badge removed" onConfirm={async () => { await badgesApi.revoke(h.user.id, id); queryClient.invalidateQueries({ queryKey: badgesKey }); }}>
                    Remove
                  </ConfirmButton>
                ),
            },
          ]}
        />
        {badge._count.holders > badge.holders.length && <Typography.Text type="secondary">Showing the latest {badge.holders.length}.</Typography.Text>}
      </Card>
    </>
  );
}

type BadgeForm = {
  iconUrl?: string | null;
  name: string;
  slug: string;
  description?: string;
  mode: 'auto' | 'manual';
  metric?: BadgeMetric;
  min?: number;
  isCriteriaPending: boolean;
  isActive: boolean;
  sortOrder: number;
};

export function BadgeFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<BadgeForm>();
  const [error, setError] = useState<string | null>(null);
  const badge = useQuery({ queryKey: [...badgesKey, id], queryFn: () => badgesApi.get(id!), enabled: !isNew });

  useEffect(() => {
    const b = badge.data;
    if (!b) return;
    form.setFieldsValue({
      iconUrl: b.iconUrl,
      name: b.name,
      slug: b.slug,
      description: b.description ?? undefined,
      mode: b.criteria ? 'auto' : 'manual',
      metric: b.criteria?.metric ?? 'battlesWon',
      min: b.criteria?.min ?? 1,
      isCriteriaPending: b.isCriteriaPending,
      isActive: b.isActive,
      sortOrder: b.sortOrder,
    });
  }, [badge.data, form]);

  const save = useMutation({
    mutationFn: (values: BadgeForm) => {
      const auto = values.mode === 'auto';
      const input: Partial<Badge> = {
        name: values.name,
        slug: values.slug,
        iconUrl: values.iconUrl || null,
        description: values.description?.trim() || null,
        criteria: auto ? { metric: values.metric!, min: values.min! } : null,
        isCriteriaPending: auto ? false : values.isCriteriaPending,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
      };
      return isNew ? badgesApi.create(input) : badgesApi.update(id!, input);
    },
    onSuccess: (saved) => {
      message.success(isNew ? 'Badge created' : 'Badge saved');
      queryClient.invalidateQueries({ queryKey: badgesKey });
      navigate(`/badges/${saved.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'Add badge' : `Edit ${badge.data?.name ?? 'badge'}`}
        crumbs={[{ label: 'Badges', to: '/badges' }, ...(isNew ? [] : [{ label: badge.data?.name ?? '…', to: `/badges/${id}` }]), { label: isNew ? 'Add' : 'Edit' }]}
        backTo={isNew ? '/badges' : `/badges/${id}`}
      />
      <FormPage
        form={form}
        onFinish={(v) => { setError(null); save.mutate(v); }}
        saving={save.isPending}
        loading={!isNew && badge.isPending}
        error={error}
        cancelTo={isNew ? '/badges' : `/badges/${id}`}
        initialValues={{ mode: 'auto', metric: 'battlesWon', min: 1, isCriteriaPending: false, isActive: true, sortOrder: 0 }}
      >
        <Form.Item name="iconUrl" label="Icon"><ImageUpload size={72} /></Form.Item>
        <Flex gap={16} wrap>
          <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
        </Flex>
        <Form.Item name="description" label="Description"><Input maxLength={255} /></Form.Item>
        <Form.Item name="mode" label="How it is earned">
          <Radio.Group options={[{ value: 'auto', label: 'Automatic rule' }, { value: 'manual', label: 'Awarded by admin' }]} />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode}>
          {({ getFieldValue }) =>
            getFieldValue('mode') === 'auto' ? (
              <Flex gap={12} wrap>
                <Form.Item name="metric" label="When the player's" rules={[{ required: true }]}>
                  <Select style={{ width: 200 }} options={Object.entries(metricLabels).map(([value, label]) => ({ value, label }))} />
                </Form.Item>
                <Form.Item name="min" label="reaches" rules={[{ required: true }]}><InputNumber min={1} max={100000} precision={0} /></Form.Item>
              </Flex>
            ) : (
              <Form.Item name="isCriteriaPending" label="Rules still pending from the client" valuePropName="checked"><Switch /></Form.Item>
            )
          }
        </Form.Item>
        <Flex gap={24}>
          <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
          <Form.Item name="isActive" label="Visible in the app" valuePropName="checked"><Switch /></Form.Item>
        </Flex>
        <Alert type="info" showIcon message="Changing a rule doesn't take badges away from players who already earned them." />
      </FormPage>
    </>
  );
}
