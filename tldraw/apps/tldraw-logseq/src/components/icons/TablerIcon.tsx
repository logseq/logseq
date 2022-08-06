import React from 'react'

const extendedIcons = [
  'block',
  'page',
  'references-hide',
  'references-show',
  'whiteboard',
  'whiteboard-element',
]

const cx = (...args: (string | undefined)[]) => args.join(' ')

export const TablerIcon = ({
  name,
  className,
  ...props
}: { name: string } & React.HTMLAttributes<HTMLElement>) => {
  const classNamePrefix = extendedIcons.includes(name) ? `ti tie-` : `ti ti-`
  return <i className={cx(classNamePrefix + name, className)} {...props} />
}
