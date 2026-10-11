(ns logseq.outliner.orphaned-pages-test
  "An edit that drops a block's last reference to an empty page deletes that
   page. (In a DB graph every page's :block/properties holds its :block/tags,
   so this needs the compiled app's entities; the outliner library's nbb run
   does not compute :block/properties.)"
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- edit-away-from-dropped
  "page1 holds a block whose title refers to Kept and Dropped by uuid, as the
   editor saves it; both pages are empty and referenced only there. The edit
   keeps [[Kept]] alone. `dropped-props` go on Dropped."
  [dropped-props]
  (let [block-uuid (random-uuid)
        kept-uuid (random-uuid)
        dropped-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              {:properties {:reviewed {:logseq.property/type :checkbox}}
               :pages-and-blocks
               [{:page {:block/title "Kept" :block/uuid kept-uuid} :blocks []}
                {:page (cond-> {:block/title "Dropped" :block/uuid dropped-uuid}
                         dropped-props (assoc :build/properties dropped-props))
                 :blocks []}
                {:page {:block/title "page1"}
                 :blocks [{:block/title (str "[[" kept-uuid "]] [[" dropped-uuid "]]")
                           :block/uuid block-uuid}]}]})
        block (d/entity @conn [:block/uuid block-uuid])]
    (is (= #{kept-uuid dropped-uuid} (set (map :block/uuid (:block/refs block)))))
    (outliner-core/save-block! conn {:db/id (:db/id block)
                                     :block/uuid block-uuid
                                     :block/title (str "[[" kept-uuid "]]")
                                     :block/refs [{:db/id (:db/id (d/entity @conn [:block/uuid kept-uuid]))}]})
    {:kept (d/entity @conn [:block/uuid kept-uuid])
     :dropped (d/entity @conn [:block/uuid dropped-uuid])}))

(deftest an-edit-deletes-the-empty-page-it-no-longer-references
  (let [{:keys [kept dropped]} (edit-away-from-dropped nil)]
    (testing "the page still referenced stays"
      (is (some? kept)))
    (testing "the empty page no longer referenced is deleted"
      (is (nil? dropped)))))

(deftest a-save-without-a-title-keeps-the-pages-the-block-references
  (let [page-uuid (random-uuid)
        block-uuid (random-uuid)
        conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Linked" :block/uuid page-uuid} :blocks []}
               {:page {:block/title "page1"}
                :blocks [{:block/title (str "[[" page-uuid "]]") :block/uuid block-uuid}]}])
        block (d/entity @conn [:block/uuid block-uuid])]
    (outliner-core/save-block! conn {:db/id (:db/id block) :block/uuid block-uuid :block/collapsed? true})
    (is (some? (d/entity @conn [:block/uuid page-uuid])))))

(deftest an-edit-keeps-a-page-with-a-property
  (let [{:keys [dropped]} (edit-away-from-dropped {:reviewed true})]
    (is (some? dropped))))
