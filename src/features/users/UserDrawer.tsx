import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Descriptions, Drawer, Flex, Popconfirm, Skeleton, Tabs, Tag } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime, formatNumber } from '../../lib/format';
import { useCurrentAdmin } from '../auth/api';
import { getUser, statusMeta, updateUserStatus, usersKeys, type UserDetails, type UserStatus } from './api';
import { CreditsSection } from './CreditsSection';
import { BadgesSection } from './BadgesSection';

type Props = { userId: string | null; onClose: () => void };

const statusActions: { status: UserStatus; label: string; danger?: boolean; confirm: string }[] = [
  { status: 'ACTIVE', label: 'Activate', confirm: "Activate this player's account?" },
  { status: 'SUSPENDED', label: 'Suspend', confirm: 'Suspend this player? They are signed out of every device.' },
  { status: 'BANNED', label: 'Ban', danger: true, confirm: "Ban this player? They won't be able to use the app." },
];

function Overview({ user, canChangeStatus }: { user: UserDetails; canChangeStatus: boolean }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: UserStatus) => updateUserStatus(user.id, status),
    onSuccess: () => {
      message.success('Player status updated');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  return (
    <Flex vertical gap={24}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Status">
          <Tag color={statusMeta[user.status].color}>{statusMeta[user.status].label}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Referral code">{user.referralCode}</Descriptions.Item>
        <Descriptions.Item label="Invited by">{user.invitedVia?.inviter.username ?? '—'}</Descriptions.Item>
        <Descriptions.Item label="Joined">{formatDateTime(user.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Last seen">{formatDateTime(user.lastSeenAt)}</Descriptions.Item>
      </Descriptions>

      <Descriptions title="Activity" column={2} bordered size="small">
        <Descriptions.Item label="Popularity">{formatNumber(user.popularity)}</Descriptions.Item>
        <Descriptions.Item label="Clips">{formatNumber(user._count.clips)}</Descriptions.Item>
        <Descriptions.Item label="Battles">{formatNumber(user.battles.total)}</Descriptions.Item>
        <Descriptions.Item label="Won / Lost">
          {user.battles.won} / {user.battles.lost}
        </Descriptions.Item>
        <Descriptions.Item label="Win rate">{user.battles.winRate}%</Descriptions.Item>
        <Descriptions.Item label="Votes received">{formatNumber(user.battles.votesReceived)}</Descriptions.Item>
        <Descriptions.Item label="Votes cast">{formatNumber(user._count.votes)}</Descriptions.Item>
        <Descriptions.Item label="Friends invited">{formatNumber(user._count.referralsMade)}</Descriptions.Item>
        <Descriptions.Item label="Gifts received">{formatNumber(user._count.giftsReceived)}</Descriptions.Item>
        <Descriptions.Item label="Gifts sent">{formatNumber(user._count.giftsSent)}</Descriptions.Item>
      </Descriptions>

      {canChangeStatus && (
        <Flex gap={8} wrap>
          {statusActions
            .filter((action) => action.status !== user.status)
            .map((action) => (
              <Popconfirm
                key={action.status}
                title={action.confirm}
                okText="Confirm"
                cancelText="Cancel"
                onConfirm={() => statusMutation.mutateAsync(action.status)}
              >
                <Button danger={action.danger} loading={statusMutation.isPending && statusMutation.variables === action.status}>
                  {action.label}
                </Button>
              </Popconfirm>
            ))}
        </Flex>
      )}
    </Flex>
  );
}

export function UserDrawer({ userId, onClose }: Props) {
  const { data: admin } = useCurrentAdmin();
  const canManage = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';

  const { data: user, isPending, isError, error } = useQuery({
    queryKey: usersKeys.detail(userId ?? ''),
    queryFn: () => getUser(userId!),
    enabled: Boolean(userId),
  });

  return (
    <Drawer open={Boolean(userId)} onClose={onClose} width={640} title={user?.username ?? 'Player details'} destroyOnHidden>
      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} />}
      {isPending && !isError && <Skeleton active />}

      {user && (
        <Tabs
          items={[
            { key: 'overview', label: 'Overview', children: <Overview user={user} canChangeStatus={canManage} /> },
            { key: 'credits', label: 'Credits', children: <CreditsSection user={user} canAdjust={canManage} /> },
            { key: 'badges', label: `Badges (${user.badges.length})`, children: <BadgesSection user={user} canEdit={canManage} /> },
          ]}
        />
      )}
    </Drawer>
  );
}
