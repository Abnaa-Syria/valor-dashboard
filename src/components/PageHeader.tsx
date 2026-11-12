import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Breadcrumb, Button, Flex, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

type Crumb = { label: string; to?: string };

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  crumbs?: Crumb[];
  /** Buttons on the right. */
  actions?: ReactNode;
  /** Shows a back arrow to this path. */
  backTo?: string;
};

/** Every page starts with this: breadcrumbs, title, subtitle and the page's actions. */
export function PageHeader({ title, subtitle, crumbs, actions, backTo }: Props) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: 20 }}>
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={crumbs.map((crumb) => ({ title: crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label }))}
        />
      )}
      <Flex justify="space-between" align="flex-start" gap={16} wrap>
        <Flex align="center" gap={12}>
          {backTo && <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(backTo)} aria-label="Back" />}
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
          </div>
        </Flex>
        {actions && (
          <Flex gap={8} wrap>
            {actions}
          </Flex>
        )}
      </Flex>
    </div>
  );
}
