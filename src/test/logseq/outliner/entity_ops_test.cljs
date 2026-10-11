(ns logseq.outliner.entity-ops-test
  "Outliner core operations that merge into or read an entity's titles: they
   need the compiled app (the outliner library's own tests run under nbb)."
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(deftest save-block-renames-a-page
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "Foo"} :blocks []}
                                               {:page {:block/title "Taken"} :blocks []}])
        foo (db-test/find-page-by-title @conn "Foo")
        save! #(outliner-core/save-block! conn {:db/id (:db/id foo) :block/uuid (:block/uuid foo) :block/title %})]
    (testing "a new title gives the page its new name"
      (save! "Bar")
      (is (= "bar" (:block/name (d/entity @conn (:db/id foo))))))
    (testing "the title of another page is refused"
      (is (thrown? js/Error (save! "Taken")))
      (is (= "bar" (:block/name (d/entity @conn (:db/id foo))))))))

(deftest save-block-allows-a-slash-in-a-block-title
  (let [conn (db-test/create-conn-with-blocks [{:page {:block/title "page1"}
                                                :blocks [{:block/title "b1"}]}])
        b1 (db-test/find-block-by-content @conn "b1")]
    (outliner-core/save-block! conn {:db/id (:db/id b1) :block/uuid (:block/uuid b1) :block/title "either/or"})
    (is (= "either/or" (:block/title (d/entity @conn (:db/id b1)))))))

(deftest a-copied-block-keeps-its-references-by-uuid
  (let [src-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Linked"} :blocks []}
               {:page {:block/title "page1"}
                :blocks [{:block/title "see [[Linked]]" :block/uuid src-uuid}
                         {:block/title "target"}]}])
        src (d/entity @conn [:block/uuid src-uuid])
        target (db-test/find-block-by-content @conn "target")
        {:keys [blocks]} (outliner-core/insert-blocks @conn [src] target {:sibling? true})]
    (is (not= (:block/raw-title src) (:block/title src)) "the stored title holds the uuid")
    (is (= (:block/raw-title src) (:block/title (first blocks))))))
