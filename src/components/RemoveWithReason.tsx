import { useState } from 'react';
import { Button, Input, Modal, Typography, type ButtonProps } from 'antd';

type Props = {
  title: string;
  description: string;
  buttonLabel: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<unknown>;
  buttonProps?: ButtonProps;
};

/** A danger button that asks for a reason (stored for the audit trail) before running the action. */
export function RemoveWithReason({ title, description, buttonLabel, confirmLabel, onConfirm, buttonProps }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      setOpen(false);
      setReason('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button danger {...buttonProps} onClick={(event) => { event.stopPropagation(); setOpen(true); }}>
        {buttonLabel}
      </Button>
      <Modal
        open={open}
        title={title}
        okText={confirmLabel}
        okButtonProps={{ danger: true, disabled: reason.trim().length < 3 }}
        confirmLoading={busy}
        onOk={confirm}
        onCancel={() => setOpen(false)}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">{description}</Typography.Paragraph>
        <Input.TextArea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Reason (at least 3 characters)"
          maxLength={200}
          showCount
          autoSize={{ minRows: 2, maxRows: 4 }}
          autoFocus
        />
      </Modal>
    </>
  );
}
