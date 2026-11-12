import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Checkbox, Flex, Input, Modal, Segmented, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import {
  listReports,
  reportStatusMeta,
  reportsKeys,
  resolveReport,
  targetLabels,
  type ListReportsParams,
  type Report,
  type ReportStatus,
  type ReportTarget,
} from './api';

function TargetSummary({ report }: { report: Report }) {
  const target = report.target;
  if (!target) return <Typography.Text type="secondary">No longer exists</Typography.Text>;
  if ('title' in target) {
    return (
      <Flex vertical>
        <Typography.Text strong>{target.title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          by {target.owner.username} · {target.status.toLowerCase()}
        </Typography.Text>
      </Flex>
    );
  }
  if ('body' in target) {
    return (
      <Flex vertical>
        <Typography.Text ellipsis style={{ maxWidth: 320 }}>“{target.body}”</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          by {target.owner.username} · {target.status.toLowerCase()}
        </Typography.Text>
      </Flex>
    );
  }
  return (
    <Typography.Text>
      {target.username} <Tag>{target.status.toLowerCase()}</Tag>
    </Typography.Text>
  );
}

export function ReportsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [params, setParams] = useState<ListReportsParams>({ page: 1, pageSize: 20, status: 'OPEN' });
  const [handling, setHandling] = useState<Report | null>(null);
  const [note, setNote] = useState('');
  const [removeContent, setRemoveContent] = useState(true);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: reportsKeys.list(params),
    queryFn: () => listReports(params),
    placeholderData: keepPreviousData,
  });

  const resolveMutation = useMutation({
    mutationFn: (status: 'RESOLVED' | 'DISMISSED') =>
      resolveReport(handling!.id, {
        status,
        note: note.trim() || undefined,
        removeContent: status === 'RESOLVED' && handling!.targetType !== 'USER' && removeContent,
      }),
    onSuccess: (_, status) => {
      message.success(status === 'RESOLVED' ? 'Report resolved' : 'Report dismissed');
      queryClient.invalidateQueries({ queryKey: reportsKeys.all });
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      setHandling(null);
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  function openReport(report: Report) {
    setHandling(report);
    setNote('');
    setRemoveContent(true);
  }

  const columns: TableProps<Report>['columns'] = [
    { title: 'Type', dataIndex: 'targetType', render: (type: ReportTarget) => <Tag>{targetLabels[type]}</Tag> },
    { title: 'Reported', key: 'target', render: (_, report) => <TargetSummary report={report} /> },
    { title: 'Reason', dataIndex: 'reason', render: (reason: string) => <Typography.Text ellipsis style={{ maxWidth: 260 }}>{reason}</Typography.Text> },
    { title: 'By', key: 'reporter', render: (_, report) => report.reporter.username, responsive: ['lg'] },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: ReportStatus) => <Tag color={reportStatusMeta[status].color}>{reportStatusMeta[status].label}</Tag>,
    },
    { title: 'Date', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
    {
      title: '',
      key: 'actions',
      render: (_, report) => report.status === 'OPEN' && <Button size="small" onClick={() => openReport(report)}>Review</Button>,
    },
  ];

  const target = handling?.target;

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Reports
      </Typography.Title>

      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Segmented<ReportStatus | 'ALL'>
          value={params.status ?? 'ALL'}
          options={[
            { value: 'OPEN', label: 'Open' },
            { value: 'RESOLVED', label: 'Resolved' },
            { value: 'DISMISSED', label: 'Dismissed' },
            { value: 'ALL', label: 'All' },
          ]}
          onChange={(value) => setParams((prev) => ({ ...prev, status: value === 'ALL' ? undefined : value, page: 1 }))}
        />
        <Select<ReportTarget>
          placeholder="All types"
          allowClear
          style={{ width: 160 }}
          options={Object.entries(targetLabels).map(([value, label]) => ({ value: value as ReportTarget, label }))}
          onChange={(targetType) => setParams((prev) => ({ ...prev, targetType, page: 1 }))}
        />
      </Flex>

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<Report>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: params.status === 'OPEN' ? 'No open reports' : 'No reports' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showTotal: (total) => `${formatNumber(total)} reports`,
          onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      <Modal
        open={handling !== null}
        title={handling ? `Review ${targetLabels[handling.targetType].toLowerCase()} report` : ''}
        onCancel={() => setHandling(null)}
        destroyOnHidden
        width={640}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={() => resolveMutation.mutate('DISMISSED')} loading={resolveMutation.isPending && resolveMutation.variables === 'DISMISSED'}>
              Dismiss
            </Button>
            <Button type="primary" danger={removeContent && handling?.targetType !== 'USER'} onClick={() => resolveMutation.mutate('RESOLVED')} loading={resolveMutation.isPending && resolveMutation.variables === 'RESOLVED'}>
              Resolve
            </Button>
          </Flex>
        }
      >
        {handling && (
          <Flex vertical gap={12}>
            <Typography.Text type="secondary">
              Reported by {handling.reporter.username} · {formatDateTime(handling.createdAt)}
            </Typography.Text>
            <Typography.Paragraph style={{ margin: 0 }}>“{handling.reason}”</Typography.Paragraph>

            {target && 'videoUrl' in target && target.videoUrl && (
              <video src={target.videoUrl} poster={target.thumbnailUrl ?? undefined} controls style={{ width: '100%', borderRadius: 8 }} />
            )}
            {target && 'body' in target && <Alert type="warning" message={`“${target.body}” — ${target.owner.username}`} />}
            {handling.targetType === 'USER' && (
              <Alert type="info" showIcon message="To suspend or ban this player, use the Players page." />
            )}

            {handling.targetType !== 'USER' && (
              <Checkbox checked={removeContent} onChange={(event) => setRemoveContent(event.target.checked)}>
                Remove this {targetLabels[handling.targetType].toLowerCase()} when resolving
              </Checkbox>
            )}
            <Input.TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note (optional)" maxLength={500} autoSize={{ minRows: 2 }} />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Every open report about the same content is closed with this decision.
            </Typography.Text>
          </Flex>
        )}
      </Modal>
    </>
  );
}
