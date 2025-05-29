import { TablerIcon } from '../icons'

export const CircleButton = ({
  style,
  icon,
  onClick,
}: {
  active?: boolean
  style?: React.CSSProperties
  icon: string
  otherIcon?: string
  onClick: () => void
}) => {
  return (
    <button
      data-html2canvas-ignore="true"
      style={style}
      className="tl-circle-button"
      onPointerDown={onClick}
    >
      <div className="tl-circle-button-icons-wrapper">
        <TablerIcon name={icon} />
      </div>
    </button>
  )
}
