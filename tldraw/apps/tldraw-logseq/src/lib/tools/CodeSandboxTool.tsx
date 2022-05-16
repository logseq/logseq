import { TLBoxTool } from '@tldraw/core'
import type { TLReactEventMap } from '@tldraw/react'
import { Shape, CodeSandboxShape } from '~lib/shapes'

export class CodeSandboxTool extends TLBoxTool<CodeSandboxShape, Shape, TLReactEventMap> {
  static id = 'code'
  static shortcut = ['x']
  Shape = CodeSandboxShape
}
