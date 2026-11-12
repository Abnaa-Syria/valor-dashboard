import { useEffect, useRef, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { App, Form, Modal, type FormInstance } from 'antd';
import { getErrorMessage } from '../lib/api';

type Props<T extends object> = {
  open: boolean;
  title: string;
  initialValues: Partial<T>;
  onSave: (values: T) => Promise<unknown>;
  onClose: () => void;
  onSaved?: () => void;
  children: (form: FormInstance<T>) => ReactNode;
  width?: number;
};

/** Create / edit form in a modal: loads initial values, saves, shows success or the API error. */
export function EditModal<T extends object>({ open, title, initialValues, onSave, onClose, onSaved, children, width }: Props<T>) {
  const { message } = App.useApp();
  const [form] = Form.useForm<T>();

  // Load values only when the modal opens (initialValues is often a new object on every render).
  const initialRef = useRef(initialValues);
  initialRef.current = initialValues;
  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue(initialRef.current as Parameters<typeof form.setFieldsValue>[0]);
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      message.success('Saved');
      onSaved?.();
      onClose();
    },
    onError: (err) => message.error(getErrorMessage(err)),
  });

  return (
    <Modal
      open={open}
      title={title}
      okText="Save"
      onOk={() => form.submit()}
      onCancel={onClose}
      confirmLoading={mutation.isPending}
      destroyOnHidden
      width={width}
    >
      <Form<T> form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)} disabled={mutation.isPending}>
        {children(form)}
      </Form>
    </Modal>
  );
}
