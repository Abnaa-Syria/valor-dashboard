import { useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Card, Form, Input, InputNumber, Result, Select, Skeleton, Tag, Typography } from 'antd';
import { get, getErrorMessage, patch } from '../../lib/api';
import { useCurrentAdmin } from '../auth/api';

type SettingsValues = {
  votingDurationHours: number;
  dailyFreeVotingCredits: number;
  dailyFreeChallengeCredits: number;
  dailyResetTimezone: string;
  creditDeductionOrder: 'FREE_FIRST' | 'PURCHASED_FIRST';
  matchmakingTimeoutMinutes: number;
  referralPopularityPoints: number;
  rematchRequestWindowHours: number;
  rematchAcceptHours: number;
};

type SettingsResponse = { values: SettingsValues; defaults: SettingsValues };

const deductionOptions = [
  { value: 'FREE_FIRST', label: 'Free credits first' },
  { value: 'PURCHASED_FIRST', label: 'Purchased credits first' },
];

// All of these are open product decisions from the Figma decision register.
const numberFields: { name: keyof SettingsValues; label: string; min: number; max: number }[] = [
  { name: 'votingDurationHours', label: 'Voting duration (hours)', min: 1, max: 168 },
  { name: 'dailyFreeVotingCredits', label: 'Free voting credits per day', min: 0, max: 100 },
  { name: 'dailyFreeChallengeCredits', label: 'Free challenge credits per day', min: 0, max: 100 },
  { name: 'matchmakingTimeoutMinutes', label: 'Matchmaking timeout (minutes)', min: 5, max: 10080 },
  { name: 'referralPopularityPoints', label: 'Popularity points per invited friend', min: 0, max: 1000 },
  { name: 'rematchRequestWindowHours', label: 'Time to ask for a rematch after a battle (hours)', min: 1, max: 168 },
  { name: 'rematchAcceptHours', label: 'Time to accept a rematch request (hours)', min: 1, max: 168 },
];

const settingsKey = ['settings'] as const;

function PendingLabel({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Tag style={{ marginInlineStart: 8 }}>Pending decision</Tag>
    </>
  );
}

export function SettingsPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<SettingsValues>();
  const { data: admin } = useCurrentAdmin();
  const canEdit = admin?.role === 'SUPER_ADMIN';

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: settingsKey,
    queryFn: () => get<SettingsResponse>('/admin/settings'),
  });

  useEffect(() => {
    if (data) form.setFieldsValue(data.values);
  }, [data, form]);

  const saveMutation = useMutation({
    mutationFn: (values: SettingsValues) => patch<SettingsResponse>('/admin/settings', values),
    onSuccess: (response) => {
      queryClient.setQueryData(settingsKey, response);
      message.success('Settings saved');
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  if (isError) {
    return (
      <Result
        status="error"
        title="Couldn't load settings"
        subTitle={getErrorMessage(error)}
        extra={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  }

  const defaultHint = (name: keyof SettingsValues) => {
    const value = data?.defaults[name];
    const shown = name === 'creditDeductionOrder' ? deductionOptions.find((o) => o.value === value)?.label : value;
    return `Default: ${shown}`;
  };

  return (
    <>
      <Typography.Title level={3} style={{ marginTop: 0 }}>
        App settings
      </Typography.Title>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16, maxWidth: 720 }}
        message="These values are still waiting on a client decision"
        description="The current values are temporary. Update them here once the final decision arrives — no code change needed."
      />

      {!canEdit && (
        <Alert type="warning" showIcon style={{ marginBottom: 16, maxWidth: 720 }} message="Only a super admin can edit settings." />
      )}

      <Card style={{ maxWidth: 720 }}>
        {isPending ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Form<SettingsValues>
            form={form}
            layout="vertical"
            disabled={!canEdit || saveMutation.isPending}
            onFinish={(values) => saveMutation.mutate(values)}
          >
            {numberFields.map((field) => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={<PendingLabel>{field.label}</PendingLabel>}
                extra={defaultHint(field.name)}
                rules={[{ required: true, message: 'This field is required' }]}
              >
                <InputNumber min={field.min} max={field.max} precision={0} style={{ width: 220 }} />
              </Form.Item>
            ))}

            <Form.Item
              name="creditDeductionOrder"
              label={<PendingLabel>Credit deduction order</PendingLabel>}
              extra={defaultHint('creditDeductionOrder')}
              rules={[{ required: true }]}
            >
              <Select options={deductionOptions} style={{ width: 220 }} />
            </Form.Item>

            <Form.Item
              name="dailyResetTimezone"
              label={<PendingLabel>Daily reset timezone</PendingLabel>}
              extra={defaultHint('dailyResetTimezone')}
              rules={[{ required: true, message: 'This field is required' }]}
            >
              <Input placeholder="e.g. Asia/Riyadh" style={{ width: 220 }} />
            </Form.Item>

            {canEdit && (
              <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving…' : 'Save settings'}
              </Button>
            )}
          </Form>
        )}
      </Card>
    </>
  );
}
