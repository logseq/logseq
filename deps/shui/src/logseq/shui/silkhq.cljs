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


(def sheet (silkhq-wrap "Sheet"))
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
