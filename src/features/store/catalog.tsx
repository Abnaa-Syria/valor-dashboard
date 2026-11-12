import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Flex, Form, Input, InputNumber, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { giftTiers, options, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton } from '../../components/common';
import { ImageUpload } from '../../components/ImageUpload';
import { useCurrentAdmin } from '../auth/api';
import { storeApi, storeKeys, type CreditPack, type Gift } from './api';

const productIdRule = { pattern: /^[A-Za-z0-9._-]+$/, message: 'Letters, numbers, dots, dashes, underscores' };
const slugRule = { pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' };
const blank = <T,>(value: T | '' | undefined) => (value === '' || value === undefined ? null : value);

function useCanEdit() {
  const { data: admin } = useCurrentAdmin();
  return admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
}

const StoreNote = () => (
  <Alert
    type="info"
    showIcon
    style={{ marginBottom: 16 }}
    message="Product IDs must match App Store Connect and Google Play. The store charges its own price; the price here is what VALOR shows and records."
  />
);

const Visible = ({ active }: { active: boolean }) => (active ? <Tag color="green">On sale</Tag> : <Tag>Hidden</Tag>);
const Price = ({ value }: { value: string | null }) => (value === null ? <Tag color="gold">Price pending</Tag> : <>SAR {value}</>);

// ───────────── Credit packs ─────────────

export function PacksListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { data, isFetching } = useQuery({ queryKey: storeKeys.packs, queryFn: storeApi.listPacks });
  const columns: TableProps<CreditPack>['columns'] = [
    { title: 'Wallet', dataIndex: 'type', render: (t: string) => (t === 'VOTING' ? 'Voting credits' : 'Challenge credits') },
    { title: 'Credits', dataIndex: 'credits' },
    { title: 'Price', dataIndex: 'priceSar', render: (v: string) => <Price value={v} /> },
    { title: 'Product ID', dataIndex: 'storeProductId', render: (v: string) => <Typography.Text code>{v}</Typography.Text> },
    { title: 'Status', dataIndex: 'isActive', render: (a: boolean) => <Visible active={a} /> },
  ];
  return (
    <>
      <PageHeader
        title="Credit packs"
        subtitle="Voting and Challenge credit packs sold in the store"
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/store/packs/new')}>Add pack</Button>}
      />
      <StoreNote />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} onRow={(p) => ({ onClick: () => navigate(`/store/packs/${p.id}`), style: { cursor: 'pointer' } })} />
    </>
  );
}

export function PackFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const [form] = Form.useForm<CreditPack>();
  const [error, setError] = useState<string | null>(null);
  const pack = useQuery({ queryKey: ['store', 'pack', id], queryFn: () => storeApi.getPack(id!), enabled: !isNew });

  useEffect(() => {
    if (pack.data) form.setFieldsValue(pack.data);
  }, [pack.data, form]);

  const save = useMutation({
    mutationFn: (values: CreditPack) => (isNew ? storeApi.createPack(values) : storeApi.updatePack(id!, values)),
    onSuccess: () => {
      message.success(isNew ? 'Pack created' : 'Pack saved');
      queryClient.invalidateQueries({ queryKey: ['store'] });
      navigate('/store/packs');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const title = isNew ? 'Add credit pack' : pack.data ? `${pack.data.credits} ${pack.data.type === 'VOTING' ? 'Voting' : 'Challenge'} credits` : 'Credit pack';
  return (
    <>
      <PageHeader
        title={title}
        subtitle={!isNew && pack.data ? `Sold ${formatNumber(pack.data.sold ?? 0)} times` : undefined}
        crumbs={[{ label: 'Credit packs', to: '/store/packs' }, { label: isNew ? 'Add' : 'Edit' }]}
        backTo="/store/packs"
        actions={
          !isNew &&
          canEdit && (
            <ConfirmButton danger title="Delete this pack?" description="Only packs that were never bought can be deleted; otherwise hide it." successMessage="Pack deleted" onConfirm={async () => { await storeApi.deletePack(id!); queryClient.invalidateQueries({ queryKey: ['store'], refetchType: 'none' }); navigate('/store/packs'); }}>
              Delete
            </ConfirmButton>
          )
        }
      />
      <FormPage form={form} onFinish={(v) => { setError(null); save.mutate(v); }} saving={save.isPending} loading={!isNew && pack.isPending} error={error} cancelTo="/store/packs" initialValues={{ type: 'VOTING', isActive: true, sortOrder: 0 }} disabled={!canEdit}>
        <Flex gap={16} wrap>
          <Form.Item name="type" label="Wallet" rules={[{ required: true }]}>
            <Select style={{ width: 200 }} options={[{ value: 'VOTING', label: 'Voting credits' }, { value: 'CHALLENGE', label: 'Challenge credits' }]} />
          </Form.Item>
          <Form.Item name="credits" label="Credits" rules={[{ required: true }]}>
            <InputNumber min={1} max={10000} precision={0} />
          </Form.Item>
          <Form.Item name="priceSar" label="Price (SAR)" rules={[{ required: true }]}>
            <InputNumber min={0} max={10000} precision={2} />
          </Form.Item>
        </Flex>
        <Form.Item name="storeProductId" label="Store product ID" rules={[{ required: true }, productIdRule]} extra="Same ID in App Store Connect and Google Play.">
          <Input />
        </Form.Item>
        <Flex gap={24}>
          <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
          <Form.Item name="isActive" label="On sale" valuePropName="checked"><Switch /></Form.Item>
        </Flex>
      </FormPage>
    </>
  );
}

// ───────────── Gifts ─────────────

export function GiftsListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { data, isFetching } = useQuery({ queryKey: storeKeys.gifts, queryFn: storeApi.listGifts });
  const columns: TableProps<Gift>['columns'] = [
    { title: '', key: 'icon', width: 56, render: (_, g) => (g.iconUrl ? <img src={g.iconUrl} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} /> : null) },
    { title: 'Gift', key: 'name', render: (_, g) => <Flex vertical><Typography.Text strong>{g.name}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{g.kind === 'GIFT' ? 'Gift' : 'Sticker'}</Typography.Text></Flex> },
    { title: 'Tier', dataIndex: 'tier', render: (t: string) => <StatusTag meta={giftTiers} value={t} /> },
    { title: 'Price', dataIndex: 'priceSar', render: (v: string | null) => <Price value={v} /> },
    { title: 'Popularity', dataIndex: 'popularityValue', render: (v: number | null) => (v === null ? '—' : `+${v}`) },
    { title: 'Status', dataIndex: 'isActive', render: (a: boolean) => <Visible active={a} /> },
  ];
  return (
    <>
      <PageHeader
        title="Gifts & stickers"
        subtitle="Gifts add popularity to the receiver. They never count as votes or change a result."
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/store/gifts/new')}>Add gift</Button>}
      />
      <StoreNote />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} onRow={(g) => ({ onClick: () => navigate(`/store/gifts/${g.id}`), style: { cursor: 'pointer' } })} />
    </>
  );
}

