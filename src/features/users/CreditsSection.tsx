import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, Flex, Form, Input, InputNumber, Segmented, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { adjustCredits, ledgerReasonLabels, listLedger, usersKeys, type CreditType, type LedgerEntry, type UserDetails } from './api';

type Props = { user: UserDetails; canAdjust: boolean };
type AdjustValues = { type: CreditType; direction: 'add' | 'remove'; amount: number; note: string };

const typeLabels: Record<CreditType, string> = { VOTING: 'Voting', CHALLENGE: 'Challenge' };

const columns: TableProps<LedgerEntry>['columns'] = [
  { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
  {
    title: 'Activity',
    key: 'reason',
    render: (_, entry) => (
      <Flex vertical>
        <Typography.Text>{ledgerReasonLabels[entry.reason] ?? entry.reason}</Typography.Text>
        {entry.note && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {entry.note}
          </Typography.Text>
        )}
      </Flex>
    ),
  },
  { title: 'Wallet', dataIndex: 'type', render: (type: CreditType) => typeLabels[type] },
  { title: 'Source', dataIndex: 'source', render: (source: string) => <Tag>{source === 'FREE' ? 'Free' : 'Purchased'}</Tag> },
  {
    title: 'Amount',
    dataIndex: 'amount',
    align: 'right',
    render: (amount: number) => (
      <Typography.Text type={amount > 0 ? 'success' : 'danger'}>{amount > 0 ? `+${amount}` : amount}</Typography.Text>
    ),
  },
];

export function CreditsSection({ user, canAdjust }: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<AdjustValues>();
  const [ledgerType, setLedgerType] = useState<CreditType | undefined>(undefined);
  const [page, setPage] = useState(1);

  const ledger = useQuery({
    queryKey: ['users', 'ledger', user.id, ledgerType, page],
    queryFn: () => listLedger(user.id, { page, pageSize: 10, type: ledgerType }),
    placeholderData: keepPreviousData,
  });

  const adjustMutation = useMutation({
    mutationFn: (values: AdjustValues) =>
      adjustCredits(user.id, {
        type: values.type,
        amount: values.direction === 'add' ? values.amount : -values.amount,
        note: values.note,
      }),
    onSuccess: () => {
      message.success('Credits updated');
      form.resetFields(['amount', 'note']);
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
      queryClient.invalidateQueries({ queryKey: ['users', 'ledger', user.id] });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const balance = (type: CreditType) => user.balances.find((b) => b.type === type);

  return (
    <Flex vertical gap={16}>
      <Flex gap={12}>
        {(['VOTING', 'CHALLENGE'] as const).map((type) => {
          const row = balance(type);
          return (
            <Card key={type} size="small" style={{ flex: 1 }}>
              <Typography.Text type="secondary">{typeLabels[type]} credits</Typography.Text>
              <Typography.Title level={3} style={{ margin: '4px 0' }}>
                {(row?.freeBalance ?? 0) + (row?.purchasedBalance ?? 0)}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {row?.freeBalance ?? 0} free today · {row?.purchasedBalance ?? 0} purchased
              </Typography.Text>
            </Card>
          );
        })}
      </Flex>

      {canAdjust && (
        <Card size="small" title="Adjust purchased credits">
          <Form<AdjustValues>
            form={form}
            layout="vertical"
            initialValues={{ type: 'VOTING', direction: 'add' }}
            onFinish={(values) => adjustMutation.mutate(values)}
            disabled={adjustMutation.isPending}
          >
            <Flex gap={12} wrap>
              <Form.Item name="type" label="Wallet">
                <Select style={{ width: 130 }} options={[{ value: 'VOTING', label: 'Voting' }, { value: 'CHALLENGE', label: 'Challenge' }]} />
              </Form.Item>
              <Form.Item name="direction" label="Action">
                <Select style={{ width: 110 }} options={[{ value: 'add', label: 'Add' }, { value: 'remove', label: 'Deduct' }]} />
              </Form.Item>
              <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
                <InputNumber min={1} max={1000} precision={0} style={{ width: 100 }} />
              </Form.Item>
            </Flex>
            <Form.Item name="note" label="Reason" rules={[{ required: true, min: 3, message: 'Add a reason (shown in the ledger)' }]}>
              <Input maxLength={200} placeholder="e.g. Compensation for failed purchase" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={adjustMutation.isPending}>
              Apply
            </Button>
          </Form>
        </Card>
      )}

      <Flex justify="space-between" align="center">
        <Typography.Text strong>Ledger</Typography.Text>
        <Segmented<CreditType | 'ALL'>
          size="small"
          value={ledgerType ?? 'ALL'}
          options={[{ value: 'ALL', label: 'All' }, { value: 'VOTING', label: 'Voting' }, { value: 'CHALLENGE', label: 'Challenge' }]}
          onChange={(value) => {
            setLedgerType(value === 'ALL' ? undefined : value);
            setPage(1);
          }}
        />
      </Flex>
      <Table<LedgerEntry>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={ledger.data?.items}
        loading={ledger.isFetching}
        locale={{ emptyText: 'No activity yet' }}
        pagination={{ current: page, pageSize: 10, total: ledger.data?.meta.total, onChange: setPage, showSizeChanger: false }}
      />
    </Flex>
  );
}
