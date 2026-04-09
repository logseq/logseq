(ns logseq.db-sync.worker-handler-sync-test
  (:require [cljs.test :refer [async deftest is testing]]
            [datascript.core :as d]
            [logseq.db-sync.checksum :as sync-checksum]
            [logseq.db-sync.common :as common]
            [logseq.db-sync.index :as index]
            [logseq.db-sync.protocol :as protocol]
            [logseq.db-sync.snapshot :as snapshot]
            [logseq.db-sync.storage :as storage]
            [logseq.db-sync.test-sql :as test-sql]
            [logseq.db-sync.worker.handler.sync :as sync-handler]
            [logseq.db-sync.worker.ws :as ws]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(defn- seeded-rng
  [seed0]
  (let [state (atom (bit-or (long seed0) 0))]
    (fn []
      (let [s (swap! state
                     (fn [x]
                       (let [x (bit-xor x (bit-shift-left x 13))
                             x (bit-xor x (bit-shift-right x 17))
                             x (bit-xor x (bit-shift-left x 5))]
                         (bit-or x 0))))]
        (/ (double (unsigned-bit-shift-right s 0)) 4294967296.0)))))

(defn- rand-int*
  [rng n]
  (js/Math.floor (* (rng) n)))

(defn- pick-rand
  [rng coll]
  (when (seq coll)
    (nth coll (rand-int* rng (count coll)))))

(defn- block-uuids-by-predicate
  [db pred]
  (->> (d/datoms db :avet :block/uuid)
       (map :e)
       distinct
       (keep (fn [eid]
               (let [ent (d/entity db eid)
                     uuid (:block/uuid ent)]
                 (when (and uuid (pred ent))
                   (str uuid)))))
       vec))

(defn- page-uuids
  [db]
  (block-uuids-by-predicate db #(some? (:block/name %))))

(defn- non-page-block-uuids
  [db]
  (block-uuids-by-predicate db #(nil? (:block/name %))))

(defn- all-block-uuids
  [db]
  (block-uuids-by-predicate db (constantly true)))

(defn- gen-server-tx-entry
  [rng db step]
  (let [page-ids (page-uuids db)
        block-ids (non-page-block-uuids db)
        all-ids (all-block-uuids db)
        op (rand-int* rng 6)]
    (case op
      ;; Explicit empty rebase no-op
      0 {:tx (protocol/tx->transit [])
         :outliner-op :rebase}

      ;; stale retract in :fix should be sanitized away (often no-op)
      1 {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid (random-uuid)]]])
         :outliner-op :fix}

      ;; update title
      2 (if-let [target-id (pick-rand rng all-ids)]
          {:tx (protocol/tx->transit [[:db/add [:block/uuid (uuid target-id)]
                                      :block/title
                                      (str "server-fuzz-title-" step)]])
           :outliner-op :save-block}
          {:tx (protocol/tx->transit [])
           :outliner-op :rebase})

      ;; move block parent/page
      3 (if (and (seq block-ids) (seq page-ids))
          (let [child (pick-rand rng block-ids)
                parent (or (pick-rand rng block-ids)
                           child)
                page (pick-rand rng page-ids)]
            {:tx (protocol/tx->transit [[:db/add [:block/uuid (uuid child)]
                                        :block/parent
                                        [:block/uuid (uuid parent)]]
                                       [:db/add [:block/uuid (uuid child)]
                                        :block/page
                                        [:block/uuid (uuid page)]]])
             :outliner-op :move-blocks})
          {:tx (protocol/tx->transit [])
           :outliner-op :rebase})

      ;; add block
      4 (if (seq page-ids)
          (let [page (pick-rand rng page-ids)
                parent (or (pick-rand rng block-ids)
                           page)
                new-uuid (random-uuid)]
            {:tx (protocol/tx->transit [{:db/id -1
                                         :block/uuid new-uuid
                                         :block/title (str "server-fuzz-add-" step)
                                         :block/order (str "a" (rand-int* rng 9))
                                         :block/parent [:block/uuid (uuid parent)]
                                         :block/page [:block/uuid (uuid page)]}])
             :outliner-op :insert-blocks})
          {:tx (protocol/tx->transit [])
           :outliner-op :rebase})

      ;; delete non-page block
      (if-let [victim (pick-rand rng block-ids)]
        {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid (uuid victim)]]])
         :outliner-op :delete-blocks}
        {:tx (protocol/tx->transit [])
         :outliner-op :rebase}))))

(defn- empty-sql []
  #js {:exec (fn [& _] #js [])})

(defn- make-server-self
  []
  (let [sql (test-sql/make-sql)
        conn (storage/open-conn sql)
        self #js {:sql sql
                  :conn conn
                  :schema-ready true}]
    {:sql sql
     :conn conn
     :self self}))

(defn- apply-entries!
  [^js self entries]
  (loop [t-before (storage/get-t (.-sql self))
         remaining entries]
    (if-let [entry (first remaining)]
      (let [response (with-redefs [ws/broadcast! (fn [& _] nil)]
                       (sync-handler/handle-tx-batch! self nil [entry] t-before))]
        (is (= "tx/batch/ok" (:type response)))
        (recur (:t response) (next remaining)))
      t-before)))

(defn- apply-batch-with-t!
  [^js self t-before entries]
  (with-redefs [ws/broadcast! (fn [& _] nil)]
    (sync-handler/handle-tx-batch! self nil entries t-before)))

(defn- assert-server-checksum-step!
  [sql conn prev-t prev-checksum response label]
  (let [stored-checksum (storage/get-checksum sql)
        recomputed-checksum (sync-checksum/recompute-checksum @conn)
        new-t (storage/get-t sql)
        accepted? (= "tx/batch/ok" (:type response))
        advanced? (> new-t prev-t)]
    (is (= new-t (:t response))
        (str label " response.t should match storage t"))
    (if accepted?
      (if advanced?
        (do
          (is (string? stored-checksum)
              (str label " stored checksum missing after mutation"))
          (is (= recomputed-checksum stored-checksum)
              (str label " stored checksum should equal full recompute")))
        (is (= prev-checksum stored-checksum)
            (str label " checksum changed on no-op accepted batch")))
      (do
        (is (= "tx/reject" (:type response))
            (str label " expected tx rejection"))
        (is (= prev-t new-t)
            (str label " rejected tx should not change t"))
        (is (= prev-checksum stored-checksum)
            (str label " rejected tx should not change checksum"))))
    {:accepted? accepted?
     :advanced? advanced?
     :t new-t
     :checksum stored-checksum}))

