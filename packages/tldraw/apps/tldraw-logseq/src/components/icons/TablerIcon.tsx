const extendedIcons = [
  'add-link',
  'block-search',
  'block',
  'connector',
  'group',
  'internal-link',
  'link-to-block',
  'link-to-page',
  'link-to-whiteboard',
  'move-to-sidebar-right',
  'object-compact',
  'object-expanded',
  'open-as-page',
  'page-search',
  'page',
  'references-hide',
  'references-show',
  'select-cursor',
  'text',
  'ungroup',
  'whiteboard-element',
  'whiteboard',
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
