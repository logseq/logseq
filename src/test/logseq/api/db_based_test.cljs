(ns logseq.api.db-based-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.test.helper :as test-helper]
            [logseq.api.block :as api-block]
            [logseq.api.db-based :as db-based-api]))

(use-fixtures :each {:before #(test-helper/start-test-db! {:build-init-data? false})
                     :after test-helper/destroy-test-db!})

(defn- listen-tx-reports
  [conn f]
  (let [reports (atom [])]
    (d/listen! conn ::db-transaction-test
               (fn [tx-report]
                 (swap! reports conj tx-report)))
    (try
      (f reports)
      (finally
        (d/unlisten! conn ::db-transaction-test)))))

(deftest transact-batches-update-block-actions-into-one-tx-test
  (let [[page first-block second-block] (test-helper/initial-test-page-and-blocks)
        repo test-helper/test-db
        conn (conn/get-db repo false)]
    (db/transact! repo [page first-block second-block])
    (listen-tx-reports
     conn
     (fn [reports]
       (let [result (js->clj (db-based-api/transact
                              (clj->js [{:type "updateBlock"
                                         :block (str (:block/uuid first-block))
                                         :content "updated block 1"}
                                        {:type "updateBlock"
                                         :block (str (:block/uuid second-block))
                                         :content "updated block 2"
                                         :properties {"rating" 2}
                                         :schema {"rating" {:type "number"}}}])
                              #js {:undoGroup "cmd-1"}))
             rating-ident (api-block/get-db-ident-from-property-name "rating" nil)
             updated-first (db/entity [:block/uuid (:block/uuid first-block)])
             updated-second (db/entity [:block/uuid (:block/uuid second-block)])
             tx-report (first @reports)]
         (is (= 1 (count @reports)))
         (is (= "pluginTransact" (get result "outlinerOp")))
         (is (= 2 (get result "actionCount")))
         (is (= true (get result "persistOp")))
         (is (= "cmd-1" (get result "undoGroup")))
         (is (= (get result "txId") (str (get-in tx-report [:tx-meta :db-sync/tx-id]))))
         (is (= :plugin-transact (get-in tx-report [:tx-meta :outliner-op])))
         (is (= true (get-in tx-report [:tx-meta :persist-op?])))
         (is (= "cmd-1" (get-in tx-report [:tx-meta :undo-group])))
         (is (= "updated block 1" (:block/title updated-first)))
         (is (= "updated block 2" (:block/title updated-second)))
         (is (= 2 (get (api-block/into-readable-db-properties (:block/properties updated-second)) (str rating-ident)))))))))

(deftest transact-supports-create-and-rename-page-in-one-batch-test
  (let [repo test-helper/test-db
        conn (conn/get-db repo false)
        page-uuid (random-uuid)]
    (listen-tx-reports
     conn
     (fn [reports]
       (let [result (js->clj (db-based-api/transact
                              (clj->js [{:type "createPage"
                                         :pageName "Transaction Draft"
                                         :options {:uuid (str page-uuid)}}
                                        {:type "renamePage"
                                         :page (str page-uuid)
                                         :newName "Transaction Final"}])
                              #js {}))
             created-page (db/entity [:block/uuid page-uuid])]
         (is (= 1 (count @reports)))
         (is (= "pluginTransact" (get result "outlinerOp")))
         (is (= "Transaction Final" (:block/title created-page)))
         (is (= created-page (db/get-page "Transaction Final")))
         (is (= nil (db/get-page "Transaction Draft"))))))))

(deftest transact-allows-existing-matching-property-schema-test
  (let [[page first-block] (take 2 (test-helper/initial-test-page-and-blocks))
        repo test-helper/test-db
        conn (conn/get-db repo false)]
    (db/transact! repo [page first-block])
    (db-based-api/upsert-property "rating" #js {:type "number"} #js {})
    (listen-tx-reports
     conn
     (fn [reports]
       (let [result (js->clj (db-based-api/transact
                              (clj->js [{:type "updateBlock"
                                         :block (str (:block/uuid first-block))
                                         :content "updated with existing schema"
                                         :properties {"rating" 5}
                                         :schema {"rating" {:type "number"}}}])
                              #js {}))
             rating-ident (api-block/get-db-ident-from-property-name "rating" nil)
             updated-block (db/entity [:block/uuid (:block/uuid first-block)])]
         (is (= 1 (count @reports)))
         (is (= "saveBlock" (get result "outlinerOp")))
         (is (= "updated with existing schema" (:block/title updated-block)))
         (is (= 5 (get (api-block/into-readable-db-properties (:block/properties updated-block)) (str rating-ident)))))))))

(deftest transact-still-rejects-existing-schema-changes-test
  (let [[page first-block] (take 2 (test-helper/initial-test-page-and-blocks))
        repo test-helper/test-db
        conn (conn/get-db repo false)]
    (db/transact! repo [page first-block])
    (db-based-api/upsert-property "rating" #js {:type "number"} #js {})
    (listen-tx-reports
     conn
     (fn [reports]
       (let [error (try
                     (db-based-api/transact
                      (clj->js [{:type "updateBlock"
                                 :block (str (:block/uuid first-block))
                                 :properties {"rating" 5}
                                 :schema {"rating" {:type "date"}}}])
                      #js {})
                     nil
                     (catch :default e
                       e))
             block-after (db/entity [:block/uuid (:block/uuid first-block)])]
         (is error)
         (is (= "Use `upsert_property` to modify existing property's schema"
                (ex-message error)))
         (is (nil? (api-block/into-readable-db-properties (:block/properties block-after))))
         (is (empty? @reports)))))))

(deftest transact-fails-atomically-when-a-later-action-errors-test
  (let [[page first-block] (take 2 (test-helper/initial-test-page-and-blocks))
        repo test-helper/test-db
        conn (conn/get-db repo false)]
    (db/transact! repo [page first-block])
    (listen-tx-reports
     conn
     (fn [reports]
       (let [error (try
                     (db-based-api/transact
                      (clj->js [{:type "updateBlock"
                                 :block (str (:block/uuid first-block))
                                 :content "should not persist"}
                                {:type "upsertProperty"
                                 :key "rating"
                                 :schema {:type "not-a-real-type"}}])
                      #js {})
                     nil
                     (catch :default e
                       e))
             block-after (db/entity [:block/uuid (:block/uuid first-block)])]
         (is error)
         (is (= "block 1" (:block/title block-after)))
         (is (empty? @reports)))))))


