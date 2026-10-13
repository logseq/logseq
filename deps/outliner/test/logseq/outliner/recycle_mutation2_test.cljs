(ns logseq.outliner.recycle-mutation2-test
  "Second-run mutation survivors in logseq.outliner.recycle."
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.recycle :as recycle]))

(def ^:private thirty-one-days-ms (* 31 24 3600 1000))

(defn- recycle-page
  [db]
  (ldb/get-built-in-page db common-config/recycle-page-name))

(defn- next-order
  [order]
  (db-order/gen-key order nil))

(defn- order-of
  [conn id]
  (:block/order (d/entity @conn id)))

(defn- find-id
  [conn title]
  (:db/id (db-test/find-block-by-content @conn title)))

(defn- capture-tx-metas!
  "Collects the tx-meta of every transaction on conn into the returned atom."
  [conn]
  (let [tx-metas (atom [])]
    (d/listen! conn ::capture (fn [tx-report] (swap! tx-metas conj (:tx-meta tx-report))))
    tx-metas))

(defn- recycle-block!
  [conn id opts]
  (ldb/transact! conn
                 (recycle/recycle-blocks-tx-data @conn [(d/entity @conn id)] opts)
                 {:outliner-op :delete-blocks}))

(defn- recycle-page!
  [conn id opts]
  (ldb/transact! conn
                 (recycle/recycle-page-tx-data @conn (d/entity @conn id) opts)
                 {:outliner-op :delete-page}))

;; Fails if, in `build-recycle-page-tx`, the `:block/name` key is dropped, the `:logseq.property/hide?` key is dropped or the `:logseq.property/built-in?` key is dropped.
(deftest recreated-recycle-page-is-named-hidden-and-built-in
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}}])
        page-id (:db/id (ldb/get-page @conn "page1"))]
    (d/transact! conn [[:db/retractEntity (:db/id (recycle-page @conn))]])
    (recycle-page! conn page-id {})
    (let [recycle (recycle-page @conn)]
      (is (= "recycle" (:block/name recycle)))
      (is (true? (:logseq.property/hide? recycle)))
      (is (true? (:logseq.property/built-in? recycle))))))

;; Fails if, in `deleted-by-id`, the body becomes `nil`, the `(#(d/entity db [:block/uuid %]))` step is dropped, the `:db/id` step is dropped or `:db/id` becomes `:db/retract`.
;; Fails if, in `recycle-blocks-tx-data`, the `:block/parent` key is dropped, the `:block/page` key is dropped or `:logseq.property/deleted-by-ref` becomes `:logseq.property/hide?`.
(deftest recycle-blocks-records-structure-and-original-refs
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "child"}]}]}
               {:page {:block/title "deleter"}}])
        page (ldb/get-page @conn "page1")
        deleter (ldb/get-page @conn "deleter")
        parent-id (find-id conn "parent")
        child-id (find-id conn "child")
        child-order (order-of conn child-id)]
    (recycle-block! conn child-id {:deleted-by-uuid (:block/uuid deleter) :now-ms 1234})
    (let [recycle (recycle-page @conn)
          child (d/entity @conn child-id)]
      (is (= (:db/id recycle) (:db/id (:block/parent child))))
      (is (= (:db/id recycle) (:db/id (:block/page child))))
      (is (some? (:block/order child)))
      (is (= 1234 (:logseq.property/deleted-at child)))
      (is (= (:db/id deleter) (:db/id (:logseq.property/deleted-by-ref child))))
      (is (= parent-id (:db/id (:logseq.property.recycle/original-parent child))))
      (is (= (:db/id page) (:db/id (:logseq.property.recycle/original-page child))))
      (is (= child-order (:logseq.property.recycle/original-order child))))))

