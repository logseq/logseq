(ns frontend.modules.shortcut.before
  (:require [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]))

;; before function
(defn prevent-default-behavior
  [f]
  (fn [e]
    (when-not (false? (f e))
      ;; return false to skip prevent default browser behavior
      ;; and stop event from bubbling
      (.preventDefault e))
    false))

(defn enable-when-not-editing-mode!
  [f s]
  (fn [e]
    (when-not (or (state/editing?)
                  (util/input? (.-target e)))
      (when (or (not (:selection? s))
              (seq (state/get-selection-blocks)))
        (f e))
      (.preventDefault e)
      false)))

(defn enable-when-editing-mode!
  "Runs an editing-only shortcut while a block is being edited. `state/editing?` can stay true for a moment after
  the editor's textarea has left the DOM (the block was deleted, the editor closed), and the shortcuts read that
  textarea: they also need a live input, except the ones whose config says `:allow-without-input? true`
  (escape-editing, which clears that state)."
  [f s]
  (fn [e]
    (when (and (state/editing?)
               (or (:allow-without-input? s) (state/get-input)))
      (when-not (false? (f e))
        (if (mobile-util/native-ios?)
          (util/stop-propagation e)
          (util/stop e))))))

(defn enable-when-not-component-editing!
  [f]
  (fn [e]
    (when (or (contains? #{:srs :page-histories} (state/get-dialog-id))
              (not (state/block-component-editing?)))
      (f e))))
