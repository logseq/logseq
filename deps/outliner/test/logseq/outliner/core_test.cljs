(ns logseq.outliner.core-test
  (:require [cljs.test :refer [deftest is testing]]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.outliner.core :as outliner-core]))

(defn- create-conn-with-blocks [opts]
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data "{}"))
        _ (sqlite-build/create-blocks conn opts)]
    conn))

(defn- find-block-by-content [conn content]
  (->> content
       (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?content
              :where [?b :block/title ?content]]
            @conn)
       first))

(deftest validate-unique-by-name-tag-and-block-type
  (testing "pages"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page1"}}
                 {:page {:block/title "Apple" :build/tags [:Company]}}
                 {:page {:block/title "Banana" :build/tags [:Fruit]}}])]

      (is (thrown-with-msg?
           js/Error
           #"Duplicate page by tag"
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "Apple"
            (assoc (find-block-by-content conn "Apple") :db/id 10000)))
          "Disallow duplicate page with tag")
      (is (nil?
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "Apple"
            (find-block-by-content conn "Banana")))
          "Allow page with same name for different tag")

      (is (thrown-with-msg?
           js/Error
           #"Duplicate page without tag"
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "page1"
            (assoc (find-block-by-content conn "page1") :db/id 10000)))
          "Disallow duplicate page without tag")))

  (testing "blocks"
    (let [conn (create-conn-with-blocks
                [{:page {:block/title "page"}
                  :blocks [{:block/title "yahoo"}
                           {:block/title "Sing Sing" :build/tags [:Movie]}
                           {:block/title "Chicago" :build/tags [:Musical]}]}])]

      (is (nil?
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "yahoo"
            (find-block-by-content conn "yahoo")))
          "Blocks without tags have no limits")

      (is (thrown-with-msg?
           js/Error
           #"Duplicate block by tag"
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "Sing Sing"
            (assoc (find-block-by-content conn "Sing Sing") :db/id 10000)))
          "Disallow duplicate page with tag")
      (is (nil?
           (outliner-core/validate-unique-by-name-tag-and-block-type
            @conn
            "Sing Sing"
            (find-block-by-content conn "Chicago")))
          "Allow block with same name for different tag"))))
