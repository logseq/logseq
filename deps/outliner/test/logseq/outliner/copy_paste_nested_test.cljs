(ns logseq.outliner.copy-paste-nested-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]))

(defn- entity-or-ref-map?
  [v]
  (or (de/entity? v)
      (and (map? v) (or (:db/id v) (:block/uuid v)))))

(defn- ->lookup-ref
  [v]
  [:block/uuid (:block/uuid v)])

(defn- clipboard-block
  "Serialize a block the way editor copy/cut does: entity refs become lookup refs."
  [block]
  (-> (into {:db/id (:db/id block)
             :block/uuid (:block/uuid block)}
            (map (fn [k]
                   [k (let [v (get block k)]
                        (cond
                          (entity-or-ref-map? v)
                          (->lookup-ref v)
                          (and (coll? v) (seq v) (every? entity-or-ref-map? v))
                          (set (map ->lookup-ref v))
                          :else
                          v))]))
            (keys block))))

(defn- copied-blocks-for
  [db block]
  (mapv clipboard-block
        (ldb/get-block-and-children db (:block/uuid block)
                                    {:include-property-block? true})))

(defn- outline-child-titles
  [block]
  (->> (ldb/sort-by-order (:block/_parent block))
       (remove :logseq.property/created-from-property)
       (mapv :block/title)))

(defn- nested-copy-conn
  []
  (db-test/create-conn-with-blocks
   [{:page {:block/title "source"}
     :blocks [{:block/title "parent-1"
               :build/children [{:block/title "child-1a"}
                                {:block/title "child-1b"}]}
              {:block/title "parent-2"
               :build/children [{:block/title "child-2a"}]}]}
    {:page {:block/title "dest"}
     :blocks [{:block/title ""}
              {:block/title "dest-anchor"}]}]))

(defn- source-parent
  [db]
  (db-test/find-block-by-content db "parent-1"))

(defn- paste-copied-tree!
  [conn copied target opts]
  (outliner-core/insert-blocks! conn copied target
                                (merge {:sibling? true
                                        :outliner-op :paste}
                                       opts)))

