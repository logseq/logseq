(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [deftest is]]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.outliner.validate :as outliner-validate]))

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

(deftest validate-block-title-unique-for-properties
  (let [conn (create-conn-with-blocks
              ;; use a property name that's same as built-in
              {:properties {:background-image {:block/schema {:type :default}}}})]

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "background-color"
          (assoc (find-block-by-content conn "background-image") :db/id 10000)))
        "Allow user property to have same name as built-in property")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate property"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "background-image"
          (assoc (find-block-by-content conn "background-image") :db/id 10000)))
        "Disallow duplicate user property")))

(deftest validate-block-title-unique-for-blocks
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page"}
                :blocks [{:block/title "yahoo"}
                         {:block/title "Sing Sing" :build/tags [:Movie]}
                         {:block/title "Chicago" :build/tags [:Musical]}]}])]

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "yahoo"
          (find-block-by-content conn "yahoo")))
        "Blocks without tags have no limits")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate block by tag"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Sing Sing"
          (assoc (find-block-by-content conn "Sing Sing") :db/id 10000)))
        "Disallow duplicate page with tag")
    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Sing Sing"
          (find-block-by-content conn "Chicago")))
        "Allow block with same name for different tag")))

(deftest validate-block-title-unique-for-pages
  (let [conn (create-conn-with-blocks
              [{:page {:block/title "page1"}}
               {:page {:block/title "Apple" :build/tags [:Company]}}
               {:page {:block/title "Banana" :build/tags [:Fruit]}}])]

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page by tag"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (assoc (find-block-by-content conn "Apple") :db/id 10000)))
        "Disallow duplicate page with tag")
    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (find-block-by-content conn "Banana")))
        "Allow page with same name for different tag")

    (is (thrown-with-msg?
         js/Error
         #"Duplicate page without tag"
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "page1"
          (assoc (find-block-by-content conn "page1") :db/id 10000)))
        "Disallow duplicate page without tag")))
