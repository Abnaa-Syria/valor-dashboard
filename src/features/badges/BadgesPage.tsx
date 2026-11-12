import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Flex, Form, Input, InputNumber, Radio, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { formatNumber } from '../../lib/format';
import { EditModal } from '../../components/EditModal';
import { ImageUpload } from '../../components/ImageUpload';
import { useCurrentAdmin } from '../auth/api';
import { badgesApi, badgesKey, metricLabels, useBadges, type Badge, type BadgeMetric } from './api';

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

function toForm(badge: Badge | 'new'): Partial<BadgeForm> {
  if (badge === 'new') return { mode: 'auto', metric: 'battlesWon', min: 1, isCriteriaPending: false, isActive: true, sortOrder: 0 };
  return {
    iconUrl: badge.iconUrl,
    name: badge.name,
    slug: badge.slug,
    description: badge.description ?? undefined,
    mode: badge.criteria ? 'auto' : 'manual',
    metric: badge.criteria?.metric ?? 'battlesWon',
    min: badge.criteria?.min ?? 1,
    isCriteriaPending: badge.isCriteriaPending,
    isActive: badge.isActive,
    sortOrder: badge.sortOrder,
  };
}

function fromForm(values: BadgeForm): Partial<Badge> {
  const auto = values.mode === 'auto';
  return {
    name: values.name,
    slug: values.slug,
    iconUrl: values.iconUrl || null,
    description: values.description?.trim() || null,
    criteria: auto ? { metric: values.metric!, min: values.min! } : null,
    isCriteriaPending: auto ? false : values.isCriteriaPending,
    isActive: values.isActive,
    sortOrder: values.sortOrder,
  };
}

export function BadgesPage() {
  const queryClient = useQueryClient();
  const { data: admin } = useCurrentAdmin();
  const canEdit = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const { data, isFetching } = useBadges();
  const [editing, setEditing] = useState<Badge | 'new' | null>(null);

  const columns: TableProps<Badge>['columns'] = [
    { title: '', key: 'icon', width: 56, render: (_, b) => (b.iconUrl ? <img src={b.iconUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} /> : null) },
    { title: 'Badge', key: 'name', render: (_, b) => <Flex vertical><Typography.Text strong>{b.name}</Typography.Text>{b.description && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{b.description}</Typography.Text>}</Flex> },
    {
      title: 'How it is earned',
      key: 'rule',
      render: (_, b) =>
        b.criteria ? (
          <Tag color="blue">Automatic: {metricLabels[b.criteria.metric]} ≥ {b.criteria.min}</Tag>
        ) : (
          <Flex gap={4}>
            <Tag>Awarded by admin</Tag>
            {b.isCriteriaPending && <Tag color="gold">Rules pending</Tag>}
          </Flex>
        ),
    },
    { title: 'Players', dataIndex: 'holders', render: formatNumber },
    { title: 'Status', dataIndex: 'isActive', render: (active: boolean) => (active ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>) },
    ...(canEdit ? [{ key: 'edit', render: (_: unknown, b: Badge) => <Button size="small" onClick={() => setEditing(b)}>Edit</Button> }] : []),
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Badges
        </Typography.Title>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing('new')}>
            Add badge
          </Button>
        )}
      </Flex>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Automatic badges are given as soon as a player reaches the rule. Other badges are awarded from a player's page (Players → Badges). Badges don't add popularity."
      />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} />

      <EditModal<BadgeForm>
        open={editing !== null}
        title={editing === 'new' ? 'Add badge' : 'Edit badge'}
        initialValues={editing ? toForm(editing) : {}}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: badgesKey })}
        onSave={(values) => (editing && editing !== 'new' ? badgesApi.update(editing.id, fromForm(values)) : badgesApi.create(fromForm(values)))}
      >
        {() => (
          <>
            <Flex gap={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
              <Form.Item name="slug" label="Slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1 }}><Input /></Form.Item>
            </Flex>
            <Form.Item name="iconUrl" label="Icon"><ImageUpload size={72} /></Form.Item>
            <Form.Item name="description" label="Description"><Input maxLength={255} /></Form.Item>
            <Form.Item name="mode" label="How it is earned">
              <Radio.Group options={[{ value: 'auto', label: 'Automatic rule' }, { value: 'manual', label: 'Awarded by admin' }]} />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(a, b) => a.mode !== b.mode}>
              {({ getFieldValue }) =>
                getFieldValue('mode') === 'auto' ? (
                  <Flex gap={12}>
                    <Form.Item name="metric" label="When the player's" rules={[{ required: true }]}>
                      <Select style={{ width: 180 }} options={Object.entries(metricLabels).map(([value, label]) => ({ value, label }))} />
                    </Form.Item>
                    <Form.Item name="min" label="reaches" rules={[{ required: true }]}>
                      <InputNumber min={1} max={100000} precision={0} />
                    </Form.Item>
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
          </>
        )}
      </EditModal>
    </>
  );
}
