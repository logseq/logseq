import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, XCircleIcon } from 'lucide-react'
import { ReactElement } from 'react'
import { cn } from '@/lib/utils'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts?.map(function ({
        id,
        title,
        description,
        action,
        ...props
      }) {
        const duration = props?.duration
        // @ts-ignore
        if (Number.isInteger(duration) && duration <= 0) {
          props.duration = 1000 * 120
        }

        let variantIcon: ReactElement | null = null

        switch (props.variant) {
          case 'info':
            variantIcon = <InfoIcon/>
            break
          case 'success':
            variantIcon = <CheckCircle2Icon/>
            break
          case 'warning':
            variantIcon = <AlertCircleIcon/>
            break
          case 'error':
            variantIcon = <XCircleIcon/>
            break
        }

        props.className = cn(
          variantIcon && ['has-variant-icon', props.variant],
          props.className)

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {variantIcon && <span className="variant-icon">{variantIcon}</span>}
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose/>
          </Toast>
        )
      })}
      <ToastViewport className={'ui__toaster-viewport'}/>
    </ToastProvider>
  )
}
