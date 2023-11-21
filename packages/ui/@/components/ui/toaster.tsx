import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export function Toaster () {
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

        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
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
