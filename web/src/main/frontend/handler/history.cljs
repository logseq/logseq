(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.history :as history]
            [frontend.handler.ui :as ui-handler]))

(defn- default-undo
  []
  (js/document.execCommand "undo" false nil))

(defn- default-redo
  []
  (js/document.execCommand "redo" false nil))

(defn undo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file :tag} route)
             (not (state/get-edit-input-id))
             (state/get-current-repo))
      (let [repo (state/get-current-repo)
            k [:git/repo repo]]
        (history/undo! k ui-handler/re-render-root!))
      (default-undo))))

(defn redo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page} route)
             (not (state/get-edit-input-id))
             (state/get-current-repo))
      (let [repo (state/get-current-repo)
            k [:git/repo repo]]
        (history/redo! k ui-handler/re-render-root!))
      (default-redo))))
