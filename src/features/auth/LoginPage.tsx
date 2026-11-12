import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Card, Flex, Form, Input, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { getErrorCode, getErrorMessage } from '../../lib/api';
import { getToken, setToken } from '../../lib/auth-storage';
import { login, meQueryKey } from './api';

type LoginValues = { email: string; password: string };

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (getToken()) return <Navigate to="/" replace />;

  async function handleSubmit(values: LoginValues) {
    setSubmitting(true);
    setError(null);
    try {
      const { token, admin } = await login(values.email, values.password);
      setToken(token);
      queryClient.setQueryData(meQueryKey, admin);
      navigate('/', { replace: true });
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'UNAUTHORIZED') setError('Email or password is incorrect.');
      else if (code === 'FORBIDDEN') setError('This account is disabled.');
      else setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%', padding: 16 }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Flex vertical align="center" gap={4} style={{ marginBottom: 24 }}>
          <span className="brand" style={{ fontSize: 32 }}>
            VALOR
          </span>
          <Typography.Text type="secondary">Admin dashboard</Typography.Text>
        </Flex>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form<LoginValues> layout="vertical" onFinish={handleSubmit} requiredMark={false} disabled={submitting}>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Enter your email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input prefix={<MailOutlined />} autoComplete="email" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block size="large" loading={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </Button>
        </Form>
      </Card>
    </Flex>
  );
}
