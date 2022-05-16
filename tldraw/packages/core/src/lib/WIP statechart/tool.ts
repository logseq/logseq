import type { TLShape } from '../shapes/TLShape'
import { AppNode } from './nodes/AppNode'
import { createTool } from './nodes/ToolNode'
import { createToolState } from './nodes/ToolStateNode'

class MyApp<S extends TLShape = TLShape> extends AppNode<S> {
  name = 'hello!'

  // static createTool = <S extends TLShape = TLShape, C extends any = any>(
  //   options: {
  //     id: string
  //     initial: string
  //     shortcut?: string[]
  //     shortcuts?: TLShortcut<S>[]
  //     context?: C
  //     states?: TLToolStateNodeConstructor<S, MyApp<S>, TLToolNode<S, MyApp<S>>>[]
  //   } & Partial<TLStateEvents<S, C & { app: MyApp<S> }>>
  // ): {
  //   new (app: MyApp<S>): TLToolNode<S, MyApp<S>, C>
  //   id: string
  //   shortcut?: string[]
  // } => {
  //   class ITool extends TLToolNode<S, MyApp<S>> {
  //     constructor(app: MyApp<S>) {
  //       super(app, options)
  //     }
  //     static id = options.id
  //     static shortcut = options.shortcut

  //     static createToolState = <X extends any = any>(
  //       options: {
  //         id: string
  //         shortcut?: string[]
  //         shortcuts?: TLShortcut<S>[]
  //         context?: C
  //       } & Partial<TLStateEvents<S, X & { app: MyApp<S>; tool: TLToolNode<S, MyApp<S>, C> }>>
  //     ): {
  //       new (app: MyApp<S>, tool: TLToolNode<S, MyApp<S>>): TLToolStateNode<
  //         S,
  //         MyApp<S>,
  //         TLToolNode<S, MyApp<S>, C>,
  //         X
  //       >
  //       id: string
  //       shortcut?: string[]
  //     } => {
  //       class IToolState extends TLToolStateNode<S, MyApp<S>, TLToolNode<S, MyApp<S>, C>> {
  //         constructor(app: MyApp<S>, tool: TLToolNode<S, MyApp<S>, C>) {
  //           super(app, tool, options)
  //         }
  //         static id = options.id
  //         static shortcut = options.shortcut
  //       }

  //       return IToolState
  //     }
  //   }

  //   return ITool
  // }
}

const tool = createTool({
  id: 'tool',
  initial: 'idle',
  context: { name: 'steve' },
  onEnter: (info, context) => {
    context.name
    context.app
  },
  states: [
    createToolState({
      id: 'idle',
      context: { age: 30 },
      onEnter: (info, context) => {
        // ...
        context.age
        context.tool
        context.app
      },
    }),
  ],
})
