import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'

export function delay (ms = 1000) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function AnimateInTurnStage (
  props: any
) {
  let { ani, ticks, children, ...rest } = props
  const [turnState, setTurnState] = useState<any>([])
  const { ref, inView, entry } = useInView({
    threshold: 0
  })

  children = children(turnState)

  useEffect(() => {
    const len = children.props?.children?.length
    if (!len) return

    const run = async () => {
      for (let i = 0; i < len; i++) {
        if (inView) {
          await delay(ticks?.[i] || 200)
        }

        turnState[i] = inView ? (ani || true) : false
        setTurnState([...turnState])
      }
    }

    if (turnState.length || inView) {
      run().catch(console.error)
    }
  }, [inView])

  return (
    <div ref={ref} {...rest}>
      {children}
    </div>
  )
}