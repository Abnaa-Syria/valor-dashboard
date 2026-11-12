import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Col, Collapse, ColorPicker, Empty, Flex, Form, Input, InputNumber, Row, Slider, Switch, Tag, Typography } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import { formatNumber } from '../../lib/format';
import { EditModal } from '../../components/EditModal';
import { ImageUpload, checkerboard } from '../../components/ImageUpload';
import { storeApi, storeKeys, type Cosmetic, type CosmeticKind } from './api';
import { defaultFrameLayout, type FrameDesign, type FrameLayout, type ThemeDesign } from './design';
import { FramePreview } from './FramePreview';
import { ThemeEditor } from './ThemeEditor';

const blank = (value: unknown) => (value === '' || value === undefined ? null : value);
const pct = (fraction: number) => Math.round(fraction * 1000) / 10;

function useCosmetics(kind: CosmeticKind) {
  const query = useQuery({ queryKey: storeKeys.cosmetics, queryFn: storeApi.listCosmetics });
  return { ...query, items: query.data?.filter((item) => item.kind === kind) ?? [] };
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

/** Shared commerce fields for frames / avatars. */
function SaleFields() {
  return (
    <>
      <Flex gap={12} wrap>
        <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 160 }}>
          <Input />
        </Form.Item>
        <Form.Item name="slug" label="Slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1, minWidth: 160 }}>
          <Input />
        </Form.Item>
      </Flex>
      <Flex gap={12} wrap align="flex-end">
        <Form.Item name="isFree" label="Free" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(a, b) => a.isFree !== b.isFree}>
          {({ getFieldValue }) =>
            !getFieldValue('isFree') && (
              <>
                <Form.Item name="priceSar" label="Price (SAR)" extra="Empty = price pending">
                  <InputNumber min={0} max={10000} precision={2} />
                </Form.Item>
                <Form.Item name="storeProductId" label="Store product ID" style={{ minWidth: 180 }}>
                  <Input />
                </Form.Item>
              </>
            )
          }
        </Form.Item>
      </Flex>
      <Flex gap={24} wrap>
        <Form.Item name="isDefault" label="Given to every new player" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="isActive" label="Visible in the app" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="sortOrder" label="Order">
          <InputNumber min={0} max={1000} precision={0} />
        </Form.Item>
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

// ───────────── Frames ─────────────

type FrameForm = {
  name: string;
  slug: string;
  isFree: boolean;
  isDefault: boolean;
  priceSar?: number | string | null;
  storeProductId?: string | null;
  isActive: boolean;
  sortOrder: number;
  assetUrl?: string | null;
  glowColor: string;
  avatarX: number;
  avatarY: number;
  avatarSize: number;
  ringX: number;
  ringY: number;
  ringSize: number;
};

function toFrameForm(item: Cosmetic | 'new', count: number): Partial<FrameForm> {
  const design = item === 'new' ? null : (item.metadata as FrameDesign | null);
  const layout = design?.layout ?? defaultFrameLayout;
  const base = {
    glowColor: design?.glowColor ?? '#7c3aed',
    avatarX: pct(layout.avatar.x),
    avatarY: pct(layout.avatar.y),
    avatarSize: pct(layout.avatar.size),
    ringX: pct(layout.ring.x),
    ringY: pct(layout.ring.y),
    ringSize: pct(layout.ring.width),
  };
  if (item === 'new') return { ...base, isFree: false, isDefault: false, isActive: false, sortOrder: count };
  return { ...base, ...item, priceSar: item.priceSar };
}

function layoutFrom(values: Partial<FrameForm>): FrameLayout {
  const f = (value: number | undefined, fallback: number) => (value ?? fallback * 100) / 100;
  return {
    avatar: { x: f(values.avatarX, defaultFrameLayout.avatar.x), y: f(values.avatarY, defaultFrameLayout.avatar.y), size: f(values.avatarSize, defaultFrameLayout.avatar.size) },
    ring: {
      x: f(values.ringX, defaultFrameLayout.ring.x),
      y: f(values.ringY, defaultFrameLayout.ring.y),
      width: f(values.ringSize, defaultFrameLayout.ring.width),
      height: f(values.ringSize, defaultFrameLayout.ring.height),
    },
  };
}

