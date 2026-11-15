import { useNavigate } from 'react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Alert, Flex, Input, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { clipStatus, options, StatusTag } from '../../lib/labels';
import { PlayerLink } from '../../components/common';
import { useGameOptions } from '../games/api';
import { clipsApi, type Clip } from './api';

type Props = { params: ListParams; setParams: SetParams; fixed?: { userId?: string; gameId?: string } };

export function ClipThumb({ url, width = 88 }: { url: string | null; width?: number }) {
  return (
    <div
      style={{
        width,
        height: Math.round((width * 9) / 16),
        borderRadius: 8,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        background: url ? `center / cover url("${url}")` : 'var(--v-placeholder)',
      }}
    >
      <PlayCircleOutlined style={{ fontSize: 18, color: '#fff' }} />
    </div>
  );
}

/** Clips list with filters. Used on /clips and in player / game pages. */
export function ClipsTable({ params, setParams, fixed = {} }: Props) {
  const navigate = useNavigate();
  const gameOptions = useGameOptions();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['clips', 'list', query],
    queryFn: () => clipsApi.list(query),
    placeholderData: keepPreviousData,
  });

  const columns: TableProps<Clip>['columns'] = [
    {
      title: 'Clip',
      key: 'clip',
      render: (_, clip) => (
        <Flex align="center" gap={12}>
          <ClipThumb url={clip.thumbnailUrl} />
          <Flex vertical>
            <Typography.Text strong>{clip.title}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {clip.game.name}
              {clip.durationSec ? ` · ${clip.durationSec}s` : ''}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    ...(fixed.userId ? [] : [{ title: 'Player', key: 'owner', render: (_: unknown, clip: Clip) => <PlayerLink player={clip.owner} /> }]),
    {
      title: 'Status',
      key: 'status',
      render: (_, clip) => (
        <Flex gap={4} wrap>
          <StatusTag meta={clipStatus} value={clip.status} />
          {clip.live.waitingForOpponent && <Tag color="purple">Waiting for opponent</Tag>}
          {clip.live.battleId && <Tag color="magenta">In live battle</Tag>}
        </Flex>
      ),
    },
    { title: 'Likes', dataIndex: 'likesCount', render: formatNumber, sorter: false },
    { title: 'Comments', dataIndex: 'commentsCount', render: formatNumber },
    { title: 'Published', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search title or player"
          allowClear
          defaultValue={params.q as string | undefined}
          style={{ maxWidth: 300 }}
          onSearch={(q) => setParams({ q: q.trim() || undefined })}
        />
        {!fixed.gameId && (
          <Select placeholder="All games" allowClear style={{ width: 180 }} options={gameOptions} value={params.gameId as string | undefined} onChange={(gameId) => setParams({ gameId })} />
        )}
        <Select placeholder="All statuses" allowClear style={{ width: 170 }} options={options(clipStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Clip>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No clips' }}
        onRow={(clip) => ({ onClick: () => navigate(`/clips/${clip.id}`), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} clips`,
          onChange: (page, pageSize) => setParams({ page, pageSize }),
        }}
      />
    </>
  );
}
