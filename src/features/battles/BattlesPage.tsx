import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Card, Col, Descriptions, Drawer, Flex, Progress, Row, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useCurrentAdmin } from '../auth/api';
import { useGameOptions } from '../games/api';
import {
  battlesKeys,
  battleStatusMeta,
  cancelBattle,
  listBattles,
  type Battle,
  type BattleClip,
  type BattleSide,
  type BattleStatus,
  type ListBattlesParams,
} from './api';

function sideLabel(battle: Battle, side: BattleSide) {
  const clip = side === 'A' ? battle.clipA : battle.clipB;
  const winner = battle.status === 'CLOSED' && battle.winnerSide === side;
  return (
    <Flex align="center" gap={6}>
      <Tag>{side}</Tag>
      <Typography.Text strong={winner}>{clip.player.username}</Typography.Text>
      {winner && <CrownFilled style={{ color: '#f5c542' }} />}
    </Flex>
  );
}

function ClipCard({ side, clip, votes, percent, winner }: { side: BattleSide; clip: BattleClip; votes: number; percent: number; winner: boolean }) {
  return (
    <Card size="small" title={<Flex gap={8} align="center"><Tag>{side}</Tag>{clip.player.username}{winner && <CrownFilled style={{ color: '#f5c542' }} />}</Flex>}>
      {clip.videoUrl && <video src={clip.videoUrl} poster={clip.thumbnailUrl ?? undefined} controls style={{ width: '100%', borderRadius: 8 }} />}
      <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{clip.title}</Typography.Paragraph>
      <Typography.Text type="secondary">
        {formatNumber(votes)} votes · {percent}%
      </Typography.Text>
    </Card>
  );
}

export function BattlesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const gameOptions = useGameOptions();
  const { data: admin } = useCurrentAdmin();
  const canCancel = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const [params, setParams] = useState<ListBattlesParams>({ page: 1, pageSize: 20 });
  const [selected, setSelected] = useState<Battle | null>(null);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: battlesKeys.list(params),
    queryFn: () => listBattles(params),
    placeholderData: keepPreviousData,
  });

  async function cancel(battle: Battle, reason: string) {
    try {
      const updated = await cancelBattle(battle.id, reason);
      message.success('Battle cancelled, all credits refunded');
      setSelected(updated);
      queryClient.invalidateQueries({ queryKey: battlesKeys.all });
    } catch (err) {
      message.error(getErrorMessage(err));
      throw err;
    }
  }

  const columns: TableProps<Battle>['columns'] = [
    { title: 'Side A', key: 'a', render: (_, battle) => sideLabel(battle, 'A') },
    { title: 'Side B', key: 'b', render: (_, battle) => sideLabel(battle, 'B') },
    { title: 'Game', key: 'game', render: (_, battle) => battle.game.name },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: BattleStatus) => <Tag color={battleStatusMeta[status].color}>{battleStatusMeta[status].label}</Tag>,
    },
    {
      title: 'Votes',
      key: 'votes',
      render: (_, battle) => (
        <Flex vertical style={{ minWidth: 140 }}>
          <Typography.Text>
            {battle.votesA} – {battle.votesB}
          </Typography.Text>
          <Progress percent={battle.totalVotes ? battle.percentA : 0} showInfo={false} size="small" strokeColor="#7c3aed" trailColor="#d946ef" />
        </Flex>
      ),
    },
    {
      title: 'Voting ends',
      key: 'ends',
      render: (_, battle) => formatDateTime(battle.closedAt ?? battle.votingEndsAt),
      responsive: ['md'],
    },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Battles
      </Typography.Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Players never see who made which clip while voting is live. Admins can, for moderation."
      />

      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="All games"
          allowClear
          style={{ width: 180 }}
          options={gameOptions}
          onChange={(gameId?: string) => setParams((prev) => ({ ...prev, gameId, page: 1 }))}
        />
        <Select<BattleStatus>
          placeholder="All statuses"
          allowClear
          style={{ width: 160 }}
          options={Object.entries(battleStatusMeta).map(([value, meta]) => ({ value: value as BattleStatus, label: meta.label }))}
          onChange={(status) => setParams((prev) => ({ ...prev, status, page: 1 }))}
        />
      </Flex>

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<Battle>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No battles yet' }}
        onRow={(battle) => ({ onClick: () => setSelected(battle), style: { cursor: 'pointer' } })}
        pagination={{
          current: params.page,
          pageSize: params.pageSize,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${formatNumber(total)} battles`,
          onChange: (page, pageSize) => setParams((prev) => ({ ...prev, page, pageSize })),
        }}
      />

      <Drawer open={selected !== null} onClose={() => setSelected(null)} width={760} title="Battle" destroyOnHidden>
        {selected && (
          <Flex vertical gap={16}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Status">
                <Tag color={battleStatusMeta[selected.status].color}>{battleStatusMeta[selected.status].label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Game">{selected.game.name}</Descriptions.Item>
              <Descriptions.Item label="Started">{formatDateTime(selected.votingStartsAt)}</Descriptions.Item>
              <Descriptions.Item label={selected.closedAt ? 'Ended' : 'Voting ends'}>
                {formatDateTime(selected.closedAt ?? selected.votingEndsAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Result" span={2}>
                {selected.status === 'CLOSED'
                  ? selected.winnerSide
                    ? `Side ${selected.winnerSide} wins (${selected.percentA}% – ${selected.percentB}%)`
                    : 'Draw'
                  : '—'}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <ClipCard side="A" clip={selected.clipA} votes={selected.votesA} percent={selected.percentA} winner={selected.status === 'CLOSED' && selected.winnerSide === 'A'} />
              </Col>
              <Col span={12}>
                <ClipCard side="B" clip={selected.clipB} votes={selected.votesB} percent={selected.percentB} winner={selected.status === 'CLOSED' && selected.winnerSide === 'B'} />
              </Col>
            </Row>

            {canCancel && selected.status === 'ACTIVE' && (
              <RemoveWithReason
                title="Cancel this battle?"
                description="Voting stops, both players get their Challenge Credit back and every voter gets their Voting Credit back. This can't be undone."
                buttonLabel="Cancel battle"
                confirmLabel="Cancel battle"
                onConfirm={(reason) => cancel(selected, reason)}
              />
            )}
          </Flex>
        )}
      </Drawer>
    </>
  );
}
