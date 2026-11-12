import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Descriptions, Flex, Form, Input, List, Row, Select, Table, Tabs, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { useLocalParams, useUrlParams } from '../../lib/params';
import { battleStatus, clipStatus, StatusTag } from '../../lib/labels';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton, EmptyState, PageState, PlayerLink } from '../../components/common';
import { RemoveWithReason } from '../../components/RemoveWithReason';
import { useGameOptions } from '../games/api';
import { ReportsTable } from '../reports/ReportsTable';
import { AuditTable } from '../audit/AuditTable';
import { clipsApi } from './api';
import { ClipsTable } from './ClipsTable';
import { CommentsTable } from './CommentsTable';

export function ClipsListPage() {
  const [params, setParams] = useUrlParams();
  return (
    <>
      <PageHeader title="Clips" subtitle="Every published clip. Open one to watch it, see its battles and comments, edit or remove it." />
      <ClipsTable params={params} setParams={setParams} />
    </>
  );
}

export function CommentsListPage() {
  const [params, setParams] = useUrlParams();
  return (
    <>
      <PageHeader title="Comments" subtitle="All comments on clips. Remove or restore any of them." />
      <CommentsTable params={params} setParams={setParams} />
    </>
  );
}

export function ClipDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [search, setSearch] = useSearchParams();
  const { data: clip, isPending, isError, error, refetch } = useQuery({ queryKey: ['clips', 'detail', id], queryFn: () => clipsApi.get(id) });
  const [commentsParams, setCommentsParams] = useLocalParams();
  const [reportsParams, setReportsParams] = useLocalParams();
  const [auditParams, setAuditParams] = useLocalParams();

  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['clips'] });
  const removed = clip.status === 'REMOVED';

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Clips', to: '/clips' }, { label: clip.title }]}
        backTo="/clips"
        title={
          <Flex align="center" gap={10}>
            {clip.title}
            <StatusTag meta={clipStatus} value={clip.status} />
            {clip.live.waitingForOpponent && <Tag color="purple">Waiting for opponent</Tag>}
            {clip.live.battleId && <Tag color="magenta">In live battle</Tag>}
          </Flex>
        }
        subtitle={`${clip.game.name} · published ${formatDateTime(clip.createdAt)}`}
        actions={
          <>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/clips/${id}/edit`)}>
              Edit
            </Button>
            {removed ? (
              <ConfirmButton title="Restore this clip?" description="It becomes visible again in the player's gallery." successMessage="Clip restored" onConfirm={async () => { await clipsApi.restore(id); refresh(); }}>
                Restore
              </ConfirmButton>
            ) : (
              <RemoveWithReason
                title="Remove this clip?"
                description="Hidden from everyone. A waiting entry is refunded; a live battle is cancelled and everyone refunded."
                buttonLabel="Remove"
                confirmLabel="Remove clip"
                onConfirm={async (reason) => {
                  try {
                    await clipsApi.remove(id, reason);
                    message.success('Clip removed');
                    refresh();
                  } catch (err) {
                    message.error(getErrorMessage(err));
                    throw err;
                  }
                }}
              />
            )}
          </>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={14}>
          <Card style={{ marginBottom: 16 }}>
            {clip.videoUrl ? (
              <video src={clip.videoUrl} poster={clip.thumbnailUrl ?? undefined} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
            ) : (
              <EmptyState description="No video" />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Details" size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Player"><PlayerLink player={clip.owner} /></Descriptions.Item>
              <Descriptions.Item label="Game">{clip.game.name}</Descriptions.Item>
              <Descriptions.Item label="Description">{clip.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="Duration">{clip.durationSec ? `${clip.durationSec}s` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Likes">{clip.likesCount}</Descriptions.Item>
              <Descriptions.Item label="Comments">{clip.commentsCount}</Descriptions.Item>
              <Descriptions.Item label="Reports">{clip.reportsCount}</Descriptions.Item>
              <Descriptions.Item label="Updated">{formatDateTime(clip.updatedAt)}</Descriptions.Item>
              {removed && <Descriptions.Item label="Removed">{formatDateTime(clip.removedAt)}</Descriptions.Item>}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={search.get('tab') ?? 'battles'}
        onChange={(key) => setSearch({ tab: key }, { replace: true })}
        items={[
          {
            key: 'battles',
            label: `Battles (${clip.battles.length})`,
            children: (
              <Table
                rowKey="id"
                size="small"
                dataSource={clip.battles}
                pagination={false}
                locale={{ emptyText: 'Never in a battle' }}
                onRow={(b) => ({ onClick: () => navigate(`/battles/${b.id}`), style: { cursor: 'pointer' } })}
                columns={[
                  { title: 'Status', dataIndex: 'status', render: (s: string) => <StatusTag meta={battleStatus} value={s} /> },
                  { title: 'Side', dataIndex: 'side' },
                  { title: 'Opponent', dataIndex: 'opponent' },
                  { title: 'Result', dataIndex: 'result', render: (r: string | null) => (r ? <Tag color={r === 'WON' ? 'green' : r === 'LOST' ? 'red' : 'default'}>{r}</Tag> : '—') },
                  { title: 'Votes', key: 'votes', render: (_, b) => `${b.votesFor} – ${b.votesAgainst}` },
                  { title: 'Ends / ended', dataIndex: 'endsAt', render: formatDateTime },
                ]}
              />
            ),
          },
          { key: 'comments', label: `Comments (${clip.commentsCount})`, children: <CommentsTable params={commentsParams} setParams={setCommentsParams} fixed={{ clipId: id }} /> },
          {
            key: 'likes',
            label: `Likes (${clip.likesCount})`,
            children: clip.likes.length ? (
              <List
                dataSource={clip.likes}
                renderItem={(like) => (
                  <List.Item extra={formatDateTime(like.createdAt)}>
                    <PlayerLink player={{ ...like.user, avatarUrl: null }} />
                  </List.Item>
                )}
                footer={clip.likesCount > clip.likes.length ? `Showing the latest ${clip.likes.length}` : undefined}
              />
            ) : (
              <EmptyState description="No likes yet" />
            ),
          },
          { key: 'reports', label: `Reports (${clip.reportsCount})`, children: <ReportsTable params={reportsParams} setParams={setReportsParams} fixed={{ targetId: id }} /> },
          { key: 'activity', label: 'Admin activity', children: <AuditTable params={auditParams} setParams={setAuditParams} fixed={{ entityType: 'clip', entityId: id }} /> },
        ]}
      />
    </>
  );
}

type ClipForm = { title: string; description?: string; gameId: string };

export function ClipEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const gameOptions = useGameOptions();
  const [form] = Form.useForm<ClipForm>();
  const [error, setError] = useState<string | null>(null);
  const { data: clip, isPending } = useQuery({ queryKey: ['clips', 'detail', id], queryFn: () => clipsApi.get(id) });

  useEffect(() => {
    if (clip) form.setFieldsValue({ title: clip.title, description: clip.description ?? '', gameId: clip.game.id });
  }, [clip, form]);

  const save = useMutation({
    mutationFn: (values: ClipForm) =>
      clipsApi.update(id, {
        title: values.title,
        description: values.description?.trim() || null,
        ...(values.gameId !== clip?.game.id && { gameId: values.gameId }),
      }),
    onSuccess: () => {
      message.success('Clip updated');
      queryClient.invalidateQueries({ queryKey: ['clips'] });
      navigate(`/clips/${id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const inBattle = (clip?.battles.length ?? 0) > 0 || clip?.live.waitingForOpponent;

  return (
    <>
      <PageHeader
        title="Edit clip"
        crumbs={[{ label: 'Clips', to: '/clips' }, { label: clip?.title ?? '…', to: `/clips/${id}` }, { label: 'Edit' }]}
        backTo={`/clips/${id}`}
      />
      <FormPage form={form} onFinish={(values) => { setError(null); save.mutate(values); }} saving={save.isPending} loading={isPending} error={error} cancelTo={`/clips/${id}`} submitLabel="Save changes">
        <Form.Item name="title" label="Title" rules={[{ required: true, max: 120 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description" rules={[{ max: 500 }]}>
          <Input.TextArea autoSize={{ minRows: 3 }} showCount maxLength={500} />
        </Form.Item>
        <Form.Item name="gameId" label="Game" extra={inBattle ? "Locked: the clip has been in a battle." : undefined}>
          <Select options={gameOptions} disabled={Boolean(inBattle)} />
        </Form.Item>
        {inBattle && <Alert type="info" showIcon message="Battle clips keep their game so results stay consistent." style={{ marginBottom: 16 }} />}
      </FormPage>
    </>
  );
}
