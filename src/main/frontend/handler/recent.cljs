(ns frontend.handler.recent
  "Fns related to recent pages feature"
  (:require [frontend.handler.db-based.recent :as db-based]
            [frontend.handler.file-based.recent :as file-recent-handler]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.db.model :as model]))

(defn add-page-to-recent!
  [repo page-name-or-block-uuid click-from-recent?]
  (let [page-name (if (uuid? page-name-or-block-uuid)
                    (when-let [block (model/get-block-by-uuid page-name-or-block-uuid)]
                      (get-in block [:block/page :block/original-name]))
                    page-name-or-block-uuid)]
    (if (config/db-based-graph? repo)
    (db-based/add-page-to-recent! page-name click-from-recent?)
    (file-recent-handler/add-page-to-recent! repo page-name click-from-recent?))))

(defn get-recent-pages
  []
  (let [repo (state/get-current-repo)]
    (if (config/db-based-graph? repo)
      (db-based/get-recent-pages)
      (file-recent-handler/get-recent-pages))))
