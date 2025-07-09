import "@silk-hq/components/dist/main-unlayered.css"
import { Fixed, Scroll, Sheet } from '@silk-hq/components'
import { BottomSheet } from './BottomSheet'
import { SheetWithDepth, SheetWithDepthStack } from './SheetWithDepth'
import { SheetWithDetent } from './SheetWithDetent'
import { SheetWithStacking, SheetWithStackingStack } from './SheetWithStacking'

declare global {
  var LSSilkhq: any
}

const silkhq = {
  Sheet, Fixed, Scroll, BottomSheet,
  SheetWithDepth, SheetWithDepthStack,
  SheetWithStacking, SheetWithDetent,
  SheetWithStackingStack,
}

window.LSSilkhq = silkhq

export default silkhq