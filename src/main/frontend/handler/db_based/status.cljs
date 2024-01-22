(ns frontend.handler.db-based.status
  "Task status related util fns"
  (:require [frontend.handler.db-based.property :as db-property-handler]
            [frontend.handler.property.util :as pu]
            [frontend.state :as state]))

(defn set-status!
  [block status-value-name]
  (let [repo (state/get-current-repo)
        status-id (:block/uuid (pu/get-closed-value-entity-by-name "status" status-value-name))]
    (when status-id
      (db-property-handler/set-block-property! repo
                                               (:block/uuid block)
                                               "status"
                                               status-id
                                               {}))))

(comment
  (defn cycle-status!
   [block status]))
