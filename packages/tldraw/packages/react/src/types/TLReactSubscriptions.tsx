import type { TLSubscriptionEventInfo, TLSubscriptionEventName } from '@tldraw/core'
import type { TLReactShape } from '../lib'
import type { TLReactApp } from '../lib/TLReactApp'

export type TLReactSubscription<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>,
  E extends TLSubscriptionEventName = TLSubscriptionEventName
> = {
  event: E
  callback: TLReactCallback<S, R, E>
}

export type TLReactSubscribe<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>
> = {
  <E extends TLSubscriptionEventName>(subscription: TLReactSubscription<S, R, E>): () => void
  <E extends TLSubscriptionEventName>(event: E, callback: TLReactCallback<S, R, E>): () => void
}

export type TLReactCallback<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>,
  E extends TLSubscriptionEventName = TLSubscriptionEventName
> = (app: R, info: TLSubscriptionEventInfo<E>) => void

export interface TLReactCallbacks<
  S extends TLReactShape = TLReactShape,
  R extends TLReactApp<S> = TLReactApp<S>
> {
  onMount: TLReactCallback<S, R, 'mount'>
  onPersist: TLReactCallback<S, R, 'persist'>
  onError: TLReactCallback<S, R, 'error'>
  onCreateShapes: TLReactCallback<S, R, 'create-shapes'>
  onCreateAssets: TLReactCallback<S, R, 'create-assets'>
  onDeleteShapes: TLReactCallback<S, R, 'delete-shapes'>
  onDeleteAssets: TLReactCallback<S, R, 'delete-assets'>
  onDrop: TLReactCallback<S, R, 'drop'>
  onCanvasDBClick: TLReactCallback<S, R, 'canvas-dbclick'>
  onPaste: TLReactCallback<S, R, 'paste'>
  onCopy: TLReactCallback<S, R, 'copy'>
}
