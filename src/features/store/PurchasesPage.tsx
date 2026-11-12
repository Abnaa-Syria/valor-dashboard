import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Card, Flex, Input, Select, Statistic, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { storeApi, storeKeys, type Purchase, type PurchaseKind, type PurchaseStatus } from './api';

const statusMeta: Record<PurchaseStatus, { label: string; color: string }> = {
  COMPLETED: { label: 'Completed', color: 'green' },
  PENDING: { label: 'Pending', color: 'blue' },
  FAILED: { label: 'Paid, not delivered', color: 'red' },
  REFUNDED: { label: 'Refunded', color: 'default' },
};

const kindLabels: Record<PurchaseKind, string> = { CREDIT_PACK: 'Credit pack', GIFT: 'Gift', COSMETIC: 'Frame / theme' };
const providerLabels = { APP_STORE: 'App Store', PLAY_STORE: 'Google Play', TEST: 'Test' } as const;

const columns: TableProps<Purchase>['columns'] = [
  { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
  { title: 'Player', key: 'user', render: (_, p) => p.user.username },
  { title: 'Product', key: 'product', render: (_, p) => <Flex vertical><Typography.Text code>{p.storeProductId}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{kindLabels[p.kind]}{p.quantity > 1 ? ` × ${p.quantity}` : ''}</Typography.Text></Flex> },
  { title: 'Amount', dataIndex: 'priceSar', render: (value: string) => `SAR ${value}` },
  { title: 'Store', dataIndex: 'provider', render: (provider: Purchase['provider']) => (provider === 'TEST' ? <Tag color="gold">Test</Tag> : providerLabels[provider]) },
  { title: 'Status', dataIndex: 'status', render: (status: PurchaseStatus) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag> },
  { title: 'Transaction', dataIndex: 'storeTransactionId', render: (id: string) => <Typography.Text type="secondary" style={{ fontSize: 12 }} copyable>{id}</Typography.Text>, responsive: ['xl'] },
];

export function PurchasesPage() {
  const [params, setParams] = useState<{ page: number; pageSize: number; status?: PurchaseStatus; kind?: PurchaseKind; q?: string }>({ page: 1, pageSize: 20 });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: storeKeys.purchases(params),
    queryFn: () => storeApi.listPurchases(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Purchases
      </Typography.Title>

      <Flex gap={12} wrap style={{ marginBottom: 16 }} align="center">
        <Input.Search placeholder="Player, product or transaction" allowClear style={{ maxWidth: 300 }} onSearch={(q) => setParams((p) => ({ ...p, q: q.trim() || undefined, page: 1 }))} />
        <Select<PurchaseKind> placeholder="All products" allowClear style={{ width: 160 }} options={Object.entries(kindLabels).map(([value, label]) => ({ value: value as PurchaseKind, label }))} onChange={(kind) => setParams((p) => ({ ...p, kind, page: 1 }))} />
        <Select<PurchaseStatus> placeholder="All statuses" allowClear style={{ width: 190 }} options={Object.entries(statusMeta).map(([value, meta]) => ({ value: value as PurchaseStatus, label: meta.label }))} onChange={(status) => setParams((p) => ({ ...p, status, page: 1 }))} />
        <Card size="small" style={{ marginInlineStart: 'auto' }}>
          <Statistic title="Completed (this filter)" value={data?.totalRevenueSar ?? '0.00'} prefix="SAR" precision={2} />
        </Card>
      </Flex>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="“Paid, not delivered” means the store charged the player but delivery failed (e.g. the battle ended a moment before). Compensate with credits from the player's page or refund through the store."
      />

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<Purchase>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No purchases yet' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showTotal: (total) => `${formatNumber(total)} purchases`,
          onChange: (page, pageSize) => setParams((p) => ({ ...p, page, pageSize })),
        }}
      />
    </>
  );
}
