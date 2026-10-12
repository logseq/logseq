(ns logseq.db.frontend.class-mutation-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.test.helper :as db-test]))

(deftest filter-visible-class-object-ids-hides-children-of-hidden-page-test
  (let [conn (db-test/create-conn-with-blocks
              {:pages-and-blocks [{:page {:block/title "Hidden page"}
                                   :blocks [{:block/title "child of hidden"}]}
                                  {:page {:block/title "Shown page"}
                                   :blocks [{:block/title "child of shown"}]}]})
        page (db-test/find-page-by-title @conn "Hidden page")
        _ (d/transact! conn [[:db/add (:db/id page) :logseq.property/hide? true]])
        db @conn
        hidden-child (:db/id (db-test/find-block-by-content db "child of hidden"))
        shown-child (:db/id (db-test/find-block-by-content db "child of shown"))]
    (is (empty? (d/datoms db :avet :logseq.property/deleted-at)) "no deleted entity in this db")
    (is (= [shown-child] (db-class/filter-visible-class-object-ids db [hidden-child shown-child])))))
