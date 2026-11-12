import { useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  App,
  Button,
  Col,
  Collapse,
  ColorPicker,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Segmented,
  Select,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import { get, getErrorMessage } from '../../lib/api';
import { storeApi, type Cosmetic } from './api';
import { contrastPairs, contrastRatio, solid, type ThemeDesign, type ThemeTokens, type TokenGroup } from './design';
import { ThemePreview } from './ThemePreview';

type ThemeForm = {
  name: string;
  slug: string;
  isFree: boolean;
  isDefault: boolean;
  priceSar?: number | string | null;
  storeProductId?: string | null;
  isActive: boolean;
  sortOrder: number;
  appearance: 'dark' | 'light';
  tokens: ThemeTokens;
};

type Props = {
  theme: Cosmetic | 'new' | null;
  themes: Cosmetic[];
  onClose: () => void;
  onSaved: () => void;
};

const blank = (value: unknown) => (value === '' || value === undefined ? null : value);

function ContrastTable({ tokens }: { tokens: ThemeTokens }) {
  const rows = contrastPairs.map((pair) => {
    const ratio = contrastRatio(solid(tokens[pair.fg]), solid(tokens[pair.bg]));
    return { ...pair, ratio, pass: ratio >= pair.min };
  });
  const failing = rows.filter((row) => !row.pass).length;
  return (
    <>
      <Typography.Text strong>Contrast check (WCAG 2.1)</Typography.Text>{' '}
      {failing === 0 ? <Tag color="green">All pass</Tag> : <Tag color="red">{failing} below target</Tag>}
      <Table
        size="small"
        rowKey="label"
        pagination={false}
        style={{ marginTop: 8 }}
        dataSource={rows}
        columns={[
          { title: 'Pair', dataIndex: 'label' },
          { title: 'Ratio', dataIndex: 'ratio', render: (ratio: number) => `${ratio.toFixed(2)} : 1` },
          { title: 'Target', dataIndex: 'min', render: (min: number) => `≥ ${min}` },
          { title: '', dataIndex: 'pass', render: (pass: boolean) => (pass ? <Tag color="green">Pass</Tag> : <Tag color="red">Low</Tag>) },
        ]}
      />
    </>
  );
}

/** Full editor for a theme: details, all tokens grouped like Figma, live app preview, contrast check. */
export function ThemeEditor({ theme, themes, onClose, onSaved }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<ThemeForm>();
  const open = theme !== null;
  const isNew = theme === 'new';

  const { data: groups } = useQuery({
    queryKey: ['store', 'theme-tokens'],
    queryFn: () => get<TokenGroup[]>('/admin/store/theme-tokens'),
    staleTime: Infinity,
  });

  const designed = useMemo(() => themes.filter((t) => t.metadata), [themes]);
  const starter = designed.find((t) => t.isDefault) ?? designed[0];

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (theme === 'new') {
      const design = starter?.metadata as ThemeDesign | undefined;
      form.setFieldsValue({
        isFree: false,
        isDefault: false,
        isActive: false,
        sortOrder: themes.length,
        appearance: design?.appearance ?? 'dark',
        tokens: { ...(design?.tokens ?? {}) },
      });
    } else if (theme) {
      const design = theme.metadata as ThemeDesign | null;
      form.setFieldsValue({
        name: theme.name,
        slug: theme.slug,
        isFree: theme.isFree,
        isDefault: theme.isDefault,
        priceSar: theme.priceSar,
        storeProductId: theme.storeProductId,
        isActive: theme.isActive,
        sortOrder: theme.sortOrder,
        appearance: design?.appearance ?? 'dark',
        tokens: { ...(design?.tokens ?? (starter?.metadata as ThemeDesign | undefined)?.tokens ?? {}) } as ThemeTokens,
      });
    }
    // Only when the drawer opens / switches theme.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, theme]);

  const tokens = (Form.useWatch('tokens', form) ?? {}) as ThemeTokens;
  const name = Form.useWatch('name', form) ?? '';

  const save = useMutation({
    mutationFn: (values: ThemeForm) => {
      const input = {
        kind: 'THEME' as const,
        name: values.name,
        slug: values.slug,
        isFree: values.isFree,
        isDefault: values.isDefault,
        priceSar: blank(values.isFree ? 0 : values.priceSar) as string | null,
        storeProductId: blank(values.storeProductId) as string | null,
        isActive: values.isActive,
        sortOrder: values.sortOrder,
        metadata: { appearance: values.appearance, tokens: values.tokens },
      };
      return isNew ? storeApi.createCosmetic(input) : storeApi.updateCosmetic((theme as Cosmetic).id, input);
    },
    onSuccess: () => {
      message.success('Theme saved');
      onSaved();
      onClose();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  function copyFrom(id: string) {
    const source = designed.find((t) => t.id === id)?.metadata as ThemeDesign | undefined;
    if (!source) return;
    form.setFieldsValue({ appearance: source.appearance, tokens: { ...source.tokens } });
    message.info('Colors copied — adjust and save');
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width="min(1180px, 100vw)"
      title={isNew ? 'New theme' : `Edit theme · ${(theme as Cosmetic | null)?.name ?? ''}`}
      destroyOnHidden
      extra={
        <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
          Save theme
        </Button>
      }
    >
      <Form<ThemeForm> form={form} layout="vertical" onFinish={(values) => save.mutate(values)} disabled={save.isPending}>
        <Row gutter={24}>
          <Col xs={24} lg={14}>
            <Flex gap={12} wrap>
              <Form.Item name="name" label="Name" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
                <Input />
              </Form.Item>
              <Form.Item name="slug" label="Slug" rules={[{ required: true, pattern: /^[a-z0-9-]+$/, message: 'Lowercase letters, numbers and dashes' }]} style={{ flex: 1, minWidth: 180 }}>
                <Input />
              </Form.Item>
            </Flex>
            <Flex gap={12} wrap align="flex-end">
              <Form.Item name="appearance" label="Appearance">
                <Segmented options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} />
              </Form.Item>
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
                      <Form.Item name="storeProductId" label="Store product ID" style={{ minWidth: 200 }}>
                        <Input />
                      </Form.Item>
                    </>
                  )
                }
              </Form.Item>
            </Flex>
            <Flex gap={24} wrap>
              <Form.Item name="isDefault" label="Default theme (new players, login screens)" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isActive" label="Visible in the app" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="sortOrder" label="Order">
                <InputNumber min={0} max={1000} precision={0} />
              </Form.Item>
            </Flex>

            <Flex justify="space-between" align="center" style={{ margin: '8px 0' }}>
              <Typography.Title level={5} style={{ margin: 0 }}>
                Colors & corners
              </Typography.Title>
              <Select
                placeholder="Copy colors from…"
                style={{ width: 220 }}
                options={designed.filter((t) => t.id !== (theme as Cosmetic | null)?.id).map((t) => ({ value: t.id, label: t.name }))}
                onChange={copyFrom}
                value={null}
              />
            </Flex>

            {!groups ? (
              <Alert type="info" message="Loading tokens…" />
            ) : (
              <Collapse
                defaultActiveKey={['Core']}
                items={groups.map((group) => ({
                  key: group.group,
                  label: (
                    <Flex vertical>
                      <Typography.Text strong>
                        {group.group} <Typography.Text type="secondary">· {group.tokens.length}</Typography.Text>
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {group.description}
                      </Typography.Text>
                    </Flex>
                  ),
                  forceRender: true,
                  children: (
                    <Row gutter={[12, 0]}>
                      {group.tokens.map((token) => (
                        <Col xs={24} sm={12} key={token.key}>
                          {token.type === 'color' ? (
                            <Form.Item
                              name={['tokens', token.key]}
                              label={token.label}
                              tooltip={`theme/${token.key}`}
                              rules={[{ required: true, message: 'Required' }]}
                              getValueFromEvent={(color) => color.toHexString()}
                            >
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
            )}
          </Col>

          <Col xs={24} lg={10}>
            <div style={{ position: 'sticky', top: 0 }}>
              <Typography.Text type="secondary">Live preview</Typography.Text>
              <div style={{ marginTop: 8 }}>
                <ThemePreview name={name} tokens={tokens} />
              </div>
              <div style={{ marginTop: 16 }}>
                <ContrastTable tokens={tokens} />
              </div>
            </div>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