(deftest copy-paste-keeps-original-children-when-uuids-still-exist
  (testing "Pasting a copied nested tree must not steal live children, even if keep-uuid? is true (stale cut / other window)."
    (let [conn (nested-copy-conn)
          parent (source-parent @conn)
          parent-uuid (:block/uuid parent)
          child-uuids (set (map :block/uuid (ldb/sort-by-order (:block/_parent parent))))
          copied (copied-blocks-for @conn parent)
          empty-target (db-test/find-block-by-content @conn "")]
      (is (= #{"child-1a" "child-1b"} (set (outline-child-titles parent))))
      (paste-copied-tree! conn copied empty-target
                          {:keep-uuid? true
                           :replace-empty-target? true})
      (let [original (d/entity @conn [:block/uuid parent-uuid])
            original-children (ldb/sort-by-order (:block/_parent original))
            dest-page (ldb/get-page @conn "dest")
            dest-child-titles (->> (ldb/sort-by-order (:block/_parent dest-page))
                                   (mapcat outline-child-titles)
                                   set)]
        (is (some? original) "Original parent remains")
        (is (= parent-uuid (:block/uuid original)))
        (is (= ["child-1a" "child-1b"] (outline-child-titles original))
            "Original children stay under the source parent")
        (is (= child-uuids (set (map :block/uuid original-children)))
            "Original child identities are unchanged")
        (is (contains? dest-child-titles "child-1a")
            "Paste still duplicates children onto the destination")
        (is (not-any? child-uuids (map :block/uuid
                                       (mapcat #(ldb/sort-by-order (:block/_parent %))
                                               (ldb/sort-by-order (:block/_parent dest-page)))))
            "Destination copies must use new child identities")))))

(deftest copy-paste-keeps-original-children-when-pasting-beside-existing-block
  (let [conn (nested-copy-conn)
        parent (source-parent @conn)
        parent-uuid (:block/uuid parent)
        copied (copied-blocks-for @conn parent)
        target (db-test/find-block-by-content @conn "dest-anchor")]
    (paste-copied-tree! conn copied target {:keep-uuid? true})
    (let [original (d/entity @conn [:block/uuid parent-uuid])]
      (is (= ["child-1a" "child-1b"] (outline-child-titles original)))
      (is (= "source" (:block/title (:block/page original)))))))

(deftest copy-paste-with-keep-uuid-false-duplicates-nested-tree
  (let [conn (nested-copy-conn)
        parent (source-parent @conn)
        parent-uuid (:block/uuid parent)
        copied (copied-blocks-for @conn parent)
        target (db-test/find-block-by-content @conn "dest-anchor")]
    (paste-copied-tree! conn copied target {:keep-uuid? false})
    (let [original (d/entity @conn [:block/uuid parent-uuid])
          dest-page (ldb/get-page @conn "dest")
          dest-parents (filter #(= "parent-1" (:block/title %))
                               (ldb/sort-by-order (:block/_parent dest-page)))]
      (is (= ["child-1a" "child-1b"] (outline-child-titles original)))
      (is (= 1 (count dest-parents)))
      (is (not= parent-uuid (:block/uuid (first dest-parents))))
      (is (= ["child-1a" "child-1b"] (outline-child-titles (first dest-parents)))))))

(deftest cut-paste-moves-nested-tree
  (let [conn (nested-copy-conn)
        parent (source-parent @conn)
        parent-uuid (:block/uuid parent)
        copied (copied-blocks-for @conn parent)
        target (db-test/find-block-by-content @conn "dest-anchor")]
    (outliner-core/delete-blocks! conn [parent] {})
    (paste-copied-tree! conn copied target {:keep-uuid? true})
    (let [moved (d/entity @conn [:block/uuid parent-uuid])]
      (is (some? moved) "Cut paste restores the original uuid")
      (is (= ["child-1a" "child-1b"] (outline-child-titles moved)))
      (is (= "dest" (:block/title (:block/page moved)))))))

(deftest non-paste-keep-uuid-reuses-live-child-identities
  (testing "Undo restore inserts with keep-uuid? and no :paste op must not remint live children."
    (let [conn (nested-copy-conn)
          parent (source-parent @conn)
          parent-uuid (:block/uuid parent)
          child-uuids (set (map :block/uuid (ldb/sort-by-order (:block/_parent parent))))
          copied (copied-blocks-for @conn parent)
          target (db-test/find-block-by-content @conn "dest-anchor")]
      (outliner-core/insert-blocks! conn copied target
                                    {:sibling? true
                                     :keep-uuid? true
                                     :keep-block-order? true})
      (let [moved (d/entity @conn [:block/uuid parent-uuid])
            dest-page (ldb/get-page @conn "dest")
            dest-parents (filter #(= "parent-1" (:block/title %))
                                 (ldb/sort-by-order (:block/_parent dest-page)))
            dest-child-uuids (set (map :block/uuid
                                       (mapcat #(ldb/sort-by-order (:block/_parent %))
                                               dest-parents)))]
        (is (= 1 (count dest-parents)))
        (is (= parent-uuid (:block/uuid (first dest-parents))))
        (is (= ["child-1a" "child-1b"] (outline-child-titles moved)))
        (is (= child-uuids (set (map :block/uuid (ldb/sort-by-order (:block/_parent moved))))))
        (is (= child-uuids dest-child-uuids)
            "Live child identities are reused, not duplicated")
        (is (= "dest" (:block/title (:block/page moved))))))))

(deftest undo-restore-keeps-live-child-uuid
  (testing "Undo insert of a deleted parent must reuse a still-live child uuid, not remint a duplicate."
    (let [conn (db-test/create-conn-with-blocks
                [{:page {:block/title "page"}
                  :blocks [{:block/title "b"}
                           {:block/title "c"
                            :build/children [{:block/title "d"}]}]}])
          b (db-test/find-block-by-content @conn "b")
          c (db-test/find-block-by-content @conn "c")
          d (db-test/find-block-by-content @conn "d")
          c-uuid (:block/uuid c)
          d-uuid (:block/uuid d)
          restore-payload (copied-blocks-for @conn c)]
      (outliner-core/move-blocks! conn [d] b {:sibling? false})
      (outliner-core/delete-blocks! conn [c] {})
      (outliner-core/insert-blocks! conn restore-payload b
                                    {:sibling? true
                                     :keep-uuid? true
                                     :keep-block-order? true})
      (let [restored (d/entity @conn [:block/uuid c-uuid])
            children (->> (ldb/sort-by-order (:block/_parent restored))
                          (remove :logseq.property/created-from-property))]
        (is (some? restored))
        (is (= ["d"] (mapv :block/title children)))
        (is (= [d-uuid] (mapv :block/uuid children))
            "Live children reparented by merge must keep their uuid on undo restore")))))
