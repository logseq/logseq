(ns frontend.worker.rtc.db-listener-test
  (:require [cljs.test :as t :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-listener :as worker-db-listener]
            [frontend.worker.rtc.db-listener :as subject]
            [logseq.db.frontend.schema :as db-schema]))

(def empty-db (d/empty-db db-schema/schema-for-db-based-graph))

(defn- tx-data=>id->attr->datom
  [tx-data]
  (let [datom-vec-coll (map vec tx-data)
        id->same-entity-datoms (group-by first datom-vec-coll)]
    (update-vals id->same-entity-datoms #'worker-db-listener/entity-datoms=>attr->datom)))

(deftest ^:fix-me entity-datoms=>ops-test
  (testing "remove whiteboard page-block"
    (let [conn (d/conn-from-db empty-db)
          block-uuid (random-uuid)
          _create-whiteboard-page-block
          (d/transact! conn [{:block/uuid block-uuid
                              :block/type "whiteboard"
                              :block/name "block-name"
                              :block/original-name "BLOCK-NAME"}])
          remove-whiteboard-page-block
          (d/transact! conn [[:db/retractEntity [:block/uuid block-uuid]]])]
      (is (= [["remove-page" {:block-uuid (str block-uuid)}]]
             (#'subject/entity-datoms=>ops2 (:db-before remove-whiteboard-page-block)
                                            (:db-after remove-whiteboard-page-block)
                                            (tx-data=>id->attr->datom (:tx-data remove-whiteboard-page-block))
                                            (map vec (:tx-data remove-whiteboard-page-block))))))))