function FrameLivePreview() {
  const form = Form.useFormInstance<FrameForm>();
  const values = Form.useWatch([], form) ?? {};
  return (
    <Flex vertical align="center" gap={8}>
      <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layoutFrom(values)} size={220} />
      <Flex gap={12} align="center">
        <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layoutFrom(values)} size={64} stage={false} />
        <FramePreview ringUrl={values.assetUrl} glowColor={values.glowColor} layout={layoutFrom(values)} size={40} stage={false} />
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Profile · lists
        </Typography.Text>
      </Flex>
    </Flex>
  );
}

export function FramesTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { items, isFetching } = useCosmetics('FRAME');
  const [editing, setEditing] = useState<Cosmetic | 'new' | null>(null);

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="A frame is a transparent PNG ring drawn over the player's avatar. Upload the ring, then line the avatar circle up with its opening using the sliders — the preview is exactly what the app shows."
      />
      {canEdit && (
        <Button icon={<PlusOutlined />} onClick={() => setEditing('new')} style={{ marginBottom: 12 }}>
          Add frame
        </Button>
      )}
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
                  hoverable={canEdit}
                  onClick={() => canEdit && setEditing(item)}
                  cover={
                    <Flex justify="center" style={{ padding: 12 }}>
                      <FramePreview ringUrl={item.assetUrl} glowColor={design?.glowColor} layout={design?.layout} size={132} />
                    </Flex>
                  }
                >
                  <Typography.Text strong>{item.name}</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <StatusTags item={item} />
                  </div>
                  {!item.assetUrl && <Tag color="red" style={{ marginTop: 6 }}>No artwork</Tag>}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <EditModal<FrameForm>
        open={editing !== null}
        width={860}
        title={editing === 'new' ? 'Add frame' : 'Edit frame'}
        initialValues={editing ? toFrameForm(editing, items.length) : {}}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: storeKeys.cosmetics })}
        onSave={(values) => {
          const input = {
            ...saleInput(values),
            kind: 'FRAME' as const,
            assetUrl: blank(values.assetUrl) as string | null,
            metadata: { glowColor: values.glowColor, layout: layoutFrom(values) },
          };
          return editing && editing !== 'new' ? storeApi.updateCosmetic(editing.id, input) : storeApi.createCosmetic(input);
        }}
      >
        {() => (
          <Row gutter={24}>
            <Col xs={24} md={14}>
              <SaleFields />
              <Form.Item name="assetUrl" label="Ring artwork" extra="Transparent PNG, square, at least 512 px.">
                <ImageUpload size={96} hint="Transparent PNG · max 5 MB" />
              </Form.Item>
              <Form.Item name="glowColor" label="Glow color" extra="Lights the preview stage and the profile header." getValueFromEvent={(color) => color.toHexString()}>
                <ColorPicker showText format="hex" disabledAlpha />
              </Form.Item>
              <Collapse
                size="small"
                items={[
                  {
                    key: 'layout',
                    label: 'Fit (avatar position inside the ring)',
                    forceRender: true,
                    children: (
                      <>
                        <Form.Item name="avatarSize" label="Avatar size %">
                          <Slider min={30} max={100} step={0.5} />
                        </Form.Item>
                        <Form.Item name="avatarX" label="Avatar left %">
                          <Slider min={0} max={50} step={0.5} />
                        </Form.Item>
                        <Form.Item name="avatarY" label="Avatar top %">
                          <Slider min={0} max={50} step={0.5} />
                        </Form.Item>
                        <Form.Item name="ringSize" label="Ring size %">
                          <Slider min={50} max={100} step={0.5} />
                        </Form.Item>
                        <Form.Item name="ringX" label="Ring left %">
                          <Slider min={0} max={25} step={0.5} />
                        </Form.Item>
                        <Form.Item name="ringY" label="Ring top %">
                          <Slider min={0} max={25} step={0.5} />
                        </Form.Item>
                      </>
                    ),
                  },
                ]}
              />
            </Col>
            <Col xs={24} md={10}>
              <Typography.Text type="secondary">Preview</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <FrameLivePreview />
              </div>
            </Col>
          </Row>
        )}
      </EditModal>
    </>
  );
}

// ───────────── Themes ─────────────

