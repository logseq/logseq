(ns frontend.search.browser
  "Browser implementation of search protocol"
  (:require [frontend.config :as config]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [promesa.core :as p]))

(defrecord Browser [repo]
  protocol/Engine
  (query [_this q option]
    (state/<invoke-db-worker :thread-api/search-blocks (state/get-current-repo) q option))
  (rebuild-pages-indice! [_this]
    (state/<invoke-db-worker :thread-api/search-build-pages-indice repo))
  (rebuild-blocks-indice! [this]
    (p/let [repo (state/get-current-repo)
            file-based? (config/local-file-based-graph? repo)
            _ (protocol/truncate-blocks! this)
            result (state/<invoke-db-worker :thread-api/search-build-blocks-indice repo)
            blocks (if file-based?
                     (->> result
                          ;; remove built-in properties from content
                          (map
                           #(update % :content
                                    (fn [content]
                                      (property-util/remove-built-in-properties (get % :format :markdown) content)))))
                     result)
            _ (when (seq blocks)
                (state/<invoke-db-worker :thread-api/search-upsert-blocks repo blocks))]))
  (transact-blocks! [_this {:keys [blocks-to-remove-set
                                   blocks-to-add]}]
    (let [repo (state/get-current-repo)]
      (p/let [_ (when (seq blocks-to-remove-set)
                  (state/<invoke-db-worker :thread-api/search-delete-blocks repo blocks-to-remove-set))]
        (when (seq blocks-to-add)
          (state/<invoke-db-worker :thread-api/search-upsert-blocks repo blocks-to-add)))))
  (truncate-blocks! [_this]
    (state/<invoke-db-worker :thread-api/search-truncate-tables (state/get-current-repo)))
  (remove-db! [_this]
    ;; Already removed in OPFS
    (p/resolved nil)))
