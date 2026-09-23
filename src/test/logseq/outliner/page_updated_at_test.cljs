(ns logseq.outliner.page-updated-at-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]))

(defn- reset-page-updated-at!
  [conn page]
  (d/transact! conn [{:db/id (:db/id page)
                      :block/updated-at 1}])
  (:block/updated-at (d/entity @conn (:db/id page))))

(defn- page-updated-at
  [conn page]
  (:block/updated-at (d/entity @conn (:db/id page))))

(deftest page-updated-at-bumps-on-child-insert-reorder-and-move
  (testing "inserting a child block bumps the page updated-at"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "parent"}]}])
          page (db-test/find-page-by-title @conn "page1")
          parent (db-test/find-block-by-content @conn "parent")
          before (reset-page-updated-at! conn page)]
      (outliner-core/insert-blocks!
       conn
       [{:block/uuid (random-uuid)
         :block/title "inserted-child"}]
       parent
       {:sibling? false
        :keep-uuid? true})
      (is (some? (db-test/find-block-by-content @conn "inserted-child")))
      (is (> (page-updated-at conn page) before)
          "Adding a child block must bump the page :block/updated-at")))

  (testing "reordering sibling blocks bumps the page updated-at"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "first"}
                           {:block/title "second"}]}])
          page (db-test/find-page-by-title @conn "page1")
          second (db-test/find-block-by-content @conn "second")
          before (reset-page-updated-at! conn page)]
      (outliner-core/move-blocks-up-down! conn [second] true)
      (is (= "second"
             (:block/title (first (ldb/sort-by-order (:block/_parent (d/entity @conn (:db/id page))))))))
      (is (> (page-updated-at conn page) before)
          "Changing block order must bump the page :block/updated-at")))

  (testing "move-blocks bumps source and destination page updated-at"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "moved"}]}
                 {:page {:block/title "page2"}
                  :blocks [{:block/title "dest"}]}])
          page1 (db-test/find-page-by-title @conn "page1")
          page2 (db-test/find-page-by-title @conn "page2")
          moved (db-test/find-block-by-content @conn "moved")
          dest (db-test/find-block-by-content @conn "dest")
          before-src (reset-page-updated-at! conn page1)
          before-dest (reset-page-updated-at! conn page2)]
      (outliner-core/move-blocks! conn [moved] dest {:sibling? false})
      (is (= (:db/id dest)
             (:db/id (:block/parent (db-test/find-block-by-content @conn "moved")))))
      (is (> (page-updated-at conn page1) before-src)
          "Removing a block must bump the source page :block/updated-at")
      (is (> (page-updated-at conn page2) before-dest)
          "Adding a block must bump the destination page :block/updated-at")))

  (testing "apply-ops move-blocks bumps page updated-at"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page1"}
                  :blocks [{:block/title "first"}
                           {:block/title "second"}]}])
          page (db-test/find-page-by-title @conn "page1")
          first-block (db-test/find-block-by-content @conn "first")
          second (db-test/find-block-by-content @conn "second")
          before (reset-page-updated-at! conn page)]
      (outliner-op/apply-ops!
       conn
       [[:move-blocks [[(:block/uuid second)]
                       (:block/uuid first-block)
                       {:sibling? false}]]]
       {})
      (is (= (:db/id first-block)
             (:db/id (:block/parent (db-test/find-block-by-content @conn "second")))))
      (is (> (page-updated-at conn page) before)
          "move-blocks via apply-ops must bump the page :block/updated-at"))))
