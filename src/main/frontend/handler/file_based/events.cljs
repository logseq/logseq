(ns frontend.handler.file-based.events
  "Events that are only for file graphs"
  (:require [clojure.core.async :as async]
            [frontend.context.i18n :refer [t]]
            [frontend.handler.events :as events]
            [frontend.handler.notification :as notification]
            [frontend.handler.page :as page-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.web.nfs :as nfs-handler]
            [frontend.fs.sync :as sync]
            [frontend.state :as state]
            [frontend.ui :as ui]))

(defmethod events/handle :graph/re-index [[_]]
  ;; Ensure the graph only has ONE window instance
  (async/go
    (async/<! (sync/<sync-stop))
    (repo-handler/re-index!
     nfs-handler/rebuild-index!
     #(do (page-handler/create-today-journal!)
          (events/file-sync-restart!)))))

(defmethod events/handle :graph/save [_]
  (repo-handler/persist-db! (state/get-current-repo)
                            {:before     #(notification/show!
                                           (ui/loading (t :graph/save))
                                           :warning)
                             :on-success #(do
                                            (notification/clear-all!)
                                            (notification/show!
                                             (t :graph/save-success)
                                             :success))
                             :on-error   #(notification/show!
                                           (t :graph/save-error)
                                           :error)}))
