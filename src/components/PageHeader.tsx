import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Breadcrumb, Flex } from 'antd';
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
    <div className="v-page-head">
      {crumbs && crumbs.length > 0 && (
        <Breadcrumb
          style={{ marginBottom: 12, fontSize: 13 }}
          items={crumbs.map((crumb) => ({ title: crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label }))}
        />
      )}
      <Flex justify="space-between" align="flex-end" gap={16} wrap>
        <Flex align="center" gap={14} style={{ minWidth: 0 }}>
          {backTo && (
            <button type="button" className="v-back" onClick={() => navigate(backTo)} aria-label="Back">
              <ArrowLeftOutlined />
            </button>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 className="v-page-title">{title}</h1>
            {subtitle && <div className="v-page-sub">{subtitle}</div>}
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
