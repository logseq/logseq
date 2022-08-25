import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, ms = 0) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, ms)
    return () => {
      clearTimeout(handler)
    }
  }, [value, ms])
  return debouncedValue
}
