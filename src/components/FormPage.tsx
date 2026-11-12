import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Button, Card, Flex, Form, Skeleton, type FormInstance } from 'antd';

type Props<T> = {
  form: FormInstance<T>;
  onFinish: (values: T) => void;
  saving: boolean;
  loading?: boolean;
  error?: string | null;
  cancelTo: string;
  submitLabel?: string;
  children: ReactNode;
  /** Optional side panel (e.g. a live preview). */
  aside?: ReactNode;
  initialValues?: Partial<T>;
  disabled?: boolean;
};

/** Standard create / edit page body: the form in a card, Save and Cancel at the bottom. */
export function FormPage<T>({ form, onFinish, saving, loading, error, cancelTo, submitLabel = 'Save', children, aside, initialValues, disabled }: Props<T>) {
  const navigate = useNavigate();

  // The form stays mounted while loading so pages can fill it as soon as their data arrives.
  const body = (
    <Card>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form<T> form={form} layout="vertical" onFinish={onFinish} disabled={saving || disabled} initialValues={initialValues as never} scrollToFirstError>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <>
            {children}
            <Flex gap={8} justify="flex-end" style={{ marginTop: 8 }}>
              <Button onClick={() => navigate(cancelTo)} disabled={saving}>
                Cancel
              </Button>
              {!disabled && (
                <Button type="primary" htmlType="submit" loading={saving}>
                  {saving ? 'Saving…' : submitLabel}
                </Button>
              )}
            </Flex>
          </>
        )}
      </Form>
    </Card>
  );

  if (!aside || loading) return <div style={{ maxWidth: aside ? undefined : 820 }}>{body}</div>;
  return (
    <Flex gap={24} align="flex-start" wrap>
      <div style={{ flex: '1 1 560px', minWidth: 0 }}>{body}</div>
      <div style={{ flex: '0 1 420px', position: 'sticky', top: 16 }}>{aside}</div>
    </Flex>
  );
}
