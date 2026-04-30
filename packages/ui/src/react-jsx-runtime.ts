import React from 'react'

export const Fragment = React.Fragment

export function jsx(type: any, props: any, key?: any) {
  return React.createElement(type, key === undefined ? props : { ...props, key })
}

export const jsxs = jsx
export const jsxDEV = jsx
