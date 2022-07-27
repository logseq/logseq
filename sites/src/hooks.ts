import { RefObject, useEffect, useRef } from 'react'

const useMounted = (): RefObject<boolean> => {

  const mounted = useRef(false)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  return mounted

}

export {
  useMounted,
}
