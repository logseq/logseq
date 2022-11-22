const extendedIcons = [
  'add-link',
  'object-compact',
  'object-expanded',
  'open-as-page',
  'block',
  'block-search',
  'internal-link',
  'move-to-sidebar-right',
  'page',
  'page-search',
  'references-hide',
  'references-show',
  'whiteboard',
  'whiteboard-element',
  'select-cursor',
  'text',
  'connector',
]

const cx = (...args: (string | undefined)[]) => args.join(' ')

export const TablerIcon = ({
  name,
  className,
  ...props
}: { name: string } & React.HTMLAttributes<HTMLElement>) => {
  const classNamePrefix = extendedIcons.includes(name) ? `tie tie-` : `ti ti-`
  return <i className={cx(classNamePrefix + name, className)} {...props} />
}
