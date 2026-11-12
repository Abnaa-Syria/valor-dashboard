import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Avatar, Button, Card, Col, Descriptions, Dropdown, Flex, Input, List, Modal, Row, Segmented, Statistic, Table, Tabs, Typography } from 'antd';
import { DownOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useLocalParams } from '../../lib/params';
import { giftTiers, playerStatus, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, PageState, PlayerLink, downloadJson } from '../../components/common';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useCurrentAdmin } from '../auth/api';
import { ClipsTable } from '../clips/ClipsTable';
import { CommentsTable } from '../clips/CommentsTable';
import { BattlesTable, EntriesTable } from '../battles/tables';
import { PurchasesTable } from '../store/PurchasesTable';
import { ReportsTable } from '../reports/ReportsTable';
import { AuditTable } from '../audit/AuditTable';
import { CreditsSection } from './CreditsSection';
import { BadgesSection } from './BadgesSection';
import { getUser, playersApi, updateUserStatus, usersKeys, type UserDetails, type UserStatus } from './api';

function Overview({ user }: { user: UserDetails }) {
  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { title: 'Popularity', value: user.popularity },
          { title: 'Battles', value: user.battles.total },
          { title: 'Win rate', value: `${user.battles.winRate}%` },
          { title: 'Votes received', value: user.battles.votesReceived },
          { title: 'Clips', value: user._count.clips },
          { title: 'Friends invited', value: user._count.referralsMade },
        ].map((card) => (
          <Col key={card.title} xs={12} md={8} xl={4}>
            <Card size="small">
              <Statistic title={card.title} value={card.value} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Account" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Status"><StatusTag meta={playerStatus} value={user.status} /></Descriptions.Item>
              <Descriptions.Item label="Joined">{formatDateTime(user.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Last seen">{formatDateTime(user.lastSeenAt)}</Descriptions.Item>
              <Descriptions.Item label="Referral code">{user.referralCode}</Descriptions.Item>
              <Descriptions.Item label="Invited by">{user.invitedVia ? <PlayerLink player={{ ...user.invitedVia.inviter, avatarUrl: null }} /> : '—'}</Descriptions.Item>
              <Descriptions.Item label="Referral count">{user.hideReferralCount ? 'Hidden from others' : 'Public'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Activity" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Won">{user.battles.won}</Descriptions.Item>
              <Descriptions.Item label="Lost">{user.battles.lost}</Descriptions.Item>
              <Descriptions.Item label="Draws">{user.battles.draws}</Descriptions.Item>
              <Descriptions.Item label="Votes cast">{formatNumber(user._count.votes)}</Descriptions.Item>
              <Descriptions.Item label="Gifts received">{formatNumber(user._count.giftsReceived)}</Descriptions.Item>
              <Descriptions.Item label="Gifts sent">{formatNumber(user._count.giftsSent)}</Descriptions.Item>
              <Descriptions.Item label="Blocked by">{formatNumber(user._count.blockedBy)} players</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>
    </>
  );
}

function GiftsTab({ userId }: { userId: string }) {
  const [direction, setDirection] = useState<'received' | 'sent'>('received');
  const [params, setParams] = useLocalParams();
  const { data, isFetching } = useQuery({
    queryKey: ['users', userId, 'gifts', direction, params],
    queryFn: () => playersApi.gifts(userId, { ...params, direction }),
  });
  return (
    <>
      <Segmented
        style={{ marginBottom: 16 }}
        value={direction}
        options={[{ value: 'received', label: 'Received' }, { value: 'sent', label: 'Sent' }]}
        onChange={(value) => {
          setDirection(value as 'received' | 'sent');
          setParams({ page: 1 });
        }}
      />
      <Table
        rowKey="id"
        size="small"
        loading={isFetching}
        dataSource={data?.items}
        locale={{ emptyText: 'No gifts' }}
        columns={[
          { title: 'Date', dataIndex: 'createdAt', render: formatDateTime },
          { title: 'Gift', key: 'gift', render: (_, g) => <Flex gap={6} align="center">{g.gift.name}<StatusTag meta={giftTiers} value={g.gift.tier} /></Flex> },
          { title: 'Qty', dataIndex: 'quantity' },
          { title: direction === 'received' ? 'From' : 'To', key: 'other', render: (_, g) => <PlayerLink player={{ ...(direction === 'received' ? g.sender : g.recipient), avatarUrl: null }} /> },
          { title: 'Popularity', key: 'pop', render: (_, g) => (g.awardedAt ? `+${g.popularityAwarded}` : 'At battle end') },
          { title: 'Battle', key: 'battle', render: (_, g) => (g.battleId ? <Link to={`/battles/${g.battleId}`}>Open</Link> : '—') },
        ]}
        pagination={{ current: params.page, pageSize: params.pageSize, total: data?.meta.total, onChange: (page, pageSize) => setParams({ page, pageSize }) }}
      />
    </>
  );
}

function BlocksTab({ userId }: { userId: string }) {
  const { data, isPending } = useQuery({ queryKey: ['users', userId, 'blocks'], queryFn: () => playersApi.blocks(userId) });
  if (isPending) return <PageState loading />;
  return (
    <Row gutter={16}>
      {[
        { title: 'Blocked by this player', items: data?.blocked ?? [] },
        { title: 'Players who blocked them', items: data?.blockedBy ?? [] },
      ].map((group) => (
        <Col xs={24} md={12} key={group.title}>
          <Card size="small" title={`${group.title} (${group.items.length})`}>
            {group.items.length === 0 ? (
              <EmptyState description="None" />
            ) : (
              <List dataSource={group.items} renderItem={(row) => <List.Item extra={formatDateTime(row.at)}><PlayerLink player={row.player} /></List.Item>} />
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function PlayerDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message, modal } = App.useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchParams();
  const { data: admin } = useCurrentAdmin();
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const { data: user, isPending, isError, error, refetch } = useQuery({ queryKey: usersKeys.detail(id), queryFn: () => getUser(id) });
  const [clipsParams, setClipsParams] = useLocalParams();
  const [battlesParams, setBattlesParams] = useLocalParams();
  const [entriesParams, setEntriesParams] = useLocalParams();
  const [purchasesParams, setPurchasesParams] = useLocalParams();
  const [commentsParams, setCommentsParams] = useLocalParams();
  const [reportsParams, setReportsParams] = useLocalParams();
  const [auditParams, setAuditParams] = useLocalParams();

  const refresh = () => queryClient.invalidateQueries({ queryKey: usersKeys.all });

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => updateUserStatus(id, status),
    onSuccess: () => {
      message.success('Status updated');
      refresh();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;

  const deleted = user.status === 'DELETED';
  const tab = search.get('tab') ?? 'overview';

  const statusItems = (['ACTIVE', 'SUSPENDED', 'BANNED'] as const)
    .filter((s) => s !== user.status)
    .map((s) => ({
      key: s,
      label: s === 'ACTIVE' ? 'Activate' : s === 'SUSPENDED' ? 'Suspend' : 'Ban',
      danger: s === 'BANNED',
      onClick: () =>
        modal.confirm({
          title: `${s === 'ACTIVE' ? 'Activate' : s === 'SUSPENDED' ? 'Suspend' : 'Ban'} ${user.username}?`,
          content: s === 'ACTIVE' ? 'The player can use the app again.' : 'The player is signed out of every device and can’t use the app.',
          okButtonProps: { danger: s === 'BANNED' },
          onOk: () => statusMutation.mutateAsync(s),
        }),
    }));

  const moreItems = [
    { key: 'password', label: 'Set a new password', onClick: () => setPasswordOpen(true) },
    {
      key: 'reset',
      label: 'Send password reset link',
      onClick: async () => {
        try {
          await playersApi.sendReset(id);
          message.success('Reset link sent');
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      },
    },
    { key: 'announce', label: 'Send a message', onClick: () => navigate(`/announcements/new?userId=${id}&username=${encodeURIComponent(user.username)}`) },
    {
      key: 'export',
      label: 'Export player data (JSON)',
      onClick: async () => {
        try {
          downloadJson(`valor-player-${user.username}.json`, await playersApi.export(id));
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      },
    },
  ];

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Players', to: '/players' }, { label: user.username }]}
        backTo="/players"
        title={
          <Flex align="center" gap={12}>
            <Avatar size={44} src={user.avatarUrl} icon={<UserOutlined />} />
            {user.username}
            <StatusTag meta={playerStatus} value={user.status} />
          </Flex>
        }
        subtitle={user.email}
        actions={
          !deleted &&
          canManage && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/players/${id}/edit`)}>
                Edit
              </Button>
              <Dropdown menu={{ items: statusItems }}>
                <Button loading={statusMutation.isPending}>
                  Status <DownOutlined />
                </Button>
              </Dropdown>
              <Dropdown menu={{ items: moreItems }}>
                <Button>
                  More <DownOutlined />
                </Button>
              </Dropdown>
              {admin?.role === 'SUPER_ADMIN' && (
                <RemoveWithReason
                  title={`Delete ${user.username}'s account?`}
                  description="Personal data is erased, live battles are cancelled and refunded, clips and comments are removed. This can't be undone."
                  buttonLabel="Delete account"
                  confirmLabel="Delete account"
                  onConfirm={async (reason) => {
                    try {
                      await playersApi.remove(id, reason);
                      message.success('Account deleted');
                      refresh();
                    } catch (err) {
                      message.error(getErrorMessage(err));
                      throw err;
                    }
                  }}
                />
              )}
            </>
          )
        }
      />

      {deleted && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Account deleted on ${formatDateTime(user.deletedAt)}`}
          description="Personal data was erased. Purchases, the credit ledger and battle results are kept without personal data."
        />
      )}

      <Tabs
        activeKey={tab}
        onChange={(key) => setSearch({ tab: key }, { replace: true })}
        items={[
          { key: 'overview', label: 'Overview', children: <Overview user={user} /> },
          { key: 'clips', label: `Clips (${user._count.clips})`, children: <ClipsTable params={clipsParams} setParams={setClipsParams} fixed={{ userId: id }} /> },
          { key: 'battles', label: `Battles (${user.battles.total})`, children: <BattlesTable params={battlesParams} setParams={setBattlesParams} fixed={{ userId: id }} /> },
          { key: 'entries', label: 'Battle entries', children: <EntriesTable params={entriesParams} setParams={setEntriesParams} fixed={{ userId: id }} /> },
          { key: 'credits', label: 'Credits', children: <CreditsSection user={user} canAdjust={canManage && !deleted} /> },
          { key: 'purchases', label: 'Purchases', children: <PurchasesTable params={purchasesParams} setParams={setPurchasesParams} fixed={{ userId: id }} showRevenue={false} /> },
          { key: 'gifts', label: 'Gifts', children: <GiftsTab userId={id} /> },
          { key: 'badges', label: `Badges (${user.badges.length})`, children: <BadgesSection user={user} canEdit={canManage && !deleted} /> },
          { key: 'comments', label: 'Comments', children: <CommentsTable params={commentsParams} setParams={setCommentsParams} fixed={{ userId: id }} /> },
          { key: 'reports', label: 'Reports', children: <ReportsTable params={reportsParams} setParams={setReportsParams} fixed={{ involvesUserId: id }} /> },
          { key: 'blocks', label: 'Blocks', children: <BlocksTab userId={id} /> },
          { key: 'activity', label: 'Admin activity', children: <AuditTable params={auditParams} setParams={setAuditParams} fixed={{ entityType: 'player', entityId: id }} /> },
        ]}
      />

      <Modal
        open={passwordOpen}
        title={`New password for ${user.username}`}
        okText="Set password"
        okButtonProps={{ disabled: newPassword.length < 8 }}
        onCancel={() => setPasswordOpen(false)}
        onOk={async () => {
          try {
            await playersApi.setPassword(id, newPassword);
            message.success('Password set — the player was signed out everywhere');
            setPasswordOpen(false);
            setNewPassword('');
          } catch (err) {
            message.error(getErrorMessage(err));
          }
        }}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">At least 8 characters. Share it privately with the player.</Typography.Paragraph>
        <Input.Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" autoFocus />
      </Modal>
    </>
  );
}
