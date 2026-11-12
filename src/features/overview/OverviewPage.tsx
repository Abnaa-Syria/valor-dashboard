import { useQuery } from '@tanstack/react-query';
import { Button, Card, Col, Result, Row, Statistic, Typography } from 'antd';
import { get, getErrorMessage } from '../../lib/api';

type Overview = {
  users: { total: number; new24h: number };
  clips: { total: number };
  battles: { active: number; closed: number; entriesWaiting: number };
  votes: { last24h: number };
  reports: { open: number };
  revenue: { totalSar: string; last30dSar: string };
  store: { purchases30d: number; giftsSent30d: number };
};

export function OverviewPage() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: () => get<Overview>('/admin/stats/overview'),
    refetchInterval: 60_000,
  });

  if (isError) {
    return (
      <Result
        status="error"
        title="Couldn't load stats"
        subTitle={getErrorMessage(error)}
        extra={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  }

  const cards = [
    { title: 'Total players', value: data?.users.total },
    { title: 'New players (24h)', value: data?.users.new24h },
    { title: 'Published clips', value: data?.clips.total },
    { title: 'Active battles', value: data?.battles.active },
    { title: 'Waiting for an opponent', value: data?.battles.entriesWaiting },
    { title: 'Completed battles', value: data?.battles.closed },
    { title: 'Votes (24h)', value: data?.votes.last24h },
    { title: 'Open reports', value: data?.reports.open },
    { title: 'Revenue (30 days)', value: data?.revenue.last30dSar, prefix: 'SAR', precision: 2 },
    { title: 'Revenue (all time)', value: data?.revenue.totalSar, prefix: 'SAR', precision: 2 },
    { title: 'Purchases (30 days)', value: data?.store.purchases30d },
    { title: 'Gifts sent (30 days)', value: data?.store.giftsSent30d },
  ];

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        Overview
      </Typography.Title>
      <Row gutter={[16, 16]}>
        {cards.map((card) => (
          <Col key={card.title} xs={24} sm={12} xl={6}>
            <Card loading={isPending}>
              <Statistic title={card.title} value={card.value ?? 0} prefix={card.prefix} precision={card.precision} />
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
}
