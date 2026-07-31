(ns frontend.handler.block-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.handler.block :as block-handler]
            [logseq.db.test.helper :as db-test]))

(deftest block-unique-title-no-truncate-when-disabled
  (testing "disable truncate for cmdk path"
    (let [title (apply str (repeat 300 "a"))
          block {:block/title title}
          result (block-handler/block-unique-title block :truncate? false)]
      (is (= title result))
      (is (= 300 (count result))))))

(deftest block-unique-title-keeps-full-tag-label
  (testing "truncate base title before appending tags"
    (let [base-title (apply str (repeat 252 "a"))
          block {:block/title base-title
                 :block/tags [{:db/ident :user.class/example
                               :block/title "example"}]}
          result (block-handler/block-unique-title block)]
      (is (string/starts-with? result base-title))
      (is (string/ends-with? result "#example"))
      (is (> (count result) 256)))))

(deftest block-unique-title-hides-class-parent-when-title-is-unique
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Milestone {:block/title "Milestone"
                                     :build/class-extends [:Project]}}})
        milestone (d/entity @conn :user.class/Milestone)]
    (with-redefs [db/get-db (fn [] @conn)]
      (is (= "Milestone" (block-handler/block-unique-title milestone))))))

(deftest block-unique-title-shows-class-parent-when-title-conflicts
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Area {:block/title "Area"}
                         :user.class/Milestone {:block/title "Milestone"
                                                :build/class-extends [:Project]}
                         :other.class/Milestone {:block/title "Milestone"
                                                 :build/class-extends [:Area]}}})
        project-milestone (d/entity @conn :user.class/Milestone)
        area-milestone (d/entity @conn :other.class/Milestone)]
    (with-redefs [db/get-db (fn [] @conn)]
      (is (= "Project/Milestone" (block-handler/block-unique-title project-milestone)))
      (is (= "Area/Milestone" (block-handler/block-unique-title area-milestone))))))

(deftest block-unique-title-resolves-plain-class-map-before-title-formatting
  (let [conn (db-test/create-conn-with-blocks
              {:classes {:Project {:block/title "Project"}
                         :Area {:block/title "Area"}
                         :user.class/Milestone {:block/title "Milestone"
                                                :build/class-extends [:Project]}
                         :other.class/Milestone {:block/title "Milestone"
                                                 :build/class-extends [:Area]}}})
        project-milestone (d/entity @conn :user.class/Milestone)
        plain-class-map {:db/id (:db/id project-milestone)
                         :block/title (:block/title project-milestone)
                         :block/tags [(d/entid @conn :logseq.class/Tag)]}]
    (with-redefs [db/get-db (fn [] @conn)
                  db/entity (fn [eid] (d/entity @conn eid))]
      (is (= "Project/Milestone" (block-handler/block-unique-title plain-class-map))))))
