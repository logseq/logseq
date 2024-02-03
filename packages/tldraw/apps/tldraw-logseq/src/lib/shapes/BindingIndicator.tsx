interface BindingIndicatorProps {
  strokeWidth: number
  size: number[]
  mode: 'svg' | 'html'
}
export function BindingIndicator({ strokeWidth, size, mode }: BindingIndicatorProps) {
  return mode === 'svg' ? (
    <rect
      className="tl-binding-indicator"
      x={strokeWidth}
      y={strokeWidth}
      rx={2}
      ry={2}
      width={Math.max(0, size[0] - strokeWidth * 2)}
      height={Math.max(0, size[1] - strokeWidth * 2)}
      strokeWidth={strokeWidth * 4}
    />
  ) : (
    <div
      className="tl-binding-indicator"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        boxShadow: '0 0 0 4px var(--tl-binding)',
        borderRadius: 4,
      }}
    />
  )
}
