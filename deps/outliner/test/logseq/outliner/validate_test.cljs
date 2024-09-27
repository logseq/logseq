(ns logseq.outliner.validate-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.outliner.validate :as outliner-validate]
            [logseq.db.test.helper :as db-test]))

(defn- find-block-by-content [conn content]
  (->> content
       (d/q '[:find [(pull ?b [*]) ...]
              :in $ ?content
              :where [?b :block/title ?content] [(missing? $ ?b :logseq.property/built-in?)]]
            @conn)
       first))

(deftest validate-block-title-unique-for-properties
  (let [conn (db-test/create-conn-with-blocks
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

(deftest validate-block-title-unique-for-pages
  (let [conn (db-test/create-conn-with-blocks
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
        "Disallow duplicate page without tag")

    (is (nil?
         (outliner-validate/validate-unique-by-name-tag-and-block-type
          @conn
          "Apple"
          (find-block-by-content conn "Fruit")))
        "Allow class to have same name as a page")))

(deftest new-graph-should-be-valid
  (let [conn (db-test/create-conn)
        pages (d/q '[:find [(pull ?b [*]) ...] :where [?b :block/title] [?b :block/type]] @conn)
        validation-errors (atom {})]
    (doseq [page pages]
      (try
        ;; Try as many of the relevant validations
        (outliner-validate/validate-unique-by-name-tag-and-block-type @conn (:block/title page) page)
        (outliner-validate/validate-page-title (:block/title page) {:node page})
        (outliner-validate/validate-page-title-characters (:block/title page) {:node page})

        (catch :default e
          (if (= :notification (:type (ex-data e)))
            (swap! validation-errors update (select-keys page [:block/title :db/ident :block/uuid]) (fnil conj []) e)
            (throw e)))))
    (is (= {} @validation-errors)
        "Default pages shouldn't have any validation errors")))