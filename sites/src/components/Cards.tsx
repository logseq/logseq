import React from 'react'
import cx from 'classnames'

export const GlassCard = React.forwardRef<HTMLDivElement, any>((
  props, ref,
) => {
  const { children, className, ...rest } = props

  return (
    <div ref={ref} className={cx('glass-card', className)} {...rest}>
      <div className="glass-card-inner">
        {children}
      </div>
    </div>
  )
})
