(ns logseq.db.sqlite.create-graph-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.db.sqlite.create-graph :as sqlite-create-graph]))

(deftest build-db-initial-data
  (testing "a new graph follows :db/ident conventions for"
    (let [conn (d/create-conn db-schema/schema-for-db-based-graph)
          _ (d/transact! conn (sqlite-create-graph/build-db-initial-data @conn "{}"))
          ident-ents (->> (d/q '[:find (pull ?b [:db/ident :block/type])
                                 :where [?b :db/ident]]
                               @conn)
                          (map first))
          default-idents (map :db/ident ident-ents)]
     (testing "namespaces"
       (is (= '() (remove namespace default-idents))
           "All default :db/ident's have namespaces")
       (is (= []
              (->> (keep namespace default-idents)
                   (remove #(string/starts-with? % "logseq."))))
           "All default :db/ident namespaces start with logseq.")
       (is (= #{"logseq.property" "logseq.class" "logseq.task" "logseq.kv"}
              (->> (keep namespace default-idents)
                   ;; only pull 1st and 2nd level namespaces e.g. logseq and logseq.property
                   (keep #(re-find #"^([^.]+\.?([^.]+)?)" %))
                   (map first)
                   set))
           "All default :db/ident's top-level namespaces are known"))

      (testing "closed values"
        (let [closed-value-ents (filter #(string/includes? (name (:db/ident %)) ".") ident-ents)
             closed-value-properties (->> closed-value-ents
                                          (map :db/ident)
                                          (map #(keyword (namespace %) (string/replace (name %) #".[^.]+$" "")))
                                          set)]
         (is (= []
                (remove #(= ["closed value"] (:block/type %)) closed-value-ents))
             "All property names that contain a '.' are closed values")
         (is (= #{}
                (set/difference closed-value-properties (set default-idents)))
             "All closed values start with a prefix that is a property name"))))))