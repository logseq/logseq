(ns logseq.outliner.paste-missing-block-ref-test
  "A clipboard copied before an undo removed a block still points at that
  block. Pasting it must keep the paste and drop the :block/link or
  :block/refs lookup of the block that is gone. A missing property value still
  fails the paste, see cut-paste-property-test."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(def ^:private paste-opts
  {:sibling? true
   :outliner-op :paste
   :keep-uuid? true})

(defn- conn-with-gone-block
  []
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "anchor"}
                         {:block/title "gone"}]}])
        gone (db-test/find-block-by-content @conn "gone")]
    (d/transact! conn [[:db/retractEntity (:db/id gone)]])
    [conn (:block/uuid gone)]))

(deftest paste-drops-references-to-a-missing-block
  (doseq [[desc block-fn]
          [["a :block/refs lookup"
            (fn [gone] {:block/title (str "see [[" gone "]]")
                        :block/refs #{[:block/uuid gone]}})]
           ["a :block/link lookup"
            (fn [gone] {:block/title ""
                        :block/link [:block/uuid gone]})]]]
    (testing desc
      (let [[conn gone-uuid] (conn-with-gone-block)
            pasted-uuid (random-uuid)
            anchor (db-test/find-block-by-content @conn "anchor")]
        (outliner-core/insert-blocks! conn
                                      [(assoc (block-fn gone-uuid) :block/uuid pasted-uuid)]
                                      anchor
                                      paste-opts)
        (let [pasted (d/entity @conn [:block/uuid pasted-uuid])]
          (is (some? pasted) "The paste is kept")
          (is (= (:db/id (:block/page anchor)) (:db/id (:block/page pasted))))
          (is (nil? (:block/link pasted)))
          (is (empty? (:block/refs pasted)))
          (is (nil? (d/entity @conn [:block/uuid gone-uuid]))
              "The missing block isn't recreated"))))))
