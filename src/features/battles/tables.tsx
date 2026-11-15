import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Flex, Input, Progress, Select, Table, Tag, Typography, type TableProps } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { clean, type ListParams, type SetParams } from '../../lib/params';
import { battleStatus, entryStatus, options, rematchStatus, StatusTag } from '../../lib/labels';
import { PlayerLink } from '../../components/common';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useGameOptions } from '../games/api';
import { battlesApi, type Battle, type Entry, type Rematch } from './api';
import { MatchEntryButton, MatchEntryModal } from './MatchEntryModal';

type Props = { params: ListParams; setParams: SetParams; fixed?: { userId?: string; gameId?: string } };

function Side({ battle, side }: { battle: Battle; side: 'A' | 'B' }) {
  const clip = side === 'A' ? battle.clipA : battle.clipB;
  const won = battle.status === 'CLOSED' && battle.winnerSide === side;
  return (
    <Flex align="center" gap={6}>
      <Tag>{side}</Tag>
      <PlayerLink player={clip.player} />
      {won && <CrownFilled style={{ color: '#f5c542' }} aria-label="Winner" />}
    </Flex>
  );
}

const pagination = (params: ListParams, setParams: SetParams, total: number | undefined, noun: string) => ({
  current: params.page,
  pageSize: params.pageSize,
  total,
  showSizeChanger: true,
  showTotal: (n: number) => `${formatNumber(n)} ${noun}`,
  onChange: (page: number, pageSize: number) => setParams({ page, pageSize }),
});

export function BattlesTable({ params, setParams, fixed = {} }: Props) {
  const navigate = useNavigate();
  const gameOptions = useGameOptions();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['battles', 'list', query],
    queryFn: () => battlesApi.list(query),
    placeholderData: keepPreviousData,
  });

  const columns: TableProps<Battle>['columns'] = [
    { title: 'Side A', key: 'a', render: (_, b) => <Side battle={b} side="A" /> },
    { title: 'Side B', key: 'b', render: (_, b) => <Side battle={b} side="B" /> },
    { title: 'Game', key: 'game', render: (_, b) => b.game.name },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={battleStatus} value={s} /> },
    {
      title: 'Votes',
      key: 'votes',
      render: (_, b) => (
        <Flex vertical style={{ minWidth: 130 }}>
          <Typography.Text>
            {b.votesA} – {b.votesB}
          </Typography.Text>
          <Progress percent={b.totalVotes ? b.percentA : 0} showInfo={false} size="small" strokeColor="var(--v-chart-ink)" />
        </Flex>
      ),
    },
    { title: 'Ends / ended', key: 'ends', render: (_, b) => formatDateTime(b.closedAt ?? b.votingEndsAt), responsive: ['md'] },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        {!fixed.gameId && <Select placeholder="All games" allowClear style={{ width: 180 }} options={gameOptions} value={params.gameId as string | undefined} onChange={(gameId) => setParams({ gameId })} />}
        <Select placeholder="All statuses" allowClear style={{ width: 160 }} options={options(battleStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Battle>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No battles' }}
        onRow={(b) => ({ onClick: () => navigate(`/battles/${b.id}`), style: { cursor: 'pointer' } })}
        pagination={pagination(params, setParams, data?.meta.total, 'battles')}
      />
    </>
  );
}

