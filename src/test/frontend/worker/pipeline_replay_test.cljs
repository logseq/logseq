(ns frontend.worker.pipeline-replay-test
  "The pipeline on an undo-redo replay of recorded datoms (local graphs)."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.pipeline :as worker-pipeline]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(defn- ref-ids
  [db id]
  (set (map :db/id (:block/refs (d/entity db id)))))

(deftest undo-redo-replay-keeps-refs-as-they-are-test
  (testing "an undo-redo replay of recorded datoms keeps refs as they are, even for a save-block op whose content would give other refs"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "b1"}]}
                 {:page {:block/title "other"}}])
          b1 (:db/id (db-test/find-block-by-content @conn "b1"))
          other (:db/id (ldb/get-page @conn "other"))
          _ (d/transact! conn [[:db/add b1 :block/refs other]])
          db @conn
          page1 (ldb/get-page db "page1")
          db' (:db-after (worker-pipeline/transact-pipeline
                          (d/with db [[:db/add b1 :block/title (str "see " (page-ref/->page-ref (:block/uuid page1)))]]
                                  {:outliner-op :save-block
                                   :undo-redo/replay-tx-datoms? true})))]
      (is (contains? (ref-ids db' b1) other))
      (is (not (contains? (ref-ids db' b1) (:db/id page1)))))))