(defn- block-placement
  [db block-uuid]
  (let [ent (d/pull db [{:block/parent [:block/uuid :block/name]}
                        {:block/page [:block/uuid :block/name]}
                        :block/order]
                    [:block/uuid block-uuid])]
    {:parent-uuid (get-in ent [:block/parent :block/uuid])
     :parent-page? (boolean (get-in ent [:block/parent :block/name]))
     :page-uuid (get-in ent [:block/page :block/uuid])
     :order (:block/order ent)}))

(defn- no-op-rebase-entry
  []
  {:tx (protocol/tx->transit [])
   :outliner-op :rebase})

(defn- tx-entry-appliable?
  [db {:keys [tx]}]
  (try
    (d/with db (protocol/transit->tx tx))
    true
    (catch :default _
      false)))

(defn- tx-entries-appliable?
  [db entries]
  (every? (partial tx-entry-appliable? db) entries))

(defn- make-insert-command
  [rng db step]
  (let [pages (page-uuids db)
        blocks (non-page-block-uuids db)]
    (if-let [page-id (pick-rand rng pages)]
      (let [parent-id (or (pick-rand rng blocks) page-id)
            new-uuid (random-uuid)
            entry {:tx (protocol/tx->transit [{:db/id -1
                                               :block/uuid new-uuid
                                               :block/title (str "rand-insert-" step)
                                               :block/order (str "a" step "-" (rand-int* rng 9))
                                               :block/parent [:block/uuid (uuid parent-id)]
                                               :block/page [:block/uuid (uuid page-id)]}])
                   :outliner-op :insert-blocks}
            inverse {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid new-uuid]]])
                     :outliner-op :delete-blocks}]
        {:forward [entry]
         :inverse [inverse]
         :undoable? true})
      {:forward [(no-op-rebase-entry)]
       :undoable? false})))

(defn- make-title-command
  [rng db step]
  (if-let [target-id (pick-rand rng (all-block-uuids db))]
    (let [target-uuid (uuid target-id)
          old-title (or (:block/title (d/pull db [:block/title] [:block/uuid target-uuid])) "")
          new-title (str "rand-title-" step)]
      {:forward [{:tx (protocol/tx->transit [[:db/add [:block/uuid target-uuid]
                                             :block/title
                                             new-title]])
                  :outliner-op :save-block}]
       :inverse [{:tx (protocol/tx->transit [[:db/add [:block/uuid target-uuid]
                                             :block/title
                                             old-title]])
                  :outliner-op :save-block}]
       :undoable? true})
    {:forward [(no-op-rebase-entry)]
     :undoable? false}))

(defn- make-move-like-command
  [db target-id new-parent-id new-page-id new-order outliner-op]
  (let [target-uuid (uuid target-id)
        placement (block-placement db target-uuid)]
    (if (and (:parent-uuid placement) (:page-uuid placement))
      {:forward [{:tx (protocol/tx->transit [[:db/add [:block/uuid target-uuid]
                                             :block/parent
                                             [:block/uuid (uuid new-parent-id)]]
                                            [:db/add [:block/uuid target-uuid]
                                             :block/page
                                             [:block/uuid (uuid new-page-id)]]
                                            [:db/add [:block/uuid target-uuid]
                                             :block/order
                                             new-order]])
                  :outliner-op outliner-op}]
       :inverse [{:tx (protocol/tx->transit [[:db/add [:block/uuid target-uuid]
                                             :block/parent
                                             [:block/uuid (:parent-uuid placement)]]
                                            [:db/add [:block/uuid target-uuid]
                                             :block/page
                                             [:block/uuid (:page-uuid placement)]]
                                            [:db/add [:block/uuid target-uuid]
                                             :block/order
                                             (:order placement)]])
                  :outliner-op outliner-op}]
       :undoable? true}
      {:forward [(no-op-rebase-entry)]
       :undoable? false})))

(defn- make-random-move-command
  [rng db step]
  (let [blocks (non-page-block-uuids db)
        pages (page-uuids db)]
    (if (and (seq blocks) (seq pages))
      (let [target-id (pick-rand rng blocks)
            parent-candidates (vec (remove #{target-id} (concat blocks pages)))
            parent-id (or (pick-rand rng parent-candidates) (pick-rand rng pages))
            page-id (pick-rand rng pages)]
        (make-move-like-command db target-id parent-id page-id (str "m" step) :move-blocks))
      {:forward [(no-op-rebase-entry)]
       :undoable? false})))

(defn- make-random-indent-command
  [rng db step]
  (let [blocks (non-page-block-uuids db)
        pages (page-uuids db)]
    (if (and (seq blocks) (seq pages))
      (let [child-id (pick-rand rng blocks)
            parent-candidates (vec (remove #{child-id} blocks))
            parent-id (or (pick-rand rng parent-candidates)
                          (pick-rand rng pages))
            page-id (pick-rand rng pages)]
        (make-move-like-command db child-id parent-id page-id (str "i" step) :indent-blocks))
      {:forward [(no-op-rebase-entry)]
       :undoable? false})))

(defn- make-random-outdent-command
  [rng db step]
  (let [candidates (->> (non-page-block-uuids db)
                        (keep (fn [block-id]
                                (let [placement (block-placement db (uuid block-id))]
                                  (when (and (:parent-uuid placement)
                                             (not (:parent-page? placement))
                                             (:page-uuid placement))
                                    block-id))))
                        vec)]
    (if-let [child-id (pick-rand rng candidates)]
      (let [child-uuid (uuid child-id)
            placement (block-placement db child-uuid)
            parent-placement (block-placement db (:parent-uuid placement))]
        (if-let [grandparent-uuid (:parent-uuid parent-placement)]
          (make-move-like-command db child-id (str grandparent-uuid) (str (:page-uuid placement)) (str "o" step "-" (rand-int* rng 9)) :outdent-blocks)
          {:forward [(no-op-rebase-entry)]
           :undoable? false}))
      {:forward [(no-op-rebase-entry)]
       :undoable? false})))

(defn- make-random-delete-entry
  [rng db]
  (if-let [victim-id (pick-rand rng (non-page-block-uuids db))]
    {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid (uuid victim-id)]]])
     :outliner-op :delete-blocks}
    (no-op-rebase-entry)))

