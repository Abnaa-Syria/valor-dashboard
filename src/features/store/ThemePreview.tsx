import type { CSSProperties, ReactNode } from 'react';
import type { ThemeTokens } from './design';

/**
 * A small mock of the app drawn only from theme tokens — the same sections as the
 * Figma "Theme System" board: Home, Battles, Profile, Wallet, Store, shared controls, nav.
 */
export function ThemePreview({ name, tokens }: { name: string; tokens: ThemeTokens }) {
  const t = (key: string) => String(tokens[key] ?? 'transparent');
  const card = Number(tokens['radius-card'] ?? 16);
  const control = Number(tokens['radius-control'] ?? 12);

  const label: CSSProperties = { fontSize: 10, letterSpacing: '0.08em', color: t('text-muted'), margin: '12px 0 6px', fontWeight: 600 };
  const surface: CSSProperties = { background: t('surface'), border: `1px solid ${t('border-subtle')}`, borderRadius: card, padding: 12 };
  const chip = (active: boolean): CSSProperties => ({
    padding: '3px 10px',
    borderRadius: control,
    fontSize: 11,
    fontWeight: 600,
    background: active ? t('accent') : 'transparent',
    color: active ? t('on-accent') : t('text-secondary'),
    border: `1px solid ${active ? t('accent') : t('border-control')}`,
  });
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <>
      <div style={label}>{title}</div>
      {children}
    </>
  );

  return (
    <div style={{ background: t('bg'), borderRadius: 20, padding: 16, color: t('text-primary'), fontFamily: 'Inter, system-ui, sans-serif', border: `1px solid ${t('border-subtle')}` }}>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{name || 'Theme'}</div>
      <div style={{ fontSize: 11, color: t('text-secondary') }}>One token set · every screen</div>

      <Section title="HOME">
        <div style={{ ...surface, background: `linear-gradient(180deg, ${t('card-top')}, ${t('card-bottom')})` }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Held the gate alone</div>
          <div style={{ fontSize: 11, color: t('text-secondary'), margin: '2px 0 8px' }}>Neon Siege · 0:42</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={chip(true)}>All games</span>
            <span style={chip(false)}>Iron Dusk</span>
          </div>
        </div>
      </Section>

      <Section title="BATTLES">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: control, fontWeight: 600, fontSize: 13, color: t('on-accent'), background: `linear-gradient(90deg, ${t('cta-start')}, ${t('cta-mid')})` }}>
            Vote Clip A
          </div>
          <div style={{ padding: '9px 14px', borderRadius: control, fontSize: 13, fontWeight: 600, border: `1px solid ${t('border-control')}` }}>Rules</div>
        </div>
      </Section>

      <Section title="PROFILE">
        <div style={{ ...surface, background: t('surface-raised') }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            63% <span style={{ fontSize: 11, fontWeight: 400, color: t('text-secondary') }}>Win rate</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: t('border-subtle'), margin: '8px 0' }}>
            <div style={{ width: '63%', height: '100%', borderRadius: 2, background: t('accent') }} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t('accent-text') }}>My gallery ›</div>
        </div>
      </Section>

      <Section title="WALLET">
        <div style={{ ...surface, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>Voting Credits</div>
            <div style={{ fontSize: 10, color: t('text-muted') }}>3 free · 7 purchased</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>10</div>
        </div>
      </Section>

      <Section title="STORE">
        <div style={surface}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>10 Voting Credits</span>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: control, background: t('accent'), color: t('on-accent-badge') }}>SAR 5.99</span>
          </div>
          <div style={{ textAlign: 'center', padding: '7px 0', fontSize: 12, borderRadius: control, background: t('disabled-surface'), color: t('disabled-text') }}>
            Price coming soon
          </div>
        </div>
      </Section>

      <Section title="SHARED">
        <div style={{ padding: '8px 12px', fontSize: 12, borderRadius: control, border: `1px solid ${t('border-control')}`, color: t('text-muted'), background: t('surface') }}>
          Search players
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 14, paddingTop: 10, borderTop: `1px solid ${t('border-subtle')}` }}>
        {['Home', 'Battles', 'Wallet', 'Profile'].map((item, i) => (
          <div key={item} style={{ textAlign: 'center', fontSize: 10, color: i === 0 ? t('accent-text') : t('nav-inactive') }}>
            <div style={{ width: 12, height: 12, borderRadius: 6, margin: '0 auto 3px', background: i === 0 ? t('accent') : t('nav-inactive') }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
