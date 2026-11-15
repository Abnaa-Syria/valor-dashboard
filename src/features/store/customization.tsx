import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Collapse,
  ColorPicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Slider,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { get, getErrorMessage } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ConfirmButton } from '../../components/common';
import { ImageUpload, checkerboard } from '../../components/ImageUpload';
import { useCurrentAdmin } from '../auth/api';
import { storeApi, storeKeys, type Cosmetic, type CosmeticKind } from './api';
import { contrastPairs, contrastRatio, defaultFrameLayout, solid, type FrameDesign, type FrameLayout, type ThemeDesign, type ThemeTokens, type TokenGroup } from './design';
import { FramePreview } from './FramePreview';
import { ThemePreview } from './ThemePreview';

const blank = (value: unknown) => (value === '' || value === undefined ? null : value);
const pct = (fraction: number) => Math.round(fraction * 1000) / 10;
const paths: Record<CosmeticKind, string> = { FRAME: '/customization/frames', THEME: '/customization/themes', AVATAR: '/customization/avatars' };
const nouns: Record<CosmeticKind, string> = { FRAME: 'frame', THEME: 'theme', AVATAR: 'avatar' };

function useCanEdit() {
  const { data: admin } = useCurrentAdmin();
  return admin?.role === 'SUPER_ADMIN' || admin?.role === 'ADMIN';
}

function useCosmetics(kind: CosmeticKind) {
  const query = useQuery({ queryKey: storeKeys.cosmetics, queryFn: storeApi.listCosmetics });
  return { ...query, items: query.data?.filter((item) => item.kind === kind) ?? [] };
}

function useCosmetic(id: string | undefined) {
  return useQuery({ queryKey: ['store', 'cosmetic', id], queryFn: () => storeApi.getCosmetic(id!), enabled: Boolean(id) });
}

function StatusTags({ item }: { item: Cosmetic }) {
  return (
    <Flex gap={4} wrap>
      {item.isDefault && <Tag color="purple">Default</Tag>}
      {item.isFree ? <Tag color="green">Free</Tag> : item.priceSar === null ? <Tag color="gold">Price pending</Tag> : <Tag>SAR {item.priceSar}</Tag>}
      {!item.isActive && <Tag>Hidden</Tag>}
      <Tag>{formatNumber(item._count.owners)} owners</Tag>
    </Flex>
  );
}

/** Shared commerce fields for frames, themes and avatars. */
function SaleFields() {
  return (
    <>
      <Flex gap={16} wrap>
        <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}><Input /></Form.Item>
        <Form.Item name="slug" label="Slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1, minWidth: 180 }}><Input /></Form.Item>
      </Flex>
      <Flex gap={16} wrap align="flex-end">
        <Form.Item name="isFree" label="Free" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.isFree !== b.isFree}>
          {({ getFieldValue }) =>
            !getFieldValue('isFree') && (
              <>
                <Form.Item name="priceSar" label="Price (SAR)" extra="Empty = price pending"><InputNumber min={0} max={10000} precision={2} /></Form.Item>
                <Form.Item name="storeProductId" label="Store product ID" style={{ minWidth: 220 }}><Input /></Form.Item>
              </>
            )
          }
        </Form.Item>
      </Flex>
      <Flex gap={24} wrap>
        <Form.Item name="isDefault" label="Default (given to every new player)" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="isActive" label="Visible in the app" valuePropName="checked"><Switch /></Form.Item>
        <Form.Item name="sortOrder" label="Order"><InputNumber min={0} max={1000} precision={0} /></Form.Item>
      </Flex>
    </>
  );
}

function saleInput(values: Record<string, unknown>) {
  return {
    name: values.name as string,
    slug: values.slug as string,
    isFree: Boolean(values.isFree),
    isDefault: Boolean(values.isDefault),
    priceSar: blank(values.isFree ? 0 : values.priceSar) as string | null,
    storeProductId: blank(values.storeProductId) as string | null,
    isActive: Boolean(values.isActive),
    sortOrder: Number(values.sortOrder ?? 0),
  };
}