(defn- make-stale-add-after-delete-conflict
  [rng db step]
  (let [blocks (non-page-block-uuids db)
        pages (page-uuids db)]
    (when (and (seq blocks) (seq pages))
      (let [victim-id (pick-rand rng blocks)
            page-id (pick-rand rng pages)
            stale-child-uuid (random-uuid)]
        {:delete-entry {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid (uuid victim-id)]]])
                        :outliner-op :delete-blocks}
         :stale-add-entry {:tx (protocol/tx->transit [{:db/id -1
                                                       :block/uuid stale-child-uuid
                                                       :block/title (str "stale-child-" step)
                                                       :block/order (str "c" step)
                                                       :block/parent [:block/uuid (uuid victim-id)]
                                                       :block/page [:block/uuid (uuid page-id)]}])
                           :outliner-op :insert-blocks}}))))

(defn- request-url
  ([]
   (request-url "/sync/graph-1/snapshot/download?graph-id=graph-1"))
  ([path]
   (let [request (js/Request. (str "http://localhost" path)
                              #js {:method "GET"})]
     {:request request
      :url (js/URL. (.-url request))})))

(defn- passthrough-compression-stream-constructor []
  (js* "function(_format){ return new TransformStream(); }"))

(deftest snapshot-download-uses-gzip-encoding-when-compression-supported-test
  (async done
         (let [sql (empty-sql)
               conn (d/create-conn db-schema/schema)
               self #js {:env #js {}
                         :conn conn
                         :schema-ready true
                         :sql sql}
               {:keys [request url]} (request-url)
               expected-url "http://localhost/sync/graph-1/snapshot/stream"
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (aset js/globalThis
                 "CompressionStream"
                 (passthrough-compression-stream-constructor))
           (-> (p/let [resp (sync-handler/handle {:self self
                                                  :request request
                                                  :url url
                                                  :route {:handler :sync/snapshot-download}})
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                 (is (= 200 (.-status resp)))
                 (is (= true (:ok body)))
                 (is (= "stream/graph-1.snapshot" (:key body)))
                 (is (= expected-url (:url body)))
                 (is (= "gzip" (:content-encoding body))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-omits-gzip-encoding-when-disabled-in-env-test
  (async done
         (let [sql (empty-sql)
               conn (d/create-conn db-schema/schema)
               self #js {:env #js {"DB_SYNC_SNAPSHOT_STREAM_GZIP" "false"}
                         :conn conn
                         :schema-ready true
                         :sql sql}
               {:keys [request url]} (request-url)]
           (-> (p/let [resp (sync-handler/handle {:self self
                                                  :request request
                                                  :url url
                                                  :route {:handler :sync/snapshot-download}})
                       text (.text resp)
                       body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                 (is (= 200 (.-status resp)))
                 (is (= true (:ok body)))
                 (is (not (contains? body :content-encoding)))
                 (done))
               (p/then (fn []
                         nil))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-stream-route-returns-framed-kvs-rows-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               sql (empty-sql)
               conn (d/create-conn db-schema/schema)
               self #js {:env #js {}
                         :conn conn
                         :schema-ready true
                         :sql sql}
               {:keys [request]} (request-url "/sync/graph-1/snapshot/stream?graph-id=graph-1")
               original-compression-stream (.-CompressionStream js/globalThis)
               restore! #(aset js/globalThis "CompressionStream" original-compression-stream)]
           (aset js/globalThis
                 "CompressionStream"
                 (passthrough-compression-stream-constructor))
           (-> (p/with-redefs [sync-handler/fetch-snapshot-kvs-rows (fn [_sql last-addr _limit]
                                                                      (if (neg? last-addr) rows []))
                               sync-handler/snapshot-row-count (fn [_sql] (count rows))]
                 (p/let [resp (sync-handler/handle-http self request)
                       encoding (.get (.-headers resp) "content-encoding")
                       content-type (.get (.-headers resp) "content-type")
                       buf (.arrayBuffer resp)
                       payload (js/Uint8Array. buf)
                       rows (snapshot/finalize-framed-buffer payload)
                       addrs (mapv first rows)]
                 (is (= 200 (.-status resp)))
                 (is (= "gzip" encoding))
                 (is (= "application/transit+json" content-type))
                 (is (= 2 (count rows)))
                 (is (= (sort addrs) addrs))
                 (is (every? (fn [[addr content _addresses]]
                               (and (int? addr)
                                    (string? content)))
                             rows))
                 (is (= [[1 "row-1" nil]
                         [2 "row-2" nil]]
                        rows))))
               (p/then (fn []
                         (restore!)
                         (done)))
               (p/catch (fn [error]
                          (restore!)
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-stream-route-returns-uncompressed-framed-kvs-rows-when-disabled-in-env-test
  (async done
         (let [rows [[1 "row-1" nil]
                     [2 "row-2" nil]]
               sql (empty-sql)
               conn (d/create-conn db-schema/schema)
               self #js {:env #js {"DB_SYNC_SNAPSHOT_STREAM_GZIP" "false"}
                         :conn conn
                         :schema-ready true
                         :sql sql}
               {:keys [request]} (request-url "/sync/graph-1/snapshot/stream?graph-id=graph-1")]
           (-> (p/with-redefs [sync-handler/fetch-snapshot-kvs-rows (fn [_sql last-addr _limit]
                                                                      (if (neg? last-addr) rows []))
                               sync-handler/snapshot-row-count (fn [_sql] (count rows))]
                 (p/let [resp (sync-handler/handle-http self request)
                         encoding (.get (.-headers resp) "content-encoding")
                         content-type (.get (.-headers resp) "content-type")
                         buf (.arrayBuffer resp)
                         payload (js/Uint8Array. buf)
                         rows (snapshot/finalize-framed-buffer payload)
                         addrs (mapv first rows)]
                   (is (= 200 (.-status resp)))
                   (is (nil? encoding))
                   (is (= "application/transit+json" content-type))
                   (is (= 2 (count rows)))
                   (is (= (sort addrs) addrs))
                   (is (= [[1 "row-1" nil]
                           [2 "row-2" nil]]
                          rows))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest ensure-schema-fallback-probes-existing-tables-test
  (async done
         (let [self #js {:sql (empty-sql)}
               schema-probes (atom [])
               {:keys [request url]} (request-url "/sync/graph-1/pull?graph-id=graph-1&since=0")]
           (-> (p/with-redefs [storage/init-schema! (fn [_]
                                                      (throw (js/Error. "ddl rejected")))
                               common/sql-exec (fn [_ sql-str & _args]
                                                 (swap! schema-probes conj sql-str)
                                                 #js [])
                               storage/fetch-tx-since (fn [_ _] [])
                               storage/get-t (fn [_] 7)
                               sync-handler/current-checksum (fn [_] "checksum-ok")]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/pull}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)
                         probe-set (set @schema-probes)]
                   (is (= 200 (.-status resp)))
                   (is (= 7 (:t body)))
                   (is (= "checksum-ok" (:checksum body)))
                   (is (contains? probe-set "select 1 from kvs limit 1"))
                   (is (contains? probe-set "select 1 from tx_log limit 1"))
                   (is (contains? probe-set "select 1 from sync_meta limit 1"))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest tx-batch-rejects-stale-lookup-entity-updates-test
  (testing "stale lookup-ref entity updates reject the tx batch"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          missing-uuid (random-uuid)
          created-uuid (random-uuid)
          tx-data [[:db/add [:block/uuid missing-uuid] :block/title "stale" 1]
                   [:db/add [:block/uuid missing-uuid] :block/updated-at 1773188050934 1]
                   [:db/add "temp-1" :block/uuid created-uuid 2]
                   [:db/add "temp-1" :block/title "ok" 2]]
          tx-entry {:tx (protocol/tx->transit tx-data)
                    :outliner-op :save-block}
          response (with-redefs [ws/broadcast! (fn [& _] nil)]
                     (sync-handler/handle-tx-batch! self nil [tx-entry] 0))]
      (is (= "tx/reject" (:type response)))
      (is (= "db transact failed" (:reason response)))
      (is (= 0 (:t response)))
      (is (nil? (d/entity @conn [:block/uuid created-uuid])))
      (is (nil? (d/entity @conn [:block/uuid missing-uuid])))
      (let [pull-response (sync-handler/pull-response self 0)]
        (is (= "pull/ok" (:type pull-response)))
        (is (empty? (:txs pull-response)))))))

(deftest tx-batch-rejects-while-snapshot-upload-is-in-progress-test
  (let [sql (test-sql/make-sql)
        conn (d/create-conn db-schema/schema)
        self #js {:sql sql
                  :conn conn
                  :schema-ready true}
        tx-data [[:db/add -1 :block/title "blocked"]]
        tx-entry {:tx (protocol/tx->transit tx-data)
                  :outliner-op :save-block}
        response (with-redefs [storage/get-meta (fn [_ k]
                                                  (when (= :snapshot-uploading? k)
                                                    "true"))]
                   (sync-handler/handle-tx-batch! self nil [tx-entry] 0))]
    (is (= "tx/reject" (:type response)))
    (is (= "snapshot upload in progress" (:reason response)))))

(deftest finished-snapshot-upload-persists-provided-checksum-test
  (async done
         (let [sql (test-sql/make-sql)
               checksum "1be70518babe8784"
               conn (d/create-conn db-schema/schema)
               self #js {:sql sql
                         :conn conn
                         :schema-ready true
                         :env #js {"DB" nil}}
               request (js/Request. (str "http://localhost/sync/graph-1/snapshot/upload?graph-id=graph-1&finished=true&checksum=" checksum)
                                    #js {:method "POST"
                                         :body (js/Uint8Array. 0)})]
           (d/transact! conn [{:block/uuid (random-uuid)
                               :block/title "uploaded"}])
           (is (nil? (storage/get-checksum sql)))
           (-> (p/with-redefs [sync-handler/import-snapshot-stream! (fn [_self _stream _reset?]
                                                                      (p/resolved 0))
                               sync-handler/<set-graph-ready-for-use! (fn [_self _graph-id _graph-ready-for-use?]
                                                                        (p/resolved true))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url (js/URL. (.-url request))
                                                    :route {:handler :sync/snapshot-upload}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 200 (.-status resp)))
                   (is (= {:ok true :count 0} body))
                   (is (= checksum (storage/get-checksum sql)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest tx-batch-rejects-when-a-tx-entry-fails-test
  (testing "db transact failure rejects the batch"
    (let [sql (test-sql/make-sql)
          conn (d/create-conn db-schema/schema)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          tx-entry-1 {:tx (protocol/tx->transit [[:db/add -1 :block/title "ok"]])
                      :outliner-op :save-block}
          tx-entry-2 {:tx (protocol/tx->transit [[:db/add -2 :block/title "bad"]])
                      :outliner-op :save-block}
          apply-calls (atom 0)
          response (with-redefs [ws/broadcast! (fn [& _] nil)
                                 sync-handler/apply-tx-entry! (fn [_conn tx-entry]
                                                                (swap! apply-calls inc)
                                                                (when (= 2 @apply-calls)
                                                                  (throw (ex-info "DB write failed with invalid data"
                                                                                  {:tx-entry tx-entry}))))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry-1 tx-entry-2] 0))]
      (is (= "tx/reject" (:type response)))
      (is (= "db transact failed" (:reason response)))
      (is (= 0 (:t response)))
      (is (nil? (:data response)))
      (is (= 2 @apply-calls)))))

(deftest tx-batch-reject-includes-success-and-failed-tx-ids-test
  (testing "partial failure returns success and failed tx ids and broadcasts changed once"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          success-tx-id (random-uuid)
          failed-tx-id (random-uuid)
          success-block-uuid (random-uuid)
          missing-uuid (random-uuid)
          tx-entry-1 {:tx-id success-tx-id
                      :tx (protocol/tx->transit [{:db/id -1
                                                  :block/uuid success-block-uuid
                                                  :block/title "ok"}])
                      :outliner-op :save-block}
          tx-entry-2 {:tx-id failed-tx-id
                      :tx (protocol/tx->transit [[:db/add [:block/uuid missing-uuid] :block/title "stale" 1]])
                      :outliner-op :save-block}
          changed-messages (atom [])
          response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                                 (swap! changed-messages conj payload))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry-1 tx-entry-2] 0))]
      (is (= "tx/reject" (:type response)))
      (is (= "db transact failed" (:reason response)))
      (is (= 1 (:t response)))
      (is (= [success-tx-id] (:success-tx-ids response)))
      (is (= failed-tx-id (:failed-tx-id response)))
      (is (= [{:type "changed" :t 1}] @changed-messages))
      (is (some? (d/entity @conn [:block/uuid success-block-uuid])))
      (is (nil? (d/entity @conn [:block/uuid missing-uuid]))))))

(deftest tx-batch-ignores-empty-rebase-entry-test
  (testing "empty rebase entry is a no-op: no t increment, no tx-log append, no changed broadcast"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          t-before (storage/get-t sql)
          tx-entry {:tx (protocol/tx->transit [])
                    :outliner-op :rebase}
          changed-messages (atom [])
          response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                                 (swap! changed-messages conj payload))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry] t-before))]
      (is (= "tx/batch/ok" (:type response)))
      (is (= t-before (:t response)))
      (is (empty? (storage/fetch-tx-since sql t-before)))
      (is (empty? @changed-messages)))))

(deftest tx-batch-mixed-empty-rebase-and-real-entry-test
  (testing "empty rebase entry is ignored while real tx still applies"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          t-before (storage/get-t sql)
          noop-rebase-entry {:tx (protocol/tx->transit [])
                             :outliner-op :rebase}
          block-uuid (random-uuid)
          real-entry {:tx (protocol/tx->transit [[:db/add -1 :block/uuid block-uuid]
                                                 [:db/add -1 :block/title "applied"]])
                      :outliner-op :save-block}
          changed-messages (atom [])
          response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                                 (swap! changed-messages conj payload))]
                     (sync-handler/handle-tx-batch! self nil [noop-rebase-entry real-entry] t-before))
          txs (storage/fetch-tx-since sql t-before)]
      (is (= "tx/batch/ok" (:type response)))
      (is (= (inc t-before) (:t response)))
      (is (= 1 (count txs)))
      (is (= :save-block (:outliner-op (first txs))))
      (is (= [{:type "changed" :t (inc t-before)}] @changed-messages)))))

(deftest tx-batch-ignores-stale-rebase-with-missing-lookup-entity-test
  (testing "stale rebase lookup refs to missing entities are treated as no-op"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          page-uuid (random-uuid)
          parent-uuid (random-uuid)
          missing-block-uuid (random-uuid)
          _ (d/transact! conn [{:block/uuid page-uuid
                                :block/name "rebase-stale-page"
                                :block/title "rebase-stale-page"}
                               {:block/uuid parent-uuid
                                :block/title "existing-parent"
                                :block/order "a0"
                                :block/parent [:block/uuid page-uuid]
                                :block/page [:block/uuid page-uuid]}])
          t-before (storage/get-t sql)
          checksum-before (storage/get-checksum sql)
          tx-entry {:tx (protocol/tx->transit
                         [[:db/retract [:block/uuid missing-block-uuid]
                           :block/parent
                           [:block/uuid page-uuid]
                           536882158]
                          [:db/add [:block/uuid missing-block-uuid]
                           :block/parent
                           [:block/uuid parent-uuid]
                           536882158]
                          [:db/retract [:block/uuid missing-block-uuid]
                           :block/order
                           "a100001V"
                           536882158]
                          [:db/add [:block/uuid missing-block-uuid]
                           :block/order
                           "a0"
                           536882158]])
                    :outliner-op :rebase}
          changed-messages (atom [])
          response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                                 (swap! changed-messages conj payload))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry] t-before))]
      (is (= "tx/batch/ok" (:type response)))
      (is (= t-before (:t response)))
      (is (= checksum-before (storage/get-checksum sql)))
      (is (empty? (storage/fetch-tx-since sql t-before)))
      (is (empty? @changed-messages)))))

