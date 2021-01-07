(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.history :as history]
            [frontend.handler.file :as file]
            [frontend.handler.editor :as editor]))

(defn- default-undo
  []
  (js/document.execCommand "undo" false nil))

(defn- default-redo
  []
  (js/document.execCommand "redo" false nil))

(defn undo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file} route)
             (state/get-current-repo))
      (let [repo (state/get-current-repo)]
        (editor/save-current-block-when-idle! false)
        (js/setTimeout #(history/undo! repo file/alter-file) 200))
      (default-undo))))

(defn redo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file} route)
             (state/get-current-repo))
      (let [repo (state/get-current-repo)]
        (history/redo! repo file/alter-file))
      (default-redo))))
