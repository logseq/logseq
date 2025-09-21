import { cn } from '../../lib/utils'

export function Link ({ className, children, ...rest }: React.HTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={cn('ui__link', className)} {...rest}>
      {children}
    </a>
  )
}