(deftest tx-batch-ignores-stale-fix-with-missing-lookup-entity-test
  (testing "stale fix lookup refs to missing entities are treated as no-op"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          page-uuid (random-uuid)
          sibling-uuid (random-uuid)
          missing-block-uuid (random-uuid)
          _ (d/transact! conn [{:block/uuid page-uuid
                                :block/name "fix-stale-page"
                                :block/title "fix-stale-page"}
                               {:block/uuid sibling-uuid
                                :block/title "existing-sibling"
                                :block/order "a5Uzl"
                                :block/parent [:block/uuid page-uuid]
                                :block/page [:block/uuid page-uuid]}])
          t-before (storage/get-t sql)
          checksum-before (storage/get-checksum sql)
          tx-entry {:tx (protocol/tx->transit
                         [[:db/retract [:block/uuid missing-block-uuid]
                           :block/order
                           "a5Uzl"
                           536871101]
                          [:db/add [:block/uuid missing-block-uuid]
                           :block/order
                           "a5c"
                           536871101]
                          [:db/retract [:block/uuid sibling-uuid]
                           :block/order
                           "a5Uzl"
                           536871101]
                          [:db/add [:block/uuid sibling-uuid]
                           :block/order
                           "a5k"
                           536871101]])
                    :outliner-op :fix}
          changed-messages (atom [])
          response (with-redefs [ws/broadcast! (fn [_self _sender payload]
                                                 (swap! changed-messages conj payload))]
                     (sync-handler/handle-tx-batch! self nil [tx-entry] t-before))]
      (is (= "tx/batch/ok" (:type response)))
      (is (= t-before (:t response)))
      (is (= checksum-before (storage/get-checksum sql)))
      (is (empty? (storage/fetch-tx-since sql t-before)))
      (is (empty? @changed-messages)))))

