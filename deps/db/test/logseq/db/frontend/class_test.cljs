(ns logseq.db.frontend.class-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.test.helper :as db-test]))

(defn- parent-class-id [db]
  (:db/id (d/entity db :user.class/Parent)))

(deftest get-class-objects-dedupes-inherited-tags-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Parent {:block/title "Parent"}
                         :Child {:block/title "Child"
                                 :build/class-extends [:Parent]}}
               :pages-and-blocks [{:page {:block/title "Object1"
                                          :build/tags [:Parent :Child]}}]})
        objects (db-class/get-class-objects @conn (parent-class-id @conn))
        ids (map :db/id objects)]
    (testing "an object tagged by both parent and child class is returned once"
      (is (= 1 (count ids)))
      (is (= 1 (count (distinct ids)))))))

(deftest get-class-objects-filters-hidden-objects-test
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Parent {:block/title "Parent"}
                         :Child {:block/title "Child"
                                 :build/class-extends [:Parent]}}
               :pages-and-blocks [{:page {:block/title "Visible"
                                          :build/tags [:Child]}}
                                  {:page {:block/title "Deleted"
                                          :build/tags [:Child]
                                          :logseq.property/deleted-at 1}}
                                  {:page {:block/title "Hidden"
                                          :build/tags [:Child]
                                          :logseq.property/hide? true}}]})
        titles (->> (db-class/get-class-objects @conn (parent-class-id @conn))
                    (map :block/title)
                    set)]
    (is (= #{"Visible"} titles))))
