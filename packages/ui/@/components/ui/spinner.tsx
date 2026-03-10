import * as React from 'react'

// @ts-ignore
import { cn } from '@/lib/utils'

export interface SpinnerProps extends React.SVGProps<SVGSVGElement> {}

const Spinner = ({ className, ...props }: SpinnerProps) => (
  <svg
    viewBox="0 0 24 24"
    className={cn('h-4 w-4 animate-spin text-muted-foreground', className)}
    fill="none"
    {...props}
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
    />
  </svg>
)

Spinner.displayName = 'Spinner'

export { Spinner }
