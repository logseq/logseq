import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, ms = 0) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    let canceled = false
    const handler = setTimeout(() => {
      if (!canceled) {
        setDebouncedValue(value)
      }
    }, ms)
    return () => {
      canceled = true
      clearTimeout(handler)
    }
  }, [value, ms])
  return debouncedValue
}
