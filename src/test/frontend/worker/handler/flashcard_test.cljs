(ns frontend.worker.handler.flashcard-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.handler.block :as block-handler]
            [frontend.worker.handler.flashcard :as flashcard]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.test.helper :as db-test]))

(defn- project-extends-card-conn
  []
  (db-test/create-conn-with-blocks
   {:classes {:Project {:block/title "Project"
                        :build/class-extends [:logseq.class/Card]}}
    :pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "project card"
                :build/tags [:Project]}
               {:block/title "plain"}]}]}))

(deftest fsrs-card-block-ids-includes-tags-that-extend-card
  (let [conn (project-extends-card-conn)
        db @conn
        ids (set (#'flashcard/fsrs-card-block-ids db nil false))
        project-card (db-test/find-block-by-content db "project card")
        plain (db-test/find-block-by-content db "plain")]
    (is (contains? ids (:db/id project-card)))
    (is (not (contains? ids (:db/id plain))))))

(deftest get-block-tag-summary-exposes-card-extends-for-renderer
  (let [conn (project-extends-card-conn)
        db @conn
        project-card (db-test/find-block-by-content db "project card")
        block (:block (block-handler/get-block-and-children
                       db (:db/id project-card) {:children? false}))
        tag (first (:block/tags block))
        extends-idents (map :db/ident (:logseq.property.class/extends tag))]
    (testing "worker tag summary includes the Card ancestor"
      (is (= :user.class/Project (:db/ident tag)))
      (is (some #{:logseq.class/Card} extends-idents)))
    (testing "worker card-class-ids includes the Project tag"
      (is (contains? (set (db-class/card-class-ids db))
                     (:db/id (d/entity db :user.class/Project)))))))
