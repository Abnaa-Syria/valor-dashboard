import { Form, Input } from 'antd';
import { post } from '../../lib/api';
import { EditModal } from '../../components/EditModal';

type Values = { currentPassword: string; newPassword: string; confirm: string };

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <EditModal<Values>
      open={open}
      title="Change password"
      initialValues={{}}
      onClose={onClose}
      onSave={({ currentPassword, newPassword }) => post('/admin/auth/change-password', { currentPassword, newPassword })}
    >
      {() => (
        <>
          <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item name="newPassword" label="New password" rules={[{ required: true, min: 10, message: 'At least 10 characters' }]}>
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Repeat new password"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  !value || value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match')),
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </>
      )}
    </EditModal>
  );
}
