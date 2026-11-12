import { useState } from 'react';
import { App, Button, Flex, Upload } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { api, getErrorMessage } from '../lib/api';

type Props = {
  /** Image URL (Form.Item passes value / onChange). */
  value?: string | null;
  onChange?: (url: string | null) => void;
  /** Preview box size in px. */
  size?: number;
  hint?: string;
};

/** Checkerboard so transparent artwork (frame rings) is visible on any background. */
export const checkerboard = {
  backgroundColor: '#1b1729',
  backgroundImage:
    'linear-gradient(45deg, #262138 25%, transparent 25%), linear-gradient(-45deg, #262138 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #262138 75%), linear-gradient(-45deg, transparent 75%, #262138 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
} as const;

/** Uploads an image to /admin/uploads and stores the returned URL in the form field. */
export function ImageUpload({ value, onChange, size = 120, hint = 'PNG, JPG or WebP · max 5 MB' }: Props) {
  const { message } = App.useApp();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('image', file);
      const response = await api.post<{ data: { url: string } }>('/admin/uploads', form);
      onChange?.(response.data.data.url);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Flex gap={12} align="center">
      <div style={{ width: size, height: size, borderRadius: 12, overflow: 'hidden', flexShrink: 0, ...checkerboard }}>
        {value && <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />}
      </div>
      <Flex vertical gap={8}>
        <Upload
          accept="image/png,image/jpeg,image/webp"
          showUploadList={false}
          beforeUpload={(file) => {
            void upload(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />} loading={uploading}>
            {value ? 'Replace' : 'Upload'}
          </Button>
        </Upload>
        {value && (
          <Button icon={<DeleteOutlined />} size="small" type="text" danger onClick={() => onChange?.(null)}>
            Remove
          </Button>
        )}
        <span style={{ fontSize: 12, opacity: 0.6 }}>{hint}</span>
      </Flex>
    </Flex>
  );
}
