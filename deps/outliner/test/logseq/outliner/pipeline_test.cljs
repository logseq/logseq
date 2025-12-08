(ns logseq.outliner.pipeline-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(deftest block-content-refs
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"} :blocks [{:block/title "b1"}]}])
        block (db-test/find-block-by-content @conn "b1")]
    (assert block)
    (is (= [(:db/id block)]
           (outliner-pipeline/block-content-refs @conn
                                                 {:block/title (str "ref to " (page-ref/->page-ref (:block/uuid block)))})))))
