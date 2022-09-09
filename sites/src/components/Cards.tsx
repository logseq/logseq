import React, { useEffect, useState } from 'react'
import cx from 'classnames'

export const GlassCard = React.forwardRef<HTMLDivElement, any>((
  props, ref,
) => {
  const { children, className, delay, animation, ...rest } = props

  const [animateClass, setAnimateClass] = useState('')

  useEffect(() => {
    setTimeout(() => {
      setAnimateClass(`ani-${animation || 'slide-in-from-bottom'}`)
    }, delay || 1000)
  }, [])

  return (
    <div ref={ref} className={cx('glass-card', animateClass, className)} {...rest}>
      <div className="glass-card-inner">
        {children}
      </div>
    </div>
  )
})
