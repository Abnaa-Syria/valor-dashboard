import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { App, Avatar, Button, Card, Empty, Flex, Popconfirm, Result, Spin, Typography, type ButtonProps } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../lib/api';

/** A player's name (with avatar) linking to their page. */
export function PlayerLink({ player, size = 24 }: { player: { id: string; username: string; avatarUrl?: string | null } | null | undefined; size?: number }) {
  if (!player) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Link to={`/players/${player.id}`} onClick={(event) => event.stopPropagation()}>
      <Flex align="center" gap={8}>
        <Avatar size={size} src={player.avatarUrl} icon={<UserOutlined />} />
        <span>{player.username}</span>
      </Flex>
    </Link>
  );
}

/** Page-level loading / error / not-found states. */
export function PageState({ loading, error, onRetry }: { loading?: boolean; error?: unknown; onRetry?: () => void }) {
  if (loading) {
    return (
      <Flex justify="center" style={{ padding: 64 }}>
        <Spin size="large" />
      </Flex>
    );
  }
  return (
    <Result
      status="error"
      title="Couldn't load this page"
      subTitle={getErrorMessage(error)}
      extra={onRetry && <Button onClick={onRetry}>Try again</Button>}
    />
  );
}

/** Card section on detail pages. */
export function Section({ title, extra, children }: { title?: ReactNode; extra?: ReactNode; children: ReactNode }) {
  return (
    <Card title={title} extra={extra} style={{ marginBottom: 16 }}>
      {children}
    </Card>
  );
}

export function EmptyState({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
}

/** A button that asks "are you sure?" and then runs the action, with success / error messages. */
export function ConfirmButton({
  title,
  description,
  onConfirm,
  successMessage,
  children,
  okText = 'Confirm',
  danger,
  ...buttonProps
}: {
  title: string;
  description?: string;
  onConfirm: () => Promise<unknown>;
  successMessage: string;
  okText?: string;
  children: ReactNode;
} & ButtonProps) {
  const { message } = App.useApp();
  return (
    <Popconfirm
      title={title}
      description={description}
      okText={okText}
      cancelText="Cancel"
      okButtonProps={{ danger }}
      onConfirm={async () => {
        try {
          await onConfirm();
          message.success(successMessage);
        } catch (err) {
          message.error(getErrorMessage(err));
        }
      }}
    >
      <Button danger={danger} {...buttonProps}>
        {children}
      </Button>
    </Popconfirm>
  );
}

/** Triggers a JSON file download in the browser. */
export function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
