(ns frontend.worker.handler.flashcard-test
  (:require [cljs.test :refer [deftest is testing]]
            [frontend.worker.handler.block :as block-handler]
            [logseq.db.test.helper :as db-test]))

(defn- project-extends-card-conn
  []
  (db-test/create-conn-with-blocks
   {:classes {:Work {:block/title "Work"
                     :build/class-extends [:logseq.class/Card]}
              :Milestone {:block/title "Milestone"
                          :build/class-extends [:Work]}
              :Project {:block/title "Project"
                        :build/class-extends [:Milestone]}}
    :pages-and-blocks
    [{:page {:block/title "page"}
      :blocks [{:block/title "project card"
                :build/tags [:Project]}]}]}))

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
      (is (some #{:logseq.class/Card} extends-idents)))))
