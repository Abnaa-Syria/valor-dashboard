import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button, Empty, Flex, List, Popconfirm, Select, Tag, Typography } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { badgesApi, useBadges } from '../badges/api';
import { usersKeys, type UserDetails } from './api';

export function BadgesSection({ user, canEdit }: { user: UserDetails; canEdit: boolean }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: badges } = useBadges();
  const [selected, setSelected] = useState<string>();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: usersKeys.detail(user.id) });
    queryClient.invalidateQueries({ queryKey: ['badges'] });
  };

  const award = useMutation({
    mutationFn: (badgeId: string) => badgesApi.award(user.id, badgeId),
    onSuccess: () => {
      message.success('Badge awarded — the player gets a notification');
      setSelected(undefined);
      refresh();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const revoke = useMutation({
    mutationFn: (badgeId: string) => badgesApi.revoke(user.id, badgeId),
    onSuccess: () => {
      message.success('Badge removed');
      refresh();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  const earnedIds = new Set(user.badges.map((b) => b.badge.id));
  const options = (badges ?? []).filter((b) => b.isActive && !earnedIds.has(b.id)).map((b) => ({ value: b.id, label: b.name }));

  return (
    <Flex vertical gap={16}>
      {canEdit && (
        <Flex gap={8}>
          <Select placeholder="Choose a badge to award" style={{ flex: 1 }} options={options} value={selected} onChange={setSelected} />
          <Button type="primary" disabled={!selected} loading={award.isPending} onClick={() => selected && award.mutate(selected)}>
            Award
          </Button>
        </Flex>
      )}
      {user.badges.length === 0 ? (
        <Empty description="No badges yet" />
      ) : (
        <List
          dataSource={user.badges}
          renderItem={(item) => (
            <List.Item
              actions={
                canEdit
                  ? [
                      <Popconfirm key="remove" title="Remove this badge?" okText="Remove" okButtonProps={{ danger: true }} onConfirm={() => revoke.mutateAsync(item.badge.id)}>
                        <Button size="small" danger>Remove</Button>
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <Flex vertical>
                <Typography.Text strong>{item.badge.name}</Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(item.earnedAt)} · {item.awardedById ? <Tag>by admin</Tag> : <Tag color="blue">automatic</Tag>}
                </Typography.Text>
              </Flex>
            </List.Item>
          )}
        />
      )}
    </Flex>
  );
}
