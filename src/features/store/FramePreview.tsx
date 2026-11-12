import { defaultFrameLayout, sampleAvatar, type FrameLayout } from './design';

type Props = {
  ringUrl?: string | null;
  glowColor?: string;
  layout?: FrameLayout;
  avatarUrl?: string;
  size?: number;
  /** Draw the glow stage behind the avatar (design 31: preview stage). */
  stage?: boolean;
};

/**
 * Draws a frame exactly the way the app will: the avatar circle and the ring image placed by
 * `layout` (fractions of a square canvas), so admins see the real result before publishing.
 */
export function FramePreview({ ringUrl, glowColor = '#7c3aed', layout = defaultFrameLayout, avatarUrl = sampleAvatar, size = 168, stage = true }: Props) {
  const px = (fraction: number) => fraction * size;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: 16,
        background: stage ? `radial-gradient(circle at 50% 55%, ${glowColor}66 0%, ${glowColor}1f 45%, transparent 70%), #0b0a12` : 'transparent',
        flexShrink: 0,
      }}
    >
      <img
        src={avatarUrl}
        alt=""
        style={{
          position: 'absolute',
          left: px(layout.avatar.x),
          top: px(layout.avatar.y),
          width: px(layout.avatar.size),
          height: px(layout.avatar.size),
          borderRadius: '50%',
          objectFit: 'cover',
        }}
      />
      {ringUrl && (
        <img
          src={ringUrl}
          alt=""
          style={{
            position: 'absolute',
            left: px(layout.ring.x),
            top: px(layout.ring.y),
            width: px(layout.ring.width),
            height: px(layout.ring.height),
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