/** Header with breadcrumbs and Delete for an item's edit page. */
function ItemHeader({ kind, item, isNew }: { kind: CosmeticKind; item?: Cosmetic; isNew: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canEdit = useCanEdit();
  const list = paths[kind];
  const label = kind === 'FRAME' ? 'Profile frames' : kind === 'THEME' ? 'App themes' : 'Avatars';
  return (
    <PageHeader
      title={isNew ? `Add ${nouns[kind]}` : (item?.name ?? '…')}
      subtitle={!isNew && item ? <StatusTags item={item} /> : undefined}
      crumbs={[{ label: 'Customization' }, { label, to: list }, { label: isNew ? 'Add' : 'Edit' }]}
      backTo={list}
      actions={
        !isNew &&
        canEdit &&
        item && (
          <ConfirmButton
            danger
            title={`Delete this ${nouns[kind]}?`}
            description="Only items nobody owns (and not the default) can be deleted; otherwise hide it."
            successMessage="Deleted"
            onConfirm={async () => {
              await storeApi.deleteCosmetic(item.id);
              queryClient.invalidateQueries({ queryKey: ['store'], refetchType: 'none' });
              navigate(list);
            }}
          >
            Delete
          </ConfirmButton>
        )
      }
    />
  );
}

function useSave(kind: CosmeticKind, id: string | undefined, setError: (e: string | null) => void) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof storeApi.createCosmetic>[0]) => (id ? storeApi.updateCosmetic(id, input) : storeApi.createCosmetic(input)),
    onSuccess: () => {
      message.success(`${nouns[kind][0].toUpperCase()}${nouns[kind].slice(1)} saved`);
      queryClient.invalidateQueries({ queryKey: ['store'] });
      navigate(paths[kind]);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });
}

// ───────────── Frames ─────────────

export function FramesListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { items, isFetching } = useCosmetics('FRAME');
  return (
    <>
      <PageHeader
        title="Profile frames"
        subtitle="Ring artwork drawn around the player's avatar. One frame is active at a time."
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/frames/new')}>Add frame</Button>}
      />
      {items.length === 0 && !isFetching ? (
        <Empty description="No frames yet" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => {
            const design = item.metadata as FrameDesign | null;
            return (
              <Col key={item.id} xs={12} sm={8} md={6} xl={4}>
                <Card
                  size="small"
                  hoverable
                  onClick={() => navigate(`/customization/frames/${item.id}`)}
                  cover={
                    <Flex justify="center" style={{ padding: 12 }}>
                      <FramePreview ringUrl={item.assetUrl} glowColor={design?.glowColor} layout={design?.layout} size={132} />
                    </Flex>
                  }
                >
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <div style={{ marginTop: 6 }}><StatusTags item={item} /></div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </>
  );
}

type FrameForm = Record<string, any> & { assetUrl?: string | null; glowColor: string; avatarX: number; avatarY: number; avatarSize: number; ringX: number; ringY: number; ringSize: number };

function layoutFrom(values: Partial<FrameForm>): FrameLayout {
  const f = (value: number | undefined, fallback: number) => (value ?? fallback * 100) / 100;
  return {
    avatar: { x: f(values.avatarX, defaultFrameLayout.avatar.x), y: f(values.avatarY, defaultFrameLayout.avatar.y), size: f(values.avatarSize, defaultFrameLayout.avatar.size) },
    ring: { x: f(values.ringX, defaultFrameLayout.ring.x), y: f(values.ringY, defaultFrameLayout.ring.y), width: f(values.ringSize, defaultFrameLayout.ring.width), height: f(values.ringSize, defaultFrameLayout.ring.height) },
  };
}

function FrameLivePreview({ form }: { form: ReturnType<typeof Form.useForm<FrameForm>>[0] }) {
  const values = (Form.useWatch([], form) ?? {}) as Partial<FrameForm>;
  const layout = layoutFrom(values);
  return (
    <Card title="Preview" size="small">
      <Flex vertical align="center" gap={12}>
        <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layout} size={260} />
        <Flex gap={16} align="center">
          <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layout} size={72} stage={false} />
          <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layout} size={40} stage={false} />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Profile · lists</Typography.Text>
        </Flex>
      </Flex>
    </Card>
  );
}

