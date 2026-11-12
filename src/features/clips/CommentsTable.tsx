import { Link } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Flex, Input, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { commentStatus, options, StatusTag } from '../../lib/labels';
import { ConfirmButton, PlayerLink } from '../../components/common';
import { clipsApi, type Comment } from './api';

type Props = { params: ListParams; setParams: SetParams; fixed?: { clipId?: string; userId?: string } };

/** Comments with remove / restore. Used on /comments, a clip page and a player page. */
export function CommentsTable({ params, setParams, fixed = {} }: Props) {
  const queryClient = useQueryClient();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['comments', 'list', query],
    queryFn: () => clipsApi.comments(query),
    placeholderData: keepPreviousData,
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['comments'] });
    queryClient.invalidateQueries({ queryKey: ['clips'] });
  };

  const columns: TableProps<Comment>['columns'] = [
    {
      title: 'Comment',
      dataIndex: 'body',
      render: (body: string) => <Typography.Paragraph style={{ margin: 0, maxWidth: 420 }} ellipsis={{ rows: 2, expandable: true }}>{body}</Typography.Paragraph>,
    },
    ...(fixed.userId ? [] : [{ title: 'By', key: 'user', render: (_: unknown, c: Comment) => <PlayerLink player={c.user} /> }]),
    ...(fixed.clipId ? [] : [{ title: 'On clip', key: 'clip', render: (_: unknown, c: Comment) => <Link to={`/clips/${c.clip.id}`}>{c.clip.title}</Link> }]),
    {
      title: 'Status',
      key: 'status',
      render: (_, c) => (
        <Flex gap={4}>
          <StatusTag meta={commentStatus} value={c.status} />
          {c.reportsCount > 0 && <Tag color="orange">{c.reportsCount} reports</Tag>}
        </Flex>
      ),
    },
    { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
    {
      title: '',
      key: 'actions',
      render: (_, c) =>
        c.status === 'VISIBLE' ? (
          <ConfirmButton size="small" danger title="Remove this comment?" successMessage="Comment removed" onConfirm={async () => { await clipsApi.removeComment(c.id); refresh(); }}>
            Remove
          </ConfirmButton>
        ) : (
          <ConfirmButton size="small" title="Show this comment again?" successMessage="Comment restored" onConfirm={async () => { await clipsApi.restoreComment(c.id); refresh(); }}>
            Restore
          </ConfirmButton>
        ),
    },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search placeholder="Search text or player" allowClear defaultValue={params.q as string | undefined} style={{ maxWidth: 300 }} onSearch={(q) => setParams({ q: q.trim() || undefined })} />
        <Select placeholder="All statuses" allowClear style={{ width: 160 }} options={options(commentStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Comment>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No comments' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} comments`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
    </>
  );
}