(deftest server-incremental-checksum-matches-full-recompute-fuzz-test
  (testing "server stored checksum stays equal to full recompute across randomized tx/rebase/no-op sequences"
    (doseq [seed (range 1 11)]
      (let [sql (test-sql/make-sql)
            conn (storage/open-conn sql)
            self #js {:sql sql
                      :conn conn
                      :schema-ready true}
            page-uuid (random-uuid)
            root-block-uuid (random-uuid)
            _ (d/transact! conn [{:block/uuid page-uuid
                                  :block/name (str "server-fuzz-page-" seed)
                                  :block/title (str "server-fuzz-page-" seed)}
                                 {:block/uuid root-block-uuid
                                  :block/title (str "server-fuzz-root-" seed)
                                  :block/order "a0"
                                  :block/parent [:block/uuid page-uuid]
                                  :block/page [:block/uuid page-uuid]}])
            rng (seeded-rng seed)]
        (loop [step 0
               prev-t (storage/get-t sql)
               prev-checksum (storage/get-checksum sql)]
          (when (< step 60)
            (let [entry (gen-server-tx-entry rng @conn step)
                  response (with-redefs [ws/broadcast! (fn [& _] nil)]
                             (sync-handler/handle-tx-batch! self nil [entry] prev-t))
                  new-t (:t response)
                  stored-checksum (storage/get-checksum sql)
                  recomputed-checksum (sync-checksum/recompute-checksum @conn)]
              (is (= "tx/batch/ok" (:type response))
                  (str "expected tx/batch/ok at seed " seed " step " step))
              (is (= new-t (storage/get-t sql))
                  (str "t mismatch at seed " seed " step " step))
              (if (> new-t prev-t)
                (do
                  (is (string? stored-checksum)
                      (str "stored checksum missing after mutation at seed " seed " step " step))
                  (is (= recomputed-checksum stored-checksum)
                      (str "checksum mismatch at seed " seed " step " step
                           " recomputed=" recomputed-checksum
                           " stored=" stored-checksum)))
                (is (= prev-checksum stored-checksum)
                    (str "checksum changed on no-op batch at seed " seed " step " step)))
              (recur (inc step) new-t stored-checksum))))))))

