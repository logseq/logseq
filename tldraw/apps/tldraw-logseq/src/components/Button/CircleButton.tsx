import React from 'react'
import { TablerIcon } from '../icons'

export const CircleButton = ({
  active,
  style,
  icon,
  otherIcon,
  onClick,
}: {
  active?: boolean
  style?: React.CSSProperties
  icon: string
  otherIcon?: string
  onClick: () => void
}) => {
  const [recentlyChanged, setRecentlyChanged] = React.useState(false)

  React.useEffect(() => {
    setRecentlyChanged(true)
    const timer = setTimeout(() => {
      setRecentlyChanged(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [active])

  return (
    <button
      data-active={active}
      data-recently-changed={recentlyChanged}
      data-html2canvas-ignore="true"
      style={style}
      className="tl-circle-button"
      onPointerDown={onClick}
    >
      <div className="tl-circle-button-icons-wrapper" data-icons-count={otherIcon ? 2 : 1}>
        {otherIcon && <TablerIcon name={otherIcon} />}
        <TablerIcon name={icon} />
      </div>
    </button>
  )
}
