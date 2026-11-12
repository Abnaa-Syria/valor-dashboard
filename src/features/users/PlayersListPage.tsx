import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Button, Flex, Input, Select, Table, Typography, type TableProps } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, useUrlParams } from '../../lib/params';
import { options, playerStatus, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { useCurrentAdmin } from '../auth/api';
import { listUsers, type UserListItem } from './api';

const columns: TableProps<UserListItem>['columns'] = [
  {
    title: 'Player',
    key: 'user',
    render: (_, user) => (
      <Flex align="center" gap={10}>
        <Avatar src={user.avatarUrl} icon={<UserOutlined />} />
        <Flex vertical>
          <Typography.Text strong>{user.username}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {user.email}
          </Typography.Text>
        </Flex>
      </Flex>
    ),
  },
  { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={playerStatus} value={s} /> },
  { title: 'Popularity', dataIndex: 'popularity', render: formatNumber },
  { title: 'Joined', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
  { title: 'Last seen', dataIndex: 'lastSeenAt', render: formatDateTime, responsive: ['lg'] },
];

export function PlayersListPage() {
  const navigate = useNavigate();
  const { data: admin } = useCurrentAdmin();
  const canManage = admin?.role !== 'MODERATOR';
  const [params, setParams] = useUrlParams();
  const query = clean(params);
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['users', 'list', query],
    queryFn: () => listUsers(query as never),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Players"
        subtitle="Everyone with a VALOR account"
        actions={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/players/new')}>
              Add player
            </Button>
          )
        }
      />
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search username or email"
          allowClear
          defaultValue={params.q as string | undefined}
          style={{ maxWidth: 320 }}
          onSearch={(q) => setParams({ q: q.trim() || undefined })}
        />
        <Select placeholder="All statuses" allowClear style={{ width: 190 }} options={options(playerStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<UserListItem>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No players' }}
        onRow={(user) => ({ onClick: () => navigate(`/players/${user.id}`), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} players`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
    </>
  );
}
