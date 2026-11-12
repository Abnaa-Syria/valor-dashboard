import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Switch } from 'antd';
import { getErrorMessage } from '../../lib/api';
import { PageHeader } from '../../components/PageHeader';
import { FormPage } from '../../components/FormPage';
import { ImageUpload } from '../../components/ImageUpload';
import { getUser, playersApi, usersKeys, type PlayerInput } from './api';

/** /players/new and /players/:id/edit */
export function PlayerFormPage() {
  const { id } = useParams();
  const isNew = !id;
  const navigate = useNavigate();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<PlayerInput & { avatarUrl?: string | null; bannerUrl?: string | null }>();
  const [error, setError] = useState<string | null>(null);

  const player = useQuery({ queryKey: usersKeys.detail(id ?? ''), queryFn: () => getUser(id!), enabled: !isNew });

  useEffect(() => {
    if (player.data) {
      form.setFieldsValue({
        username: player.data.username,
        email: player.data.email,
        avatarUrl: player.data.avatarUrl,
        hideReferralCount: player.data.hideReferralCount,
      });
    }
  }, [player.data, form]);

  const save = useMutation({
    mutationFn: (values: PlayerInput) =>
      isNew
        ? playersApi.create({ username: values.username, email: values.email, password: values.password })
        : playersApi.update(id!, { username: values.username, email: values.email, avatarUrl: values.avatarUrl ?? null, hideReferralCount: values.hideReferralCount }),
    onSuccess: (saved) => {
      message.success(isNew ? 'Player created' : 'Player updated');
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      navigate(`/players/${saved.id}`);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleted = player.data?.status === 'DELETED';

  return (
    <>
      <PageHeader
        title={isNew ? 'Add player' : `Edit ${player.data?.username ?? 'player'}`}
        subtitle={isNew ? 'Creates an account the player can log in with. Default frame and theme are given automatically.' : undefined}
        crumbs={[{ label: 'Players', to: '/players' }, ...(isNew ? [] : [{ label: player.data?.username ?? '…', to: `/players/${id}` }]), { label: isNew ? 'Add' : 'Edit' }]}
        backTo={isNew ? '/players' : `/players/${id}`}
      />
      <FormPage
        form={form}
        onFinish={(values) => {
          setError(null);
          save.mutate(values);
        }}
        saving={save.isPending}
        loading={!isNew && player.isPending}
        error={deleted ? 'This account was deleted by the player and can no longer be edited.' : error}
        disabled={deleted}
        cancelTo={isNew ? '/players' : `/players/${id}`}
        submitLabel={isNew ? 'Create player' : 'Save changes'}
      >
        <Form.Item
          name="username"
          label="Username"
          extra="3–20 characters: letters, numbers and underscores."
          rules={[{ required: true, message: 'Enter a username' }, { pattern: /^[A-Za-z0-9_]{3,20}$/, message: '3–20 letters, numbers or underscores' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Enter a valid email' }]}>
          <Input />
        </Form.Item>
        {isNew ? (
          <Form.Item name="password" label="Password" extra="At least 8 characters. Share it privately with the player." rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        ) : (
          <>
            <Form.Item name="avatarUrl" label="Profile picture">
              <ImageUpload size={88} />
            </Form.Item>
            <Form.Item name="hideReferralCount" label="Hide referral count from other players" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )}
      </FormPage>
    </>
  );
}