export function EntriesTable({ params, setParams, fixed = {} }: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const gameOptions = useGameOptions();
  const [matching, setMatching] = useState<Entry | null>(null);
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['entries', 'list', query],
    queryFn: () => battlesApi.entries(query),
    placeholderData: keepPreviousData,
  });

  async function cancel(entry: Entry, reason: string) {
    try {
      await battlesApi.cancelEntry(entry.id, reason);
      message.success('Entry cancelled, Challenge Credit refunded');
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    } catch (err) {
      message.error(getErrorMessage(err));
      throw err;
    }
  }

  const columns: TableProps<Entry>['columns'] = [
    ...(fixed.userId ? [] : [{ title: 'Player', key: 'user', render: (_: unknown, e: Entry) => <PlayerLink player={e.user} /> }]),
    { title: 'Clip', key: 'clip', render: (_, e) => <Link to={`/clips/${e.clip.id}`}>{e.clip.title}</Link> },
    { title: 'Game', key: 'game', render: (_, e) => e.game.name },
    { title: 'Criteria', key: 'criteria', render: (_, e) => <Flex gap={4}><Tag>{e.weaponClass}</Tag><Tag>{e.rank}</Tag></Flex> },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={entryStatus} value={s} /> },
    { title: 'Entered', dataIndex: 'createdAt', render: formatDateTime },
    {
      title: 'Result',
      key: 'result',
      render: (_, e) =>
        e.battleId ? <Link to={`/battles/${e.battleId}`}>Open battle</Link> : e.status === 'QUEUED' ? `Expires ${formatDateTime(e.expiresAt)}` : '—',
    },
    {
      title: '',
      key: 'actions',
      // Pinned so the actions stay visible when the table scrolls sideways.
      fixed: 'right',
      render: (_, e) =>
        e.status === 'QUEUED' && (
          <Flex gap={8} justify="flex-end" wrap={false}>
            <MatchEntryButton onClick={() => setMatching(e)} />
            <RemoveWithReason
            title="Cancel this entry?"
            description="The player gets their Challenge Credit back and a notification."
            buttonLabel="Cancel"
            confirmLabel="Cancel entry"
            buttonProps={{ size: 'small' }}
            onConfirm={(reason) => cancel(e, reason)}
          />
          </Flex>
        ),
    },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        {!fixed.userId && <Input.Search placeholder="Search player" allowClear defaultValue={params.q as string | undefined} style={{ maxWidth: 260 }} onSearch={(q) => setParams({ q: q.trim() || undefined })} />}
        <Select placeholder="All games" allowClear style={{ width: 180 }} options={gameOptions} value={params.gameId as string | undefined} onChange={(gameId) => setParams({ gameId })} />
        <Select placeholder="All statuses" allowClear style={{ width: 190 }} options={options(entryStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Entry>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No battle entries' }}
        pagination={pagination(params, setParams, data?.meta.total, 'entries')}
      />
      <MatchEntryModal entry={matching} onClose={() => setMatching(null)} />
    </>
  );
}

export function RematchesTable({ params, setParams, fixed = {} }: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const query = clean({ ...params, ...fixed });
  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['rematches', 'list', query],
    queryFn: () => battlesApi.rematches(query),
    placeholderData: keepPreviousData,
  });

  async function cancel(rematch: Rematch, reason: string) {
    try {
      await battlesApi.cancelRematch(rematch.id, reason);
      message.success('Rematch cancelled, challenger refunded');
      queryClient.invalidateQueries({ queryKey: ['rematches'] });
    } catch (err) {
      message.error(getErrorMessage(err));
      throw err;
    }
  }

  const columns: TableProps<Rematch>['columns'] = [
    { title: 'Challenger', key: 'challenger', render: (_, r) => <PlayerLink player={r.challenger} /> },
    { title: 'Opponent', key: 'opponent', render: (_, r) => <PlayerLink player={r.opponent} /> },
    { title: 'Game', key: 'game', render: (_, r) => r.originalBattle.game.name },
    { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={rematchStatus} value={s} /> },
    { title: 'Asked', dataIndex: 'createdAt', render: formatDateTime },
    {
      title: 'Battles',
      key: 'battles',
      render: (_, r) => (
        <Flex gap={12}>
          <Link to={`/battles/${r.originalBattleId}`}>First battle</Link>
          {r.battleId && <Link to={`/battles/${r.battleId}`}>Rematch</Link>}
        </Flex>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_, r) =>
        r.status === 'PENDING' && (
          <RemoveWithReason
            title="Cancel this rematch request?"
            description="The challenger gets their Challenge Credit back."
            buttonLabel="Cancel"
            confirmLabel="Cancel request"
            buttonProps={{ size: 'small' }}
            onConfirm={(reason) => cancel(r, reason)}
          />
        ),
    },
  ];

  return (
    <>
      <Flex gap={12} wrap style={{ marginBottom: 16 }}>
        <Select placeholder="All statuses" allowClear style={{ width: 200 }} options={options(rematchStatus)} value={params.status as string | undefined} onChange={(status) => setParams({ status })} />
      </Flex>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}
      <Table<Rematch>
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        scroll={{ x: 'max-content' }}
        locale={{ emptyText: 'No rematch requests' }}
        pagination={pagination(params, setParams, data?.meta.total, 'rematches')}
      />
    </>
  );
}
