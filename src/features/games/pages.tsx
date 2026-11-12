import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Col, Flex, Form, Input, InputNumber, Row, Select, Statistic, Switch, Table, Tabs, Tag, Typography, type TableProps } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { useLocalParams } from '../../lib/params';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton, PageState } from '../../components/common';
import { ImageUpload } from '../../components/ImageUpload';
import { useCurrentAdmin } from '../auth/api';
import { ClipsTable } from '../clips/ClipsTable';
import { BattlesTable } from '../battles/tables';
import { AuditTable } from '../audit/AuditTable';
import { gamesApi, gamesKey, useGames, type Game, type GameInput } from './api';

function useCanEdit() {
  const { data: admin } = useCurrentAdmin();
  return admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
}

const TagList = ({ values }: { values: string[] }) =>
  values.length === 0 ? <Typography.Text type="secondary">—</Typography.Text> : <Flex gap={4} wrap>{values.map((v) => <Tag key={v}>{v}</Tag>)}</Flex>;

const GameIcon = ({ url, size = 32 }: { url: string | null; size?: number }) =>
  url ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: 8, objectFit: 'cover' }} /> : <div style={{ width: size, height: size, borderRadius: 8, background: '#1b1729' }} />;

export function GamesListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { data, isFetching } = useGames();
  const columns: TableProps<Game>['columns'] = [
    { title: 'Game', key: 'name', render: (_, g) => <Flex align="center" gap={10}><GameIcon url={g.iconUrl} /><Flex vertical><Typography.Text strong>{g.name}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{g.slug}</Typography.Text></Flex></Flex> },
    { title: 'Status', dataIndex: 'isActive', render: (a: boolean) => (a ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>) },
    { title: 'Weapon classes', key: 'w', render: (_, g) => <TagList values={g.criteria.weaponClasses} /> },
    { title: 'Ranks', key: 'r', render: (_, g) => <TagList values={g.criteria.ranks} /> },
    { title: 'Clips', key: 'clips', render: (_, g) => formatNumber(g.counts.clips) },
    { title: 'Battles', key: 'battles', render: (_, g) => formatNumber(g.counts.battles) },
  ];
  return (
    <>
      <PageHeader
        title="Games"
        subtitle="Games players can upload for, with the battle criteria used for matchmaking"
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/games/new')}>Add game</Button>}
      />
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message="Two battle entries match only when the game, weapon class and rank are all the same." />
      <Table rowKey="id" columns={columns} dataSource={data} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} onRow={(g) => ({ onClick: () => navigate(`/games/${g.id}`), style: { cursor: 'pointer' } })} />
    </>
  );
}

