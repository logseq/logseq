(ns logseq.melange.bridge.db.frontend.comments-class-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.test-helper :as db-test]))

(deftest comments-built-in-class
  (let [conn (db-test/create-conn)
        comments (d/entity @conn :logseq.class/Comments)]
    (testing "#Comments is a built-in tag"
      (is (= "Comments" (:block/title comments)))
      (is (ldb/class? comments)))

    (testing "#Comments can be used to tag a block"
      (let [conn (db-test/create-conn-with-blocks
                  {:pages-and-blocks
                   [{:page {:block/title "A"}
                     :blocks [{:block/title "thread"
                               :build/tags [:logseq.class/Comments]}]}]})
            block (ffirst (d/q '[:find (pull ?b [:db/id :block/title {:block/tags [:db/ident]}])
                                 :where
                                 [?b :block/title "thread"]]
                               @conn))]
        (is (= #{:logseq.class/Comments}
               (set (map :db/ident (:block/tags block)))))
        (is (not (ldb/page? (d/entity @conn (:db/id block)))))))))