export function ThemesTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { items, isFetching } = useCosmetics('THEME');
  const [editing, setEditing] = useState<Cosmetic | 'new' | null>(null);

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="A theme is one set of 58 tokens (colors and corners) that restyles the whole app. Open a theme to edit its tokens with a live preview and a contrast check."
      />
      {canEdit && (
        <Button icon={<PlusOutlined />} onClick={() => setEditing('new')} style={{ marginBottom: 12 }}>
          Add theme
        </Button>
      )}
      {items.length === 0 && !isFetching ? (
        <Empty description="No themes yet" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => {
            const design = item.metadata as ThemeDesign | null;
            const tokens = design?.tokens ?? {};
            const swatches = ['bg', 'surface', 'surface-raised', 'accent', 'accent-secondary', 'text-primary'];
            return (
              <Col key={item.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  size="small"
                  title={
                    <Flex justify="space-between" align="center">
                      {item.name}
                      {design && <Tag>{design.appearance === 'light' ? 'Light' : 'Dark'}</Tag>}
                    </Flex>
                  }
                  extra={canEdit && <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditing(item)} />}
                >
                  {design ? (
                    <div style={{ background: String(tokens.bg), borderRadius: 12, padding: 12, border: `1px solid ${String(tokens['border-subtle'])}` }}>
                      <Flex gap={6}>
                        {swatches.map((key) => (
                          <div key={key} title={key} style={{ width: 24, height: 24, borderRadius: 12, background: String(tokens[key]), border: '1px solid #ffffff22' }} />
                        ))}
                      </Flex>
                      <div
                        style={{
                          marginTop: 10,
                          padding: '6px 0',
                          textAlign: 'center',
                          fontSize: 12,
                          fontWeight: 600,
                          borderRadius: Number(tokens['radius-control']),
                          background: String(tokens.accent),
                          color: String(tokens['on-accent']),
                        }}
                      >
                        Vote Clip A
                      </div>
                    </div>
                  ) : (
                    <Tag color="red">No colors set</Tag>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <StatusTags item={item} />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
      <ThemeEditor theme={editing} themes={items} onClose={() => setEditing(null)} onSaved={() => queryClient.invalidateQueries({ queryKey: storeKeys.cosmetics })} />
    </>
  );
}

// ───────────── Avatars ─────────────

type AvatarForm = {
  name: string;
  slug: string;
  isFree: boolean;
  isDefault: boolean;
  priceSar?: number | string | null;
  storeProductId?: string | null;
  isActive: boolean;
  sortOrder: number;
  assetUrl?: string | null;
};

export function AvatarsTab({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { items, isFetching } = useCosmetics('AVATAR');
  const [editing, setEditing] = useState<Cosmetic | 'new' | null>(null);

  return (
    <>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Ready-made profile pictures players can pick instead of uploading a photo. The default one is given to every new player."
      />
      {canEdit && (
        <Button icon={<PlusOutlined />} onClick={() => setEditing('new')} style={{ marginBottom: 12 }}>
          Add avatar
        </Button>
      )}
      {items.length === 0 && !isFetching ? (
        <Empty description="No avatars yet — players can still upload their own photo" />
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={12} sm={8} md={6} xl={4}>
              <Card
                size="small"
                hoverable={canEdit}
                onClick={() => canEdit && setEditing(item)}
                cover={
                  <div style={{ aspectRatio: '1', ...checkerboard }}>
                    {item.assetUrl && <img src={item.assetUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                }
              >
                <Typography.Text strong>{item.name}</Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <StatusTags item={item} />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <EditModal<AvatarForm>
        open={editing !== null}
        title={editing === 'new' ? 'Add avatar' : 'Edit avatar'}
        initialValues={editing === 'new' ? { isFree: true, isDefault: false, isActive: true, sortOrder: items.length } : (editing ?? {})}
        onClose={() => setEditing(null)}
        onSaved={() => queryClient.invalidateQueries({ queryKey: storeKeys.cosmetics })}
        onSave={(values) => {
          const input = { ...saleInput(values), kind: 'AVATAR' as const, assetUrl: blank(values.assetUrl) as string | null };
          return editing && editing !== 'new' ? storeApi.updateCosmetic(editing.id, input) : storeApi.createCosmetic(input);
        }}
      >
        {() => (
          <>
            <Form.Item name="assetUrl" label="Image" extra="Square, at least 512 px." rules={[{ required: true, message: 'Upload an image' }]}>
              <ImageUpload size={96} />
            </Form.Item>
            <SaleFields />
          </>
        )}
      </EditModal>
    </>
  );
}
