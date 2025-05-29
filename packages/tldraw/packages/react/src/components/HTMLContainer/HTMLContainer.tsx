import { Observer } from 'mobx-react-lite'
import * as React from 'react'

interface HTMLContainerProps extends React.HTMLProps<HTMLDivElement> {
  centered?: boolean
  opacity?: number
  children: React.ReactNode
}

export const HTMLContainer = React.forwardRef<HTMLDivElement, HTMLContainerProps>(
  function HTMLContainer({ children, opacity, centered, className = '', ...rest }, ref) {
    return (
      <Observer>
        {() => (
          <div
            ref={ref}
            className={`tl-positioned-div ${className}`}
            style={opacity ? { opacity } : undefined}
            draggable={false}
          >
            <div className={`tl-positioned-inner ${centered ? 'tl-centered' : ''}`} {...rest}>
              {children}
            </div>
          </div>
        )}
      </Observer>
    )
  }
)
