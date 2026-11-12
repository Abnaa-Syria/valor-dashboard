import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { ArrowRightOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
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
    <div className="v-login">
      <section className="v-login-art" aria-hidden>
        <span className="v-orb" style={{ width: 320, height: 320, background: '#7c3aed', top: '8%', left: '12%' }} />
        <span className="v-orb" style={{ width: 260, height: 260, background: '#d946ef', bottom: '10%', right: '8%', animationDelay: '-6s' }} />
        <img className="v-login-logo" src="/brand/valor-logo.png" alt="" />
        <div className="v-login-tag">
          Two clips. One vote.
          <br />
          <span>Total control.</span>
        </div>
        <div className="v-login-points">
          <span>Battles & voting</span>
          <span>Players & moderation</span>
          <span>Store & customization</span>
        </div>
      </section>

      <section className="v-login-form">
        <div className="v-login-card">
          <img src="/brand/valor-emblem.png" alt="VALOR" width={56} height={56} style={{ filter: 'drop-shadow(0 10px 24px rgba(139,92,246,.6))' }} />
          <div className="v-eyebrow" style={{ marginTop: 18 }}>Admin console</div>
          <h2>Welcome back</h2>
          <div style={{ color: 'var(--v-muted)', marginBottom: 24 }}>Log in to run the VALOR arena.</div>

          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form<LoginValues> layout="vertical" onFinish={handleSubmit} requiredMark={false} disabled={submitting} size="large">
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Enter your email' },
                { type: 'email', message: 'Enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} autoComplete="email" autoFocus placeholder="you@valor.app" />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Enter your password' }]}>
              <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="••••••••" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={submitting} style={{ marginTop: 8, height: 50 }}>
              {submitting ? 'Logging in…' : (
                <>
                  Log in <ArrowRightOutlined />
                </>
              )}
            </Button>
          </Form>
        </div>
      </section>
    </div>
  );
}