export function FrameFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const canEdit = useCanEdit();
  const [form] = Form.useForm<FrameForm>();
  const [error, setError] = useState<string | null>(null);
  const item = useCosmetic(id);
  const save = useSave('FRAME', id, setError);

  useEffect(() => {
    if (!item.data) return;
    const design = item.data.metadata as FrameDesign | null;
    const layout = design?.layout ?? defaultFrameLayout;
    form.setFieldsValue({
      ...item.data,
      glowColor: design?.glowColor ?? '#7c3aed',
      avatarX: pct(layout.avatar.x),
      avatarY: pct(layout.avatar.y),
      avatarSize: pct(layout.avatar.size),
      ringX: pct(layout.ring.x),
      ringY: pct(layout.ring.y),
      ringSize: pct(layout.ring.width),
    } as FrameForm);
  }, [item.data, form]);

  return (
    <>
      <ItemHeader kind="FRAME" item={item.data} isNew={isNew} />
      <FormPage
        form={form}
        disabled={!canEdit}
        loading={!isNew && item.isPending}
        saving={save.isPending}
        error={error}
        cancelTo={paths.FRAME}
        initialValues={{
          isFree: false, isDefault: false, isActive: false, sortOrder: 0, glowColor: '#7c3aed',
          avatarX: pct(defaultFrameLayout.avatar.x), avatarY: pct(defaultFrameLayout.avatar.y), avatarSize: pct(defaultFrameLayout.avatar.size),
          ringX: pct(defaultFrameLayout.ring.x), ringY: pct(defaultFrameLayout.ring.y), ringSize: pct(defaultFrameLayout.ring.width),
        }}
        onFinish={(values) => {
          setError(null);
          save.mutate({ ...saleInput(values), kind: 'FRAME', assetUrl: blank(values.assetUrl) as string | null, metadata: { glowColor: values.glowColor, layout: layoutFrom(values) } });
        }}
        aside={<FrameLivePreview form={form} />}
      >
        <Form.Item name="assetUrl" label="Ring artwork" extra="Transparent PNG, square, at least 512 px.">
          <ImageUpload size={96} hint="Transparent PNG · max 5 MB" />
        </Form.Item>
        <Form.Item name="glowColor" label="Glow color" extra="Lights the preview stage and the profile header." getValueFromEvent={(color) => color.toHexString()}>
          <ColorPicker showText format="hex" disabledAlpha />
        </Form.Item>
        <SaleFields />
        <Collapse
          size="small"
          items={[
            {
              key: 'fit',
              label: 'Fit — line the avatar up with the ring opening',
              forceRender: true,
              children: (
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Form.Item name="avatarSize" label="Avatar size %"><Slider min={30} max={100} step={0.5} /></Form.Item>
                    <Form.Item name="avatarX" label="Avatar left %"><Slider min={0} max={50} step={0.5} /></Form.Item>
                    <Form.Item name="avatarY" label="Avatar top %"><Slider min={0} max={50} step={0.5} /></Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="ringSize" label="Ring size %"><Slider min={50} max={100} step={0.5} /></Form.Item>
                    <Form.Item name="ringX" label="Ring left %"><Slider min={0} max={25} step={0.5} /></Form.Item>
                    <Form.Item name="ringY" label="Ring top %"><Slider min={0} max={25} step={0.5} /></Form.Item>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </FormPage>
    </>
  );
}

// ───────────── Themes ─────────────

export function ThemesListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { items, isFetching } = useCosmetics('THEME');
  return (
    <>
      <PageHeader
        title="App themes"
        subtitle="Each theme is a set of 58 tokens (colors and corners) that restyles the whole app."
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/themes/new')}>Add theme</Button>}
      />
      {items.length === 0 && !isFetching ? (
        <Empty description="No themes yet" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => {
            const design = item.metadata as ThemeDesign | null;
            const tokens = design?.tokens ?? {};
            return (
              <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                <Card size="small" hoverable onClick={() => navigate(`/customization/themes/${item.id}`)} title={<Flex justify="space-between">{item.name}{design && <Tag>{design.appearance === 'light' ? 'Light' : 'Dark'}</Tag>}</Flex>}>
                  {design ? (
                    <div style={{ background: String(tokens.bg), borderRadius: 12, padding: 12, border: `1px solid ${String(tokens['border-subtle'])}` }}>
                      <Flex gap={6}>
                        {['bg', 'surface', 'surface-raised', 'accent', 'accent-secondary', 'text-primary'].map((key) => (
                          <div key={key} title={key} style={{ width: 24, height: 24, borderRadius: 12, background: String(tokens[key]), border: '1px solid var(--v-swatch-border)' }} />
                        ))}
                      </Flex>
                      <div style={{ marginTop: 10, padding: '6px 0', textAlign: 'center', fontSize: 12, fontWeight: 600, borderRadius: Number(tokens['radius-control']), background: String(tokens.accent), color: String(tokens['on-accent']) }}>
                        Vote Clip A
                      </div>
                    </div>
                  ) : (
                    <Tag color="red">No colors set</Tag>
                  )}
                  <div style={{ marginTop: 10 }}><StatusTags item={item} /></div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </>
  );
}

function ContrastTable({ tokens }: { tokens: ThemeTokens }) {
  const rows = contrastPairs.map((pair) => {
    const ratio = contrastRatio(solid(tokens[pair.fg]), solid(tokens[pair.bg]));
    return { ...pair, ratio, pass: ratio >= pair.min };
  });
  const failing = rows.filter((row) => !row.pass).length;
  return (
    <Card size="small" title={<>Contrast (WCAG 2.1) {failing === 0 ? <Tag color="green">All pass</Tag> : <Tag color="red">{failing} below target</Tag>}</>}>
      <Table
        size="small"
        rowKey="label"
        pagination={false}
        dataSource={rows}
        columns={[
          { title: 'Pair', dataIndex: 'label' },
          { title: 'Ratio', dataIndex: 'ratio', render: (r: number) => `${r.toFixed(2)}:1` },
          { title: '', dataIndex: 'pass', render: (pass: boolean, row) => (pass ? <Tag color="green">≥ {row.min}</Tag> : <Tag color="red">&lt; {row.min}</Tag>) },
        ]}
      />
    </Card>
  );
}

type ThemeForm = Record<string, any> & { appearance: 'dark' | 'light'; tokens: ThemeTokens };

function ThemeAside({ form }: { form: ReturnType<typeof Form.useForm<ThemeForm>>[0] }) {
  const tokens = (Form.useWatch('tokens', form) ?? {}) as ThemeTokens;
  const name = (Form.useWatch('name', form) as string) ?? '';
  return (
    <Flex vertical gap={16}>
      <ThemePreview name={name} tokens={tokens} />
      <ContrastTable tokens={tokens} />
    </Flex>
  );
}

export function ThemeFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const { message } = App.useApp();
  const canEdit = useCanEdit();
  const [form] = Form.useForm<ThemeForm>();
  const [error, setError] = useState<string | null>(null);
  const item = useCosmetic(id);
  const all = useCosmetics('THEME');
  const save = useSave('THEME', id, setError);
  const groups = useQuery({ queryKey: ['store', 'theme-tokens'], queryFn: () => get<TokenGroup[]>('/admin/store/theme-tokens'), staleTime: Infinity });
  const designed = useMemo(() => all.items.filter((t) => t.metadata), [all.items]);

  useEffect(() => {
    if (isNew) {
      const starter = (designed.find((t) => t.isDefault) ?? designed[0])?.metadata as ThemeDesign | undefined;
      if (starter && !form.getFieldValue('tokens')) form.setFieldsValue({ appearance: starter.appearance, tokens: { ...starter.tokens } });
    } else if (item.data) {
      const design = item.data.metadata as ThemeDesign | null;
      form.setFieldsValue({ ...item.data, appearance: design?.appearance ?? 'dark', tokens: { ...(design?.tokens ?? {}) } } as ThemeForm);
    }
  }, [isNew, item.data, designed, form]);

  function copyFrom(themeId: string) {
    const source = designed.find((t) => t.id === themeId)?.metadata as ThemeDesign | undefined;
    if (!source) return;
    form.setFieldsValue({ appearance: source.appearance, tokens: { ...source.tokens } });
    message.info('Colors copied — adjust and save');
  }

  return (
    <>
      <ItemHeader kind="THEME" item={item.data} isNew={isNew} />
      <FormPage
        form={form}
        disabled={!canEdit}
        loading={(!isNew && item.isPending) || groups.isPending}
        saving={save.isPending}
        error={error}
        cancelTo={paths.THEME}
        initialValues={{ isFree: false, isDefault: false, isActive: false, sortOrder: 0, appearance: 'dark' }}
        onFinish={(values) => {
          setError(null);
          save.mutate({ ...saleInput(values), kind: 'THEME', metadata: { appearance: values.appearance, tokens: values.tokens } });
        }}
        aside={<ThemeAside form={form} />}
      >
        <SaleFields />
        <Form.Item name="appearance" label="Appearance">
          <Segmented options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
        </Form.Item>
        <Flex justify="space-between" align="center" style={{ margin: '8px 0 12px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>Colors & corners</Typography.Title>
          <Select placeholder="Copy colors from…" style={{ width: 220 }} value={null} options={designed.filter((t) => t.id !== id).map((t) => ({ value: t.id, label: t.name }))} onChange={copyFrom} />
        </Flex>
        <Collapse
          defaultActiveKey={['Core']}
          items={(groups.data ?? []).map((group) => ({
            key: group.group,
            forceRender: true,
            label: (
              <Flex vertical>
                <Typography.Text strong>{group.group} <Typography.Text type="secondary">· {group.tokens.length}</Typography.Text></Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{group.description}</Typography.Text>
              </Flex>
            ),
            children: (
              <Row gutter={[12, 0]}>
                {group.tokens.map((token) => (
                  <Col xs={24} sm={12} key={token.key}>
                    {token.type === 'color' ? (
                      <Form.Item name={['tokens', token.key]} label={token.label} tooltip={`theme/${token.key}`} rules={[{ required: true, message: 'Required' }]} getValueFromEvent={(color) => color.toHexString()}>
                        <ColorPicker showText format="hex" />
                      </Form.Item>
                    ) : (
                      <Form.Item name={['tokens', token.key]} label={`${token.label} (pt)`} tooltip={`theme/${token.key}`} rules={[{ required: true }]}>
                        <InputNumber min={0} max={40} precision={0} />
                      </Form.Item>
                    )}
                  </Col>
                ))}
              </Row>
            ),
          }))}
        />
      </FormPage>
    </>
  );
}

// ───────────── Avatars ─────────────

export function AvatarsListPage() {
  const navigate = useNavigate();
  const canEdit = useCanEdit();
  const { items, isFetching } = useCosmetics('AVATAR');
  return (
    <>
      <PageHeader
        title="Avatars"
        subtitle="Ready-made profile pictures players can pick instead of uploading a photo."
        actions={canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/customization/avatars/new')}>Add avatar</Button>}
      />
      {items.length === 0 && !isFetching ? (
        <Empty description="No avatars yet — players can still upload their own photo" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={12} sm={8} md={6} xl={4}>
              <Card
                size="small"
                hoverable
                onClick={() => navigate(`/customization/avatars/${item.id}`)}
                cover={<div style={{ aspectRatio: '1', ...checkerboard }}>{item.assetUrl && <img src={item.assetUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>}
              >
                <Typography.Text strong>{item.name}</Typography.Text>
                <div style={{ marginTop: 6 }}><StatusTags item={item} /></div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}

export function AvatarFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const canEdit = useCanEdit();
  const [form] = Form.useForm<Record<string, unknown>>();
  const [error, setError] = useState<string | null>(null);
  const item = useCosmetic(id);
  const save = useSave('AVATAR', id, setError);

  useEffect(() => {
    if (item.data) form.setFieldsValue(item.data as unknown as Record<string, any>);
  }, [item.data, form]);

  return (
    <>
      <ItemHeader kind="AVATAR" item={item.data} isNew={isNew} />
      <FormPage
        form={form}
        disabled={!canEdit}
        loading={!isNew && item.isPending}
        saving={save.isPending}
        error={error}
        cancelTo={paths.AVATAR}
        initialValues={{ isFree: true, isDefault: false, isActive: true, sortOrder: 0 }}
        onFinish={(values) => {
          setError(null);
          save.mutate({ ...saleInput(values), kind: 'AVATAR', assetUrl: blank(values.assetUrl) as string | null });
        }}
      >
        <Form.Item name="assetUrl" label="Image" extra="Square, at least 512 px." rules={[{ required: true, message: 'Upload an image' }]}>
          <ImageUpload size={120} />
        </Form.Item>
        <SaleFields />
        {!isNew && <Alert type="info" showIcon message="Changing the image updates it for players who already picked this avatar only when they pick it again." />}
      </FormPage>
    </>
  );
}
