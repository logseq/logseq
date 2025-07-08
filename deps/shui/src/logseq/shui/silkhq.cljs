(ns logseq.shui.silkhq
  (:require [logseq.shui.util :refer [component-wrap] :as util]
            [goog.object :refer [getValueByKeys] :as gobj]))

(goog-define NODETEST false)

(def silkhq-wrap
  (partial component-wrap js/window.LSSilkhq))

(defn silkhq-get
  [name]
  (if NODETEST
    #js {}
    (let [path (util/get-path name)]
      (some-> js/window.LSSilkhq (gobj/getValueByKeys (clj->js path))))))


(def sheet (silkhq-wrap "Sheet.Root"))
(def sheet-bleeding-background (silkhq-wrap "Sheet.BleedingBackground"))
(def sheet-portal (silkhq-wrap "Sheet.Portal"))
(def sheet-handle (silkhq-wrap "Sheet.Handle"))
(def sheet-content (silkhq-wrap "Sheet.Content"))
(def sheet-title (silkhq-wrap "Sheet.Title"))
(def sheet-description (silkhq-wrap "Sheet.Description"))
(def sheet-trigger (silkhq-wrap "Sheet.Trigger"))
(def sheet-outlet (silkhq-wrap "Sheet.Outlet"))
(def sheet-backdrop (silkhq-wrap "Sheet.Backdrop"))
(def sheet-view (silkhq-wrap "Sheet.View"))

(def bottom-sheet (silkhq-wrap "BottomSheet.Root"))
(def bottom-sheet-portal (silkhq-wrap "BottomSheet.Portal"))
(def bottom-sheet-handle (silkhq-wrap "BottomSheet.Handle"))
(def bottom-sheet-content (silkhq-wrap "BottomSheet.Content"))
(def bottom-sheet-title (silkhq-wrap "BottomSheet.Title"))
(def bottom-sheet-description (silkhq-wrap "BottomSheet.Description"))
(def bottom-sheet-trigger (silkhq-wrap "BottomSheet.Trigger"))
(def bottom-sheet-outlet (silkhq-wrap "BottomSheet.Outlet"))
(def bottom-sheet-backdrop (silkhq-wrap "BottomSheet.Backdrop"))
(def bottom-sheet-view (silkhq-wrap "BottomSheet.View"))

(def depth-sheet (silkhq-wrap "SheetWithDepth.Root"))
(def depth-sheet-portal (silkhq-wrap "SheetWithDepth.Portal"))
(def depth-sheet-handle (silkhq-wrap "SheetWithDepth.Handle"))
(def depth-sheet-content (silkhq-wrap "SheetWithDepth.Content"))
(def depth-sheet-title (silkhq-wrap "SheetWithDepth.Title"))
(def depth-sheet-description (silkhq-wrap "SheetWithDepth.Description"))
(def depth-sheet-trigger (silkhq-wrap "SheetWithDepth.Trigger"))
(def depth-sheet-outlet (silkhq-wrap "SheetWithDepth.Outlet"))
(def depth-sheet-backdrop (silkhq-wrap "SheetWithDepth.Backdrop"))
(def depth-sheet-view (silkhq-wrap "SheetWithDepth.View"))
(def depth-sheet-stack (silkhq-wrap "SheetWithDepthStack.Root"))
(def depth-sheet-scenery-outlets (silkhq-wrap "SheetWithDepthStack.SceneryOutlets"))

(def detent-sheet (silkhq-wrap "SheetWithDetent.Root"))
(def detent-sheet-portal (silkhq-wrap "SheetWithDetent.Portal"))
(def detent-sheet-handle (silkhq-wrap "SheetWithDetent.Handle"))
(def detent-sheet-content (silkhq-wrap "SheetWithDetent.Content"))
(def detent-sheet-title (silkhq-wrap "SheetWithDetent.Title"))
(def detent-sheet-description (silkhq-wrap "SheetWithDetent.Description"))
(def detent-sheet-trigger (silkhq-wrap "SheetWithDetent.Trigger"))
(def detent-sheet-outlet (silkhq-wrap "SheetWithDetent.Outlet"))
(def detent-sheet-backdrop (silkhq-wrap "SheetWithDetent.Backdrop"))
(def detent-sheet-view (silkhq-wrap "SheetWithDetent.View"))
(def detent-sheet-scroll (silkhq-wrap "SheetWithDetent.ScrollRoot"))
(def detent-sheet-scroll-content (silkhq-wrap "SheetWithDetent.ScrollContent"))
(def detent-sheet-scroll-view (silkhq-wrap "SheetWithDetent.ScrollView"))

(def stacking-sheet (silkhq-wrap "SheetWithStacking.Root"))
(def stacking-sheet-portal (silkhq-wrap "SheetWithStacking.Portal"))
(def stacking-sheet-handle (silkhq-wrap "SheetWithStacking.Handle"))
(def stacking-sheet-content (silkhq-wrap "SheetWithStacking.Content"))
(def stacking-sheet-title (silkhq-wrap "SheetWithStacking.Title"))
(def stacking-sheet-description (silkhq-wrap "SheetWithStacking.Description"))
(def stacking-sheet-trigger (silkhq-wrap "SheetWithStacking.Trigger"))
(def stacking-sheet-outlet (silkhq-wrap "SheetWithStacking.Outlet"))
(def stacking-sheet-backdrop (silkhq-wrap "SheetWithStacking.Backdrop"))
(def stacking-sheet-view (silkhq-wrap "SheetWithStacking.View"))
(def stacking-stack-sheet (silkhq-wrap "SheetWithStackingStack.Root"))