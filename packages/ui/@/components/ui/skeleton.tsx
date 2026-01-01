import * as React from 'react'

// @ts-ignore
import { cn } from '@/lib/utils'

function Skeleton ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('ui__skeleton animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
