import { Link, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Card, Col, Descriptions, Row, Table, Tag, Typography } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useLocalParams, useUrlParams } from '../../lib/params';
import { ledgerReasons, providerLabels, purchaseKind, purchaseStatus, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, PageState, PlayerLink } from '../../components/common';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useCurrentAdmin } from '../auth/api';
import { AuditTable } from '../audit/AuditTable';
import { storeApi } from './api';
import { PurchasesTable } from './PurchasesTable';

export function PurchasesListPage() {
  const [params, setParams] = useUrlParams();
  return (
    <>
      <PageHeader title="Purchases" subtitle="Every store purchase. “Paid, not delivered” needs attention: compensate with credits or refund." />
      <PurchasesTable params={params} setParams={setParams} />
    </>
  );
}

export function PurchaseDetailPage() {
  const { id = '' } = useParams();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const { data: admin } = useCurrentAdmin();
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const [auditParams, setAuditParams] = useLocalParams();
  const { data: purchase, isPending, isError, error, refetch } = useQuery({ queryKey: ['purchases', 'detail', id], queryFn: () => storeApi.getPurchase(id) });

  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Purchases', to: '/purchases' }, { label: purchase.storeProductId }]}
        backTo="/purchases"
        title={
          <>
            SAR {purchase.priceSar} · {purchaseKind[purchase.kind]?.label} <StatusTag meta={purchaseStatus} value={purchase.status} />
          </>
        }
        subtitle={formatDateTime(purchase.createdAt)}
        actions={
          canManage &&
          purchase.status === 'COMPLETED' && (
            <RemoveWithReason
              title="Refund this purchase?"
              description="Refund the money in App Store Connect / Google Play. This marks the purchase refunded and takes back what was delivered (credits still in the wallet, the item, or the gift's popularity)."
              buttonLabel="Refund"
              confirmLabel="Mark refunded"
              onConfirm={async (reason) => {
                try {
                  const result = await storeApi.refundPurchase(id, reason);
                  modal.success({ title: 'Purchase refunded', content: result.outcome });
                  queryClient.invalidateQueries({ queryKey: ['purchases'] });
                } catch (err) {
                  message.error(getErrorMessage(err));
                  throw err;
                }
              }}
            />
          )
        }
      />

      {purchase.status === 'FAILED' && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="The store charged the player, but delivery failed."
          description={
            <>
              Compensate from the <Link to={`/players/${purchase.user.id}?tab=credits`}>player's Credits tab</Link>, or refund through the store.
            </>
          }
        />
      )}

      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Purchase" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Player"><PlayerLink player={{ ...purchase.user, avatarUrl: null }} /></Descriptions.Item>
              <Descriptions.Item label="Product"><Typography.Text code>{purchase.storeProductId}</Typography.Text></Descriptions.Item>
              <Descriptions.Item label="Quantity">{purchase.quantity}</Descriptions.Item>
              <Descriptions.Item label="Amount">SAR {purchase.priceSar}</Descriptions.Item>
              <Descriptions.Item label="Store">{purchase.provider === 'TEST' ? <Tag color="gold">Test</Tag> : providerLabels[purchase.provider]}</Descriptions.Item>
              <Descriptions.Item label="Transaction"><Typography.Text copyable style={{ fontSize: 12 }}>{purchase.storeTransactionId}</Typography.Text></Descriptions.Item>
              <Descriptions.Item label="Updated">{formatDateTime(purchase.updatedAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="What was delivered" size="small" style={{ marginBottom: 16 }}>
            {purchase.ledger.length > 0 && (
              <Table
                rowKey="id"
                size="small"
                pagination={false}
                dataSource={purchase.ledger}
                columns={[
                  { title: 'Wallet', dataIndex: 'type', render: (t: string) => (t === 'VOTING' ? 'Voting' : 'Challenge') },
                  { title: 'Activity', dataIndex: 'reason', render: (r: string, e) => <>{ledgerReasons[r] ?? r}{e.note && <div style={{ fontSize: 12, opacity: 0.6 }}>{e.note}</div>}</> },
                  { title: 'Amount', dataIndex: 'amount', render: (a: number) => <Typography.Text type={a > 0 ? 'success' : 'danger'}>{a > 0 ? `+${a}` : a}</Typography.Text> },
                  { title: 'When', dataIndex: 'createdAt', render: formatDateTime },
                ]}
              />
            )}
            {purchase.gifts.map((g) => (
              <Descriptions key={g.id} column={1} size="small">
                <Descriptions.Item label="Gift">{g.quantity}× {g.gift.name}</Descriptions.Item>
                <Descriptions.Item label="To"><PlayerLink player={{ ...g.recipient, avatarUrl: null }} /></Descriptions.Item>
                <Descriptions.Item label="Popularity">{g.awardedAt ? `+${g.popularityAwarded}` : 'Delivered when the battle ends'}</Descriptions.Item>
                {g.battleId && <Descriptions.Item label="Battle"><Link to={`/battles/${g.battleId}`}>Side {g.battleSide}</Link></Descriptions.Item>}
              </Descriptions>
            ))}
            {purchase.items.map((i) => (
              <Descriptions key={i.item.id} column={1} size="small">
                <Descriptions.Item label="Item">{i.item.name} ({i.item.kind.toLowerCase()})</Descriptions.Item>
                <Descriptions.Item label="Owned since">{formatDateTime(i.acquiredAt)}</Descriptions.Item>
              </Descriptions>
            ))}
            {purchase.ledger.length === 0 && purchase.gifts.length === 0 && purchase.items.length === 0 && <EmptyState description="Nothing delivered" />}
          </Card>
        </Col>
      </Row>

      <Card title="Admin activity" size="small">
        <AuditTable params={auditParams} setParams={setAuditParams} fixed={{ entityType: 'purchase', entityId: id }} />
      </Card>
    </>
  );
}
