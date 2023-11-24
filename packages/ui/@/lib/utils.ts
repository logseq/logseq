import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createContext, useContext, useRef } from 'react'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const idRef = { default: 0 }
const Id = createContext<() => number>(() => {
  return ++idRef.default
})

// NOTE: compatible for React 18 (useId hook)
export const useId = (prefix: string = 'id') => {
  const getter = useContext(Id)
  const ref = useRef<string>()
  if (!ref.current) ref.current = `${prefix}:${getter()}`
  return ref.current
}

