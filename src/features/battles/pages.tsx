import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Descriptions, Flex, InputNumber, Popover, Progress, Row, Table, Tabs, Tag, Typography } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useLocalParams, useUrlParams } from '../../lib/params';
import { battleStatus, rematchStatus, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { ConfirmButton, EmptyState, PageState, PlayerLink } from '../../components/common';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useCurrentAdmin } from '../auth/api';
import { AuditTable } from '../audit/AuditTable';
import { battlesApi, type BattleClip } from './api';
import { BattlesTable, EntriesTable, RematchesTable } from './tables';

export function BattlesListPage() {
  const [params, setParams] = useUrlParams();
  return (
    <>
      <PageHeader title="Battles" subtitle="All battles. Admins see both players, even while voting is live." />
      <BattlesTable params={params} setParams={setParams} />
    </>
  );
}

export function EntriesListPage() {
  const [params, setParams] = useUrlParams({ status: 'QUEUED' });
  return (
    <>
      <PageHeader title="Battle entries" subtitle="Clips waiting for an opponent, and past entries. Cancelling a waiting entry refunds its Challenge Credit." />
      <EntriesTable params={params} setParams={setParams} />
    </>
  );
}

export function RematchesListPage() {
  const [params, setParams] = useUrlParams();
  return (
    <>
      <PageHeader title="Rematches" subtitle="Rematch requests between players. Cancelling a pending one refunds the challenger." />
      <RematchesTable params={params} setParams={setParams} />
    </>
  );
}

function SideCard({ side, clip, votes, percent, winner }: { side: 'A' | 'B'; clip: BattleClip; votes: number; percent: number; winner: boolean }) {
  return (
    <Card
      size="small"
      title={
        <Flex gap={8} align="center">
          <Tag>{side}</Tag>
          <PlayerLink player={clip.player} />
          {winner && (
            <Tag color="gold" icon={<CrownFilled />}>
              Winner
            </Tag>
          )}
        </Flex>
      }
      extra={<Link to={`/clips/${clip.clipId}`}>Open clip</Link>}
      style={{ marginBottom: 16 }}
    >
      {clip.videoUrl && <video src={clip.videoUrl} poster={clip.thumbnailUrl ?? undefined} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />}
      <Typography.Paragraph style={{ marginTop: 8, marginBottom: 4 }}>{clip.title}</Typography.Paragraph>
      <Typography.Text type="secondary">
        {formatNumber(votes)} {votes === 1 ? 'vote' : 'votes'} · {percent}%
      </Typography.Text>
    </Card>
  );
}

