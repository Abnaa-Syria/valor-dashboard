import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Flex, Input, Modal, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useGameOptions } from '../games/api';
import { clipStatusMeta, clipsKeys, listClips, removeClip, type Clip, type ClipStatus, type ListClipsParams } from './api';

export function ClipsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const gameOptions = useGameOptions();
  const [params, setParams] = useState<ListClipsParams>({ page: 1, pageSize: 20 });
  const [playing, setPlaying] = useState<Clip | null>(null);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: clipsKeys.list(params),
    queryFn: () => listClips(params),
    placeholderData: keepPreviousData,
  });

  async function remove(clip: Clip, reason: string) {
    try {
      await removeClip(clip.id, reason);
      message.success('Clip removed');
      queryClient.invalidateQueries({ queryKey: clipsKeys.all });
    } catch (err) {
      message.error(getErrorMessage(err));
      throw err;
    }
  }

  const columns: TableProps<Clip>['columns'] = [
    {
      title: 'Clip',
      key: 'clip',
      render: (_, clip) => (
        <Flex align="center" gap={12}>
          <div
            onClick={() => setPlaying(clip)}
            style={{
              width: 96,
              height: 54,
              borderRadius: 8,
              background: clip.thumbnailUrl ? `center / cover url("${clip.thumbnailUrl}")` : '#1b1729',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <PlayCircleOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <Flex vertical>
            <Typography.Text strong>{clip.title}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {clip.owner.username} · {clip.game.name}
            </Typography.Text>
          </Flex>
        </Flex>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, clip) => (
        <Flex gap={4} wrap>
          <Tag color={clipStatusMeta[clip.status].color}>{clipStatusMeta[clip.status].label}</Tag>
          {clip.live.waitingForOpponent && <Tag color="purple">Waiting for opponent</Tag>}
          {clip.live.battleId && <Tag color="magenta">In live battle</Tag>}
        </Flex>
      ),
    },
    { title: 'Likes', dataIndex: 'likesCount', render: formatNumber },
    { title: 'Comments', dataIndex: 'commentsCount', render: formatNumber },
    { title: 'Published', dataIndex: 'createdAt', render: formatDateTime, responsive: ['md'] },
    {
      title: '',
      key: 'actions',
      render: (_, clip) =>
        clip.status !== 'REMOVED' && (
          <RemoveWithReason
            title="Remove this clip?"
            description="The clip is hidden from everyone. If it's waiting for an opponent the entry is refunded; if it's in a live battle, the battle is cancelled and all credits are refunded."
            buttonLabel="Remove"
            confirmLabel="Remove clip"
            buttonProps={{ size: 'small' }}
            onConfirm={(reason) => remove(clip, reason)}
          />
        ),
    },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Clips
      </Typography.Title>

      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Search by title or username"
          allowClear
          style={{ maxWidth: 320 }}
          onSearch={(q) => setParams((prev) => ({ ...prev, q: q.trim() || undefined, page: 1 }))}
        />
        <Select
          placeholder="All games"
          allowClear
          style={{ width: 180 }}
          options={gameOptions}
          onChange={(gameId?: string) => setParams((prev) => ({ ...prev, gameId, page: 1 }))}
        />
        <Select<ClipStatus>
          placeholder="All statuses"
          allowClear
          style={{ width: 160 }}
          options={Object.entries(clipStatusMeta).map(([value, meta]) => ({ value: value as ClipStatus, label: meta.label }))}
          onChange={(status) => setParams((prev) => ({ ...prev, status, page: 1 }))}
        />
      </Flex>

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<Clip>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No clips yet' }}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} clips`,
          onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      <Modal open={playing !== null} title={playing?.title} footer={null} onCancel={() => setPlaying(null)} destroyOnHidden width={720}>
        {playing?.videoUrl && (
          <video src={playing.videoUrl} poster={playing.thumbnailUrl ?? undefined} controls autoPlay style={{ width: '100%', borderRadius: 8 }} />
        )}
        {playing?.description && <Typography.Paragraph style={{ marginTop: 12 }}>{playing.description}</Typography.Paragraph>}
      </Modal>
    </>
  );
}
