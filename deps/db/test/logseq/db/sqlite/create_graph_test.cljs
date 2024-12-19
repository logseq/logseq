(ns logseq.db.sqlite.create-graph-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.sqlite.build :as sqlite-build]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.db.frontend.class :as db-class]))

(deftest new-graph-db-idents
  (testing "a new graph follows :db/ident conventions for"
    (let [conn (db-test/create-conn)
          ident-ents (->> (d/q '[:find [?b ...]
                                 :where [?b :db/ident]]
                               @conn)
                          (map (fn [id] (d/entity @conn id))))
          default-idents (map :db/ident ident-ents)]
      (is (> (count default-idents) 45)
          "Approximate number of default idents is correct")

      (testing "namespaces"
        (is (= '() (remove namespace default-idents))
            "All default :db/ident's have namespaces")
        (is (= []
               (->> (remove db-property/db-attribute-properties default-idents)
                    (keep namespace)
                    (remove #(string/starts-with? % "logseq."))))
            "All default :db/ident namespaces start with logseq."))

      (testing "closed values"
        (let [closed-value-ents (filter #(string/includes? (name (:db/ident %)) ".") ident-ents)
              closed-value-properties (->> closed-value-ents
                                           (map :db/ident)
                                           (map #(keyword (namespace %) (string/replace (name %) #".[^.]+$" "")))
                                           set)]
          (is (= []
                 (remove ldb/closed-value? closed-value-ents))
              "All property names that contain a '.' are closed values")
          (is (= #{}
                 (set/difference
                  (set (remove #{:logseq.property/color} closed-value-properties))
                  (set default-idents)))
              "All closed values start with a prefix that is a property name"))))))

(deftest new-graph-marks-built-ins
  (let [conn (db-test/create-conn)
        idents (->> (d/q '[:find [(pull ?b [:db/ident :logseq.property/built-in?]) ...]
                           :where [?b :db/ident]]
                         @conn)
                    ;; only kv's and empty property value aren't marked because
                    ;; they aren't user facing
                    (remove #(or (= "logseq.kv" (namespace (:db/ident %)))
                                 (= :logseq.property/empty-placeholder (:db/ident %)))))
        pages (d/q '[:find [(pull ?b [:logseq.property/built-in? :block/title]) ...]
                     :where [?b :block/tags :logseq.class/Page]]
                   @conn)]
    (is (= [] (remove :logseq.property/built-in? idents))
        "All entities with :db/ident have built-in property (except for kv idents)")
    (is (= [] (remove :logseq.property/built-in? pages))
        "All default internal pages should have built-in property")))

(deftest new-graph-creates-class
  (let [conn (db-test/create-conn)
        task (d/entity @conn :logseq.class/Task)]
    (is (ldb/class? task)
        "Task class has correct type")
    (is (= 3 (count (:logseq.property.class/properties task)))
        "Has correct number of task properties")
    (is (every? ldb/property? (:logseq.property.class/properties task))
        "Each task property has correct type")))

(deftest new-graph-initializes-default-classes-correctly
  (let [conn (db-test/create-conn)]
    (is (= (count db-class/built-in-classes) (count (d/datoms @conn :avet :block/tags :logseq.class/Tag)))
        "All built-in classes have a :logseq.class/Tag")

    (is (= (count (dissoc db-class/built-in-classes :logseq.class/Root))
           (count (->> (d/datoms @conn :avet :block/tags :logseq.class/Tag)
                       (map #(d/entity @conn (:e %)))
                       (mapcat :logseq.property/_parent)
                       set)))
        "Reverse lookup of :logseq.property/parent correctly fetches number of child classes")))

(deftest new-graph-is-valid
  (let [conn (db-test/create-conn)
        validation (db-validate/validate-db! @conn)]
    ;; For debugging
    ;; (println (count (:errors validation)) "errors of" (count (:entities validation)))
    (is (empty? (map :entity (:errors validation)))
        "New graph has no validation errors")))

(deftest property-types
  (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
        _ (d/transact! conn (sqlite-create-graph/build-db-initial-data
                             (pr-str {:macros {"docs-base-url" "https://docs.logseq.com/#/page/$1"}})))]

    (testing ":url property"
      (sqlite-build/create-blocks
       conn
       {:properties {:url {:block/schema {:type :url}}}
        :pages-and-blocks
        [{:page {:block/title "page1"}
          :blocks [{:block/title "b1" :build/properties {:url "https://logseq.com"}}
                   ;; :url macros are used for consistently building urls with the same hostname e.g. docs graph
                   {:block/title "b2" :build/properties {:url "{{docs-base-url test}}"}}]}]})

      (is (empty? (map :entity (:errors (db-validate/validate-db! @conn))))
          "Graph with different :url blocks has no validation errors"))))
