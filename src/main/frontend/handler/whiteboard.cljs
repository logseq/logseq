(ns frontend.handler.whiteboard
  (:require [frontend.state :as state]))

;; FIXME: embed /draw should be supported too
(defn whiteboard-mode?
  []
  (= (state/get-current-route) :whiteboard))

(defn create-page!
  [page-title]
  (when-let [app ^js (state/get-current-whiteboard)]
    (.createShapes app (clj->js
                        [{:id (str "logseq-portal-" "clojure")
                          :type "logseq-portal"
                          :pageId page-title}]))))