;; Fails if, in `recycle-blocks-tx-data`, the `:block/order` key is dropped, the `:block/_parent` step is dropped, the `ldb/sort-by-order` step is dropped or the `last` step is dropped.
(deftest recycle-blocks-orders-after-last-recycled-block
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "b1"} {:block/title "b2"} {:block/title "b3"}]}])
        b1 (find-id conn "b1")
        b2 (find-id conn "b2")
        b3 (find-id conn "b3")]
    (recycle-block! conn b3 {})
    (let [o3 (order-of conn b3)]
      (recycle-block! conn b2 {})
      (is (= (next-order o3) (order-of conn b2)))
      (let [o2 (order-of conn b2)]
        (recycle-block! conn b1 {})
        (is (= (next-order o2) (order-of conn b1)))))))

;; Fails if, in `recycle-page-tx-data`, `:logseq.property/deleted-by-ref` becomes `:logseq.property/hide?`.
(deftest recycle-page-orders-after-last-recycled-page
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "p1"}}
               {:page {:block/title "p2"}}
               {:page {:block/title "deleter"}}])
        p1 (:db/id (ldb/get-page @conn "p1"))
        p2 (:db/id (ldb/get-page @conn "p2"))
        deleter (ldb/get-page @conn "deleter")]
    (recycle-page! conn p1 {})
    (let [o1 (order-of conn p1)]
      (recycle-page! conn p2 {:deleted-by-uuid (:block/uuid deleter)})
      (is (= (next-order o1) (order-of conn p2)))
      (is (= (:db/id deleter)
             (:db/id (:logseq.property/deleted-by-ref (d/entity @conn p2))))))))

;; Fails if, in `recycle-blocks-tx-data`, `:logseq.property.recycle/original-parent` becomes `:logseq.property.recycle/_original-parent` or `:block/parent` becomes `:block/tags`.
;; Fails if, in `restore-target`, the `:order` key is dropped or `:logseq.property.recycle/original-order` becomes `:logseq.property.recycle/original-page`.
;; Fails if, in `restore-tx-data`, the `[:db/retract (:db/id root) :logseq.pr...` tx entry is dropped, `:logseq.property/deleted-by-ref` becomes `:logseq.property/hide?` or `:block/page` becomes `:block/parent`.
(deftest restore-block-reuses-original-position-and-clears-recycle-properties
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "parent"
                          :build/children [{:block/title "c1"} {:block/title "c2"}]}]}
               {:page {:block/title "deleter"}}])
        page (ldb/get-page @conn "page1")
        deleter (ldb/get-page @conn "deleter")
        parent-id (find-id conn "parent")
        c1-id (find-id conn "c1")
        c1-order (order-of conn c1-id)
        c1-uuid (:block/uuid (d/entity @conn c1-id))]
    (recycle-block! conn c1-id {:deleted-by-uuid (:block/uuid deleter)})
    (is (true? (recycle/restore! conn c1-uuid)))
    (let [c1 (d/entity @conn c1-id)]
      (is (= parent-id (:db/id (:block/parent c1))))
      (is (= (:db/id page) (:db/id (:block/page c1))))
      (is (= c1-order (:block/order c1)))
      (is (nil? (:logseq.property/deleted-at c1)))
      (is (nil? (:logseq.property/deleted-by-ref c1)))
      (is (nil? (:logseq.property.recycle/original-page c1)))
      (is (nil? (:logseq.property.recycle/original-parent c1)))
      (is (nil? (:logseq.property.recycle/original-order c1))))))

;; Fails if, in `recycle-blocks-tx-data`, `:block/page` becomes `:block/parent`, the `:block/order` step is dropped or `:block/order` becomes `:block/page`.
;; Fails if, in `restore-order`, the body becomes `nil`.
;; Fails if, in `restore-target`, `:logseq.property.recycle/original-page` becomes `:logseq.property.recycle/original-parent`, `:db/id` becomes `:db/retract`, the `:parent` key is dropped, the `:page` key is dropped or the `:order` key is dropped.
(deftest restore-block-falls-back-to-original-page-when-parent-is-recycled
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "sibling"}
                         {:block/title "parent"
                          :build/children [{:block/title "c1"}]}]}])
        page-id (:db/id (ldb/get-page @conn "page1"))
        sibling-id (find-id conn "sibling")
        parent-id (find-id conn "parent")
        c1-id (find-id conn "c1")
        c1-uuid (:block/uuid (d/entity @conn c1-id))]
    (recycle-block! conn c1-id {})
    (recycle-block! conn parent-id {})
    (is (true? (recycle/restore! conn c1-uuid)))
    (let [c1 (d/entity @conn c1-id)]
      (is (= page-id (:db/id (:block/parent c1))))
      (is (= page-id (:db/id (:block/page c1))))
      (is (= (next-order (order-of conn sibling-id)) (:block/order c1))))))

