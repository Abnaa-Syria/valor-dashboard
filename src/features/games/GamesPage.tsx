import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Flex, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag, Typography, type TableProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { useCurrentAdmin } from '../auth/api';
import { createGame, gamesKey, updateGame, useGames, type Game, type GameInput } from './api';
import { ImageUpload } from '../../components/ImageUpload';

function TagList({ values }: { values: string[] }) {
  if (values.length === 0) return <Typography.Text type="secondary">—</Typography.Text>;
  return (
    <Flex gap={4} wrap>
      {values.map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
    </Flex>
  );
}

export function GamesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { data: admin } = useCurrentAdmin();
  const canEdit = admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
  const { data: games, isFetching, isError, error } = useGames();
  const [editing, setEditing] = useState<Game | 'new' | null>(null);
  const [form] = Form.useForm<GameInput>();

  const saveMutation = useMutation({
    mutationFn: (values: GameInput) => {
      const input = { ...values, iconUrl: values.iconUrl || null };
      return editing && editing !== 'new' ? updateGame(editing.id, input) : createGame(input);
    },
    onSuccess: () => {
      message.success('Game saved');
      queryClient.invalidateQueries({ queryKey: gamesKey });
      setEditing(null);
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  function openEditor(game: Game | 'new') {
    setEditing(game);
    form.setFieldsValue(
      game === 'new'
        ? { name: '', slug: '', criteria: { weaponClasses: [], ranks: [] }, isActive: true, sortOrder: (games?.length ?? 0) }
        : { iconUrl: game.iconUrl, name: game.name, slug: game.slug, criteria: game.criteria, isActive: game.isActive, sortOrder: game.sortOrder },
    );
  }

  const columns: TableProps<Game>['columns'] = [
    { title: 'Game', dataIndex: 'name', render: (name: string, game) => <Flex vertical><Typography.Text strong>{name}</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>{game.slug}</Typography.Text></Flex> },
    { title: 'Status', dataIndex: 'isActive', render: (active: boolean) => (active ? <Tag color="green">Active</Tag> : <Tag>Hidden</Tag>) },
    { title: 'Weapon classes', key: 'weapons', render: (_, game) => <TagList values={game.criteria.weaponClasses} /> },
    { title: 'Ranks', key: 'ranks', render: (_, game) => <TagList values={game.criteria.ranks} /> },
    { title: 'Clips', key: 'clips', render: (_, game) => formatNumber(game.counts.clips) },
    { title: 'Battles', key: 'battles', render: (_, game) => formatNumber(game.counts.battles) },
    ...(canEdit ? [{ title: '', key: 'actions', render: (_: unknown, game: Game) => <Button size="small" onClick={() => openEditor(game)}>Edit</Button> }] : []),
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Games
        </Typography.Title>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor('new')}>
            Add game
          </Button>
        )}
      </Flex>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Battle criteria"
        description="Players pick one weapon class and one rank when entering a battle. Two entries match only when the game, weapon class and rank are the same."
      />

      {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 16 }} />}

      <Table<Game> rowKey="id" columns={columns} dataSource={games} loading={isFetching} pagination={false} scroll={{ x: 'max-content' }} />

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add game' : 'Edit game'}
        onCancel={() => setEditing(null)}
        onOk={() => form.submit()}
        okText="Save"
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form<GameInput> form={form} layout="vertical" onFinish={(values) => saveMutation.mutate(values)}>
          <Form.Item name="iconUrl" label="Icon">
            <ImageUpload size={72} />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Enter a name' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="slug"
            label="Slug"
            extra="Lowercase letters, numbers and dashes. Used in links."
            rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Use lowercase letters, numbers and dashes' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name={['criteria', 'weaponClasses']} label="Weapon classes" extra="Type a value and press Enter.">
            <Select mode="tags" open={false} tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name={['criteria', 'ranks']} label="Ranks" extra="Type a value and press Enter.">
            <Select mode="tags" open={false} tokenSeparators={[',']} />
          </Form.Item>
          <Flex gap={24}>
            <Form.Item name="sortOrder" label="Order">
              <InputNumber min={0} max={1000} precision={0} />
            </Form.Item>
            <Form.Item name="isActive" label="Visible in the app" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Flex>
        </Form>
      </Modal>
    </>
  );
}
