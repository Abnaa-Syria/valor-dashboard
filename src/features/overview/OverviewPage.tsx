import { useId, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Flex, Row, Segmented, Skeleton, Typography } from 'antd';
import {
  ArrowRightOutlined,
  FireOutlined,
  FlagOutlined,
  GiftOutlined,
  HourglassOutlined,
  LikeOutlined,
  NotificationOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  UserAddOutlined,
  VideoCameraOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { get } from '../../lib/api';
import { formatNumber } from '../../lib/format';
import { PageState } from '../../components/common';
import { useCurrentAdmin } from '../auth/api';

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
const gridColor = 'rgba(167,139,250,0.08)';
const axisColor = 'rgba(214,208,240,0.45)';
const shortDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Icon chip colors only (identity of each tile); numbers stay in text colors.
const tones = {
  violet: { bg: 'linear-gradient(135deg,#6d28d9,#a78bfa)', glow: 'rgba(139,92,246,0.45)' },
  magenta: { bg: 'linear-gradient(135deg,#a21caf,#e879f9)', glow: 'rgba(217,70,239,0.4)' },
  coral: { bg: 'linear-gradient(135deg,#e11d48,#fb7185)', glow: 'rgba(251,113,133,0.4)' },
  amber: { bg: 'linear-gradient(135deg,#d97706,#fbbf24)', glow: 'rgba(251,191,36,0.35)' },
  teal: { bg: 'linear-gradient(135deg,#0f766e,#2dd4bf)', glow: 'rgba(45,212,191,0.35)' },
  sky: { bg: 'linear-gradient(135deg,#1d4ed8,#60a5fa)', glow: 'rgba(96,165,250,0.35)' },
} as const;

type Kpi = { title: string; value: ReactNode; icon: ReactNode; tone: keyof typeof tones; to?: string };

function KpiCard({ kpi, loading }: { kpi: Kpi; loading: boolean }) {
  const tone = tones[kpi.tone];
  const body = (
    <>
      <div className="v-kpi-icon" style={{ background: tone.bg, boxShadow: `0 10px 24px -10px ${tone.glow}` }}>{kpi.icon}</div>
      <div className="v-kpi-label">{kpi.title}</div>
      {loading ? <Skeleton.Input active size="small" style={{ marginTop: 6 }} /> : <div className="v-kpi-value">{kpi.value}</div>}
      {kpi.to && <ArrowRightOutlined className="v-kpi-arrow" />}
    </>
  );
  const style = { ['--kpi-glow' as string]: tone.glow };
  return kpi.to ? <Link to={kpi.to} className="v-kpi" style={style}>{body}</Link> : <div className="v-kpi" style={style}>{body}</div>;
}

function ChartCard({ title, data, field, kind, money }: { title: string; data: Day[]; field: keyof Day; kind: 'area' | 'bar'; money?: boolean }) {
  const gradientId = useId().replace(/:/g, '');
  const total = data.reduce((sum, d) => sum + Number(d[field]), 0);
  const fmt = (v: number) => (money ? `SAR ${v.toFixed(2)}` : formatNumber(v));
  const common = { data, margin: { top: 8, right: 8, bottom: 0, left: -12 } };
  const axes = (
    <>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ink} stopOpacity={kind === 'area' ? 0.45 : 1} />
          <stop offset="100%" stopColor={ink} stopOpacity={kind === 'area' ? 0 : 0.55} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke={gridColor} vertical={false} />
      <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
      <YAxis allowDecimals={!!money} tick={{ fill: axisColor, fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
      <Tooltip
        cursor={kind === 'bar' ? { fill: 'rgba(167,139,250,0.06)' } : { stroke: 'rgba(196,181,253,0.4)' }}
        contentStyle={{ background: '#1c1829', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 12, boxShadow: '0 16px 40px -12px rgba(0,0,0,0.8)' }}
        labelStyle={{ color: '#a39dbb' }}
        itemStyle={{ color: '#f4f1ff' }}
        labelFormatter={(d) => shortDate(String(d))}
        formatter={(v) => [fmt(Number(v)), title]}
      />
    </>
  );
  return (
    <Card size="small" title={title} extra={<span style={{ fontFamily: 'var(--v-display)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{fmt(total)}</span>}>
      <ResponsiveContainer width="100%" height={210}>
        {kind === 'area' ? (
          <AreaChart {...common}>
            {axes}
            <Area type="monotone" dataKey={field} stroke={ink} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 5, stroke: '#15121f', strokeWidth: 2 }} />
          </AreaChart>
        ) : (
          <BarChart {...common}>
            {axes}
            <Bar dataKey={field} fill={`url(#${gradientId})`} radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function OverviewPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(30);
  const { data: admin } = useCurrentAdmin();
  const stats = useQuery({ queryKey: ['stats', 'overview'], queryFn: () => get<Overview>('/admin/stats/overview'), refetchInterval: 60_000 });
  const series = useQuery({ queryKey: ['stats', 'timeseries', days], queryFn: () => get<Day[]>('/admin/stats/timeseries', { days }) });

  if (stats.isError) return <PageState loading={false} error={stats.error} onRetry={stats.refetch} />;
  const data = stats.data;
  const sar = (v?: string) => `SAR ${Number(v ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const community: Kpi[] = [
    { title: 'Total players', value: formatNumber(data?.users.total ?? 0), icon: <TeamOutlined />, tone: 'violet', to: '/players' },
    { title: 'New players · 24h', value: formatNumber(data?.users.new24h ?? 0), icon: <UserAddOutlined />, tone: 'sky', to: '/players' },
    { title: 'Published clips', value: formatNumber(data?.clips.total ?? 0), icon: <VideoCameraOutlined />, tone: 'magenta', to: '/clips' },
    { title: 'Open reports', value: formatNumber(data?.reports.open ?? 0), icon: <FlagOutlined />, tone: 'coral', to: '/reports' },
  ];
  const arena: Kpi[] = [
    { title: 'Live battles', value: formatNumber(data?.battles.active ?? 0), icon: <ThunderboltOutlined />, tone: 'violet', to: '/battles?status=ACTIVE' },
    { title: 'Waiting for an opponent', value: formatNumber(data?.battles.entriesWaiting ?? 0), icon: <HourglassOutlined />, tone: 'amber', to: '/entries' },
    { title: 'Completed battles', value: formatNumber(data?.battles.closed ?? 0), icon: <TrophyOutlined />, tone: 'teal', to: '/battles?status=CLOSED' },
    { title: 'Votes · 24h', value: formatNumber(data?.votes.last24h ?? 0), icon: <LikeOutlined />, tone: 'magenta' },
  ];
  const economy: Kpi[] = [
    { title: 'Revenue · 30 days', value: sar(data?.revenue.last30dSar), icon: <WalletOutlined />, tone: 'teal', to: '/purchases' },
    { title: 'Revenue · all time', value: sar(data?.revenue.totalSar), icon: <FireOutlined />, tone: 'amber', to: '/purchases' },
    { title: 'Purchases · 30 days', value: formatNumber(data?.store.purchases30d ?? 0), icon: <ShoppingCartOutlined />, tone: 'sky', to: '/purchases' },
    { title: 'Gifts sent · 30 days', value: formatNumber(data?.store.giftsSent30d ?? 0), icon: <GiftOutlined />, tone: 'coral' },
  ];

  const row = (title: string, items: Kpi[]) => (
    <div style={{ marginBottom: 28 }}>
      <div className="v-eyebrow" style={{ marginBottom: 12 }}>{title}</div>
      <Row gutter={[16, 16]}>
        {items.map((kpi) => (
          <Col key={kpi.title} xs={12} md={12} xl={6}>
            <KpiCard kpi={kpi} loading={stats.isPending} />
          </Col>
        ))}
      </Row>
    </div>
  );

  const daily = series.data ?? [];
  const firstName = admin?.name.split(' ')[0] ?? '';
  return (
    <>
      <section className="v-hero">
        <img className="v-hero-emblem" src="/brand/valor-emblem.png" alt="" />
        <div className="v-hero-body">
          <div className="v-eyebrow">Command center</div>
          <h1>
            {greeting()}{firstName && `, ${firstName}`}.
            <br />
            <span>The arena is live.</span>
          </h1>
          <p>
            {data
              ? `${formatNumber(data.battles.active)} live ${data.battles.active === 1 ? 'battle' : 'battles'} · ${formatNumber(data.reports.open)} open ${data.reports.open === 1 ? 'report' : 'reports'} · ${formatNumber(data.votes.last24h)} votes in the last 24 hours`
              : 'Loading the latest numbers…'}
          </p>
          <Flex gap={10} wrap>
            <Button type="primary" size="large" icon={<FlagOutlined />} onClick={() => navigate('/reports')}>Review reports</Button>
            <Button size="large" icon={<ThunderboltOutlined />} onClick={() => navigate('/battles?status=ACTIVE')}>Live battles</Button>
            {admin?.role !== 'MODERATOR' && <Button size="large" icon={<NotificationOutlined />} onClick={() => navigate('/announcements/new')}>Send announcement</Button>}
          </Flex>
        </div>
      </section>

      {row('Community', community)}
      {row('Arena', arena)}
      {row('Economy · test purchases not counted', economy)}

      <Flex align="center" justify="space-between" wrap gap={12} style={{ margin: '8px 0 14px' }}>
        <div>
          <h2 className="v-section-title">Daily activity</h2>
          <Typography.Text type="secondary">How the community moved, day by day.</Typography.Text>
        </div>
        <Segmented value={days} onChange={(v) => setDays(Number(v))} options={[{ value: 7, label: '7 days' }, { value: 30, label: '30 days' }, { value: 90, label: '90 days' }]} />
      </Flex>
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
