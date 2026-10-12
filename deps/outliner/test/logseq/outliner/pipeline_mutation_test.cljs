(ns logseq.outliner.pipeline-mutation-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.pipeline :as outliner-pipeline]))

(def ^:private timestamp (.getTime (js/Date. 2026 8 8 12)))

(def ^:private task-uuid #uuid "6a1d0c1e-0000-4000-8000-000000000001")

(def ^:private test-db
  (delay
    (let [conn (db-test/create-conn-with-import-map
                {:properties {:user.property/node {:logseq.property/type :node}
                              :user.property/nodes {:logseq.property/type :node
                                                    :db/cardinality :db.cardinality/many}
                              :plugin.property.foo/due {:logseq.property/type :datetime}}
                 :pages-and-blocks
                 [{:page {:build/journal 20260908}}
                  {:page {:block/title "target1"}}
                  {:page {:block/title "target2"}}
                  {:page {:block/title "page1"}
                   :blocks [{:block/title "node-ref"
                             :build/properties {:user.property/node [:build/page {:block/title "target1"}]}}
                            {:block/title "many-ref"
                             :build/properties {:user.property/nodes #{[:build/page {:block/title "target1"}]
                                                                       [:build/page {:block/title "target2"}]}}}
                            {:block/title "plugin-datetime"
                             :build/properties {:plugin.property.foo/due timestamp}}
                            {:block/title "private-ref"}
                            {:block/title "task-obj"
                             :block/uuid task-uuid
                             :build/tags [:logseq.class/Task]}
                            {:block/title "object-ref"
                             :build/properties {:user.property/node [:block/uuid task-uuid]}}]}]})
          private-block (db-test/find-block-by-content @conn "private-ref")]
      (d/transact! conn [[:db/add (:db/id private-block) :logseq.property/view-for
                          (:db/id (db-test/find-page-by-title @conn "target1"))]])
      @conn)))

(defn- id-of [db title]
  (:db/id (or (db-test/find-page-by-title db title)
              (db-test/find-block-by-content db title))))

(defn- refs-both-ways
  "Refs of the block titled `title` from the single-block and the bulk builder."
  [db title]
  (let [block (d/entity db (id-of db title))]
    [(set (outliner-pipeline/db-rebuild-block-refs db block))
     (set ((outliner-pipeline/db-rebuild-block-refs-fn db) block))]))

(deftest page-property-value-is-a-ref-test
  (let [db @test-db
        expected #{(:db/id (d/entity db :user.property/node)) (id-of db "target1")}]
    (is (= [expected expected] (refs-both-ways db "node-ref")))))

(deftest tagged-block-property-value-is-a-ref-test
  ;; A block with a tag is an object (not a page): it is a ref as well.
  (let [db @test-db
        expected #{(:db/id (d/entity db :user.property/node)) (id-of db "task-obj")}]
    (is (= [expected expected] (refs-both-ways db "object-ref")))))

(deftest every-value-of-a-many-property-is-a-ref-test
  (let [db @test-db
        expected #{(:db/id (d/entity db :user.property/nodes))
                   (id-of db "target1") (id-of db "target2")}]
    (is (= [expected expected] (refs-both-ways db "many-ref")))))

(deftest plugin-datetime-property-makes-no-journal-ref-test
  (let [db @test-db
        journal-id (:e (first (d/datoms db :avet :block/journal-day 20260908)))
        expected #{(:db/id (d/entity db :plugin.property.foo/due))}]
    (testing "sanity: the value's journal exists"
      (is (some? journal-id))
      (is (= journal-id (outliner-pipeline/get-journal-day-from-long db timestamp))))
    (is (= [expected expected] (refs-both-ways db "plugin-datetime")))))

(deftest private-built-in-property-value-is-not-a-ref-test
  (let [db @test-db]
    (is (= (id-of db "target1")
           (:db/id (:logseq.property/view-for (d/entity db (id-of db "private-ref"))))))
    (is (= [#{} #{}] (refs-both-ways db "private-ref")))))