(deftest server-checksum-is-invariant-across-commuting-batch-order-test
  (testing "server checksum converges when commuting tx entries are applied in opposite order"
    (let [page-uuid (random-uuid)
          block-a-uuid (random-uuid)
          block-b-uuid (random-uuid)
          seed-db! (fn [conn]
                     (d/transact! conn [{:block/uuid page-uuid
                                         :block/name "server-order-page"
                                         :block/title "server-order-page"}
                                        {:block/uuid block-a-uuid
                                         :block/title "A0"
                                         :block/order "a0"
                                         :block/page [:block/uuid page-uuid]
                                         :block/parent [:block/uuid page-uuid]}
                                        {:block/uuid block-b-uuid
                                         :block/title "B0"
                                         :block/order "a1"
                                         :block/page [:block/uuid page-uuid]
                                         :block/parent [:block/uuid page-uuid]}]))
          entry-a {:tx (protocol/tx->transit [[:db/add [:block/uuid block-a-uuid]
                                               :block/title
                                               "A1"]])
                   :outliner-op :save-block}
          entry-b {:tx (protocol/tx->transit [[:db/add [:block/uuid block-b-uuid]
                                               :block/order
                                               "a9"]])
                   :outliner-op :save-block}
          {:keys [self conn sql]} (make-server-self)
          _ (seed-db! conn)
          _ (apply-entries! self [entry-a entry-b])
          checksum-ab (storage/get-checksum sql)
          recompute-ab (sync-checksum/recompute-checksum @conn)
          pull-ab [(d/pull @conn [:block/title :block/order] [:block/uuid block-a-uuid])
                   (d/pull @conn [:block/title :block/order] [:block/uuid block-b-uuid])]
          {:keys [self conn sql]} (make-server-self)
          _ (seed-db! conn)
          _ (apply-entries! self [entry-b entry-a])
          checksum-ba (storage/get-checksum sql)
          recompute-ba (sync-checksum/recompute-checksum @conn)
          pull-ba [(d/pull @conn [:block/title :block/order] [:block/uuid block-a-uuid])
                   (d/pull @conn [:block/title :block/order] [:block/uuid block-b-uuid])]]
      (is (= recompute-ab checksum-ab))
      (is (= recompute-ba checksum-ba))
      (is (= checksum-ab checksum-ba))
      (is (= pull-ab pull-ba)))))