(defn- create-namespace-pages!
  "Creates page `parent-title` with child pages from `child-titles`; returns their uuids in order."
  [conn parent-title child-titles]
  (let [child-uuids (mapv (fn [child-title]
                            (second (outliner-page/create! conn (str parent-title "/" child-title)
                                                           {:split-namespace? true})))
                          child-titles)
        parent-uuid (:block/uuid (:block/parent (d/entity @conn [:block/uuid (first child-uuids)])))]
    {:parent-uuid parent-uuid
     :child-uuids child-uuids}))

;; Fails if, in `awaiting-original-parent?`, `:db/id` becomes `:db/retract`.
;; Fails if, in `relink-waiting-children-tx`, the `[:db/retract (:db/id child) :logseq.p...` tx entry is dropped or `:logseq.property.recycle/original-page` becomes `:logseq.property.recycle/original-parent`.
(deftest restore-page-relinks-waiting-child-held-by-recycle-page
  (let [conn (db-test/create-conn)
        {:keys [parent-uuid child-uuids]} (create-namespace-pages! conn "Foo" ["Bar"])
        child-uuid (first child-uuids)
        child-id (:db/id (d/entity @conn [:block/uuid child-uuid]))
        parent-id (:db/id (d/entity @conn [:block/uuid parent-uuid]))]
    (recycle-page! conn child-id {})
    (recycle-page! conn parent-id {})
    (is (true? (recycle/restore! conn child-uuid)))
    (d/transact! conn [[:db/add child-id :block/parent (:db/id (recycle-page @conn))]
                       [:db/add child-id :logseq.property.recycle/original-page parent-id]])
    (is (true? (recycle/restore! conn parent-uuid)))
    (let [child (d/entity @conn child-id)]
      (is (= parent-id (:db/id (:block/parent child))))
      (is (nil? (:logseq.property.recycle/original-parent child)))
      (is (nil? (:logseq.property.recycle/original-page child))))))

;; Fails if, in `relink-waiting-children-tx`, the `ldb/sort-by-order` step is dropped.
(deftest restore-page-orders-waiting-child-after-last-sorted-child
  (let [conn (db-test/create-conn)
        {:keys [parent-uuid child-uuids]} (create-namespace-pages! conn "Foo" ["Bar" "Baz" "Qux"])
        [bar-uuid baz-uuid qux-uuid] child-uuids
        id-of (fn [u] (:db/id (d/entity @conn [:block/uuid u])))
        parent-id (id-of parent-uuid)
        bar-id (id-of bar-uuid)
        order-low (db-order/gen-key nil nil)
        order-high (next-order order-low)]
    (d/transact! conn [[:db/add (id-of baz-uuid) :block/order order-high]
                       [:db/add (id-of qux-uuid) :block/order order-low]])
    (recycle-page! conn bar-id {})
    (recycle-page! conn parent-id {})
    (is (true? (recycle/restore! conn bar-uuid)))
    (d/transact! conn [[:db/retract bar-id :logseq.property.recycle/original-order]])
    (is (true? (recycle/restore! conn parent-uuid)))
    (let [bar (d/entity @conn bar-id)]
      (is (= parent-id (:db/id (:block/parent bar))))
      (is (= (next-order order-high) (:block/order bar))))))

