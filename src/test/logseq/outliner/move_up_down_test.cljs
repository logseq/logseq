(ns logseq.outliner.move-up-down-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]))

(defn- page-child-titles
  [conn page]
  (->> (:block/_parent (d/entity @conn (:db/id page)))
       (remove :logseq.property/created-from-property)
       ldb/sort-by-order
       (mapv :block/title)))

(defn- block-page-id
  [conn title]
  (:db/id (:block/page (db-test/find-block-by-content @conn title))))

(defn- two-journal-conn
  []
  (db-test/create-conn-with-blocks
   [{:page {:build/journal 20260927}
     :blocks [{:block/title "a"}
              {:block/title "b"}
              {:block/title "c"}]}
    {:page {:build/journal 20260926}
     :blocks [{:block/title "e"}
              {:block/title "f"}]}]))

(deftest move-blocks-up-down-keeps-ctrl-click-selection-on-own-page
  (testing "same-page move up still swaps a later sibling with the first block"
    (let [conn (two-journal-conn)
          today (db-test/find-journal-by-journal-day @conn 20260927)
          yesterday (db-test/find-journal-by-journal-day @conn 20260926)]
      (outliner-core/move-blocks-up-down! conn [(db-test/find-block-by-content @conn "b")] true)
      (is (= ["b" "a" "c"] (page-child-titles conn today)))
      (is (= ["e" "f"] (page-child-titles conn yesterday)))))

  (testing "move up on first blocks of two journal pages is a no-op, in either click order"
    (doseq [selection-titles [["a" "e"] ["e" "a"]]]
      (let [conn (two-journal-conn)
            today (db-test/find-journal-by-journal-day @conn 20260927)
            yesterday (db-test/find-journal-by-journal-day @conn 20260926)
            selected (mapv #(db-test/find-block-by-content @conn %) selection-titles)]
        (outliner-core/move-blocks-up-down! conn selected true)
        (is (= ["a" "b" "c"] (page-child-titles conn today))
            (str "today stays put after selecting " selection-titles))
        (is (= ["e" "f"] (page-child-titles conn yesterday))
            (str "yesterday stays put after selecting " selection-titles))
        (is (= (:db/id today) (block-page-id conn "a")))
        (is (= (:db/id yesterday) (block-page-id conn "e"))))))

  (testing "move down on last blocks of two journal pages is a no-op, in either click order"
    (doseq [selection-titles [["c" "f"] ["f" "c"]]]
      (let [conn (two-journal-conn)
            today (db-test/find-journal-by-journal-day @conn 20260927)
            yesterday (db-test/find-journal-by-journal-day @conn 20260926)
            selected (mapv #(db-test/find-block-by-content @conn %) selection-titles)]
        (outliner-core/move-blocks-up-down! conn selected false)
        (is (= ["a" "b" "c"] (page-child-titles conn today)))
        (is (= ["e" "f"] (page-child-titles conn yesterday)))
        (is (= (:db/id today) (block-page-id conn "c")))
        (is (= (:db/id yesterday) (block-page-id conn "f"))))))

  (testing "move up on later blocks of two pages moves each block within its own page"
    (let [conn (two-journal-conn)
          today (db-test/find-journal-by-journal-day @conn 20260927)
          yesterday (db-test/find-journal-by-journal-day @conn 20260926)
          selected [(db-test/find-block-by-content @conn "b")
                    (db-test/find-block-by-content @conn "f")]]
      (outliner-core/move-blocks-up-down! conn selected true)
      (is (= ["b" "a" "c"] (page-child-titles conn today)))
      (is (= ["f" "e"] (page-child-titles conn yesterday)))
      (is (= (:db/id today) (block-page-id conn "b")))
      (is (= (:db/id yesterday) (block-page-id conn "f")))))

  (testing "move down on earlier blocks of two pages moves each block within its own page"
    (let [conn (two-journal-conn)
          today (db-test/find-journal-by-journal-day @conn 20260927)
          yesterday (db-test/find-journal-by-journal-day @conn 20260926)
          selected [(db-test/find-block-by-content @conn "a")
                    (db-test/find-block-by-content @conn "e")]]
      (outliner-core/move-blocks-up-down! conn selected false)
      (is (= ["b" "a" "c"] (page-child-titles conn today)))
      (is (= ["f" "e"] (page-child-titles conn yesterday)))
      (is (= (:db/id today) (block-page-id conn "a")))
      (is (= (:db/id yesterday) (block-page-id conn "e")))))

  (testing "apply-ops move-blocks-up-down keeps a multi-page selection on each page"
    (let [conn (two-journal-conn)
          today (db-test/find-journal-by-journal-day @conn 20260927)
          yesterday (db-test/find-journal-by-journal-day @conn 20260926)
          a (db-test/find-block-by-content @conn "a")
          e (db-test/find-block-by-content @conn "e")]
      (outliner-op/apply-ops!
       conn
       [[:move-blocks-up-down [[(:block/uuid a) (:block/uuid e)] true]]]
       {})
      (is (= ["a" "b" "c"] (page-child-titles conn today)))
      (is (= ["e" "f"] (page-child-titles conn yesterday)))
      (is (= (:db/id yesterday) (block-page-id conn "e"))))))

(deftest move-blocks-up-down-keeps-nested-pages-under-own-parent
  (testing "Ctrl+click nested pages under different parents move within each parent"
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "Projects"}}
                 {:page {:block/title "Archive"}}
                 {:page {:block/title "A"}}
                 {:page {:block/title "B"}}
                 {:page {:block/title "C"}}
                 {:page {:block/title "X"}}
                 {:page {:block/title "Y"}}])
          projects (db-test/find-page-by-title @conn "Projects")
          archive (db-test/find-page-by-title @conn "Archive")
          a (db-test/find-page-by-title @conn "A")
          b (db-test/find-page-by-title @conn "B")
          c (db-test/find-page-by-title @conn "C")
          x (db-test/find-page-by-title @conn "X")
          y (db-test/find-page-by-title @conn "Y")]
      (outliner-core/move-blocks! conn [a] projects {:sibling? false})
      (outliner-core/move-blocks! conn [b] a {:sibling? true})
      (outliner-core/move-blocks! conn [c] b {:sibling? true})
      (outliner-core/move-blocks! conn [x] archive {:sibling? false})
      (outliner-core/move-blocks! conn [y] x {:sibling? true})
      (is (= ["A" "B" "C"] (page-child-titles conn projects)))
      (is (= ["X" "Y"] (page-child-titles conn archive)))
      (outliner-core/move-blocks-up-down!
       conn
       [(d/entity @conn (:db/id c)) (d/entity @conn (:db/id y))]
       true)
      (is (= (:db/id projects)
             (:db/id (:block/parent (d/entity @conn (:db/id c))))))
      (is (= (:db/id archive)
             (:db/id (:block/parent (d/entity @conn (:db/id y))))))
      (is (= ["A" "C" "B"] (page-child-titles conn projects)))
      (is (= ["Y" "X"] (page-child-titles conn archive)))
      (outliner-core/move-blocks-up-down!
       conn
       [(d/entity @conn (:db/id a))]
       false)
      (is (= ["C" "A" "B"] (page-child-titles conn projects))
          "A nested page can still move down past a sibling page"))))
