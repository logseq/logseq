(ns frontend.search.browser
  "Browser implementation of search protocol"
  (:require [frontend.config :as config]
            [frontend.handler.file-based.property.util :as property-util]
            [frontend.persist-db.browser :as browser]
            [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [promesa.core :as p]))

(defonce *worker browser/*worker)

(defrecord Browser [repo]
  protocol/Engine
  (query [_this q option]
    (if-let [worker @*worker]
      (worker :thread-api/search-blocks (state/get-current-repo) q option)
      (p/resolved nil)))
  (rebuild-pages-indice! [_this]
    (if-let [worker @*worker]
      (worker :thread-api/search-build-pages-indice repo)
      (p/resolved nil)))
  (rebuild-blocks-indice! [this]
    (if-let [worker @*worker]
      (p/let [repo (state/get-current-repo)
              file-based? (config/local-file-based-graph? repo)
              _ (protocol/truncate-blocks! this)
              result (worker :thread-api/search-build-blocks-indice repo)
              blocks (if file-based?
                       (->> result
                            ;; remove built-in properties from content
                            (map
                             #(update % :content
                                      (fn [content]
                                        (property-util/remove-built-in-properties (get % :format :markdown) content)))))
                       result)
              _ (when (seq blocks)
                  (worker :thread-api/search-upsert-blocks repo blocks))])
      (p/resolved nil)))
  (transact-blocks! [_this {:keys [blocks-to-remove-set
                                   blocks-to-add]}]
    (if-let [worker @*worker]
      (let [repo (state/get-current-repo)]
        (p/let [_ (when (seq blocks-to-remove-set)
                    (worker :thread-api/search-delete-blocks repo blocks-to-remove-set))]
          (when (seq blocks-to-add)
            (worker :thread-api/search-upsert-blocks repo blocks-to-add))))
      (p/resolved nil)))
  (truncate-blocks! [_this]
    (if-let [worker @*worker]
      (worker :thread-api/search-truncate-tables (state/get-current-repo))
      (p/resolved nil)))
  (remove-db! [_this]
    ;; Already removed in OPFS
    (p/resolved nil)))
