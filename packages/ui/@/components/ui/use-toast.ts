// Inspired by react-hot-toast library
import * as React from 'react'

import type {
  ToastActionElement,
  ToastProps,
} from '@/components/ui/toast'

const TOAST_LIMIT = 16
const TOAST_REMOVE_DELAY = 2 * 1000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  icon?: React.ReactNode
  onDismiss?: (id: string) => void
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId () {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
  type: ActionType['ADD_TOAST']
  toast: ToasterToast
}
  | {
  type: ActionType['UPDATE_TOAST']
  toast: Partial<ToasterToast>
}
  | {
  type: ActionType['DISMISS_TOAST']
  toastId?: ToasterToast['id']
}
  | {
  type: ActionType['REMOVE_TOAST']
  toastId?: ToasterToast['id']
}

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        const toast = state.toasts.find(it => it.id == toastId)
        addToRemoveQueue(toastId)
        toast?.onDismiss?.(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
          toast?.onDismiss?.(toast.id)
        })
      }

      const toasts = state.toasts.map((t) => {
        if (t.id == toastId || toastId == undefined) {
          return {
            ...t,
            open: false,
          }
        }

        return t
      })

      return { ...state, toasts }
    }
    case 'REMOVE_TOAST':
      if (action.toastId == undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch (action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = ToasterToast

function toast ({ id, ...props }: Toast) {
  id = id || genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })

  const dismiss = () => {
    dispatch({ type: 'DISMISS_TOAST', toastId: id })
  }

  const toastIdExist = memoryState.toasts?.some(it => it.id == id)

  dispatch({
    type: toastIdExist ? 'UPDATE_TOAST' : 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast () {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
    update: (toastId: string, props: Omit<ToasterToast, 'id'>) => dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id: toastId }
    })
  }
}

export { genId, useToast, toast }