export function GameDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const [search, setSearch] = useSearchParams();
  const [clipsParams, setClipsParams] = useLocalParams();
  const [battlesParams, setBattlesParams] = useLocalParams();
  const [auditParams, setAuditParams] = useLocalParams();
  const { data: game, isPending, isError, error, refetch } = useQuery({ queryKey: [...gamesKey, id], queryFn: () => gamesApi.get(id) });
  if (isPending || isError) return <PageState loading={isPending} error={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        crumbs={[{ label: 'Games', to: '/games' }, { label: game.name }]}
        backTo="/games"
        title={<Flex align="center" gap={10}><GameIcon url={game.iconUrl} size={40} />{game.name}{game.isActive ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>}</Flex>}
        subtitle={game.slug}
        actions={
          canEdit && (
            <>
              <Button icon={<EditOutlined />} onClick={() => navigate(`/games/${id}/edit`)}>Edit</Button>
              <ConfirmButton danger title="Delete this game?" description="Only games with no clips or battles can be deleted; otherwise hide it." successMessage="Game deleted" onConfirm={async () => { await gamesApi.remove(id); queryClient.setQueryData<Game[]>(gamesKey, (rows) => rows?.filter((r) => r.id !== id)); queryClient.invalidateQueries({ queryKey: gamesKey, refetchType: 'none' }); navigate('/games'); }}>
                Delete
              </ConfirmButton>
            </>
          )
        }
      />
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={8}><Card size="small"><Statistic title="Clips" value={game.counts.clips} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Battles" value={game.counts.battles} /></Card></Col>
        <Col xs={8}><Card size="small"><Statistic title="Battle entries" value={game.counts.tickets ?? 0} /></Card></Col>
      </Row>
      <Card size="small" title="Battle criteria" style={{ marginBottom: 16 }}>
        <Flex vertical gap={8}>
          <Flex gap={8}><Typography.Text type="secondary" style={{ width: 120 }}>Weapon classes</Typography.Text><TagList values={game.criteria.weaponClasses} /></Flex>
          <Flex gap={8}><Typography.Text type="secondary" style={{ width: 120 }}>Ranks</Typography.Text><TagList values={game.criteria.ranks} /></Flex>
        </Flex>
      </Card>
      <Tabs
        activeKey={search.get('tab') ?? 'clips'}
        onChange={(key) => setSearch({ tab: key }, { replace: true })}
        items={[
          { key: 'clips', label: 'Clips', children: <ClipsTable params={clipsParams} setParams={setClipsParams} fixed={{ gameId: id }} /> },
          { key: 'battles', label: 'Battles', children: <BattlesTable params={battlesParams} setParams={setBattlesParams} fixed={{ gameId: id }} /> },
          { key: 'activity', label: 'Admin activity', children: <AuditTable params={auditParams} setParams={setAuditParams} fixed={{ entityType: 'game', entityId: id }} /> },
        ]}
      />
    </>
  );
}

export function GameFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<GameInput>();
  const [error, setError] = useState<string | null>(null);
  const game = useQuery({ queryKey: [...gamesKey, id], queryFn: () => gamesApi.get(id!), enabled: !isNew });

  useEffect(() => {
    if (game.data) form.setFieldsValue(game.data);
  }, [game.data, form]);

  const save = useMutation({
    mutationFn: (values: GameInput) => {
      const input = { ...values, iconUrl: values.iconUrl || null };
      return isNew ? gamesApi.create(input) : gamesApi.update(id!, input);
    },
    onSuccess: (saved) => {
      message.success(isNew ? 'Game created' : 'Game saved');
      queryClient.invalidateQueries({ queryKey: gamesKey });
      navigate(`/games/${saved.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'Add game' : `Edit ${game.data?.name ?? 'game'}`}
        crumbs={[{ label: 'Games', to: '/games' }, ...(isNew ? [] : [{ label: game.data?.name ?? '…', to: `/games/${id}` }]), { label: isNew ? 'Add' : 'Edit' }]}
        backTo={isNew ? '/games' : `/games/${id}`}
      />
      <FormPage
        form={form}
        onFinish={(v) => { setError(null); save.mutate(v); }}
        saving={save.isPending}
        loading={!isNew && game.isPending}
        error={error}
        cancelTo={isNew ? '/games' : `/games/${id}`}
        initialValues={{ criteria: { weaponClasses: [], ranks: [] }, isActive: true, sortOrder: 0 }}
      >
        <Form.Item name="iconUrl" label="Icon"><ImageUpload size={72} /></Form.Item>
        <Flex gap={16} wrap>
          <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
          <Form.Item name="slug" label="Slug" extra="Lowercase letters, numbers and dashes." rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1, minWidth: 200 }}><Input /></Form.Item>
        </Flex>
        <Form.Item name={['criteria', 'weaponClasses']} label="Weapon classes" extra="Type a value and press Enter.">
          <Select mode="tags" open={false} tokenSeparators={[',']} />
        </Form.Item>
        <Form.Item name={['criteria', 'ranks']} label="Ranks" extra="Type a value and press Enter, in order from lowest to highest.">
          <Select mode="tags" open={false} tokenSeparators={[',']} />
        </Form.Item>
        <Flex gap={24}>
          <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
          <Form.Item name="isActive" label="Visible in the app" valuePropName="checked"><Switch /></Form.Item>
        </Flex>
      </FormPage>
    </>
  );
}
