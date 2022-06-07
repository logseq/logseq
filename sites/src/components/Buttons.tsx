import React, { ReactNode } from 'react'
import cx from 'classnames'

export interface ILSButtonProps extends Omit<React.ComponentPropsWithRef<'button'>, 'type'> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export const LSButton = React.forwardRef<HTMLButtonElement, ILSButtonProps>((
  props, ref
) => {
  const { leftIcon, rightIcon, children, className, ...rest } = props

  return (
    <button
      className={
        cx(
          'flex items-center text-base space-x-1 bg-logseq-400 rounded-lg py-3 px-4',
          'transition-opacity hover:opacity-80 active:opacity-100',
          className)
      }
      ref={ref} {...rest}>
      {leftIcon && <i className={'pr-1'}>{leftIcon}</i>}
      <span>{children}</span>
      {rightIcon && <i className={'pl-1'}>{rightIcon}</i>}
    </button>
  )
})