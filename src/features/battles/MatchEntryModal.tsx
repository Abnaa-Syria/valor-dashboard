import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Avatar, Button, Empty, Flex, Input, Modal, Spin, Tag, Typography } from 'antd';
import { PlayCircleOutlined, UserOutlined } from '@ant-design/icons';
import { getErrorMessage } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { battlesApi, type Entry, type MatchCandidate } from './api';

/**
 * Admin picks the opponent for an entry that is still waiting: any ready clip of the same game
 * from another active player (not in a live battle, no block between them). The battle starts
 * right away; clips that are themselves waiting are matched entry-to-entry.
 */
export function MatchEntryModal({ entry, onClose }: { entry: Entry | null; onClose: () => void }) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<MatchCandidate | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ['entries', 'candidates', entry?.id, q],
    queryFn: () => battlesApi.matchCandidates(entry!.id, q || undefined),
    enabled: Boolean(entry),
  });

  function close() {
    setPicked(null);
    setQ('');
    onClose();
  }

  async function confirm() {
    if (!entry || !picked) return;
    setSaving(true);
    try {
      const result = await battlesApi.matchEntry(entry.id, picked.id);
      message.success('Battle started. Both players were notified.');
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      queryClient.invalidateQueries({ queryKey: ['battles'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      close();
      navigate(`/battles/${result.battleId}`);
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={Boolean(entry)}
      onCancel={close}
      title="Pick an opponent"
      width={680}
      okText="Start battle"
      okButtonProps={{ disabled: !picked, loading: saving }}
      onOk={confirm}
      destroyOnHidden
    >
      {entry && (
        <>
          <Typography.Paragraph type="secondary" style={{ marginTop: 4 }}>
            <b>{entry.user.username}</b>’s clip “{entry.clip.title}” · {entry.game.name} · {entry.weaponClass} · {entry.rank}. The battle starts right away, and the
            opponent isn’t charged a Challenge Credit.
          </Typography.Paragraph>
          <Input.Search placeholder="Search player or clip title" allowClear onSearch={(v) => setQ(v.trim())} style={{ marginBottom: 12 }} />
          {isError && <Alert type="error" showIcon message={getErrorMessage(error)} style={{ marginBottom: 12 }} />}
          <div style={{ maxHeight: 420, overflowY: 'auto', marginInline: -4, paddingInline: 4 }}>
            {isFetching && !data ? (
              <Flex justify="center" style={{ padding: 32 }}>
                <Spin />
              </Flex>
            ) : !data?.length ? (
              <Empty description={q ? 'No clips match this search' : `No other ${entry.game.name} clips are free to battle right now`} />
            ) : (
              <Flex vertical gap={8}>
                {data.map((c) => {
                  const selected = picked?.id === c.id;
                  return (
                    <button key={c.id} type="button" className={`v-pick${selected ? ' v-pick-selected' : ''}`} onClick={() => setPicked(c)} aria-pressed={selected}>
                      <div className="v-pick-thumb" style={c.thumbnailUrl ? { backgroundImage: `url("${c.thumbnailUrl}")` } : undefined}>
                        <PlayCircleOutlined />
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'start' }}>
                        <div className="v-pick-title">{c.title}</div>
                        <Flex align="center" gap={6} style={{ marginTop: 2 }}>
                          <Avatar size={18} src={c.user.avatarUrl || undefined} icon={<UserOutlined />} />
                          <span className="v-pick-meta">
                            {c.user.username} · {formatDateTime(c.createdAt)}
                          </span>
                        </Flex>
                      </div>
                      {c.waitingEntry && (
                        <Tag color="purple" title={`Waiting with ${c.waitingEntry.weaponClass} · ${c.waitingEntry.rank}`}>
                          Also waiting
                        </Tag>
                      )}
                    </button>
                  );
                })}
              </Flex>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

export function MatchEntryButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="small" type="primary" onClick={onClick}>
      Add opponent
    </Button>
  );
}
