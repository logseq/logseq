(ns frontend.worker.handler.export
  "Export, import, and validation operations for the db worker."
  (:require [frontend.common.thread-api :refer [def-thread-api]]
            [frontend.worker.db.validate :as worker-db-validate]
            [frontend.worker.export :as worker-export]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.publishing.html :as publish-html]))

(def-thread-api :thread-api/export-get-debug-datoms
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-debug-datoms conn)))

(def-thread-api :thread-api/export-get-all-page->content
  [repo options]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-all-page->content @conn options)))

(def-thread-api :thread-api/export-get-blocks-data
  [repo root-block-uuids-or-page-uuid opts content-config]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/get-blocks-export-data @conn root-block-uuids-or-page-uuid opts content-config)))

(def-thread-api :thread-api/export-blocks-as-format
  [repo root-block-uuids-or-page-uuid format-type options content-config]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-export/export-blocks-as-format
     @conn
     root-block-uuids-or-page-uuid
     format-type
     options
     content-config)))

(def-thread-api :thread-api/validate-db
  [repo & [opts]]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (worker-db-validate/validate-db conn opts)))

(defn- checksum-diagnostics
  [repo]
  {:local-checksum (client-op/get-local-checksum repo)
   :remote-checksum (get @db-sync/*repo->latest-remote-checksum repo)})

(def-thread-api :thread-api/recompute-checksum-diagnostics
  [repo]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (let [result (worker-db-validate/recompute-checksum-diagnostics repo conn (checksum-diagnostics repo))
          recomputed-checksum (:recomputed-checksum result)]
      (when (and (some? recomputed-checksum)
                 (worker-state/get-client-ops-conn repo))
        (client-op/update-local-checksum repo recomputed-checksum))
      (cond-> result
        (some? recomputed-checksum)
        (assoc :local-checksum recomputed-checksum)))))

;; Returns an export-edn map for given repo. When there's an unexpected error, a map
;; with key :export-edn-error is returned.
(def-thread-api :thread-api/export-edn
  [repo options]
  (let [conn (worker-state/get-datascript-conn repo)]
    (try
      (sqlite-export/build-export @conn options)
      (catch :default e
        (js/console.error "export-edn error: " e)
        (js/console.error "Stack:\n" (.-stack e))
        (platform/post-message! (platform/current)
                                :notification
                                [nil :error nil nil nil
                                 {:i18n-key :export/error-unexpected}])
        {:export-edn-error (.-message e)}))))

(def-thread-api :thread-api/import-edn
  [repo export-edn]
  (let [conn (worker-state/get-datascript-conn repo)]
    (when-not conn
      (throw (ex-info "graph not opened" {:code :graph-not-opened :repo repo})))
    (let [txs (sqlite-export/build-import export-edn @conn {})
          validation (sqlite-export/validate-import-txs txs @conn)]
      (if-let [error (:error validation)]
        {:error error}
        (let [tx-data (:tx-data validation)
              tx-meta {::sqlite-export/imported-data? true}]
          (ldb/transact! conn tx-data tx-meta)
          {:tx-count (count tx-data)})))))

(def-thread-api :thread-api/build-publishing-html
  [repo options]
  (when-let [conn (worker-state/get-datascript-conn repo)]
    (publish-html/build-html @conn options)))