(deftest server-checksum-is-invariant-across-tx-partitioning-test
  (testing "server checksum converges when identical tx-data is sent as one entry or split entries"
    (let [page-uuid (random-uuid)
          block-a-uuid (random-uuid)
          block-b-uuid (random-uuid)
          seed-db! (fn [conn]
                     (d/transact! conn [{:block/uuid page-uuid
                                         :block/name "server-partition-page"
                                         :block/title "server-partition-page"}
                                        {:block/uuid block-a-uuid
                                         :block/title "A0"
                                         :block/order "a0"
                                         :block/page [:block/uuid page-uuid]
                                         :block/parent [:block/uuid page-uuid]}
                                        {:block/uuid block-b-uuid
                                         :block/title "B0"
                                         :block/order "a1"
                                         :block/page [:block/uuid page-uuid]
                                         :block/parent [:block/uuid page-uuid]}]))
          datom-a [:db/add [:block/uuid block-a-uuid] :block/title "A2"]
          datom-b [:db/add [:block/uuid block-b-uuid] :block/order "a8"]
          one-entry {:tx (protocol/tx->transit [datom-a datom-b])
                     :outliner-op :save-block}
          split-entry-a {:tx (protocol/tx->transit [datom-a])
                         :outliner-op :save-block}
          split-entry-b {:tx (protocol/tx->transit [datom-b])
                         :outliner-op :save-block}
          {:keys [self conn sql]} (make-server-self)
          _ (seed-db! conn)
          _ (apply-entries! self [one-entry])
          checksum-one (storage/get-checksum sql)
          recompute-one (sync-checksum/recompute-checksum @conn)
          pull-one [(d/pull @conn [:block/title :block/order] [:block/uuid block-a-uuid])
                    (d/pull @conn [:block/title :block/order] [:block/uuid block-b-uuid])]
          {:keys [self conn sql]} (make-server-self)
          _ (seed-db! conn)
          _ (apply-entries! self [split-entry-a split-entry-b])
          checksum-split (storage/get-checksum sql)
          recompute-split (sync-checksum/recompute-checksum @conn)
          pull-split [(d/pull @conn [:block/title :block/order] [:block/uuid block-a-uuid])
                      (d/pull @conn [:block/title :block/order] [:block/uuid block-b-uuid])]]
      (is (= recompute-one checksum-one))
      (is (= recompute-split checksum-split))
      (is (= checksum-one checksum-split))
      (is (= pull-one pull-split)))))

(deftest server-checksum-remains-correct-under-random-outliner-conflicts-test
  (testing "random insert/move/indent/outdent/delete with stale-client conflicts and undo/redo keeps checksum correct"
    (doseq [seed (range 31 35)]
      (let [{:keys [self conn sql]} (make-server-self)
            page-uuid (random-uuid)
            root-uuid (random-uuid)
            child-a-uuid (random-uuid)
            child-b-uuid (random-uuid)
            _ (d/transact! conn [{:block/uuid page-uuid
                                  :block/name (str "outliner-fuzz-page-" seed)
                                  :block/title (str "outliner-fuzz-page-" seed)}
                                 {:block/uuid root-uuid
                                  :block/title "root"
                                  :block/order "a0"
                                  :block/page [:block/uuid page-uuid]
                                  :block/parent [:block/uuid page-uuid]}
                                 {:block/uuid child-a-uuid
                                  :block/title "child-a"
                                  :block/order "a1"
                                  :block/page [:block/uuid page-uuid]
                                  :block/parent [:block/uuid root-uuid]}
                                 {:block/uuid child-b-uuid
                                  :block/title "child-b"
                                  :block/order "a2"
                                  :block/page [:block/uuid page-uuid]
                                  :block/parent [:block/uuid root-uuid]}])
            rng (seeded-rng (* seed 7919))]
        (loop [step 0
               t-before (storage/get-t sql)
               checksum-before (storage/get-checksum sql)
               undo-stack []
               redo-stack []]
          (when (< step 80)
            (let [db @conn
                  op (rand-int* rng 11)]
              (cond
                ;; explicit conflict scenario: delete parent then stale client inserts child under deleted parent
                (= op 0)
                (if-let [{:keys [delete-entry stale-add-entry]} (make-stale-add-after-delete-conflict rng db step)]
                  (let [delete-response (apply-batch-with-t! self t-before [delete-entry])
                        delete-state (assert-server-checksum-step! sql conn t-before checksum-before delete-response
                                                                   (str "seed " seed " step " step " delete-before-stale-add"))
                        stale-response (apply-batch-with-t! self (:t delete-state) [stale-add-entry])
                        stale-state (assert-server-checksum-step! sql conn (:t delete-state) (:checksum delete-state) stale-response
                                                                  (str "seed " seed " step " step " stale-add-after-delete"))]
                    (is (= "tx/reject" (:type stale-response))
                        (str "seed " seed " step " step " stale child insert should be rejected"))
                    (recur (inc step) (:t stale-state) (:checksum stale-state) undo-stack redo-stack))
                  (let [noop-response (apply-batch-with-t! self t-before [(no-op-rebase-entry)])
                        noop-state (assert-server-checksum-step! sql conn t-before checksum-before noop-response
                                                                 (str "seed " seed " step " step " fallback-noop"))]
                    (recur (inc step) (:t noop-state) (:checksum noop-state) undo-stack redo-stack)))

                ;; undo
                (= op 1)
                (if-let [{:keys [forward inverse]} (peek undo-stack)]
                  (let [entries (if (tx-entries-appliable? db inverse)
                                  inverse
                                  [(no-op-rebase-entry)])
                        response (apply-batch-with-t! self t-before entries)
                        state (assert-server-checksum-step! sql conn t-before checksum-before response
                                                            (str "seed " seed " step " step " undo"))]
                    (recur (inc step)
                           (:t state)
                           (:checksum state)
                           (pop undo-stack)
                           (if (:advanced? state)
                             (conj redo-stack {:forward forward :inverse inverse})
                             redo-stack)))
                  (let [noop-response (apply-batch-with-t! self t-before [(no-op-rebase-entry)])
                        noop-state (assert-server-checksum-step! sql conn t-before checksum-before noop-response
                                                                 (str "seed " seed " step " step " undo-noop"))]
                    (recur (inc step) (:t noop-state) (:checksum noop-state) undo-stack redo-stack)))

                ;; redo
                (= op 2)
                (if-let [{:keys [forward inverse]} (peek redo-stack)]
                  (let [entries (if (tx-entries-appliable? db forward)
                                  forward
                                  [(no-op-rebase-entry)])
                        response (apply-batch-with-t! self t-before entries)
                        state (assert-server-checksum-step! sql conn t-before checksum-before response
                                                            (str "seed " seed " step " step " redo"))]
                    (recur (inc step)
                           (:t state)
                           (:checksum state)
                           (if (:advanced? state)
                             (conj undo-stack {:forward forward :inverse inverse})
                             undo-stack)
                           (pop redo-stack)))
                  (let [noop-response (apply-batch-with-t! self t-before [(no-op-rebase-entry)])
                        noop-state (assert-server-checksum-step! sql conn t-before checksum-before noop-response
                                                                 (str "seed " seed " step " step " redo-noop"))]
                    (recur (inc step) (:t noop-state) (:checksum noop-state) undo-stack redo-stack)))

                :else
                (let [command (case op
                                3 (make-insert-command rng db step)
                                4 (make-random-move-command rng db step)
                                5 (make-random-indent-command rng db step)
                                6 (make-random-outdent-command rng db step)
                                7 (make-title-command rng db step)
                                8 {:forward [(make-random-delete-entry rng db)]
                                   :undoable? false}
                                9 (make-random-move-command rng db step)
                                10 (make-random-indent-command rng db step)
                                {:forward [(no-op-rebase-entry)]
                                 :undoable? false})
                      entries (if (tx-entries-appliable? db (:forward command))
                                (:forward command)
                                [(no-op-rebase-entry)])
                      response (apply-batch-with-t! self t-before entries)
                      state (assert-server-checksum-step! sql conn t-before checksum-before response
                                                          (str "seed " seed " step " step " op " op))
                      command-applied? (and (:undoable? command) (:advanced? state))
                      next-undo (if command-applied?
                                  (conj undo-stack {:forward (:forward command)
                                                    :inverse (:inverse command)})
                                  undo-stack)
                      next-redo (if (:advanced? state) [] redo-stack)]
                  (recur (inc step) (:t state) (:checksum state) next-undo next-redo))))))))))

