import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Checkbox, Col, Descriptions, Flex, Input, Row, Table, Typography } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useUrlParams } from '../../lib/params';
import { reportStatus, reportTarget, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { PageState, PlayerLink } from '../../components/common';
import { reportsApi, targetLink } from './api';
import { ReportsTable, TargetSummary } from './ReportsTable';

export function ReportsListPage() {
  const [params, setParams] = useUrlParams({ status: 'OPEN' });
  return (
    <>
      <PageHeader title="Reports" subtitle="What players reported. Open a report to review the content and decide." />
      <ReportsTable params={params} setParams={setParams} />
    </>
  );
}

export function ReportDetailPage() {
  const { id = '' } = useParams();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const [removeContent, setRemoveContent] = useState(true);
  const { data: report, isPending, isError, error, refetch } = useQuery({ queryKey: ['reports', 'detail', id], queryFn: () => reportsApi.get(id) });

  const resolve = useMutation({
    mutationFn: (status: 'RESOLVED' | 'DISMISSED') =>
      reportsApi.resolve(id, { status, note: note.trim() || undefined, removeContent: status === 'RESOLVED' && report?.targetType !== 'USER' && removeContent }),
    onSuccess: (_, status) => {
      message.success(status === 'RESOLVED' ? 'Report resolved' : 'Report dismissed');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;
  const target = report.target;
  const link = targetLink(report);
  const open = report.status === 'OPEN';
  const noun = reportTarget[report.targetType]?.label.toLowerCase();

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Reports', to: '/reports' }, { label: `${reportTarget[report.targetType]?.label} report` }]}
        backTo="/reports"
        title={
          <Flex align="center" gap={10}>
            {reportTarget[report.targetType]?.label} report
            <StatusTag meta={reportStatus} value={report.status} />
          </Flex>
        }
        subtitle={`Reported ${formatDateTime(report.createdAt)}`}
      />

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card title="Reported content" extra={link && <Link to={link}>Open {noun}</Link>} style={{ marginBottom: 16 }}>
            {!target && <Alert type="warning" showIcon message="The reported content no longer exists." />}
            {target && 'videoUrl' in target && target.videoUrl && (
              <video src={target.videoUrl} poster={target.thumbnailUrl ?? undefined} controls style={{ width: '100%', borderRadius: 8, background: '#000', marginBottom: 12 }} />
            )}
            {target && <TargetSummary report={report} />}
            {target && 'body' in target && <Typography.Paragraph style={{ marginTop: 12 }}>“{target.body}”</Typography.Paragraph>}
            {target && <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>Current status: {target.status.toLowerCase()}</Typography.Paragraph>}
          </Card>

          <Card title={`Other reports about this ${noun} (${report.related.length})`} size="small" style={{ marginBottom: 16 }}>
            <Table
              rowKey="id"
              size="small"
              dataSource={report.related}
              pagination={false}
              locale={{ emptyText: 'No other reports' }}
              columns={[
                { title: 'By', key: 'by', render: (_, r) => <PlayerLink player={{ ...r.reporter, avatarUrl: null }} /> },
                { title: 'Reason', dataIndex: 'reason' },
                { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={reportStatus} value={s} /> },
                { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
                { title: '', key: 'open', render: (_, r) => <Link to={`/reports/${r.id}`}>Open</Link> },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Report" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Reported by"><PlayerLink player={{ ...report.reporter, avatarUrl: null }} /></Descriptions.Item>
              <Descriptions.Item label="Reason">{report.reason}</Descriptions.Item>
              {!open && <Descriptions.Item label="Decided by">{report.resolvedBy?.name ?? '—'}</Descriptions.Item>}
              {!open && <Descriptions.Item label="Decided">{formatDateTime(report.resolvedAt)}</Descriptions.Item>}
              {!open && <Descriptions.Item label="Note">{report.resolutionNote || '—'}</Descriptions.Item>}
            </Descriptions>
          </Card>

          {open && (
            <Card title="Decision" size="small">
              <Flex vertical gap={12}>
                {report.targetType === 'USER' ? (
                  <Alert type="info" showIcon message="To suspend or ban the player, open their page." action={<Link to={`/players/${report.targetId}`}>Open player</Link>} />
                ) : (
                  <Checkbox checked={removeContent} onChange={(e) => setRemoveContent(e.target.checked)}>
                    Remove this {noun} when resolving
                  </Checkbox>
                )}
                <Input.TextArea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional, kept with the decision)" maxLength={500} autoSize={{ minRows: 2 }} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Every open report about the same {noun} is closed with this decision.
                </Typography.Text>
                <Flex gap={8} justify="flex-end">
                  <Button onClick={() => resolve.mutate('DISMISSED')} loading={resolve.isPending && resolve.variables === 'DISMISSED'}>
                    Dismiss
                  </Button>
                  <Button type="primary" danger={removeContent && report.targetType !== 'USER'} onClick={() => resolve.mutate('RESOLVED')} loading={resolve.isPending && resolve.variables === 'RESOLVED'}>
                    Resolve
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}
        </Col>
      </Row>
    </>
  );
}
