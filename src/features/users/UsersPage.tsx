import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Avatar, Flex, Input, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { listUsers, statusMeta, usersKeys, type ListUsersParams, type UserListItem, type UserStatus } from './api';
import { UserDrawer } from './UserDrawer';

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
  {
    title: 'Status',
    dataIndex: 'status',
    render: (status: UserStatus) => <Tag color={statusMeta[status].color}>{statusMeta[status].label}</Tag>,
  },
  { title: 'Popularity', dataIndex: 'popularity', render: formatNumber },
  { title: 'Joined', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
  { title: 'Last seen', dataIndex: 'lastSeenAt', render: formatDateTime, responsive: ['lg'] },
];

export function UsersPage() {
  const [params, setParams] = useState<ListUsersParams>({ page: 1, pageSize: 20 });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: usersKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Players
      </Typography.Title>

      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by username or email"
          allowClear
          style={{ maxWidth: 320 }}
          onSearch={(q) => setParams((prev) => ({ ...prev, q: q.trim() || undefined, page: 1 }))}
        />
        <Select<UserStatus>
          placeholder="All statuses"
          allowClear
          style={{ width: 160 }}
          options={Object.entries(statusMeta).map(([value, meta]) => ({ value: value as UserStatus, label: meta.label }))}
          onChange={(status) => setParams((prev) => ({ ...prev, status, page: 1 }))}
        />
      </Flex>

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<UserListItem>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No players yet' }}
        onRow={(user) => ({ onClick: () => setSelectedId(user.id), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} players`,
          onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