(defn- seed-page-with-block-tree!
  [conn]
  (let [page-uuid (random-uuid)
        parent-uuid (random-uuid)
        child-a-uuid (random-uuid)
        child-b-uuid (random-uuid)
        now 1775549093572]
    (d/transact! conn [{:block/uuid page-uuid
                        :block/name "sync-repro-page"
                        :block/title "sync-repro-page"
                        :block/created-at now
                        :block/updated-at now}
                       {:block/uuid parent-uuid
                        :block/title "parent"
                        :block/parent [:block/uuid page-uuid]
                        :block/page [:block/uuid page-uuid]
                        :block/order "a0"
                        :block/created-at now
                        :block/updated-at now}
                       {:block/uuid child-a-uuid
                        :block/title "child-a"
                        :block/parent [:block/uuid parent-uuid]
                        :block/page [:block/uuid page-uuid]
                        :block/order "a1"
                        :block/created-at now
                        :block/updated-at now}
                       {:block/uuid child-b-uuid
                        :block/title "child-b"
                        :block/parent [:block/uuid parent-uuid]
                        :block/page [:block/uuid page-uuid]
                        :block/order "a2"
                        :block/created-at now
                        :block/updated-at now}])
    {:page-uuid page-uuid
     :parent-uuid parent-uuid
     :child-a-uuid child-a-uuid
     :child-b-uuid child-b-uuid}))

(deftest tx-batch-stale-retract-block-includes-current-descendants-test
  (testing "stale block retract should still delete descendants attached in current db"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          {:keys [parent-uuid child-a-uuid child-b-uuid]} (seed-page-with-block-tree! conn)
          t-before (storage/get-t sql)
          stale-delete-entry {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid parent-uuid]]])
                              :outliner-op :delete-blocks}
          response (with-redefs [ws/broadcast! (fn [& _] nil)]
                     (sync-handler/handle-tx-batch! self nil [stale-delete-entry] t-before))]
      (is (= "tx/batch/ok" (:type response)))
      (is (number? (:t response)))
      (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
      (is (nil? (d/entity @conn [:block/uuid child-a-uuid])))
      (is (nil? (d/entity @conn [:block/uuid child-b-uuid]))))))

(deftest tx-batch-stale-retract-page-includes-current-page-tree-test
  (testing "stale page retract should still delete page tree to avoid orphan blocks"
    (let [sql (test-sql/make-sql)
          conn (storage/open-conn sql)
          self #js {:sql sql
                    :conn conn
                    :schema-ready true}
          {:keys [page-uuid parent-uuid child-a-uuid child-b-uuid]} (seed-page-with-block-tree! conn)
          t-before (storage/get-t sql)
          stale-delete-entry {:tx (protocol/tx->transit [[:db/retractEntity [:block/uuid page-uuid]]])
                              :outliner-op :delete-page}
          response (with-redefs [ws/broadcast! (fn [& _] nil)]
                     (sync-handler/handle-tx-batch! self nil [stale-delete-entry] t-before))]
      (is (= "tx/batch/ok" (:type response)))
      (is (number? (:t response)))
      (is (nil? (d/entity @conn [:block/uuid page-uuid])))
      (is (nil? (d/entity @conn [:block/uuid parent-uuid])))
      (is (nil? (d/entity @conn [:block/uuid child-a-uuid])))
      (is (nil? (d/entity @conn [:block/uuid child-b-uuid]))))))

(deftest sync-pull-is-blocked-when-graph-is-not-ready-for-use-test
  (async done
         (let [self #js {:env #js {"DB" :db}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url "/sync/graph-1/pull?graph-id=graph-1&since=0")]
           (-> (p/with-redefs [index/<graph-ready-for-use? (fn [_db _graph-id]
                                                             (p/resolved false))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/pull}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 409 (.-status resp)))
                   (is (= "graph not ready" (:error body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))

(deftest snapshot-download-is-blocked-when-graph-is-not-ready-for-use-test
  (async done
         (let [bucket #js {:put (fn [& _]
                                  (throw (js/Error. "should-not-upload-snapshot")))}
               self #js {:env #js {"DB" :db
                                   "LOGSEQ_SYNC_ASSETS" bucket}
                         :sql (empty-sql)}
               {:keys [request url]} (request-url)]
           (-> (p/with-redefs [index/<graph-ready-for-use? (fn [_db _graph-id]
                                                             (p/resolved false))]
                 (p/let [resp (sync-handler/handle {:self self
                                                    :request request
                                                    :url url
                                                    :route {:handler :sync/snapshot-download}})
                         text (.text resp)
                         body (js->clj (js/JSON.parse text) :keywordize-keys true)]
                   (is (= 409 (.-status resp)))
                   (is (= "graph not ready" (:error body)))))
               (p/then (fn []
                         (done)))
               (p/catch (fn [error]
                          (is false (str error))
                          (done)))))))
