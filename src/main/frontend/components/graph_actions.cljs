(ns frontend.components.graph-actions
  (:require [frontend.handler.route :as route-handler]
            [frontend.state :as state]))

(defn redirect-to-node!
  [node]
  (when-let [node-ref (or (:uuid node) (:label node))]
    (route-handler/redirect-to-page! node-ref)))

(defn open-node-in-sidebar!
  [node]
  (when-let [db-id (:db-id node)]
    (state/sidebar-add-block! (state/get-current-repo)
                              db-id
                              (if (:page? node) :page :block))))

(defn activate-node!
  [node event]
  (if (.-shiftKey event)
    (open-node-in-sidebar! node)
    (redirect-to-node! node)))
