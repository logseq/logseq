import React, { ReactNode } from 'react'
import cx from 'classnames'

export interface ILSButtonProps extends Omit<React.ComponentPropsWithRef<'button'>, 'type'> {
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  href?: string
}

export const Button = React.forwardRef<HTMLButtonElement, ILSButtonProps>((
  props, ref
) => {
  const { href, leftIcon, rightIcon, children, className, ...rest } = props

  if (href) {
    rest.onClick = () => {
      window?.open(
        href, '_blank'
      )
    }
  }

  return (
    <button
      className={
        cx(
          'flex items-center justify-between text-base space-x-1 bg-logseq-400 rounded-lg py-3 px-4',
          'transition-opacity hover:opacity-80 active:opacity-100 disabled:hover:opacity-100',
          className)
      }
      ref={ref} {...rest}>
      <div className={'l flex items-center'}>
        {leftIcon && <i className={'pr-1.5'}>{leftIcon}</i>}
        <span>{children}</span>
      </div>

      {rightIcon && <i className={'pl-1'}>{rightIcon}</i>}
    </button>
  )
})