export function GiftFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const [form] = Form.useForm<Gift>();
  const [error, setError] = useState<string | null>(null);
  const gift = useQuery({ queryKey: ['store', 'gift', id], queryFn: () => storeApi.getGift(id!), enabled: !isNew });

  useEffect(() => {
    if (gift.data) form.setFieldsValue(gift.data);
  }, [gift.data, form]);

  const save = useMutation({
    mutationFn: (values: Gift) => {
      const input = { ...values, priceSar: blank(values.priceSar), popularityValue: blank(values.popularityValue), storeProductId: blank(values.storeProductId), iconUrl: blank(values.iconUrl) };
      return isNew ? storeApi.createGift(input) : storeApi.updateGift(id!, input);
    },
    onSuccess: () => {
      message.success(isNew ? 'Gift created' : 'Gift saved');
      queryClient.invalidateQueries({ queryKey: ['store'] });
      navigate('/store/gifts');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'Add gift' : (gift.data?.name ?? 'Gift')}
        subtitle={!isNew && gift.data ? `Sent ${formatNumber(gift.data._count?.transactions ?? 0)} times` : undefined}
        crumbs={[{ label: 'Gifts & stickers', to: '/store/gifts' }, { label: isNew ? 'Add' : 'Edit' }]}
        backTo="/store/gifts"
        actions={
          !isNew &&
          canEdit && (
            <ConfirmButton danger title="Delete this gift?" description="Only gifts that were never sent can be deleted; otherwise hide it." successMessage="Gift deleted" onConfirm={async () => { await storeApi.deleteGift(id!); queryClient.invalidateQueries({ queryKey: ['store'], refetchType: 'none' }); navigate('/store/gifts'); }}>
              Delete
            </ConfirmButton>
          )
        }
      />
      <FormPage form={form} onFinish={(v) => { setError(null); save.mutate(v); }} saving={save.isPending} loading={!isNew && gift.isPending} error={error} cancelTo="/store/gifts" initialValues={{ kind: 'GIFT', tier: 'MID', isActive: true, sortOrder: 0 }} disabled={!canEdit}>
        <Form.Item name="iconUrl" label="Icon">
          <ImageUpload size={80} />
        </Form.Item>
        <Flex gap={16} wrap>
          <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }, slugRule]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
        </Flex>
        <Flex gap={16} wrap>
          <Form.Item name="kind" label="Type"><Select style={{ width: 150 }} options={[{ value: 'GIFT', label: 'Gift' }, { value: 'STICKER', label: 'Sticker' }]} /></Form.Item>
          <Form.Item name="tier" label="Tier"><Select style={{ width: 170 }} options={options(giftTiers)} /></Form.Item>
          <Form.Item name="priceSar" label="Price (SAR)" extra="Empty = price pending"><InputNumber min={0} max={10000} precision={2} /></Form.Item>
          <Form.Item name="popularityValue" label="Popularity per gift"><InputNumber min={0} max={100000} precision={0} /></Form.Item>
        </Flex>
        <Form.Item name="storeProductId" label="Store product ID" rules={[productIdRule]}><Input /></Form.Item>
        <Flex gap={24}>
          <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
          <Form.Item name="isActive" label="On sale" valuePropName="checked"><Switch /></Form.Item>
        </Flex>
      </FormPage>
    </>
  );
}
