(ns frontend.worker.db-listener-test
  (:require [cljs.test :refer [deftest is testing]]
            [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.markdown-mirror :as markdown-mirror]
            [frontend.worker.pipeline :as worker-pipeline]
            [frontend.worker.platform :as platform]
            [frontend.worker.render-delta :as render-delta]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.sync :as db-sync]
            [logseq.db :as ldb]
            [logseq.db.test.helper :as db-test]))

(def ^:private forbidden-renderer-payload-keys
  #{:affected-keys
    :blocks
    :deleted-assets
    :deleted-block-uuids
    :editor-row-uuids
    :entity-updated-block-uuids
    :pages
    :render-invalidated-block-uuids
    :result
    :structural-parent-uuids
    :tx-data
    :updated-blocks})

(deftest renderer-tx-meta-keeps-only-side-effect-inputs-test
  (testing "renderer publication excludes worker and direct-response metadata"
    (let [tx-meta {:initial-pages? true
                   :end? true
                   :client-id "client"
                   :outliner-op :rename-page
                   :deleted-page "deleted"
                   :data {:old-name "before" :new-name "after"}
                   :outliner-ops [[:save-block []]]
                   :db-sync/inverse-outliner-ops [[:save-block []]]
                   :db-sync/tx-id 42
                   :local-tx? true
                   :request-id "request"
                   :ui/perf-id (random-uuid)
                   :error-handler (fn [_] nil)}]
      (is (= {:initial-pages? true
              :end? true
              :client-id "client"
              :outliner-op :rename-page
              :deleted-page "deleted"
              :data {:old-name "before" :new-name "after"}}
             (#'db-listener/renderer-tx-meta tx-meta))))))

(deftest markdown-mirror-listener-enqueues-worker-mirror-work-test
  (let [calls (atom [])
        tx-report {:tx-data [:tx]}]
    (with-redefs [markdown-mirror/<handle-tx-report!
                  (fn [repo conn tx-report opts]
                    (swap! calls conj [repo conn tx-report opts]))]
      ((get-method db-listener/listen-db-changes :markdown-mirror)
       :markdown-mirror
       {:repo "repo"}
       tx-report))
    (is (= [["repo" nil tx-report {:defer? true}]]
           @calls))))

(deftest db-listener-persists-local-tx-before-broadcasting-ui-refresh-test
  (let [conn (db-test/create-conn)
        calls (atom [])]
    (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                  db-sync/handle-local-tx! (fn [& _]
                                             (swap! calls conj :persist-local-tx))
                  worker-pipeline/invoke-hooks (fn [_conn tx-report _context]
                                                 {:tx-report tx-report})
                  render-delta/build (fn [_input]
                                       (swap! calls conj :build-ui-refresh)
                                       {:rev 1})
                  shared-service/broadcast-to-clients! (fn [event _payload]
                                                         (when (= :sync-db-changes event)
                                                           (swap! calls conj :broadcast-ui-refresh)))]
      (db-listener/listen-db-changes! "repo" conn :handler-keys [:sync-db-to-main-thread :db-sync])
      (d/transact! conn [{:db/id -1 :block/title "b1"}] {:local-tx? true}))
    (is (= [:persist-local-tx :build-ui-refresh :broadcast-ui-refresh] @calls)
        "UI refresh work must wait until the local tx has been persisted.")))

(deftest db-listener-builds-one-render-delta-for-origin-and-broadcast-test
  (let [repo "repo"
        conn (db-test/create-conn)
        block-uuid #uuid "11111111-1111-1111-1111-111111111111"
        perf-id #uuid "22222222-2222-2222-2222-222222222222"
        deleted-block-uuid #uuid "33333333-3333-3333-3333-333333333333"
        operation-id 41
        affected-keys #{[:resource :tasks]}
        delta {:graph-id repo
               :rev 1
               :blocks {block-uuid {:block/uuid block-uuid
                                    :block/tx-id 1}}
               :deleted {}
               :children {}
               :affected-keys #{[:graph]}}
        post-pipeline-report (atom nil)
        build-inputs (atom [])
        broadcast-payloads (atom [])]
    (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                  db-sync/handle-local-tx! (fn [& _] nil)
                  worker-pipeline/invoke-hooks
                  (fn [_conn tx-report _context]
                    (let [block-id (some (fn [datom]
                                           (when (and (:added datom)
                                                      (= :block/uuid (:a datom)))
                                             (:e datom)))
                                         (:tx-data tx-report))]
                      (reset! post-pipeline-report tx-report)
                      {:tx-report tx-report
                       :affected-keys affected-keys
                       :blocks [(d/entity (:db-after tx-report) block-id)]
                       :deleted-block-uuids #{deleted-block-uuid}}))
                  render-delta/build
                  (fn [input]
                    (swap! build-inputs conj input)
                    delta)
                  shared-service/broadcast-to-clients!
                  (fn [event payload]
                    (when (= :sync-db-changes event)
                      (swap! broadcast-payloads conj payload)))]
      (db-listener/listen-db-changes! repo conn
                                      :handler-keys [:sync-db-to-main-thread :db-sync])
      (d/transact! conn
                   [{:db/id -1
                     :block/uuid block-uuid
                     :block/title "hello"
                     :block/tx-id 1}]
                   {:local-tx? true
                    :db-sync/tx-id operation-id
                    :request-id "request-1"
                    :client-id "client"
                    :outliner-op :save-block
                    :ui/perf-id perf-id}))
    (let [origin-delta (db-listener/take-outliner-op-delta! perf-id)
          build-input (first @build-inputs)
          broadcast-payload (first @broadcast-payloads)
          roundtripped (-> broadcast-payload
                           ldb/write-transit-str
                           ldb/read-transit-str)]
      (is (= 1 (count @build-inputs))
          "Each committed transaction must construct its renderer delta once.")
      (is (identical? @post-pipeline-report (:tx-report build-input))
          "Delta construction must use the post-pipeline transaction report.")
      (is (= {:graph-id repo
              :rev (:max-tx (:db-after @post-pipeline-report))
              :op-id operation-id
              :deleted-block-uuids #{deleted-block-uuid}
              :affected-keys affected-keys}
             (select-keys build-input
                          [:graph-id :rev :op-id :deleted-block-uuids :affected-keys])))
      (is (= #{block-uuid} (set (keys (:blocks build-input)))))
      (is (= {:block/uuid block-uuid
              :block/title "hello"
              :block/tx-id 1}
             (select-keys (get-in build-input [:blocks block-uuid])
                          [:block/uuid :block/title :block/tx-id])))
      (is (= 1 (count @broadcast-payloads)))
      (is (identical? delta origin-delta)
          "The origin request must retain the constructed delta value.")
      (is (identical? delta (:delta broadcast-payload))
          "The broadcast must reuse the constructed delta value.")
      (is (= {:repo repo
              :tx-meta {:client-id "client"
                        :outliner-op :save-block}
              :delta delta}
             broadcast-payload)
          "The renderer broadcast must contain only its graph, side-effect inputs, and delta.")
      (is (= delta (:delta roundtripped))
          "The compact renderer delta must survive the worker transit boundary.")
      (is (not-any? #(contains? broadcast-payload %)
                    forbidden-renderer-payload-keys)
          "Renderer broadcasts must not expose transaction datoms or legacy marker fields."))))

(deftest db-listener-does-not-publish-graph-download-render-deltas-test
  (doseq [tx-meta [{:rtc-download-graph? true}
                   {:sync-download-graph? true}]]
    (let [conn (db-test/create-conn)
          build-inputs (atom [])
          broadcast-payloads (atom [])]
      (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                    db-sync/handle-local-tx! (fn [& _] nil)
                    worker-pipeline/invoke-hooks
                    (fn [_conn tx-report _context]
                      {:tx-report tx-report})
                    render-delta/build
                    (fn [input]
                      (swap! build-inputs conj input)
                      {:rev 1})
                    shared-service/broadcast-to-clients!
                    (fn [event payload]
                      (when (= :sync-db-changes event)
                        (swap! broadcast-payloads conj payload)))]
        (db-listener/listen-db-changes! "repo" conn
                                        :handler-keys [:sync-db-to-main-thread :db-sync])
        (d/transact! conn
                     [{:db/id -1 :block/title "downloaded"}]
                     tx-meta))
      (is (empty? @build-inputs) (str tx-meta))
      (is (empty? @broadcast-payloads) (str tx-meta)))))

(deftest db-listener-does-not-publish-skip-validation-render-deltas-test
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "before"}]}])
        block (db-test/find-block-by-content @conn "before")
        block-id (:db/id block)
        _ (d/transact! conn [[:db/add block-id :block/tx-id 17]])
        original-pipeline @ldb/*transact-pipeline-fn
        formal-pipeline-calls (atom [])
        build-inputs (atom [])
        broadcast-payloads (atom [])
        mirrored-reports (atom [])]
    (try
      (ldb/register-transact-pipeline-fn!
       (fn [tx-report]
         (swap! formal-pipeline-calls conj tx-report)
         (worker-pipeline/transact-pipeline tx-report)))
      (with-redefs [db-sync/update-local-sync-checksum! (fn [& _] nil)
                    db-sync/handle-local-tx! (fn [& _] nil)
                    markdown-mirror/<handle-tx-report!
                    (fn [_repo _conn tx-report _opts]
                      (swap! mirrored-reports conj tx-report))
                    worker-pipeline/invoke-hooks
                    (fn [& _]
                      (throw (js/Error. "skip-validation transactions must bypass renderer work")))
                    render-delta/build
                    (fn [input]
                      (swap! build-inputs conj input)
                      {:rev 1})
                    shared-service/broadcast-to-clients!
                    (fn [event payload]
                      (when (= :sync-db-changes event)
                        (swap! broadcast-payloads conj payload)))]
        (db-listener/listen-db-changes! "repo" conn
                                        :handler-keys [:sync-db-to-main-thread
                                                       :db-sync
                                                       :markdown-mirror])
        (ldb/transact! conn
                       [[:db/add block-id :block/title "after"]]
                       {:skip-validate-db? true}))
      (finally
        (reset! ldb/*transact-pipeline-fn original-pipeline)))
    (is (= "after" (:block/title (d/entity @conn block-id))))
    (is (= 17 (:block/tx-id (d/entity @conn block-id)))
        "A raw skipped transaction must not synthesize a canonical revision.")
    (is (empty? @formal-pipeline-calls)
        "A skipped ldb transaction must not enter the formal transaction pipeline.")
    (is (empty? @build-inputs)
        "Transactions outside the formal pipeline cannot construct renderer deltas.")
    (is (empty? @broadcast-payloads)
        "Transactions outside the formal pipeline cannot publish renderer deltas.")
    (is (= 1 (count @mirrored-reports))
        "Bypassing the renderer pipeline must not suppress unrelated post-commit handlers.")
    (is (= {:skip-validate-db? true}
           (:tx-meta (first @mirrored-reports))))
    (is (identical? @conn (:db-after (first @mirrored-reports)))
        "Deferred handlers must receive the raw skipped transaction report.")))

(deftest db-listener-reports-post-commit-failures-without-blocking-ui-sync-test
  (doseq [failed-stage [:checksum :persist]]
    (let [conn (db-test/create-conn)
          calls (atom [])
          captured-errors (atom [])]
      (with-redefs [db-sync/update-local-sync-checksum!
                    (fn [& _]
                      (swap! calls conj :checksum)
                      (when (= :checksum failed-stage)
                        (throw (js/Error. "checksum failed"))))
                    db-sync/handle-local-tx!
                    (fn [& _]
                      (swap! calls conj :persist)
                      (when (= :persist failed-stage)
                        (throw (js/Error. "persist failed"))))
                    worker-pipeline/invoke-hooks
                    (fn [_conn tx-report _context]
                      {:tx-report tx-report})
                    render-delta/build
                    (fn [_input]
                      (swap! calls conj :build-ui-refresh)
                      {:rev 1})
                    shared-service/broadcast-to-clients!
                    (fn [event _payload]
                      (when (= :sync-db-changes event)
                        (swap! calls conj :broadcast-ui-refresh)))
                    platform/post-message!
                    (fn [_platform event payload]
                      (when (= :capture-error event)
                        (swap! captured-errors conj payload)))
                    platform/current (constantly :test)]
        (db-listener/listen-db-changes! "repo" conn
                                        :handler-keys [:sync-db-to-main-thread :db-sync])
        (let [error (try
                      (d/transact! conn [{:db/id -1 :block/title "hello"}]
                                   {:local-tx? true})
                      nil
                      (catch :default error
                        error))]
          (is (nil? error) (str "Post-commit failure escaped: " failed-stage))
          (is (= 1 (d/q '[:find (count ?e) .
                          :where [?e :block/title "hello"]]
                        @conn)))
          (is (= 1 (count @captured-errors)))
          (is (= [:checksum :persist :build-ui-refresh :broadcast-ui-refresh]
                 @calls)))))))