export function BattleDetailPage() {
  const { id = '' } = useParams();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchParams();
  const { data: admin } = useCurrentAdmin();
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const [hours, setHours] = useState(6);
  const [auditParams, setAuditParams] = useLocalParams();
  const { data: battle, isPending, isError, error, refetch } = useQuery({ queryKey: ['battles', 'detail', id], queryFn: () => battlesApi.get(id) });

  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['battles'] });
  const live = battle.status === 'ACTIVE';
  const closed = battle.status === 'CLOSED';

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Battles', to: '/battles' }, { label: `${battle.clipA.player.username} vs ${battle.clipB.player.username}` }]}
        backTo="/battles"
        title={
          <Flex align="center" gap={10}>
            {battle.clipA.player.username} vs {battle.clipB.player.username}
            <StatusTag meta={battleStatus} value={battle.status} />
          </Flex>
        }
        subtitle={`${battle.game.name} · started ${formatDateTime(battle.votingStartsAt)}`}
        actions={
          live &&
          canManage && (
            <>
              <Popover
                trigger="click"
                title="Extend voting"
                content={
                  <Flex gap={8} align="center">
                    <InputNumber min={1} max={72} value={hours} onChange={(v) => setHours(v ?? 1)} addonAfter="hours" />
                    <Button
                      type="primary"
                      onClick={async () => {
                        try {
                          await battlesApi.extend(id, hours);
                          message.success(`Voting extended by ${hours}h`);
                          refresh();
                        } catch (err) {
                          message.error(getErrorMessage(err));
                        }
                      }}
                    >
                      Extend
                    </Button>
                  </Flex>
                }
              >
                <Button>Extend voting</Button>
              </Popover>
              <ConfirmButton
                title="Close voting now?"
                description="Votes are counted now, the result is announced and pending gifts are delivered."
                successMessage="Battle closed"
                onConfirm={async () => {
                  await battlesApi.close(id);
                  refresh();
                }}
              >
                Close now
              </ConfirmButton>
              <RemoveWithReason
                title="Cancel this battle?"
                description="Voting stops, both players and every voter are refunded. This can't be undone."
                buttonLabel="Cancel battle"
                confirmLabel="Cancel battle"
                onConfirm={async (reason) => {
                  try {
                    await battlesApi.cancel(id, reason);
                    message.success('Battle cancelled, everyone refunded');
                    refresh();
                  } catch (err) {
                    message.error(getErrorMessage(err));
                    throw err;
                  }
                }}
              />
            </>
          )
        }
      />

      {live && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Voting ends ${formatDateTime(battle.votingEndsAt)}. Players don't see who made which clip until then — you do.`}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, md: 4 }} size="small">
          <Descriptions.Item label="Result">
            {closed ? (battle.winnerSide ? `Side ${battle.winnerSide} wins` : 'Draw') : live ? 'Voting live' : 'Cancelled'}
          </Descriptions.Item>
          <Descriptions.Item label="Votes">
            {battle.votesA} – {battle.votesB} ({battle.totalVotes})
          </Descriptions.Item>
          <Descriptions.Item label={battle.closedAt ? 'Ended' : 'Ends'}>{formatDateTime(battle.closedAt ?? battle.votingEndsAt)}</Descriptions.Item>
          <Descriptions.Item label="Rematch">
            {battle.rematch ? (
              <Flex gap={6}>
                <StatusTag meta={rematchStatus} value={battle.rematch.status} />
                {battle.rematch.battleId && <Link to={`/battles/${battle.rematch.battleId}`}>Open</Link>}
              </Flex>
            ) : battle.rematchOf ? (
              <Link to={`/battles/${battle.rematchOf.originalBattleId}`}>This is a rematch — open the first battle</Link>
            ) : (
              '—'
            )}
          </Descriptions.Item>
        </Descriptions>
        <Progress percent={battle.totalVotes ? battle.percentA : 0} showInfo={false} strokeColor="var(--v-chart-ink)" style={{ marginTop: 8 }} />
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <SideCard side="A" clip={battle.clipA} votes={battle.votesA} percent={battle.percentA} winner={closed && battle.winnerSide === 'A'} />
        </Col>
        <Col xs={24} md={12}>
          <SideCard side="B" clip={battle.clipB} votes={battle.votesB} percent={battle.percentB} winner={closed && battle.winnerSide === 'B'} />
        </Col>
      </Row>

      <Tabs
        activeKey={search.get('tab') ?? 'votes'}
        onChange={(key) => setSearch({ tab: key }, { replace: true })}
        items={[
          {
            key: 'votes',
            label: `Votes (${battle.votes.length})`,
            children: (
              <Table
                rowKey={(v) => v.user.id}
                size="small"
                dataSource={battle.votes}
                locale={{ emptyText: 'No votes yet' }}
                columns={[
                  { title: 'Voter', key: 'user', render: (_, v) => <PlayerLink player={{ ...v.user, avatarUrl: null }} /> },
                  { title: 'Voted for', dataIndex: 'side', render: (s: string) => <Tag>Side {s}</Tag> },
                  { title: 'When', dataIndex: 'createdAt', render: formatDateTime },
                ]}
              />
            ),
          },
          {
            key: 'gifts',
            label: `Gifts (${battle.gifts.length})`,
            children: battle.gifts.length ? (
              <Table
                rowKey="id"
                size="small"
                dataSource={battle.gifts}
                pagination={false}
                columns={[
                  { title: 'From', key: 'sender', render: (_, g) => <PlayerLink player={{ ...g.sender, avatarUrl: null }} /> },
                  { title: 'To side', dataIndex: 'battleSide' },
                  { title: 'Gift', key: 'gift', render: (_, g) => `${g.quantity}× ${g.gift.name}` },
                  { title: 'Popularity', key: 'pop', render: (_, g) => (g.awardedAt ? `+${g.popularityAwarded} delivered` : 'Delivered when the battle ends') },
                  { title: 'Sent', dataIndex: 'createdAt', render: formatDateTime },
                ]}
              />
            ) : (
              <EmptyState description="No gifts in this battle" />
            ),
          },
          {
            key: 'entries',
            label: 'Entries',
            children: (
              <Table
                rowKey="id"
                size="small"
                dataSource={battle.tickets}
                pagination={false}
                locale={{ emptyText: 'Started as a rematch (no matchmaking entries)' }}
                columns={[
                  { title: 'Player', key: 'user', render: (_, t) => t.user.username },
                  { title: 'Criteria', key: 'criteria', render: (_, t) => <Flex gap={4}><Tag>{t.weaponClass}</Tag><Tag>{t.rank}</Tag></Flex> },
                  { title: 'Entered', dataIndex: 'createdAt', render: formatDateTime },
                  { title: 'Matched', dataIndex: 'matchedAt', render: formatDateTime },
                ]}
              />
            ),
          },
          { key: 'activity', label: 'Admin activity', children: <AuditTable params={auditParams} setParams={setAuditParams} fixed={{ entityType: 'battle', entityId: id }} /> },
        ]}
      />
    </>
  );
}
