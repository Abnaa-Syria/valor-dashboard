import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Card, Flex, Input, Select, Statistic, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { options, providerLabels, purchaseKind, purchaseStatus, StatusTag } from '../../lib/labels';
import { PlayerLink } from '../../components/common';
import { storeApi, type Purchase } from './api';

type Props = { params: ListParams; setParams: SetParams; fixed?: { userId?: string }; showRevenue?: boolean };

export function PurchasesTable({ params, setParams, fixed = {}, showRevenue = true }: Props) {
  const navigate = useNavigate();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['purchases', 'list', query],
    queryFn: () => storeApi.listPurchases(query),
    placeholderData: keepPreviousData,
  });

  const columns: TableProps<Purchase>['columns'] = [
    { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
    ...(fixed.userId ? [] : [{ title: 'Player', key: 'user', render: (_: unknown, p: Purchase) => <PlayerLink player={p.user} /> }]),
    {
      title: 'Product',
      key: 'product',
      render: (_, p) => (
        <Flex vertical>
          <Typography.Text code>{p.storeProductId}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {purchaseKind[p.kind]?.label}
            {p.quantity > 1 ? ` × ${p.quantity}` : ''}
          </Typography.Text>
        </Flex>
      ),
    },
    { title: 'Amount', dataIndex: 'priceSar', render: (v: string) => `SAR ${v}` },
    { title: 'Store', dataIndex: 'provider', render: (p: string) => (p === 'TEST' ? <Tag color="gold">Test</Tag> : providerLabels[p]) },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={purchaseStatus} value={s} /> },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }} align="center">
        {!fixed.userId && <Input.Search placeholder="Player, product or transaction" allowClear defaultValue={params.q as string | undefined} style={{ maxWidth: 300 }} onSearch={(q) => setParams({ q: q.trim() || undefined })} />}
        <Select placeholder="All products" allowClear style={{ width: 200 }} options={options(purchaseKind)} value={params.kind as string | undefined} onChange={(kind) => setParams({ kind })} />
        <Select placeholder="All statuses" allowClear style={{ width: 190 }} options={options(purchaseStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
        {showRevenue && (
          <Card size="small" style={{ marginInlineStart: 'auto' }}>
            <Statistic title="Completed (this filter)" value={data?.totalRevenueSar ?? '0.00'} prefix="SAR" precision={2} />
          </Card>
        )}
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Purchase>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No purchases' }}
        onRow={(p) => ({ onClick: () => navigate(`/purchases/${p.id}`), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} purchases`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
    </>
  );
}
