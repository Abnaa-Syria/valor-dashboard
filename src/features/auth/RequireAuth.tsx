import { Navigate, Outlet } from 'react-router';
import { Button, Flex, Result, Spin } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { getToken } from '../../lib/auth-storage';
import { useCurrentAdmin } from './api';

export function RequireAuth() {
  const { isPending, isError, error, refetch } = useCurrentAdmin();

  if (!getToken()) return <Navigate to="/login" replace />;

  if (isPending) {
    return (
      <Flex align="center" justify="center" style={{ height: '100%' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  // An expired session (401) is handled by the API client, which redirects to /login.
  // Anything else (e.g. server down) keeps the session and offers a retry.
  if (isError) {
    return (
      <Result
        status="error"
        title="Couldn't load your account"
        subTitle={getErrorMessage(error)}
        extra={<Button onClick={() => refetch()}>Try again</Button>}
      />
    );
  }

  return <Outlet />;
}
