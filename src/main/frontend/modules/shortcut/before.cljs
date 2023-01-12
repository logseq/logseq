(ns frontend.modules.shortcut.before
  (:require [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]))

;; before function
(defn prevent-default-behavior
  [f]
  (fn [e]
    (f e)
    ;; return false to prevent default browser behavior
    ;; and stop event from bubbling
    false))

(defn enable-when-not-editing-mode!
  [f]
  (fn [e]
    (when-not (or (state/editing?)
                  (util/input? (.-target e)))
      (f e)
      false)))

(defn enable-when-editing-mode!
  [f]
  (fn [e]
    (when (state/editing?)
      (if (mobile-util/native-ios?)
        (util/stop-propagation e)
        (util/stop e))
      (f e))))

(defn enable-when-not-component-editing!
  [f]
  (fn [e]
    (when (or (contains? #{:srs :page-histories} (state/get-modal-id))
              (not (state/block-component-editing?)))
      (f e))))
