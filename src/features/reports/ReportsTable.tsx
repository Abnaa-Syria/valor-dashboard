import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Flex, Segmented, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { options, reportStatus, reportTarget, StatusTag } from '../../lib/labels';
import { PlayerLink } from '../../components/common';
import { reportsApi, type Report } from './api';

type Props = { params: ListParams; setParams: SetParams; fixed?: { involvesUserId?: string; targetId?: string } };

export function TargetSummary({ report }: { report: Pick<Report, 'target'> }) {
  const target = report.target;
  if (!target) return <Typography.Text type="secondary">No longer exists</Typography.Text>;
  if ('title' in target) {
    return (
      <Flex vertical>
        <Typography.Text strong>{target.title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>by {target.owner.username}</Typography.Text>
      </Flex>
    );
  }
  if ('body' in target) {
    return (
      <Flex vertical>
        <Typography.Text ellipsis style={{ maxWidth: 300 }}>“{target.body}”</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>by {target.owner.username}</Typography.Text>
      </Flex>
    );
  }
  return <Typography.Text>{target.username}</Typography.Text>;
}

export function ReportsTable({ params, setParams, fixed = {} }: Props) {
  const navigate = useNavigate();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['reports', 'list', query],
    queryFn: () => reportsApi.list(query),
    placeholderData: keepPreviousData,
  });

  const columns: TableProps<Report>['columns'] = [
    { title: 'Type', dataIndex: 'targetType', render: (t: string) => <StatusTag meta={reportTarget} value={t} /> },
    { title: 'Reported', key: 'target', render: (_, r) => <TargetSummary report={r} /> },
    { title: 'Reason', dataIndex: 'reason', render: (reason: string) => <Typography.Text ellipsis style={{ maxWidth: 260 }}>{reason}</Typography.Text> },
    { title: 'By', key: 'reporter', render: (_, r) => <PlayerLink player={r.reporter} /> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={reportStatus} value={s} /> },
    { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Segmented
          value={(params.status as string | undefined) ?? 'ALL'}
          options={[{ value: 'ALL', label: 'All' }, ...options(reportStatus)]}
          onChange={(value) => setParams({ status: value === 'ALL' ? undefined : (value as string) })}
        />
        <Select placeholder="All types" allowClear style={{ width: 150 }} options={options(reportTarget)} value={params.targetType as string | undefined} onChange={(targetType) => setParams({ targetType })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Report>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No reports' }}
        rowClassName={(r) => (r.status === 'OPEN' ? 'row-attention' : '')}
        onRow={(r) => ({ onClick: () => navigate(`/reports/${r.id}`), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showTotal: (total) => `${formatNumber(total)} reports`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
      {(data?.items.some((r) => r.status === 'OPEN') ?? false) && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          <Tag color="orange">Open</Tag> reports need a decision — open one to review it.
        </Typography.Text>
      )}
    </>
  );
}
