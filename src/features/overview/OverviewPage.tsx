import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Segmented, Statistic, Typography } from 'antd';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { PageHeader } from '../../components/PageHeader';
import { PageState } from '../../components/common';

type Overview = {
  users: { total: number; new24h: number };
  clips: { total: number };
  battles: { active: number; closed: number; entriesWaiting: number };
  votes: { last24h: number };
  reports: { open: number };
  revenue: { totalSar: string; last30dSar: string };
  store: { purchases30d: number; giftsSent30d: number };
};

type Day = { date: string; newPlayers: number; clips: number; battlesCompleted: number; votes: number; revenueSar: number };

const ink = '#9085e9';
const gridColor = 'rgba(255,255,255,0.06)';
const axisColor = 'rgba(255,255,255,0.45)';
const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function ChartCard({ title, data, field, kind, money }: { title: string; data: Day[]; field: keyof Day; kind: 'area' | 'bar'; money?: boolean }) {
  const total = data.reduce((sum, d) => sum + Number(d[field]), 0);
  const fmt = (v: number) => (money ? `SAR ${v.toFixed(2)}` : formatNumber(v));
  const common = { data, margin: { top: 8, right: 8, bottom: 0, left: -12 } };
  const axes = (
    <>
      <CartesianGrid stroke={gridColor} vertical={false} />
      <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
      <YAxis allowDecimals={!!money} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
      <Tooltip
        cursor={kind === 'bar' ? { fill: 'rgba(255,255,255,0.04)' } : { stroke: axisColor }}
        contentStyle={{ background: '#1b1729', border: '1px solid #2c2640', borderRadius: 8 }}
        labelFormatter={(d) => shortDate(String(d))}
        formatter={(v) => [fmt(Number(v)), title]}
      />
    </>
  );
  return (
    <Card size="small" title={title} extra={<Typography.Text strong>{fmt(total)}</Typography.Text>}>
      <ResponsiveContainer width="100%" height={200}>
        {kind === 'area' ? (
          <AreaChart {...common}>
            {axes}
            <Area type="monotone" dataKey={field} stroke={ink} strokeWidth={2} fill={ink} fillOpacity={0.15} activeDot={{ r: 4 }} />
          </AreaChart>
        ) : (
          <BarChart {...common}>
            {axes}
            <Bar dataKey={field} fill={ink} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}

export function OverviewPage() {
  const [days, setDays] = useState(30);
  const stats = useQuery({ queryKey: ['stats', 'overview'], queryFn: () => get<Overview>('/admin/stats/overview'), refetchInterval: 60_000 });
  const series = useQuery({ queryKey: ['stats', 'timeseries', days], queryFn: () => get<Day[]>('/admin/stats/timeseries', { days }) });

  if (stats.isError) return <PageState loading={false} error={stats.error} onRetry={stats.refetch} />;
  const data = stats.data;

  const cards: { title: string; value?: number | string; to?: string; prefix?: string; precision?: number }[] = [
    { title: 'Total players', value: data?.users.total, to: '/players' },
    { title: 'New players (24h)', value: data?.users.new24h, to: '/players' },
    { title: 'Published clips', value: data?.clips.total, to: '/clips' },
    { title: 'Open reports', value: data?.reports.open, to: '/reports' },
    { title: 'Active battles', value: data?.battles.active, to: '/battles?status=ACTIVE' },
    { title: 'Waiting for an opponent', value: data?.battles.entriesWaiting, to: '/entries' },
    { title: 'Completed battles', value: data?.battles.closed, to: '/battles?status=CLOSED' },
    { title: 'Votes (24h)', value: data?.votes.last24h },
    { title: 'Revenue (30 days)', value: data?.revenue.last30dSar, prefix: 'SAR', precision: 2, to: '/purchases' },
    { title: 'Revenue (all time)', value: data?.revenue.totalSar, prefix: 'SAR', precision: 2, to: '/purchases' },
    { title: 'Purchases (30 days)', value: data?.store.purchases30d, to: '/purchases' },
    { title: 'Gifts sent (30 days)', value: data?.store.giftsSent30d },
  ];

  const daily = series.data ?? [];
  return (
    <>
      <PageHeader title="Overview" subtitle="How VALOR is doing right now. Test purchases are not counted as revenue." />
      <Row gutter={[16, 16]}>
        {cards.map((card) => {
          const body = (
            <Card loading={stats.isPending} hoverable={!!card.to} size="small">
              <Statistic title={card.title} value={card.value ?? 0} prefix={card.prefix} precision={card.precision} />
            </Card>
          );
          return <Col key={card.title} xs={12} md={8} xl={6}>{card.to ? <Link to={card.to}>{body}</Link> : body}</Col>;
        })}
      </Row>

      <Row align="middle" justify="space-between" style={{ margin: '28px 0 12px' }}>
        <Typography.Title level={5} style={{ margin: 0 }}>Daily activity</Typography.Title>
        <Segmented value={days} onChange={(v) => setDays(Number(v))} options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} />
      </Row>
      {series.isError ? (
        <PageState loading={false} error={series.error} onRetry={series.refetch} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}><ChartCard title="New players" data={daily} field="newPlayers" kind="area" /></Col>
          <Col xs={24} lg={12}><ChartCard title="Votes" data={daily} field="votes" kind="area" /></Col>
          <Col xs={24} lg={12}><ChartCard title="Clips uploaded" data={daily} field="clips" kind="bar" /></Col>
          <Col xs={24} lg={12}><ChartCard title="Battles completed" data={daily} field="battlesCompleted" kind="bar" /></Col>
          <Col xs={24}><ChartCard title="Revenue" data={daily} field="revenueSar" kind="bar" money /></Col>
        </Row>
      )}
    </>
  );
}
