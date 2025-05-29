import * as React from 'react'
import { Observer } from 'mobx-react-lite'

interface SvgContainerProps extends React.SVGProps<SVGGElement> {
  children: React.ReactNode
  className?: string
}

export const SVGContainer = React.forwardRef<SVGSVGElement, SvgContainerProps>(
  function SVGContainer({ id, className = '', style, children, ...rest }, ref) {
    return (
      <Observer>
        {() => (
          <svg ref={ref} style={style} className={`tl-positioned-svg ${className}`}>
            <g id={id} className="tl-centered-g" {...rest}>
              {children}
            </g>
          </svg>
        )}
      </Observer>
    )
  }
)