;; Fails if, in `restore!`, the `:outliner-op` key is dropped.
;; Fails if, in `permanently-delete!`, the `:outliner-op` key is dropped.
;; Fails if, in `gc-tx-data`, `:db/retractEntity` becomes `:db/add` or `:db/id` becomes `:db/retract`.
;; Fails if, in `gc!`, the `:outliner-op` key is dropped or the `:persist-op?` key is dropped.
(deftest restore-permanently-delete-and-gc-transact-with-outliner-op-meta
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "r1"} {:block/title "r2"} {:block/title "r3"}]}])
        ids (mapv #(find-id conn %) ["r1" "r2" "r3"])
        uuids (mapv #(:block/uuid (d/entity @conn %)) ids)]
    (doseq [id ids]
      (recycle-block! conn id {:now-ms 0}))
    (let [tx-metas (capture-tx-metas! conn)]
      (is (true? (recycle/restore! conn (nth uuids 0))))
      (is (true? (recycle/permanently-delete! conn (nth uuids 1))))
      (is (true? (recycle/gc! conn {:now-ms thirty-one-days-ms})))
      (is (= [:restore-recycled :recycle-delete-permanently :recycle-gc]
             (mapv :outliner-op @tx-metas)))
      (is (false? (:persist-op? (last @tx-metas)))))))

;; Fails if, in `permanently-delete-tx-data`, the `(with-delete-cleanup-tx db)` step is dropped.
;; Fails if, in `gc-tx-data`, the `(with-delete-cleanup-tx db)` step is dropped.
(deftest delete-tx-data-includes-property-history-cleanup
  ;; ldb/transact! adds the same cleanup itself, so only the tx-data shows it
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "target"}]}])
        target-id (find-id conn "target")
        history-uuid (random-uuid)
        now (common-util/time-ms)]
    (d/transact! conn [{:block/uuid history-uuid
                        :block/created-at now
                        :block/updated-at now
                        :logseq.property.history/block target-id
                        :logseq.property.history/property (:db/id (d/entity @conn :logseq.property/status))
                        :logseq.property.history/scalar-value "Todo"}])
    (recycle-block! conn target-id {:now-ms 0})
    (let [history-retract [:db/retractEntity (:db/id (d/entity @conn [:block/uuid history-uuid]))]
          permanent-tx-data (recycle/permanently-delete-tx-data @conn (d/entity @conn target-id))
          gc-tx-data (#'recycle/gc-tx-data @conn {:now-ms thirty-one-days-ms})]
      (is (some #{history-retract} permanent-tx-data))
      (is (some #{history-retract} gc-tx-data)))))

;; Fails if, in `page-descendants`, the `ldb/sort-by-order` step is dropped.
;; Fails if, in `page-block-subtree-ids`, the `ldb/sort-by-order` step is dropped or `:db/id` becomes `:db/retract`.
(deftest permanently-delete-tx-data-lists-pages-and-blocks-in-order
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "P"}
                :blocks [{:block/title "b1"} {:block/title "b2"}]}])
        page (ldb/get-page @conn "P")
        {:keys [child-uuids]} (create-namespace-pages! conn "P" ["C1" "C2"])
        [c1-uuid c2-uuid] child-uuids
        id-of (fn [u] (:db/id (d/entity @conn [:block/uuid u])))
        order-low (db-order/gen-key nil nil)
        order-high (next-order order-low)
        b1-id (find-id conn "b1")
        b2-id (find-id conn "b2")]
    (d/transact! conn [[:db/add (id-of c1-uuid) :block/order order-high]
                       [:db/add (id-of c2-uuid) :block/order order-low]
                       [:db/add b1-id :block/order order-high]
                       [:db/add b2-id :block/order order-low]])
    (recycle-page! conn (:db/id page) {})
    (let [tx-data (recycle/permanently-delete-tx-data @conn (d/entity @conn (:db/id page)))
          retracted-uuids (->> tx-data
                               (filter #(= :db/retractEntity (first %)))
                               (map (fn [[_ [_ block-uuid]]] block-uuid)))]
      (is (= [(:block/uuid page)
              (:block/uuid (d/entity @conn b2-id))
              (:block/uuid (d/entity @conn b1-id))
              c2-uuid
              c1-uuid]
             retracted-uuids)))))
