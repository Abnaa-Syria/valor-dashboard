import { Link } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Flex, Input, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { auditApi, entityPath, type AuditEntry } from './api';

type Props = { params: ListParams; setParams: SetParams; fixed?: { entityType?: string; entityId?: string; adminId?: string } };

/** Who changed what, and when. Used on /audit and in detail pages (Activity tab). */
export function AuditTable({ params, setParams, fixed = {} }: Props) {
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['audit', 'list', query],
    queryFn: () => auditApi.list(query),
    placeholderData: keepPreviousData,
  });
  const types = useQuery({ queryKey: ['audit', 'types'], queryFn: auditApi.entityTypes, enabled: !fixed.entityType });

  const columns: TableProps<AuditEntry>['columns'] = [
    { title: 'When', dataIndex: 'createdAt', render: formatDateTime, width: 170 },
    ...(fixed.adminId ? [] : [{ title: 'Admin', key: 'admin', render: (_: unknown, e: AuditEntry) => <Link to={`/admins/${e.admin.id}`}>{e.admin.name}</Link> }]),
    { title: 'Action', dataIndex: 'action', render: (action: string) => <Tag>{action}</Tag> },
    {
      title: 'What happened',
      key: 'summary',
      render: (_, e) => {
        const path = fixed.entityId ? null : entityPath(e.entityType, e.entityId);
        return (
          <Flex vertical>
            <Typography.Text>{e.summary}</Typography.Text>
            {path && (
              <Link to={path} style={{ fontSize: 12 }}>
                Open {e.entityType}
              </Link>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <>
      {!fixed.entityId && (
        <Flex gap={12} wrap style={{ marginBottom: 16 }}>
          <Input.Search placeholder="Search actions" allowClear defaultValue={params.q as string | undefined} style={{ maxWidth: 300 }} onSearch={(q) => setParams({ q: q.trim() || undefined })} />
          {!fixed.entityType && (
            <Select
              placeholder="All areas"
              allowClear
              style={{ width: 180 }}
              options={(types.data ?? []).map((t) => ({ value: t, label: t }))}
              value={params.entityType as string | undefined}
              onChange={(entityType) => setParams({ entityType })}
            />
          )}
        </Flex>
      )}
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<AuditEntry>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No admin activity yet' }}
        expandable={{
          rowExpandable: (e) => Boolean(e.details),
          expandedRowRender: (e) => <pre style={{ margin: 0, fontSize: 12, whiteSpace: 'pre-wrap' }}>{JSON.stringify(e.details, null, 2)}</pre>,
        }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showTotal: (total) => `${formatNumber(total)} actions`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
    </>
  );
}
