import { Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeMode } from '../theme-mode';

/** Header button: switches the console between dark and light (remembered on this browser). */
export function ThemeSwitch({ className = '' }: { className?: string }) {
  const { mode, toggle } = useThemeMode();
  const next = mode === 'dark' ? 'light' : 'dark';
  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <button type="button" className={`v-icon-btn v-theme-switch ${className}`} aria-label={`Switch to ${next} mode`} onClick={toggle}>
        {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      </button>
    </Tooltip>
  );
}
