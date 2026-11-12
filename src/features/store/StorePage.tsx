import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Flex, Form, Input, InputNumber, Select, Switch, Table, Tabs, Tag, Typography, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { EditModal } from '../../components/EditModal';
import { useCurrentAdmin } from '../auth/api';
import { storeApi, storeKeys, tierLabels, type CreditPack, type Gift, type GiftTier } from './api';
import { AvatarsTab, FramesTab, ThemesTab } from './CustomizationTabs';
import { ImageUpload } from '../../components/ImageUpload';

const productIdRule = { pattern: /^[A-Za-z0-9._-]+$/, message: 'Letters, numbers, dots, dashes, underscores' };
const slugRule = { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' };

function Price({ value }: { value: string | null }) {
  return value === null ? <Tag color="gold">Price pending</Tag> : <>SAR {value}</>;
}

function ActiveTag({ active }: { active: boolean }) {
  return active ? <Tag color="green">On sale</Tag> : <Tag>Hidden</Tag>;
}

/** Turns "" into null for optional numeric / text fields. */
const nullable = <T,>(value: T | '' | undefined) => (value === '' || value === undefined ? null : value);

// ───────────── Credit packs ─────────────

function PacksTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery({ queryKey: storeKeys.packs, queryFn: storeApi.listPacks });
  const [editing, setEditing] = useState<CreditPack | 'new' | null>(null);

  const columns: TableProps<CreditPack>['columns'] = [
    { title: 'Wallet', dataIndex: 'type', render: (type: string) => (type === 'VOTING' ? 'Voting' : 'Challenge') },
    { title: 'Credits', dataIndex: 'credits' },
    { title: 'Price', dataIndex: 'priceSar', render: (value: string) => <Price value={value} /> },
    { title: 'Store product ID', dataIndex: 'storeProductId', render: (id: string) => <Typography.Text code>{id}</Typography.Text> },
    { title: 'Status', dataIndex: 'isActive', render: (active: boolean) => <ActiveTag active={active} /> },
    ...(canEdit ? [{ key: 'edit', render: (_: unknown, pack: CreditPack) => <Button size="small" onClick={() => setEditing(pack)}>Edit</Button> }] : []),
  ];

  return (
    <>
      {canEdit && (
        <Button icon={<PlusOutlined />} onClick={() => setEditing('new')} style={{ marginBottom: 12 }}>
          Add pack
        </Button>
      )}
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} />
      <EditModal<CreditPack>
        open={editing !== null}
        title={editing === 'new' ? 'Add credit pack' : 'Edit credit pack'}
        initialValues={editing === 'new' ? { type: 'VOTING', isActive: true, sortOrder: 0 } : (editing ?? {})}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: storeKeys.packs })}
        onSave={(values) => (editing && editing !== 'new' ? storeApi.updatePack(editing.id, values) : storeApi.createPack(values))}
      >
        {() => (
          <>
            <Flex gap={12}>
              <Form.Item name="type" label="Wallet" rules={[{ required: true }]}>
                <Select style={{ width: 140 }} options={[{ value: 'VOTING', label: 'Voting' }, { value: 'CHALLENGE', label: 'Challenge' }]} />
              </Form.Item>
              <Form.Item name="credits" label="Credits" rules={[{ required: true }]}>
                <InputNumber min={1} max={10000} precision={0} />
              </Form.Item>
              <Form.Item name="priceSar" label="Price (SAR)" rules={[{ required: true }]}>
                <InputNumber min={0} max={10000} precision={2} step={1} />
              </Form.Item>
            </Flex>
            <Form.Item name="storeProductId" label="Store product ID" extra="Must match the product ID in App Store Connect / Google Play." rules={[{ required: true }, productIdRule]}>
              <Input />
            </Form.Item>
            <Flex gap={24}>
              <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
              <Form.Item name="isActive" label="On sale" valuePropName="checked"><Switch /></Form.Item>
            </Flex>
          </>
        )}
      </EditModal>
    </>
  );
}

// ───────────── Gifts ─────────────

function GiftsTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data, isFetching } = useQuery({ queryKey: storeKeys.gifts, queryFn: storeApi.listGifts });
  const [editing, setEditing] = useState<Gift | 'new' | null>(null);

  const columns: TableProps<Gift>['columns'] = [
    { title: '', key: 'icon', width: 56, render: (_, gift) => (gift.iconUrl ? <img src={gift.iconUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} /> : null) },
    { title: 'Gift', key: 'name', render: (_, gift) => <Flex vertical><Typography.Text strong>{gift.name}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{gift.kind === 'GIFT' ? 'Gift' : 'Sticker'}</Typography.Text></Flex> },
    { title: 'Tier', dataIndex: 'tier', render: (tier: GiftTier) => <Tag>{tierLabels[tier]}</Tag> },
    { title: 'Price', dataIndex: 'priceSar', render: (value: string | null) => <Price value={value} /> },
    { title: 'Popularity', dataIndex: 'popularityValue', render: (value: number | null) => (value === null ? '—' : `+${value}`) },
    { title: 'Store product ID', dataIndex: 'storeProductId', render: (id: string | null) => (id ? <Typography.Text code>{id}</Typography.Text> : '—') },
    { title: 'Status', dataIndex: 'isActive', render: (active: boolean) => <ActiveTag active={active} /> },
    ...(canEdit ? [{ key: 'edit', render: (_: unknown, gift: Gift) => <Button size="small" onClick={() => setEditing(gift)}>Edit</Button> }] : []),
  ];

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Gifts add popularity to the receiver. They never count as votes or change a battle result. Gifts sent inside a battle reach the player when voting closes."
      />
      {canEdit && (
        <Button icon={<PlusOutlined />} onClick={() => setEditing('new')} style={{ marginBottom: 12 }}>
          Add gift
        </Button>
      )}
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} />
      <EditModal<Gift>
        open={editing !== null}
        title={editing === 'new' ? 'Add gift' : 'Edit gift'}
        initialValues={editing === 'new' ? { kind: 'GIFT', tier: 'MID', isActive: true, sortOrder: 0 } : (editing ?? {})}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: storeKeys.gifts })}
        onSave={(values) => {
          const input = { ...values, priceSar: nullable(values.priceSar), popularityValue: nullable(values.popularityValue), storeProductId: nullable(values.storeProductId), iconUrl: nullable(values.iconUrl) };
          return editing && editing !== 'new' ? storeApi.updateGift(editing.id, input) : storeApi.createGift(input);
        }}
      >
        {() => (
          <>
            <Flex gap={12}>
              <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1 }}><Input /></Form.Item>
              <Form.Item name="slug" label="Slug" rules={[{ required: true }, slugRule]} style={{ flex: 1 }}><Input /></Form.Item>
            </Flex>
            <Form.Item name="iconUrl" label="Icon">
              <ImageUpload size={72} />
            </Form.Item>
            <Flex gap={12}>
              <Form.Item name="kind" label="Type"><Select style={{ width: 130 }} options={[{ value: 'GIFT', label: 'Gift' }, { value: 'STICKER', label: 'Sticker' }]} /></Form.Item>
              <Form.Item name="tier" label="Tier"><Select style={{ width: 150 }} options={Object.entries(tierLabels).map(([value, label]) => ({ value, label }))} /></Form.Item>
            </Flex>
            <Flex gap={12}>
              <Form.Item name="priceSar" label="Price (SAR)" extra="Empty = price pending (not for sale)"><InputNumber min={0} max={10000} precision={2} /></Form.Item>
              <Form.Item name="popularityValue" label="Popularity per gift"><InputNumber min={0} max={100000} precision={0} /></Form.Item>
            </Flex>
            <Form.Item name="storeProductId" label="Store product ID" rules={[productIdRule]}><Input /></Form.Item>
            <Flex gap={24}>
              <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
              <Form.Item name="isActive" label="On sale" valuePropName="checked"><Switch /></Form.Item>
            </Flex>
          </>
        )}
      </EditModal>
    </>
  );
}

export function StorePage() {
  const { data: admin } = useCurrentAdmin();
  const canEdit = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Store
      </Typography.Title>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Prices must also be set in App Store Connect and Google Play with the same product IDs. The app charges the store price; the price here is what VALOR shows and records."
      />
      <Tabs
        items={[
          { key: 'packs', label: 'Credit packs', children: <PacksTab canEdit={canEdit} /> },
          { key: 'gifts', label: 'Gifts & stickers', children: <GiftsTab canEdit={canEdit} /> },
          { key: 'frames', label: 'Profile frames', children: <FramesTab canEdit={canEdit} /> },
          { key: 'themes', label: 'App themes', children: <ThemesTab canEdit={canEdit} /> },
          { key: 'avatars', label: 'Avatars', children: <AvatarsTab canEdit={canEdit} /> },
        ]}
      />
    </>
  );
}
