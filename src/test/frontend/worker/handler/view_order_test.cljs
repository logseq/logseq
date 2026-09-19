(ns frontend.worker.handler.view-order-test
  (:require [cljs.test :refer [deftest is]]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as undo-redo]
            [logseq.db :as ldb]
            [logseq.db.common.view :as db-view]
            [logseq.db.common.view-order :as view-order]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.property :as property]))

(defn- entity [db title] (db-test/find-page-by-title db title))
(defn- row-uuid [db title] (:block/uuid (entity db title)))

(defn- make-fixture
  [titles]
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "Rows"}
                :blocks (mapv (fn [title] {:block/title title}) titles)}
               {:page {:block/title "Destination"}
                :blocks [{:block/title "Target"}]}
               {:page {:block/title "Settings"}
                :blocks [{:block/title "Table"}]}])
        view (entity @conn "Table")
        sorting [{:id :block/title :asc? true}]]
    (d/transact! conn [{:db/id (:db/id view)
                        :logseq.property.view/feature-type :query-result
                        :logseq.property.view/type :logseq.property.view/type.table
                        :logseq.property.table/sorting sorting}])
    {:conn conn :view-uuid (:block/uuid view)
     :context {:feature-type :query-result :sorting sorting :input ""
               :query-row-uuids (mapv #(row-uuid @conn %) titles)}}))

(defn- options [db context]
  (assoc context :view-feature-type (:feature-type context)
         :query-entity-ids (mapv #(:db/id (d/entity db [:block/uuid %])) (:query-row-uuids context))))

(defn- rows
  [{:keys [conn view-uuid context]}]
  (let [db @conn
        view (d/entity db [:block/uuid view-uuid])
        result (:data (db-view/get-view-data db (:db/id view) (options db context)))
        uuids (fn [xs] (mapv #(:block/uuid (d/entity db %)) xs))]
    (if (:logseq.property.view/group-by-property view)
      (into {} (map (fn [[value xs]] [(view-order/group-value value) (uuids xs)])) result)
      {nil (uuids result)})))

(defn- drop-request
  [{:keys [conn view-uuid context] :as fixture} title group target-group anchor placement]
  {:context context :rows (rows fixture)
   :expected-order (:logseq.property.table/sort-order (d/entity @conn [:block/uuid view-uuid]))
   :row-uuid (row-uuid @conn title) :source-group group :target-group target-group
   :anchor-uuid (when anchor (row-uuid @conn anchor)) :placement placement})

(defn- drop!
  [{:keys [conn view-uuid]} request]
  (outliner-op/apply-ops! conn [[:reorder-view-rows [view-uuid request]]] {}))

(defn- titles [db uuids]
  (mapv #(:block/title (d/entity db [:block/uuid %])) uuids))

(defn- with-history!
  [conn f]
  (let [repo "table-order-history-test"
        Database (js/require "better-sqlite3")
        history-db (new Database ":memory:")
        previous-dbs @worker-state/*datascript-conns
        previous-history @worker-state/*client-ops-conns
        previous-apply @undo-redo/*apply-history-action!]
    (client-op/ensure-sqlite-schema! history-db)
    (swap! worker-state/*datascript-conns assoc repo conn)
    (swap! worker-state/*client-ops-conns assoc repo history-db)
    (reset! undo-redo/*apply-history-action! sync-apply/apply-history-action!)
    (d/listen! conn ::history #(sync-apply/enqueue-local-tx! repo %))
    (undo-redo/clear-history! repo)
    (try
      (f repo)
      (finally
        (d/unlisten! conn ::history)
        (undo-redo/clear-history! repo)
        (.close history-db)
        (reset! undo-redo/*apply-history-action! previous-apply)
        (reset! worker-state/*datascript-conns previous-dbs)
        (reset! worker-state/*client-ops-conns previous-history)))))

(deftest manual-order-syncs-and-undo-restores-column-sorting-test
  (let [{:keys [conn view-uuid] :as fixture} (make-fixture ["A" "B" "C"])
        other-client (d/conn-from-db @conn)
        before (rows fixture)]
    (with-history!
      conn
      (fn [repo]
        (drop! fixture (drop-request fixture "C" nil nil "A" :before))
        (let [pending (client-op/get-pending-local-txs repo)
              sorted (rows fixture)]
          (is (= 1 (count pending)))
          (is (some #(= :logseq.property.table/sort-order (nth % 2)) (:tx (first pending))))
          ;; Apply the serialized wire transaction to a second client.
          (ldb/transact! other-client (:tx (first pending)) {:transact-remote? true})
          (is (= sorted (rows (assoc fixture :conn other-client))))
          (undo-redo/undo repo)
          (is (= before (rows fixture)))
          (is (= [{:id :block/title :asc? true}]
                 (:logseq.property.table/sorting (d/entity @conn [:block/uuid view-uuid]))))
          (undo-redo/redo repo)
          (is (= sorted (rows fixture)))
          ;; Column preferences stay local; the shared order wins over them on redo too.
          (is (some? (:logseq.property.table/sort-order (d/entity @conn [:block/uuid view-uuid])))))))))

(deftest reorder-captures-sorting-and-persists-test
  (let [{:keys [conn view-uuid] :as fixture} (make-fixture ["A" "B" "C" "D"])
        sorting [{:id :block/updated-at :asc? false} {:id :block/title :asc? false}]
        _ (d/transact! conn (into [{:db/id (:db/id (entity @conn "Table"))
                                    :logseq.property.table/sorting sorting}]
                                  (map-indexed (fn [i title] {:db/id (:db/id (entity @conn title))
                                                              :block/updated-at i})
                                               ["A" "B" "C" "D"])))
        fixture (assoc-in fixture [:context :sorting] sorting)]
    (is (= ["D" "C" "B" "A"] (titles @conn (get (rows fixture) nil))))
    (drop! fixture (drop-request fixture "A" nil nil "C" :before))
    (is (= ["D" "A" "C" "B"] (titles @conn (get (rows fixture) nil))))
    (is (nil? (:logseq.property.table/sorting (d/entity @conn [:block/uuid view-uuid]))))
    (d/transact! conn [[:db/add (:db/id (entity @conn "B")) :block/updated-at 999]])
    (is (= ["D" "A" "C" "B"] (titles @conn (get (rows fixture) nil))))
    (let [reopened (d/conn-from-db (ldb/read-transit-str (ldb/write-transit-str @conn)))]
      (is (= (rows fixture) (rows (assoc fixture :conn reopened)))))))

(deftest reorder-keeps-filtered-out-rows-in-their-slots-test
  (let [{:keys [conn] :as fixture} (make-fixture ["A visible" "B hidden" "C visible" "D visible"])
        filtered (assoc-in fixture [:context :input] "visible")]
    (drop! filtered (drop-request filtered "D visible" nil nil "A visible" :before))
    (is (= ["D visible" "A visible" "C visible"] (titles @conn (get (rows filtered) nil))))
    (is (= ["D visible" "B hidden" "A visible" "C visible"] (titles @conn (get (rows fixture) nil))))))

(deftest no-op-and-stale-drops-do-not-transact-test
  (let [{:keys [conn] :as fixture} (make-fixture ["A" "B" "C"])
        changes (atom [])
        stale (drop-request fixture "C" nil nil "A" :before)]
    (d/listen! conn ::changes #(swap! changes conj %))
    (drop! fixture (drop-request fixture "A" nil nil "A" :before))
    (drop! fixture (drop-request fixture "C" nil nil nil :end))
    (is (empty? @changes))
    (drop! fixture (drop-request fixture "B" nil nil "A" :before))
    (is (= 1 (count @changes)))
    (let [before @conn]
      (is (thrown? js/Error (drop! fixture stale)))
      (is (= before @conn)))
    (d/unlisten! conn ::changes)))

(deftest new-rows-append-and-column-sort-clears-manual-order-test
  (let [{:keys [conn view-uuid] :as fixture} (make-fixture ["A" "B" "C"])]
    (drop! fixture (drop-request fixture "C" nil nil "A" :before))
    (let [expanded (update-in fixture [:context :query-row-uuids] conj (row-uuid @conn "Target"))]
      (is (= ["C" "A" "B" "Target"] (titles @conn (get (rows expanded) nil)))))
    (outliner-op/apply-ops! conn [[:remove-block-property [view-uuid :logseq.property.table/sort-order]]
                         [:set-block-property [view-uuid :logseq.property.table/sorting
                                               [{:id :block/title :asc? false}]]]] {})
    (is (= ["C" "B" "A"] (titles @conn (get (rows fixture) nil))))))

(defn- many-group-fixture []
  (let [{:keys [conn] :as fixture} (make-fixture ["A" "B" "C" "D"])
        property-ident :user.property/group
        rows-page (:db/id (entity @conn "Rows"))
        destination (:db/id (entity @conn "Destination"))
        settings (:db/id (entity @conn "Settings"))]
    (property/upsert-property! conn property-ident
                               {:logseq.property/type :node :db/cardinality :db.cardinality/many}
                               {:property-name "Group"})
    (d/transact! conn [{:db/id (:db/id (entity @conn "Table"))
                        :logseq.property.view/group-by-property property-ident}
                       {:db/id (:db/id (entity @conn "A")) property-ident [rows-page settings]}
                       {:db/id (:db/id (entity @conn "B")) property-ident [rows-page]}
                       {:db/id (:db/id (entity @conn "C")) property-ident [destination settings]}])
    (assoc-in fixture [:context :group-by-property-ident] property-ident)))

(defn- page-group [db title] {:kind :entity :uuid (row-uuid db title)})

(deftest repeated-rows-have-independent-positions-in-each-group-test
  (let [{:keys [conn] :as fixture} (many-group-fixture)
        source (page-group @conn "Rows")
        other (page-group @conn "Settings")]
    (drop! fixture (drop-request fixture "B" source source "A" :before))
    (is (= ["B" "A"] (titles @conn (get (rows fixture) source))))
    (is (= ["A" "C"] (titles @conn (get (rows fixture) other))))))

(deftest cross-group-moves-retain-other-values-and-empty-clears-all-test
  (let [{:keys [conn] :as fixture} (many-group-fixture)
        source (page-group @conn "Rows")
        destination (page-group @conn "Destination")
        other (page-group @conn "Settings")]
    (drop! fixture (drop-request fixture "A" source destination "C" :after))
    (is (= ["B"] (titles @conn (get (rows fixture) source))))
    (is (= ["C" "A"] (titles @conn (get (rows fixture) destination))))
    (is (= ["A" "C"] (titles @conn (get (rows fixture) other))))
    (is (= #{"Destination" "Settings"} (set (map :block/title (:user.property/group (entity @conn "A"))))))
    (drop! fixture (drop-request fixture "A" destination {:kind :empty} "D" :after))
    (is (nil? (:user.property/group (entity @conn "A"))))
    (is (= ["D" "A"] (titles @conn (get (rows fixture) {:kind :empty}))))))

(deftest group-drop-undo-restores-membership-and-independent-positions-test
  (let [{:keys [conn] :as fixture} (many-group-fixture)
        source (page-group @conn "Rows")
        destination (page-group @conn "Destination")
        before (rows fixture)]
    (with-history!
      conn
      (fn [repo]
        (drop! fixture (drop-request fixture "A" source destination "C" :after))
        (let [after (rows fixture)]
          (undo-redo/undo repo)
          (is (= before (rows fixture)))
          (is (= #{"Rows" "Settings"}
                 (set (map :block/title (:user.property/group (entity @conn "A"))))))
          (undo-redo/redo repo)
          (is (= after (rows fixture)))
          (is (= #{"Destination" "Settings"}
                 (set (map :block/title (:user.property/group (entity @conn "A")))))))))))

(deftest scalar-group-drops-use-the-property-type-test
  (doseq [[property-type source-value target-value] [[:number 1 2] [:checkbox false true]]]
    (let [{:keys [conn] :as fixture} (make-fixture ["A" "B" "C"])
          property-ident :user.property/group
          source {:kind :scalar :value source-value}
          target {:kind :scalar :value target-value}]
      (property/upsert-property! conn property-ident {:logseq.property/type property-type}
                                 {:property-name "Group"})
      (property/set-block-property! conn (:db/id (entity @conn "A")) property-ident source-value)
      (property/set-block-property! conn (:db/id (entity @conn "B")) property-ident target-value)
      (d/transact! conn [[:db/add (:db/id (entity @conn "Table"))
                           :logseq.property.view/group-by-property property-ident]])
      (let [grouped (assoc-in fixture [:context :group-by-property-ident] property-ident)]
        (drop! grouped (drop-request grouped "A" source target "B" :before))
        (is (= ["A" "B"] (titles @conn (get (rows grouped) target))))
        (is (nil? (get (rows grouped) source)))))))

(deftest manual-order-survives-layout-and-grouping-switches-test
  (let [{:keys [conn] :as fixture} (many-group-fixture)
        source (page-group @conn "Rows")
        view-id (:db/id (entity @conn "Table"))]
    (drop! fixture (drop-request fixture "B" source source "A" :before))
    (d/transact! conn [[:db/add view-id :logseq.property.view/type :logseq.property.view/type.gallery]])
    (is (= ["A" "B"] (titles @conn (get (rows fixture) source))))
    (d/transact! conn [[:db/add view-id :logseq.property.view/type :logseq.property.view/type.table]
                       [:db/retract view-id :logseq.property.view/group-by-property]])
    (is (= ["A" "B" "C" "D"]
           (titles @conn (get (rows (update fixture :context dissoc :group-by-property-ident)) nil))))
    (d/transact! conn [[:db/add view-id :logseq.property.view/group-by-property :user.property/group]])
    (is (= ["B" "A"] (titles @conn (get (rows fixture) source))))))

(deftest page-drop-moves-the-subtree-in-one-transaction-test
  (let [{:keys [conn] :as fixture} (make-fixture ["A" "B"])
        source (page-group @conn "Rows")
        destination (page-group @conn "Destination")
        child-uuid (random-uuid)
        _ (outliner-op/apply-ops! conn [[:insert-blocks [[{:block/title "Child" :block/uuid child-uuid}]
                                                (row-uuid @conn "A") {:sibling? false}]]] {})
        _ (d/transact! conn [[:db/add (:db/id (entity @conn "Table"))
                             :logseq.property.view/group-by-property :block/page]])
        fixture (-> fixture
                    (assoc-in [:context :group-by-property-ident] :block/page)
                    (update-in [:context :query-row-uuids] conj (row-uuid @conn "Target")))
        reports (atom [])]
    (d/listen! conn ::page-move #(swap! reports conj %))
    (with-history!
      conn
      (fn [repo]
        (drop! fixture (drop-request fixture "A" source destination "Target" :before))
        (is (= 1 (count @reports)))
        (is (= "Destination" (:block/title (:block/page (entity @conn "A")))))
        (is (= "Destination" (:block/title (:block/page (entity @conn "Child")))))
        (is (= (:db/id (entity @conn "A")) (:db/id (:block/parent (entity @conn "Child")))))
        (is (= ["A" "Target"] (titles @conn (get (rows fixture) destination))))
        (undo-redo/undo repo)
        (is (= "Rows" (:block/title (:block/page (entity @conn "A")))))
        (is (= "Rows" (:block/title (:block/page (entity @conn "Child")))))
        (is (= ["A" "B"] (titles @conn (get (rows fixture) source))))
        (undo-redo/redo repo)
        (is (= "Destination" (:block/title (:block/page (entity @conn "Child")))))
        (is (= ["A" "Target"] (titles @conn (get (rows fixture) destination))))))
    (d/unlisten! conn ::page-move)))

(deftest invalid-page-target-leaves-order-and-structure-unchanged-test
  (let [{:keys [conn] :as fixture} (make-fixture ["A" "B"])
        _ (d/transact! conn [[:db/add (:db/id (entity @conn "Table"))
                             :logseq.property.view/group-by-property :block/page]])
        fixture (-> fixture
                    (assoc-in [:context :group-by-property-ident] :block/page)
                    (update-in [:context :query-row-uuids] conj (row-uuid @conn "Destination")))
        before @conn]
    (is (thrown? js/Error (drop! fixture (drop-request fixture "A" (page-group @conn "Rows")
                                                 {:kind :empty} "Destination" :before))))
    (is (= before @conn))))
