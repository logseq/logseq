(ns frontend.worker.db-core-test
  (:require [cljs.test :refer [deftest is]]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker.db-core]))

(deftest db-core-registers-db-sync-thread-apis
  (let [api-map @thread-api/*thread-apis]
    (is (contains? api-map :thread-api/set-db-sync-config))
    (is (contains? api-map :thread-api/db-sync-start))
    (is (contains? api-map :thread-api/db-sync-stop))
    (is (contains? api-map :thread-api/db-sync-update-presence))
    (is (contains? api-map :thread-api/db-sync-request-asset-download))
    (is (contains? api-map :thread-api/db-sync-grant-graph-access))
    (is (contains? api-map :thread-api/db-sync-ensure-user-rsa-keys))
    (is (contains? api-map :thread-api/db-sync-upload-graph))
    (is (contains? api-map :thread-api/db-sync-import-kvs-rows))))
