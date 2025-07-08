import "@silk-hq/components/dist/main-unlayered.css"
import { Sheet } from '@silk-hq/components'
import { BottomSheet } from './BottomSheet'
import { SheetWithDepth, SheetWithDepthStack } from './SheetWithDepth'
import { SheetWithDetent } from './SheetWithDetent'
import { SheetWithStacking, SheetWithStackingStack } from './SheetWithStacking'

declare global {
  var LSSilkhq: any
}

const silkhq = {
  Sheet, BottomSheet,
  SheetWithDepth, SheetWithDepthStack,
  SheetWithStacking, SheetWithDetent,
  SheetWithStackingStack,
}

window.LSSilkhq = silkhq

export default silkhq