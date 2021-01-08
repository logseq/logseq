(ns frontend.handler.history
  (:require [frontend.state :as state]
            [frontend.history :as history]
            [frontend.handler.file :as file]
            [frontend.handler.editor :as editor]
            [promesa.core :as p]
            [clojure.core.async :as async]))

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
      (let [repo (state/get-current-repo)
            chan (async/promise-chan)
            save-commited? (atom nil)]
        (editor/save-current-block-when-idle! {:check-idle? false
                                               :chan chan
                                               :chan-callback #(reset! save-commited? true)})
        (if @save-commited?
          (async/go
            (let [_ (async/<! chan)]
              (history/undo! repo file/alter-file)))
          (history/undo! repo file/alter-file)))
      (default-undo))))

(defn redo!
  []
  (let [route (get-in (:route-match @state/state) [:data :name])]
    (if (and (contains? #{:home :page :file} route)
             (state/get-current-repo))
      (let [repo (state/get-current-repo)]
        (history/redo! repo file/alter-file))
      (default-redo))))
