(ns frontend.worker.sync.apply-txs-mutation2-test
  "Second-run mutation survivors in frontend.worker.sync.apply-txs."
  (:require [cljs.test :refer [async deftest is]]
            [datascript.core :as d]
            [frontend.worker.platform :as platform]
            [frontend.worker.shared-service :as shared-service]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.asset-db-listener :as asset-db-listener]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.assets :as sync-assets]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.large-title :as sync-large-title]
            [frontend.worker.sync.presence :as sync-presence]
            [frontend.worker.sync.transport :as sync-transport]
            [frontend.worker.sync.util :as sync-util]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [logseq.common.util :as common-util]
            [logseq.common.version :as build-version]
            [logseq.db :as ldb]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.op.construct :as op-construct]
            [logseq.outliner.recycle :as recycle]
            [promesa.core :as p]))

(defn- three-blocks-conn
  []
  (db-test/create-conn-with-blocks
   [{:page {:block/title "page1"}
     :blocks [{:block/title "a"} {:block/title "b"} {:block/title "c"}]}]))

(defn- replay!
  [conn op args]
  (#'sync-apply/replay-canonical-outliner-op! conn [op args] nil))

(defn- replay-error-data
  [conn op args]
  (try
    (replay! conn op args)
    nil
    (catch :default e
      (ex-data e))))

(defn- captured-tx-metas
  "Runs `f`, returns the tx-meta of every transaction `conn` commits meanwhile."
  [conn f]
  (let [metas (atom [])]
    (d/listen! conn ::capture (fn [report] (swap! metas conj (:tx-meta report))))
    (try
      (f)
      (finally
        (d/unlisten! conn ::capture)))
    @metas))

;; remote sync conflicts

;; Fails if, in `remote-sync-conflicts`, the `distinct` step is dropped, the `vec` step is dropped, the `a` step is dropped or the `:remote-t` key is dropped.
(deftest remote-sync-conflicts-lists-distinct-remote-titles-that-differ-from-the-local-block
  (let [conn (three-blocks-conn)
        a (db-test/find-block-by-content @conn "a")
        b (db-test/find-block-by-content @conn "b")
        a-ref [:block/uuid (:block/uuid a)]
        b-ref [:block/uuid (:block/uuid b)]
        local-txs [{:tx [[:db/add a-ref :block/title "local a" 1 true]
                         [:db/add b-ref :block/title "local b" 1 true]]}]
        remote-txs [{:t 7 :tx-data [[:db/add a-ref :block/title "remote a" 7 true]
                                    [:db/add a-ref :block/title "remote a" 7 true]
                                    [:db/add b-ref :block/title "b" 7 true]]}]
        conflicts (#'sync-apply/remote-sync-conflicts @conn local-txs remote-txs)]
    (is (vector? conflicts))
    (is (= [{:block-uuid (:block/uuid a)
             :attr :block/title
             :value "remote a"
             :remote-t 7}]
           conflicts)
        "A repeated remote item is listed once and a title equal to the current one is no conflict")))

;; rebase helpers

;; Fails if, in `rebase-find-existing-left-sibling`, the body becomes `nil` or `:block/uuid` becomes `:block/_raw-parent`.
(deftest rebase-find-existing-left-sibling-skips-siblings-missing-from-the-current-db
  (let [conn (three-blocks-conn)
        db-before @conn
        a (d/entity db-before [:block/uuid (:block/uuid (db-test/find-block-by-content db-before "a"))])
        b (db-test/find-block-by-content db-before "b")
        c (d/entity db-before [:block/uuid (:block/uuid (db-test/find-block-by-content db-before "c"))])]
    (d/transact! conn [[:db/retractEntity (:db/id b)]])
    (is (= (:block/uuid a)
           (:block/uuid (#'sync-apply/rebase-find-existing-left-sibling @conn c)))
        "The nearest left sibling that still exists wins")
    (is (nil? (#'sync-apply/rebase-find-existing-left-sibling @conn a)))))

;; Fails if, in `rebase-target-ref`, `:block/uuid` becomes `:block/_raw-parent`.
;; Fails if, in `template-parent-ref`, `:block/uuid` becomes `:block/_raw-parent`.
(deftest rebase-target-ref-and-template-parent-ref-normalize-block-references
  (let [u (random-uuid)]
    (doseq [f [#'sync-apply/rebase-target-ref #'sync-apply/template-parent-ref]]
      (is (= [:block/uuid u] (f [:block/uuid u])))
      (is (= [:block/uuid u] (f u)))
      (is (= [:block/uuid u] (f {:block/uuid u :block/title "x"})))
      (is (= 5 (f 5)))
      (is (= [:block/name "x"] (f [:block/name "x"]))))
    (is (= [:block/uuid "not-a-uuid"] (#'sync-apply/rebase-target-ref [:block/uuid "not-a-uuid"])))
    (is (= {:block/uuid "not-a-uuid"} (#'sync-apply/rebase-target-ref {:block/uuid "not-a-uuid"})))
    (is (= {:block/uuid "not-a-uuid"} (#'sync-apply/template-parent-ref {:block/uuid "not-a-uuid"})))))

;; Fails if, in `template-parent-ref`, `:block/uuid` becomes `:block/_raw-parent`.
;; Fails if, in `sanitize-template-block`, `:db/id` becomes `:db/retract`, the `(d/entity block-id)` step is dropped, the `:block/uuid` step is dropped, `:block/uuid` becomes `:block/_raw-parent`, the `(dissoc :db/id :block/order :block/pa...` step is dropped, the `(update :block/parent template-parent...` step is dropped, `:block/order` becomes `:block/page`, `:block/tx-id` becomes `:block/uuid` or `:block/parent` becomes `:block/pre-block?`.
(deftest sanitize-template-block-drops-position-data-and-finds-the-uuid
  (let [conn (three-blocks-conn)
        db @conn
        a (db-test/find-block-by-content db "a")
        parent-uuid (random-uuid)
        sanitize #'sync-apply/sanitize-template-block
        block {:db/id (:db/id a)
               :block/title "t"
               :block/order "a9"
               :block/page 1
               :block/tx-id 5
               :block/parent parent-uuid}]
    (is (= {:block/title "t"
            :block/parent [:block/uuid parent-uuid]
            :block/uuid (:block/uuid a)}
           (sanitize db nil block))
        "The uuid of a numeric :db/id comes from the current db")
    (is (= (:block/uuid a)
           (:block/uuid (sanitize nil db block)))
        "The uuid of a numeric :db/id comes from the db before the rebase")
    (is (= {:block/title "t" :block/uuid parent-uuid :block/parent [:block/uuid parent-uuid]}
           (sanitize db nil {:db/id [:block/uuid parent-uuid]
                             :block/title "t"
                             :block/parent parent-uuid}))
        "A lookup-ref :db/id yields its uuid")
    (is (= {:block/title "t" :block/uuid parent-uuid :block/parent nil}
           (sanitize db nil {:block/uuid parent-uuid :block/title "t"})))
    (is (not (contains? (sanitize db nil {:db/id 123456789 :block/title "t"}) :block/uuid)))))

;; replay of canonical outliner ops

;; Fails if, in `replay-canonical-outliner-op!`, the `:args` key is dropped or the `:reason` key is dropped.
(deftest replaying-an-op-on-missing-targets-reports-why
  (let [conn (three-blocks-conn)
        missing-uuid (random-uuid)
        save-args [{:block/uuid missing-uuid :block/title "x"} {}]
        insert-args [[{:block/title "x"}] [:block/uuid missing-uuid] {}]
        template-args [(random-uuid) (random-uuid) {}]
        move-args [[(random-uuid)] [:block/uuid missing-uuid] {}]
        indent-args [[(random-uuid)] true {}]
        restore-args [(random-uuid)]]
    (is (= {:args save-args :reason :missing-block :op :save-block}
           (replay-error-data conn :save-block save-args)))
    (is (= {:args insert-args :op :insert-blocks}
           (replay-error-data conn :insert-blocks insert-args)))
    (is (= {:args template-args :reason :missing-template-or-target-block :op :apply-template}
           (replay-error-data conn :apply-template template-args)))
    (is (= {:args move-args :op :move-blocks}
           (replay-error-data conn :move-blocks move-args)))
    (is (= {:args indent-args :op :indent-outdent-blocks}
           (replay-error-data conn :indent-outdent-blocks indent-args)))
    (is (= {:args restore-args :reason :invalid-restore-target :op :restore-recycled}
           (replay-error-data conn :restore-recycled restore-args)))))

;; Fails if, in `replay-canonical-outliner-op!`, `:block/order` becomes `:block/page`.
(deftest replaying-save-block-ignores-the-recorded-position
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        order-before (:block/order b)]
    (replay! conn :save-block [{:block/uuid (:block/uuid b)
                                :block/title "b2"
                                :db/id 987654
                                :block/order "zzz"}
                               {}])
    (let [b' (d/entity @conn (:db/id b))]
      (is (= "b2" (:block/title b')))
      (is (= order-before (:block/order b'))
          "The recorded :block/order is dropped, the block keeps its place"))))

;; Fails if, in `replay-canonical-outliner-op!`, `:block/title` becomes `:block/tx-id` or `:block/uuid` becomes `:block/_raw-parent`.
(deftest replaying-create-page-for-an-existing-page-returns-it
  (let [conn (three-blocks-conn)
        page (ldb/get-page @conn "page1")]
    (is (= ["page1" (:block/uuid page)]
           (replay! conn :create-page ["page1" {}])))
    (is (= ["page1" (:block/uuid page)]
           (replay! conn :create-page ["page1" {:uuid (:block/uuid page)}])))))

;; Fails if, in `replay-canonical-outliner-op!`, the `:outliner-op` key is dropped.
(deftest replaying-recycle-ops-tags-the-transaction
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        b-ref [:block/uuid (:block/uuid b)]
        recycle! #(ldb/transact! conn
                                 (recycle/recycle-blocks-tx-data @conn [(d/entity @conn (:db/id b))] {})
                                 {:outliner-op :delete-blocks})]
    (recycle!)
    (is (some? (:logseq.property/deleted-at (d/entity @conn (:db/id b)))))
    (is (= [:restore-recycled]
           (mapv :outliner-op (captured-tx-metas conn #(replay! conn :restore-recycled [b-ref])))))
    (is (nil? (:logseq.property/deleted-at (d/entity @conn (:db/id b)))))
    (recycle!)
    (is (= [:recycle-delete-permanently]
           (mapv :outliner-op (captured-tx-metas conn #(replay! conn :recycle-delete-permanently [b-ref])))))
    (is (nil? (d/entity @conn b-ref)))))

;; rebase and meta

;; Fails if, in `sync-fix-tx-meta`, the body becomes `nil`, the `:outliner-op` key is dropped, the `:gen-undo-ops?` key is dropped, the `:db-sync/tx-id` key is dropped or `:db-sync/tx-id` becomes `:db-sync/upload-response-timeout`.
(deftest sync-fix-tx-meta-marks-a-fix-without-undo
  (let [tx-meta (#'sync-apply/sync-fix-tx-meta)]
    (is (= :fix (:outliner-op tx-meta)))
    (is (false? (:gen-undo-ops? tx-meta)))
    (is (uuid? (:db-sync/tx-id tx-meta)))
    (is (= #{:outliner-op :gen-undo-ops? :db-sync/tx-id} (set (keys tx-meta))))))

;; Fails if, in `rebase-local-op!`, the `:tx-id` key is dropped, the `:status` key is dropped, the `:original-outliner-op` key is dropped, the `:db-sync/inverse-outliner-ops` key is dropped or `:db-sync/inverse-outliner-ops` becomes `:db-sync/large-title-rehydrate-failed`.
(deftest rebase-local-op-keeps-fix-ops-and-tags-the-replay
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        tx-id (random-uuid)
        forward [[:save-block [{:block/uuid (:block/uuid b) :block/title "rebased"} {}]]]
        inverse [[:save-block [{:block/uuid (:block/uuid b) :block/title "b"} {}]]]
        local-tx {:tx-id tx-id
                  :outliner-op :save-block
                  :forward-outliner-ops forward
                  :inverse-outliner-ops inverse}
        result (atom nil)
        metas (captured-tx-metas conn #(reset! result (#'sync-apply/rebase-local-op! nil conn local-tx @conn)))
        tx-meta (last metas)]
    (is (= {:tx-id tx-id :status :rebased} @result))
    (is (= :rebase (:outliner-op tx-meta)))
    (is (= :save-block (:original-outliner-op tx-meta)))
    (is (true? (:db-sync/rebased-local? tx-meta)))
    (is (= tx-id (:db-sync/tx-id tx-meta)))
    (is (= forward (:db-sync/forward-outliner-ops tx-meta)))
    (is (= inverse (:db-sync/inverse-outliner-ops tx-meta)))
    (is (not (contains? tx-meta :db-sync/replayed-tx-data?)))
    (is (= {:tx-id tx-id :status :kept}
           (#'sync-apply/rebase-local-op! nil conn {:tx-id tx-id :outliner-op :fix} @conn)))))

;; Fails if, in `rebase-local-op!`, `:db-sync/replayed-tx-data?` becomes `:db-sync/report-apply-remote-txs-error-failed`, the `normalize-tx-data-for-rebase` step is dropped or `:db-sync/suppress-stale-rebase-transact-failed-log?` becomes `:db-sync/tx-id`.
(deftest rebase-local-op-replays-recorded-tx-data-when-there-are-no-forward-ops
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        tx-id (random-uuid)
        local-tx {:tx-id tx-id
                  :outliner-op :save-block
                  :tx [[:db/add (:db/id b) :block/title "recorded" 536870913]]}
        result (atom nil)
        inner-transacts (atom [])
        original-transact! ldb/transact!
        metas (with-redefs [ldb/transact! (fn [& args]
                                            (swap! inner-transacts conj args)
                                            (apply original-transact! args))]
                (captured-tx-metas conn #(reset! result (#'sync-apply/rebase-local-op! nil conn local-tx @conn))))
        [_ inner-tx-data inner-tx-meta] (first @inner-transacts)]
    (is (= {:tx-id tx-id :status :rebased} @result))
    (is (= "recorded" (:block/title (d/entity @conn (:db/id b)))))
    (is (true? (:db-sync/replayed-tx-data? (last metas))))
    (is (= [[:db/add (:db/id b) :block/title "recorded"]] (vec inner-tx-data))
        "The recorded datoms are replayed without their tx ids")
    (is (true? (:db-sync/suppress-stale-rebase-transact-failed-log? inner-tx-meta)))))

;; Fails if, in `reverse-local-txs!`, the `(keep identity)` step is dropped or the `vec` step is dropped.
(deftest reverse-local-txs-reports-stale-reversals-as-failed
  (let [conn (three-blocks-conn)
        result (sync-apply/reverse-local-txs! conn [{:tx-id 1 :outliner-op :fix}
                                                    {:tx-id 2 :outliner-op :save-block}])]
    (is (vector? result))
    (is (= [{:tx-id 2 :status :failed}] result)
        "A fix op reverses to nothing and an op without reversal data is a failed one")))

;; reporting

;; Fails if, in `broadcast-sync-conflicts!`, the body becomes `nil`, the `:repo` key is dropped, the `:block-uuid` key is dropped or the `:conflicts` key is dropped.
(deftest broadcast-sync-conflicts-sends-each-block-once
  (let [u (random-uuid)
        sent (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [& args] (swap! sent conj (vec args)))
                  client-op/get-sync-conflicts (fn [repo block-uuid] [[repo block-uuid]])]
      (#'sync-apply/broadcast-sync-conflicts! "repo" [{:block-uuid u} {:block-uuid u}]))
    (is (= [[:sync-conflicts-updated {:repo "repo" :block-uuid u :conflicts [["repo" u]]}]]
           @sent))))

;; Fails if, in `report-apply-remote-txs-error!`, the body becomes `nil`, the `:error` key is dropped, the `:payload` key is dropped, the `:source` key is dropped, the `:operation` key is dropped, the `:has-local-changes` key is dropped, the `:remote-tx-count` key is dropped, the `:local-tx-count` key is dropped or the `:error-data` key is dropped.
(deftest report-apply-remote-txs-error-posts-the-failure-context
  (let [posted (atom [])
        error (ex-info "boom" {:code 1})]
    (with-redefs [platform/current (fn [] {:broadcast {:post-message! (fn [type payload] (swap! posted conj [type payload]))}})]
      (#'sync-apply/report-apply-remote-txs-error! error {:has-local-changes? true :remote-txs [1 2 3] :local-txs [1]})
      (#'sync-apply/report-apply-remote-txs-error! (js/Error. "plain") {:has-local-changes? false :remote-txs [] :local-txs []}))
    (let [[[type payload] [_ plain-payload]] @posted]
      (is (= :capture-error type))
      (is (= {:source "db-sync"
              :operation "apply-remote-txs"
              :has-local-changes true
              :remote-tx-count 3
              :local-tx-count 1}
             (:payload payload)))
      (is (= "Sync apply remote txs failed" (.-message (:error payload))))
      (is (= {:error-data (str {:code 1})} (:extra payload)))
      (is (not (contains? plain-payload :extra)) "An error without data adds no :extra"))))

;; Fails if, in `fail-if-pending-tx-snapshot-changed!`, the `:repo` key is dropped, the `:local-tx-ids` key is dropped or the `:current-local-tx-ids` key is dropped.
(deftest fail-if-pending-tx-snapshot-changed-reports-both-snapshots
  (with-redefs [sync-apply/pending-txs (fn [_repo & _] [{:tx-id 2}])]
    (let [data (try
                 (#'sync-apply/fail-if-pending-tx-snapshot-changed! "repo" [{:tx-id 1}])
                 nil
                 (catch :default e (ex-data e)))]
      (is (= {:code :pending-tx-snapshot-changed
              :repo "repo"
              :local-tx-ids [1]
              :current-local-tx-ids [2]}
             data))
      (is (nil? (#'sync-apply/fail-if-pending-tx-snapshot-changed! "repo" [{:tx-id 2}]))))))

;; Fails if, in `finish-apply-remote-txs!`, the `:tx-data` key is dropped or the `:graph-id` key is dropped.
(deftest finish-apply-remote-txs-rehydrates-large-titles-of-the-remote-data
  (async done
    (let [calls (atom [])
          original sync-apply/rehydrate-large-titles!]
      (set! sync-apply/rehydrate-large-titles! (fn [repo opts] (swap! calls conj [repo opts]) nil))
      (-> (#'sync-apply/finish-apply-remote-txs! "repo" {:graph-id "g" :inflight (atom [1])} [[:db/add 1 :a 2]] nil)
          (p/finally (fn [_ _]
                       (set! sync-apply/rehydrate-large-titles! original)
                       (is (= [["repo" {:tx-data [[:db/add 1 :a 2]] :graph-id "g"}]] @calls))
                       (done)))))))

;; Fails if, in `apply-remote-txs!`, `:db-sync/missing-db` becomes `:db-sync/missing-field`, the `:repo` key is dropped or the `:op` key is dropped.
(deftest apply-remote-txs-without-a-db-fails-fast-with-its-context
  (let [error (try
                (sync-apply/apply-remote-txs! "no-such-repo" nil [])
                nil
                (catch :default e e))]
    (is (= "missing-db" (ex-message error)))
    (is (= {:repo "no-such-repo" :op :apply-remote-txs} (ex-data error)))))

;; worker wiring

;; Fails if, in `sync-counts`, the body becomes `nil`, the `:get-datascript-conn` key is dropped, the `:get-client-ops-conn` key is dropped, the `:get-pending-local-tx-count` key is dropped, the `:get-unpushed-asset-ops-count` key is dropped, the `:get-missing-asset-upload-files` key is dropped, the `:get-local-tx` key is dropped, the `:get-local-checksum` key is dropped, the `:get-graph-uuid` key is dropped, the `:latest-remote-tx` key is dropped or the `:latest-remote-checksum` key is dropped.
(deftest sync-counts-hands-presence-the-worker-lookups-and-the-latest-remote-state
  (let [captured (atom nil)
        original-tx @sync-apply/*repo->latest-remote-tx
        original-checksum @sync-apply/*repo->latest-remote-checksum]
    (reset! sync-apply/*repo->latest-remote-tx {"r" 5})
    (reset! sync-apply/*repo->latest-remote-checksum {"r" "cs"})
    (try
      (with-redefs [sync-presence/sync-counts (fn [deps repo] (reset! captured [deps repo]) :counts)]
        (is (= :counts (#'sync-apply/sync-counts "r"))))
      (finally
        (reset! sync-apply/*repo->latest-remote-tx original-tx)
        (reset! sync-apply/*repo->latest-remote-checksum original-checksum)))
    (is (= [{:get-datascript-conn worker-state/get-datascript-conn
             :get-client-ops-conn worker-state/get-client-ops-conn
             :get-pending-local-tx-count client-op/get-pending-local-tx-count
             :get-unpushed-asset-ops-count client-op/get-unpushed-asset-ops-count
             :get-missing-asset-upload-files sync-assets/get-missing-asset-upload-files
             :get-local-tx client-op/get-local-tx
             :get-local-checksum client-op/get-local-checksum
             :get-graph-uuid client-op/get-graph-uuid
             :latest-remote-tx {"r" 5}
             :latest-remote-checksum {"r" "cs"}}
            "r"]
           @captured))))

;; Fails if, in `broadcast-rtc-state!`, the body becomes `nil`.
(deftest broadcast-rtc-state-sends-the-presence-payload-of-a-client
  (let [sent (atom [])]
    (with-redefs [shared-service/broadcast-to-clients! (fn [& args] (swap! sent conj (vec args)))
                  sync-presence/rtc-state-payload (fn [sync-counts-f client] [:payload client (fn? sync-counts-f)])]
      (#'sync-apply/broadcast-rtc-state! {:repo "r"})
      (#'sync-apply/broadcast-rtc-state! nil))
    (is (= [[:rtc-sync-state [:payload {:repo "r"} true]]] @sent))))

;; Fails if, in `auth-headers`, the body becomes `nil`.
(deftest auth-headers-come-from-the-id-token
  (with-redefs [sync-auth/auth-headers (fn [token] [:headers token])
                worker-state/get-id-token (fn [] "tok")]
    (is (= [:headers "tok"] (#'sync-apply/auth-headers)))))

;; Fails if, in `ws-ready-state`, the body becomes `nil`.
(deftest ws-ready-state-reads-the-socket-or-nothing
  (is (nil? (#'sync-apply/ws-ready-state nil)))
  (is (= 1 (#'sync-apply/ws-ready-state #js {:readyState 1}))))

;; Fails if, in `perf-time-ms`, the body becomes `nil`.
(deftest perf-time-ms-is-a-number
  (is (number? (#'sync-apply/perf-time-ms))))

;; Fails if, in `upload-large-title!`, the body becomes `nil`, the `:repo` key is dropped, the `:graph-id` key is dropped, the `:title` key is dropped, the `:aes-key` key is dropped, the `:http-base` key is dropped, the `:auth-headers` key is dropped, the `:fail-fast-f` key is dropped or the `:encrypt-text-value-f` key is dropped.
;; Fails if, in `rehydrate-large-titles!`, the `:repo` key is dropped, the `:graph-id` key is dropped, the `:obj` key is dropped, the `:aes-key` key is dropped, the `:http-base` key is dropped, the `:auth-headers` key is dropped, the `:fail-fast-f` key is dropped or the `:decrypt-text-value-f` key is dropped.
;; Fails if, in `rehydrate-large-titles-from-db!`, the body becomes `nil`, the `:get-conn-f` key is dropped or the `:rehydrate-large-titles!-f` key is dropped.
(deftest large-title-wrappers-pass-the-worker-context
  (let [calls (atom [])]
    (with-redefs [sync-auth/http-base-url (fn [config] [:http-base config])
                  sync-auth/auth-headers (fn [token] [:headers token])
                  worker-state/get-id-token (fn [] "tok")
                  sync-large-title/upload-large-title! (fn [opts] (swap! calls conj [:upload opts]) :uploaded)
                  sync-large-title/download-large-title! (fn [opts] (swap! calls conj [:download opts]) :downloaded)
                  sync-large-title/rehydrate-large-titles! (fn [repo opts] (swap! calls conj [:rehydrate repo opts]) :rehydrated)
                  sync-large-title/rehydrate-large-titles-from-db! (fn [repo graph-id opts]
                                                                     (swap! calls conj [:from-db repo graph-id opts])
                                                                     :from-db)]
      (let [http-base [:http-base @worker-state/*db-sync-config]
            headers [:headers "tok"]]
        (is (= :uploaded (sync-apply/upload-large-title! "r" "g" "title" :key)))
        (is (= [:upload {:repo "r"
                         :graph-id "g"
                         :title "title"
                         :aes-key :key
                         :http-base http-base
                         :auth-headers headers
                         :fail-fast-f sync-util/fail-fast
                         :encrypt-text-value-f sync-crypt/<encrypt-text-value}]
               (first @calls)))
        (reset! calls [])
        (is (= :rehydrated (sync-apply/rehydrate-large-titles! "r" {:tx-data []})))
        (let [[_ repo opts] (first @calls)
              download-fn (:download-fn opts)]
          (is (= "r" repo))
          (is (= [] (:tx-data opts)))
          (is (= {:get-conn-f worker-state/get-datascript-conn
                  :graph-e2ee?-f sync-crypt/graph-e2ee?
                  :ensure-graph-aes-key-f sync-crypt/<ensure-graph-aes-key
                  :fail-fast-f sync-util/fail-fast}
                 (select-keys opts [:get-conn-f :graph-e2ee?-f :ensure-graph-aes-key-f :fail-fast-f])))
          (reset! calls [])
          (is (= :downloaded (download-fn "repo2" "gid" :obj :key)))
          (is (= [[:download {:repo "repo2"
                              :graph-id "gid"
                              :obj :obj
                              :aes-key :key
                              :http-base http-base
                              :auth-headers headers
                              :fail-fast-f sync-util/fail-fast
                              :decrypt-text-value-f sync-crypt/<decrypt-text-value}]]
                 @calls)))
        (reset! calls [])
        (is (= :from-db (sync-apply/rehydrate-large-titles-from-db! "r" "g")))
        (is (= [[:from-db "r" "g" {:get-conn-f worker-state/get-datascript-conn
                                    :rehydrate-large-titles!-f sync-apply/rehydrate-large-titles!}]]
               @calls))))))

;; Fails if, in `request-asset-download!`, the `:broadcast-rtc-state!-f` key is dropped.
(deftest request-asset-download-passes-the-worker-callbacks
  (let [calls (atom [])]
    (with-redefs [sync-assets/request-asset-download! (fn [repo asset-uuid opts] (swap! calls conj [repo asset-uuid opts]) :requested)]
      (is (= :requested (sync-apply/request-asset-download! "r" :asset))))
    (is (= [["r" :asset {:current-client-f @#'sync-apply/current-client
                       :enqueue-asset-task-f sync-assets/enqueue-asset-task!
                       :broadcast-rtc-state!-f @#'sync-apply/broadcast-rtc-state!}]]
           @calls))))

;; ignored attrs and normalization

;; Fails if, in `reverse-data-ignored-attrs`, `:block/tx-id` becomes `:block/uuid`.
;; Fails if, in `normalize-tx-data`, the `remove-ignored-attrs` step is dropped or the `(remove (fn [[_op e]]` step is dropped.
(deftest normalize-tx-data-drops-ignored-attrs-and-ignored-entities
  (let [conn (three-blocks-conn)
        _ (d/transact! conn [{:db/ident :logseq.kv/graph-uuid :block/title "kv"}])
        db @conn
        b (db-test/find-block-by-content db "b")
        kv (d/entity db :logseq.kv/graph-uuid)
        t 536870913
        tx-data [(d/datom (:db/id b) :block/title "b2" t true)
                 (d/datom (:db/id b) :block/tx-id 99 t true)
                 (d/datom (:db/id kv) :block/title "kv2" t true)]]
    (is (= [[:db/add [:block/uuid (:block/uuid b)] :block/title "b2" t]]
           (vec (#'sync-apply/normalize-tx-data db db tx-data))))))

;; Fails if, in `reverse-tx-data`, the `db-normalize/reorder-retract-entity` step is dropped.
(deftest reverse-tx-data-puts-the-retract-entity-after-the-other-retracts
  (let [conn (three-blocks-conn)
        db-before @conn
        ux (random-uuid)
        uy (random-uuid)
        report (d/with db-before [{:block/uuid ux :block/title "x"} {:block/uuid uy :block/title "y"}])
        db-after (:db-after report)
        tx-data (:tx-data report)
        ;; the reversal meets the uuid of x first and the title of y second
        ordered (vec (concat (filter #(and (= :block/title (:a %)) (= "y" (:v %))) tx-data)
                             (filter #(and (= :block/uuid (:a %)) (= ux (:v %))) tx-data)))
        t (:tx (first ordered))]
    (is (= [[:db/retract [:block/uuid uy] :block/title "y" t]
            [:db/retractEntity [:block/uuid ux]]]
           (vec (sync-apply/reverse-tx-data db-before db-after ordered))))))

;; Fails if, in `rebase-history-ops`, the `:inverse-ops` key is dropped.
(deftest rebase-history-ops-keeps-the-recorded-inverse-ops
  (let [conn (three-blocks-conn)
        result (#'sync-apply/rebase-history-ops {:tx [] :inverse-outliner-ops [[:save-block [{:block/uuid (random-uuid)} {}]]]} @conn)]
    (is (= 1 (count (:inverse-ops result))))
    (is (nil? (:forward-ops result)))
    (is (contains? result :inverse-ops))))

;; Fails if, in `normalize-tx-data-for-rebase`, the `(mapv (fn [item]` step is dropped or the `db-normalize/reorder-retract-entity` step is dropped.
(deftest normalize-tx-data-for-rebase-trims-datoms-and-moves-retract-entity-last
  (let [f #'sync-apply/normalize-tx-data-for-rebase
        ref [:block/uuid (random-uuid)]]
    (is (nil? (f nil)))
    (is (= [[:db/add 1 :a 2]] (vec (f [[:db/add 1 :a 2 99]]))))
    (is (= [[:db/add ref :block/title "x"] [:db/add 5 :a 1] [:db/retractEntity ref]]
           (vec (f [[:db/retractEntity ref] [:db/add ref :block/title "x" 7] [:db/add 5 :a 1 7]]))))))

;; Fails if, in `inferred-outliner-ops?`, the body becomes `nil`.
(deftest inferred-outliner-ops-only-for-plain-local-transactions
  (let [f #'sync-apply/inferred-outliner-ops?]
    (is (true? (f {})))
    (is (false? (f {:outliner-ops [[:save-block]]})))
    (is (false? (f {:undo? true})))
    (is (false? (f {:redo? true})))
    (is (false? (f {:outliner-op :batch-import-edn})))))

;; Fails if, in `apply-tx-meta`, the body becomes `nil`, the `:transact-remote?` key is dropped, the `:persist-op?` key is dropped or the `:t` key is dropped.
(deftest apply-tx-meta-describes-a-remote-transaction
  (let [f #'sync-apply/apply-tx-meta]
    (is (= {:transact-remote? true :persist-op? false :t 5} (f {:t 5})))
    (is (= {:transact-remote? true :persist-op? false :t 5 :outliner-op :save-block}
           (f {:t 5 :outliner-op :save-block})))
    (is (= {:transact-remote? true :persist-op? false :t 1 :outliner-op :db-migrate
            :db-migrate? true :skip-validate-db? true}
           (f {:t 1 :outliner-op :db-migrate})))))

;; upload timeout

;; Fails if, in `report-upload-response-timeout!`, the `:elapsed-ms` key is dropped, the `:t-before` key is dropped, the `:latest-remote-tx` key is dropped, the `:current-local-tx` key is dropped, the `:online?` key is dropped, the `:ws-open?` key is dropped or the `:ws-ready-state` key is dropped.
(deftest report-upload-response-timeout-posts-the-request-context
  (let [posted (atom [])
        original-remote @sync-apply/*repo->latest-remote-tx
        u1 (random-uuid)
        u2 (random-uuid)]
    (reset! sync-apply/*repo->latest-remote-tx {"r" 9})
    (try
      (with-redefs [worker-state/online? (constantly true)
                    sync-transport/ws-open? (constantly true)
                    common-util/time-ms (constantly 1500)
                    client-op/get-local-tx (fn [_] 8)
                    platform/current (fn [] :platform)
                    platform/post-message! (fn [p type payload] (swap! posted conj [p type payload]))]
        (#'sync-apply/report-upload-response-timeout!
         {:repo "r" :graph-id "g" :ws #js {:readyState 1}}
         {:sent-at 1000 :tx-ids [u1 u2] :t-before 7 :outliner-ops [:save-block :save-block]}))
      (finally
        (reset! sync-apply/*repo->latest-remote-tx original-remote)))
    (let [[[p type payload]] @posted]
      (is (= 1 (count @posted)))
      (is (= :platform p))
      (is (= :capture-error type))
      (is (= {:source "db-sync"
              :operation "upload-tx-batch"
              :repo "r"
              :graph-id "g"
              :timeout-ms 120000
              :elapsed-ms 500
              :tx-count 2
              :t-before 7
              :latest-remote-tx 9
              :current-local-tx 8
              :online? true
              :ws-open? true
              :ws-ready-state 1
              :outliner-op "save-block,save-block"}
             (:payload payload)))
      (is (= {:tx-ids [(str u1) (str u2)] :outliner-ops ["save-block" "save-block"]}
             (:extra payload))))))

;; Fails if, in `clear-upload-response-timeout!`, the `(dissoc :timer)` step is dropped.
(deftest clear-upload-response-timeout-returns-the-request-without-its-timer
  (let [*request (atom {:tx-ids [1] :timer (js/setTimeout (fn []) 100000)})]
    (is (= {:tx-ids [1]} (sync-apply/clear-upload-response-timeout! {:upload-request *request})))
    (is (nil? @*request))))

;; tx item helpers

;; Fails if, in `tx-item-block-uuid`, the body becomes `nil`, `:block/uuid` becomes `:block/_raw-parent` or the `:block/uuid` step is dropped.
(deftest tx-item-block-uuid-resolves-uuids-lookup-refs-and-entity-ids
  (let [conn (three-blocks-conn)
        db @conn
        b (db-test/find-block-by-content db "b")
        u (random-uuid)
        f #'sync-apply/tx-item-block-uuid]
    (is (= u (f db u)))
    (is (= u (f db [:block/uuid u])))
    (is (= (:block/uuid b) (f db (:db/id b))))
    (is (nil? (f db 987654)))
    (is (nil? (f db "x")))
    (is (nil? (f db [:block/uuid "x"])))))

;; Fails if, in `tx-item-entity-block-uuid`, the body becomes `nil`.
(deftest tx-item-entity-block-uuid-uses-the-temp-id-map-then-the-db
  (let [conn (three-blocks-conn)
        db @conn
        b (db-test/find-block-by-content db "b")
        u (random-uuid)
        f #'sync-apply/tx-item-entity-block-uuid]
    (is (= (:block/uuid b) (f db [:db/add (:db/id b) :block/title "x"])))
    (is (nil? (f db {:e (:db/id b)})))
    (is (= u (f db {(:db/id b) u} [:db/add (:db/id b) :block/title "x"])))))

;; Fails if, in `remote-txs-retract-entity-block-uuid-suffixes`, the `vec` step is dropped.
(deftest remote-txs-retract-entity-block-uuid-suffixes-collect-the-later-deletions
  (let [u1 (random-uuid)
        u2 (random-uuid)
        result (#'sync-apply/remote-txs-retract-entity-block-uuid-suffixes
                [{:tx-data [[:db/retractEntity [:block/uuid u1]]]}
                 {:tx-data [[:db.fn/retractEntity [:block/uuid u2]] [:db/add 1 :a 2]]}])]
    (is (vector? result))
    (is (= [#{u1 u2} #{u2}] result))))

;; Fails if, in `drop-stale-adds-after-remote-entity-delete`, the `(map tx-item-entity)` step is dropped, the `set` step is dropped or `:block/uuid` becomes `:block/_raw-parent`.
(deftest drop-stale-adds-after-remote-entity-delete-keeps-recreated-entities
  (let [u1 (random-uuid)
        u2 (random-uuid)
        tx-data [[:db/retract 1 :block/uuid u1]
                 [:db/add 1 :block/title "stale"]
                 [:db/retract 2 :block/uuid u2]
                 [:db/add 2 :block/uuid u2]
                 [:db/add 2 :block/title "kept"]
                 [:db/add 3 :block/uuid (random-uuid)]
                 [:db/add 4 :block/uuid (random-uuid)]]]
    (is (= (into [[:db/retract 1 :block/uuid u1]
                  [:db/retract 2 :block/uuid u2]
                  [:db/add 2 :block/uuid u2]
                  [:db/add 2 :block/title "kept"]]
                 (subvec tx-data 5))
           (vec (#'sync-apply/drop-stale-adds-after-remote-entity-delete tx-data))))))

;; upload grouping

;; Fails if, in `cardinality-many-attr?`, the body becomes `nil` or `:db/cardinality` becomes `:db/cas`.
(deftest cardinality-many-attr-reads-the-schema-then-the-attribute-entity
  (let [ident {:db/ident {:db/unique :db.unique/identity}}
        schema-db (d/empty-db (assoc ident :foo {:db/cardinality :db.cardinality/many}))
        ;; datoms loaded as they are, so the schema does not know them
        ident-db (d/init-db [(d/datom 100 :db/ident :bar) (d/datom 100 :db/cardinality :db.cardinality/many)
                             (d/datom 101 :db/ident :baz) (d/datom 101 :db/cardinality :db.cardinality/one)]
                            ident)
        f #'sync-apply/cardinality-many-attr?]
    (is (true? (f schema-db :foo)))
    (is (false? (f schema-db :other)))
    (is (true? (f ident-db :bar)))
    (is (false? (f ident-db :baz)))))

;; Fails if, in `ref-attr?`, `:db/valueType` becomes `:db/add`.
(deftest ref-attr-reads-the-schema-then-the-attribute-entity
  (let [ident {:db/ident {:db/unique :db.unique/identity}}
        schema-db (d/empty-db (assoc ident :foo {:db/valueType :db.type/ref}))
        ident-db (d/init-db [(d/datom 100 :db/ident :bar) (d/datom 100 :db/valueType :db.type/ref)
                             (d/datom 101 :db/ident :baz) (d/datom 101 :db/valueType :db.type/string)]
                            ident)
        f #'sync-apply/ref-attr?]
    (is (true? (f schema-db :foo)))
    (is (false? (f schema-db :other)))
    (is (true? (f ident-db :bar)))
    (is (false? (f ident-db :baz)))))

;; Fails if, in `upload-tx-item-group-keys`, `:db/id` becomes `:db/retract`, `:db/cas` becomes `:db/id`, `:db.fn/cas` becomes `:db.fn/retractEntity`, `:db/retractEntity` becomes `:db/valueType` or `:db.fn/retractEntity` becomes `:db.fn/cas`.
(deftest upload-tx-item-group-keys-covers-maps-cas-and-retract-entity-forms
  (let [f #'sync-apply/upload-tx-item-group-keys]
    (is (= #{-1} (f nil #{} {:db/id -1 :block/title "x"})))
    (is (= #{} (f nil #{} {:db/id 5 :block/title "x"})))
    (is (= #{-1} (f nil #{} [:db/cas -1 :block/title "x" "y"])))
    (is (= #{"t"} (f nil #{} [:db.fn/cas "t" :block/title "x" "y"])))
    (is (= #{-3} (f nil #{} [:db/retractEntity -3])))
    (is (= #{"x"} (f nil #{} [:db.fn/retractEntity "x"])))
    (is (= #{} (f nil #{} [:db/retractEntity 5])))))

;; Fails if, in `clear-large-upload-progress!`, the `(map #(large-upload-progress-key repo...` step is dropped, the `seq` step is dropped or `filter` becomes `remove`.
(deftest clear-large-upload-progress-forgets-only-the-given-transactions
  (let [*progress @#'sync-apply/*repo->large-upload-progress
        original @*progress
        u1 (random-uuid)
        u2 (random-uuid)
        writes (atom 0)]
    (try
      (reset! *progress {["r" u1] 5 ["r" u2] 7})
      (add-watch *progress ::count (fn [& _] (swap! writes inc)))
      (#'sync-apply/clear-large-upload-progress! "r" [])
      (is (= 0 @writes) "Nothing to clear writes nothing")
      (#'sync-apply/clear-large-upload-progress! "r" [u1 nil])
      (is (= {["r" u2] 7} @*progress))
      (finally
        (remove-watch *progress ::count)
        (reset! *progress original)))))

;; persisting a local transaction

;; Fails if, in `persist-local-tx!`, the `:created-at` key is dropped, the `:pending?` key is dropped, the `:failed?` key is dropped, the `:undo-redo` key is dropped, the `:inferred-outliner-ops?` key is dropped or the `:apply-history-action!` key is dropped.
(deftest persist-local-tx-stores-the-client-op-entry-and-records-undo
  (let [entries (atom [])
        undo-calls (atom [])
        pending (atom [])
        id (random-uuid)
        report {:db-before :before :db-after :after :tx-data [1 2]}
        persist! (fn [tx-meta normalized reversed]
                   (#'sync-apply/persist-local-tx! "r" (assoc report :tx-meta tx-meta) normalized reversed))]
    (with-redefs [worker-state/get-client-ops-conn (fn [_] :ops-conn)
                  op-construct/derive-history-outliner-ops (fn [& _] {:forward-outliner-ops [:fwd] :inverse-outliner-ops [:inv]})
                  client-op/upsert-local-tx-entry! (fn [repo entry] (swap! entries conj [repo entry]) {:should-inc-pending? true})
                  worker-undo-redo/gen-undo-ops! (fn [& args] (swap! undo-calls conj (vec args)))
                  client-op/adjust-pending-local-tx-count! (fn [repo n] (swap! pending conj [repo n]))]
      (is (= id (persist! {:db-sync/tx-id id :outliner-op :save-block} [:n1] [:r1])))
      (persist! {:db-sync/tx-id id :undo? true :db-migrate? true} [:n2] [:r2])
      (persist! {:db-sync/tx-id id :redo? true} [:n3] [:r3]))
    (let [base {:tx-id id
                :pending? true
                :failed? false
                :forward-outliner-ops [:fwd]
                :inverse-outliner-ops [:inv]}]
      (is (= [["r" (assoc base
                          :outliner-op :save-block
                          :undo-redo :none
                          :inferred-outliner-ops? true
                          :normalized-tx-data [:n1]
                          :reversed-tx-data [:r1])]
              ["r" (assoc base
                          :outliner-op :db-migrate
                          :undo-redo :undo
                          :inferred-outliner-ops? false
                          :normalized-tx-data [:n2]
                          :reversed-tx-data [:r2])]
              ["r" (assoc base
                          :outliner-op nil
                          :undo-redo :redo
                          :inferred-outliner-ops? false
                          :normalized-tx-data [:n3]
                          :reversed-tx-data [:r3])]]
             (mapv (fn [[repo entry]] [repo (dissoc entry :created-at)]) @entries)))
      (is (every? (fn [[_ entry]] (number? (:created-at entry))) @entries)))
    (is (= 3 (count @undo-calls)))
    (is (= ["r" (assoc report :tx-meta {:db-sync/tx-id id :outliner-op :save-block}) id {:apply-history-action! sync-apply/apply-history-action!}]
           (first @undo-calls)))
    (is (= [["r" 1] ["r" 1] ["r" 1]] @pending))))

;; uploading

(defn- settle
  "Resolves to [:ok value] or [:err error] whichever way `promise` ends."
  [promise]
  (-> (p/then (p/resolved nil) (fn [_] promise))
      (p/then (fn [v] [:ok v]))
      (p/catch (fn [e] [:err e]))))

;; Fails if, in `<upload-aes-key`, the body becomes `nil`, `:db-sync/missing-field` becomes `:db-sync/rebased-local?`, the `:repo` key is dropped or the `:field` key is dropped.
(deftest upload-aes-key-is-needed-only-for-e2ee-graphs-with-entries
  (async done
    (let [calls (atom [])
          *e2ee? (atom false)
          *key-result (atom nil)
          original-e2ee? sync-crypt/graph-e2ee?
          original-ensure sync-crypt/<ensure-graph-aes-key
          run (fn [e2ee? entries key-result]
                (reset! *e2ee? e2ee?)
                (reset! *key-result key-result)
                (settle (#'sync-apply/<upload-aes-key "r" {:graph-id "g"} entries)))]
      (set! sync-crypt/graph-e2ee? (fn [_] @*e2ee?))
      (set! sync-crypt/<ensure-graph-aes-key (fn [repo graph-id]
                                               (swap! calls conj [repo graph-id])
                                               (p/resolved @*key-result)))
      (-> (p/let [plain (run false [{:tx-data [1]}] :k)
                  no-entries (run true [] :k)
                  keyed (run true [{:tx-data [1]}] :k)
                  missing (run true [{:tx-data [1]}] nil)]
            (is (= [:ok nil] plain))
            (is (= [:ok nil] no-entries))
            (is (= [:ok :k] keyed))
            (is (= [["r" "g"] ["r" "g"]] @calls))
            (is (= :err (first missing)))
            (is (= "missing-field" (ex-message (second missing))))
            (is (= {:repo "r" :field :aes-key} (ex-data (second missing)))))
          (p/catch (fn [e] (is false (str e))))
          (p/finally (fn [_ _]
                       (set! sync-crypt/graph-e2ee? original-e2ee?)
                       (set! sync-crypt/<ensure-graph-aes-key original-ensure)
                       (done)))))))

;; Fails if, in `<encrypt-tx-entry`, the `:repo` key is dropped, the `:graph-id` key is dropped or the `:aes-key` key is dropped.
(deftest encrypt-tx-entry-offloads-the-large-titles-of-the-entry
  (async done
    (let [calls (atom [])
          original sync-large-title/offload-large-titles]
      (set! sync-large-title/offload-large-titles (fn [tx-data opts]
                                                    (swap! calls conj [tx-data opts])
                                                    (p/resolved [:offloaded])))
      (-> (#'sync-apply/<encrypt-tx-entry "r" {:graph-id "g"} nil {:tx-id 1 :tx-data [:orig]})
          (p/then (fn [entry]
                    (is (= {:tx-id 1 :tx-data [:offloaded]} entry))
                    (is (= [[[:orig] {:repo "r" :graph-id "g" :aes-key nil}]]
                           (mapv (fn [[tx-data opts]] [tx-data (select-keys opts [:repo :graph-id :aes-key])]) @calls)))))
          (p/catch (fn [e] (is false (str e))))
          (p/finally (fn [_ _]
                       (set! sync-large-title/offload-large-titles original)
                       (done)))))))

;; Fails if, in `send-tx-batch!`, the `:client-revision` key is dropped, the `:t-before` key is dropped, the `distinct` step is dropped or the `vec` step is dropped.
(deftest send-tx-batch-sends-the-payload-and-starts-the-response-timer
  (async done
    (let [sent (atom [])
          *inflight (atom nil)
          *upload-request (atom nil)
          client {:ws :ws :inflight *inflight :upload-request *upload-request}
          u1 (random-uuid)
          u2 (random-uuid)
          entries [{:tx-id u1 :outliner-op :save-block}
                   {:tx-id u2 :outliner-op :save-block}
                   {:outliner-op :insert-blocks}]
          entries* [{:tx-id u1 :outliner-op :save-block :tx-data [[:db/add 1 :a 2]]}]
          original-send sync-transport/send!
          original-revision build-version/revision]
      (set! build-version/revision (fn [] "rev-1"))
      (set! sync-transport/send! (fn [_coerce ws message] (swap! sent conj [ws message]) nil))
      (-> (#'sync-apply/send-tx-batch! client 7 entries entries*)
          (p/then (fn [_]
                    (is (= [u1 u2] @*inflight))
                    (is (= [[:ws {:type "tx/batch"
                                  :client-revision "rev-1"
                                  :t-before 7
                                  :txs [{:tx (sqlite-util/write-transit-str [[:db/add 1 :a 2]])
                                         :tx-id (str u1)
                                         :outliner-op :save-block}]}]]
                           @sent))
                    (let [request @*upload-request]
                      (is (vector? (:outliner-ops request)))
                      (is (= {:tx-ids [u1 u2]
                              :outliner-ops [:save-block :insert-blocks]
                              :large-upload-progress []
                              :t-before 7}
                             (select-keys request [:tx-ids :outliner-ops :large-upload-progress :t-before])))
                      (is (number? (:sent-at request)))
                      (is (some? (:timer request))))))
          (p/catch (fn [e] (is false (str e))))
          (p/finally (fn [_ _]
                       (set! build-version/revision original-revision)
                       (set! sync-transport/send! original-send)
                       (sync-apply/clear-upload-response-timeout! client)
                       (done)))))))

;; Fails if, in `<upload-pending-batch!`, the `:limit` key is dropped or the `(p/catch (fn [error]` step is dropped.
(deftest upload-pending-batch-asks-for-fifty-pending-txs-and-records-send-failures
  (async done
    (let [limits (atom [])
          *last-error (atom nil)
          client {:graph-id "g" :last-sync-error *last-error}
          conn (three-blocks-conn)
          pending [{:tx-id (random-uuid) :outliner-op :save-block :tx [[:db/add 1 :block/title "x"]]}]
          original-pending client-op/get-pending-local-txs
          original-e2ee? sync-crypt/graph-e2ee?
          original-ensure sync-crypt/<ensure-graph-aes-key]
      (with-redefs [client-op/get-pending-local-txs (fn [_repo & args] (swap! limits conj (vec args)) [])]
        (is (nil? (#'sync-apply/<upload-pending-batch! "r" client conn 1))))
      (is (= [[:limit 50]] @limits))
      (set! client-op/get-pending-local-txs (fn [& _] pending))
      (set! sync-crypt/graph-e2ee? (constantly true))
      (set! sync-crypt/<ensure-graph-aes-key (fn [& _] (p/resolved nil)))
      (-> (#'sync-apply/<upload-pending-batch! "r" client conn 1)
          (p/then (fn [_] (is (some? @*last-error) "The missing key is kept as the last sync error")))
          (p/catch (fn [e] (is false (str "The failure must not escape: " e))))
          (p/finally (fn [_ _]
                       (set! client-op/get-pending-local-txs original-pending)
                       (set! sync-crypt/graph-e2ee? original-e2ee?)
                       (set! sync-crypt/<ensure-graph-aes-key original-ensure)
                       (done)))))))

;; Fails if, in `enqueue-flush-pending!`, the `(p/catch (fn [_] nil))` step is dropped or the `(p/catch (fn [error]` step is dropped.
(deftest enqueue-flush-pending-chains-the-flushes-and-survives-failures
  (async done
    (let [calls (atom 0)
          original sync-apply/flush-pending!
          client {:send-queue (atom (p/rejected (ex-info "earlier" {})))}]
      (set! sync-apply/flush-pending! (fn [_repo _client] (swap! calls inc) (throw (ex-info "boom" {}))))
      (sync-apply/enqueue-flush-pending! "r" client)
      (sync-apply/enqueue-flush-pending! "r" client)
      (-> @(:send-queue client)
          (p/then (fn [_] (is (= 2 @calls) "A rejected predecessor does not stop the next flush")))
          (p/catch (fn [e] (is false (str "The queue must not reject: " e))))
          (p/finally (fn [_ _]
                       (set! sync-apply/flush-pending! original)
                       (done)))))))

;; replay data of a local tx

;; Fails if, in `local-tx-has-replay-data?`, the body becomes `nil`.
(deftest local-tx-has-replay-data-when-any-recorded-data-is-left
  (let [f #'sync-apply/local-tx-has-replay-data?]
    (is (f {:tx [[:db/add 1 :a 2]]}))
    (is (f {:reversed-tx [[:db/add 1 :a 2]]}))
    (is (f {:forward-outliner-ops [[:save-block]]}))
    (is (f {:inverse-outliner-ops [[:save-block]]}))
    (is (not (f {:tx [] :reversed-tx nil})))))

;; Fails if, in `large-upload-progress`, the `(keep (fn [{:keys [large-upload-origi...` step is dropped, the `vec` step is dropped or the `:large-upload-final?` key is dropped.
(deftest large-upload-progress-lists-the-chunked-entries
  (let [u (random-uuid)
        result (#'sync-apply/large-upload-progress
                [{:tx-id 1}
                 {:large-upload-original-tx-id u
                  :large-upload-next-index 5
                  :large-upload-final? false
                  :tx-data [1]}])]
    (is (vector? result))
    (is (= [{:large-upload-original-tx-id u
             :large-upload-next-index 5
             :large-upload-final? false}]
           result))))

;; rejected transactions

;; Fails if, in `rollback-and-mark-failed-txs!`, the `(filter uuid?)` step is dropped, the `(drop-while #(not (contains? rejected...` step is dropped, the `vec` step is dropped, the `:rtc-tx?` key is dropped, the `:tx-reject-rollback?` key is dropped, the `:listen-db` key is dropped, `:db-sync/rebased-local?` becomes `:db-sync/replayed-tx-data?`, the `(map :tx-id)` step is dropped, the `(filter (fn [{:keys [status]}]` step is dropped, the `(keep :tx-id)` step is dropped, the `distinct` step is dropped or `filter` becomes `remove`.
(deftest rollback-and-mark-failed-txs-rebases-the-pending-txs-after-the-rejected-one
  (let [conn (three-blocks-conn)
        [u0 u1 u2 u3 u4] (repeatedly 5 random-uuid)
        replay-ops [[:delete-blocks [[] {}]]]
        pending [{:tx-id u0 :outliner-op :save-block :forward-outliner-ops replay-ops}
                 {:tx-id u1 :outliner-op :save-block :forward-outliner-ops replay-ops}
                 {:tx-id u2 :outliner-op :fix :tx [[:db/add 1 :a 2]]}
                 {:tx-id u3 :outliner-op :save-block :forward-outliner-ops replay-ops}
                 {:tx-id u3 :outliner-op :save-block :forward-outliner-ops replay-ops}
                 {:tx-id u4 :outliner-op :save-block}]
        reversed (atom [])
        batches (atom [])
        handled (atom [])
        stale (atom [])
        failed (atom [])
        report #(assoc {:tx-data [1]} :tx-meta %)
        rebased-report (report {:outliner-op :rebase :db-sync/rebased-local? true})
        rollback! (fn [tx-ids pending-txs]
               (with-redefs [worker-state/get-datascript-conn (constantly conn)
                             sync-apply/pending-txs (fn [_repo & _] pending-txs)
                             sync-apply/reverse-local-txs! (fn [_conn txs] (swap! reversed conj txs) nil)
                             sync-apply/handle-local-tx! (fn [repo tx-report] (swap! handled conj [repo tx-report]))
                             sync-apply/mark-pending-txs-false! (fn [repo ids] (swap! stale conj [repo ids]))
                             sync-apply/mark-failed-txs! (fn [repo ids] (swap! failed conj [repo ids]))
                             worker-undo-redo/clear-history! (fn [_repo] nil)
                             ldb/batch-transact-with-temp-conn!
                             (fn [conn* tx-meta f & [opts]]
                               (swap! batches conj tx-meta)
                               (f conn*)
                               (when (:listen-db opts)
                                 (doseq [r [rebased-report
                                            (report {:outliner-op :rebase})
                                            (report {:outliner-op :save-block :db-sync/rebased-local? true})
                                            (assoc rebased-report :tx-data [])]]
                                   ((:listen-db opts) r)))
                               ;; the rollback batch commits a report, a replayed rebase makes none
                               (when (:tx-reject-rollback? tx-meta)
                                 {:tx-data []}))]
                 (sync-apply/rollback-and-mark-failed-txs! "r" tx-ids)))]
    (rollback! [u1 "not-a-uuid"] pending)
    (is (= [[u1 u2 u3 u3 u4]] (mapv #(mapv :tx-id %) @reversed)))
    (is (vector? (first @reversed)))
    (is (= (mapv :tx-id (first @reversed)) (mapv :tx-id (subvec pending 1))))
    (is (= {:rtc-tx? true :tx-reject-rollback? true} (first @batches)))
    (is (= [["r" rebased-report]] @handled)
        "Only a rebased local transaction with data is handled again")
    (is (= [["r" [u3]]] @stale)
        "Only a rebase that failed or did nothing, of a tx with replay data, is no longer pending")
    (is (vector? (second (first @stale))))
    (is (= [["r" [u1 "not-a-uuid"]]] @failed))
    ;; a tx id that is not a uuid is no rejection
    (reset! reversed [])
    (reset! batches [])
    (rollback! [1] [{:tx-id 1 :outliner-op :save-block :forward-outliner-ops replay-ops}])
    (is (empty? @reversed))
    (is (empty? @batches))))

;; history actions

;; Fails if, in `expected-history-action-error-reason?`, the body becomes `nil`.
(deftest expected-history-action-error-reason-names-the-invalid-action-reasons
  (let [f #'sync-apply/expected-history-action-error-reason?]
    (is (true? (f :invalid-history-action-ops)))
    (is (true? (f :invalid-history-action-tx)))
    (is (false? (f :error)))))

;; Fails if, in `inline-history-action`, the `:outliner-op` key is dropped.
(deftest inline-history-action-needs-forward-and-inverse-ops
  (let [f #'sync-apply/inline-history-action
        forward [[:save-block [{} {}]]]
        inverse [[:save-block [{} {}]]]]
    (is (= {:outliner-op :save-block :forward-outliner-ops forward :inverse-outliner-ops inverse}
           (f {:outliner-op :save-block
               :db-sync/forward-outliner-ops forward
               :db-sync/inverse-outliner-ops inverse})))
    (is (= {:outliner-op :save-block :forward-outliner-ops forward :inverse-outliner-ops inverse}
           (f {:outliner-op :save-block
               :forward-outliner-ops forward
               :inverse-outliner-ops inverse})))
    (is (nil? (f {:outliner-op :save-block :forward-outliner-ops forward})))))

;; Fails if, in `apply-history-action!`, the `:action` key is dropped, the `:applied?` key is dropped, the `:reason` key is dropped, the `:tx-id` key is dropped, `:db-sync/missing-db` becomes `:db-sync/missing-field`, the `:repo` key is dropped or the `:op` key is dropped.
(deftest apply-history-action-reports-why-nothing-was-applied
  (let [conn (three-blocks-conn)
        id (random-uuid)
        fix-action {:tx-id id :outliner-op :fix}
        error (try
                (sync-apply/apply-history-action! "no-such-repo" id true {})
                nil
                (catch :default e e))]
    (is (= "missing-db" (ex-message error)))
    (is (= {:repo "no-such-repo" :op :apply-history-action} (ex-data error)))
    (with-redefs [worker-state/get-datascript-conn (constantly conn)
                  client-op/get-local-tx-entry (constantly nil)]
      (is (= {:applied? false :reason :missing-history-action :tx-id id}
             (sync-apply/apply-history-action! "r" id true {}))))
    (with-redefs [worker-state/get-datascript-conn (constantly conn)
                  client-op/get-local-tx-entry (constantly fix-action)]
      (is (= {:applied? false :reason :unsupported-history-action :action fix-action}
             (sync-apply/apply-history-action! "r" id true {}))))))

;; Fails if, in `apply-history-action!`, `:db-sync/tx-id` becomes `:db-sync/upload-response-timeout`, the `:outliner-op` key is dropped, the `:local-tx?` key is dropped, the `:persist-op?` key is dropped, the `:undo?` key is dropped or the `:redo?` key is dropped.
(deftest apply-history-action-replays-the-semantic-ops-with-a-history-tx-meta
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        b-uuid (:block/uuid b)
        id (random-uuid)
        history-id (random-uuid)
        source-id (random-uuid)
        forward [[:save-block [{:block/uuid b-uuid :block/title "forward"} {}]]]
        inverse [[:save-block [{:block/uuid b-uuid :block/title "inverse"} {}]]]
        action {:tx-id id
                :outliner-op :save-block
                :forward-outliner-ops forward
                :inverse-outliner-ops inverse
                :tx [[:db/add (:db/id b) :block/title "ignored" 1]]
                :reversed-tx [[:db/add (:db/id b) :block/title "ignored" 1]]}
        title #(:block/title (d/entity @conn (:db/id b)))
        meta-keys [:outliner-op :local-tx? :gen-undo-ops? :persist-op? :undo? :redo?
                   :db-sync/tx-id :db-sync/source-tx-id
                   :db-sync/forward-outliner-ops :db-sync/inverse-outliner-ops]
        apply! (fn [undo? tx-meta]
                 (let [result (atom nil)
                       metas (with-redefs [worker-state/get-datascript-conn (constantly conn)
                                           client-op/get-local-tx-entry (constantly action)]
                               (captured-tx-metas conn #(reset! result (sync-apply/apply-history-action! "r" id undo? tx-meta))))]
                   [@result (select-keys (last metas) (conj meta-keys :db-sync/replayed-tx-data?))]))
        [undo-result undo-meta] (apply! true {:db-sync/tx-id history-id :db-sync/source-tx-id source-id})
        undo-title (title)
        [redo-result redo-meta] (apply! false {:redo? true :db-sync/tx-id id})]
    (is (= {:applied? true :history-tx-id history-id} undo-result))
    (is (= "inverse" undo-title))
    (is (= {:outliner-op :save-block
            :local-tx? true
            :gen-undo-ops? false
            :persist-op? true
            :undo? true
            :db-sync/tx-id history-id
            :db-sync/source-tx-id source-id
            :db-sync/forward-outliner-ops inverse
            :db-sync/inverse-outliner-ops forward}
           (dissoc undo-meta :redo?)))
    (is (not (:redo? undo-meta)))
    (is (= "forward" (title)))
    (is (true? (:applied? redo-result)))
    (is (uuid? (:history-tx-id redo-result)))
    (is (not= id (:history-tx-id redo-result)) "The history tx id differs from the source tx id")
    (is (= {:outliner-op :save-block
            :local-tx? true
            :gen-undo-ops? false
            :persist-op? true
            :undo? false
            :redo? true
            :db-sync/tx-id (:history-tx-id redo-result)
            :db-sync/source-tx-id id
            :db-sync/forward-outliner-ops forward
            :db-sync/inverse-outliner-ops inverse}
           redo-meta))))

;; Fails if, in `apply-history-action!`, the `normalize-tx-data-for-rebase` step is dropped.
(deftest apply-history-action-replays-the-recorded-tx-data-without-semantic-ops
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        id (random-uuid)
        action {:tx-id id
                :outliner-op :save-block
                :tx [[:db/add (:db/id b) :block/title "recorded" 536870913]]
                :reversed-tx [[:db/add (:db/id b) :block/title "b" 536870913]]}
        replayed (atom [])
        original-transact! ldb/transact!
        apply! (fn [undo?]
                 (let [result (atom nil)
                       metas (with-redefs [worker-state/get-datascript-conn (constantly conn)
                                           client-op/get-local-tx-entry (constantly action)
                                           ldb/transact! (fn [conn* tx-data & more]
                                                           (when (every? vector? tx-data)
                                                             (swap! replayed conj (vec tx-data)))
                                                           (apply original-transact! conn* tx-data more))]
                               (captured-tx-metas conn #(reset! result (sync-apply/apply-history-action! "r" id undo? {}))))]
                   [@result (last metas)]))
        [redo-result redo-meta] (apply! false)
        redo-title (:block/title (d/entity @conn (:db/id b)))
        [undo-result undo-meta] (apply! true)]
    (is (= [[[:db/add (:db/id b) :block/title "recorded"]]
            [[:db/add (:db/id b) :block/title "b"]]]
           @replayed)
        "The recorded datoms are replayed without their tx ids")
    (is (true? (:applied? redo-result)))
    (is (= "recorded" redo-title))
    (is (true? (:db-sync/replayed-tx-data? redo-meta)))
    (is (true? (:applied? undo-result)))
    (is (= "b" (:block/title (d/entity @conn (:db/id b)))))
    (is (true? (:db-sync/replayed-tx-data? undo-meta)))))

;; block descendants and retracts

(defn- family-conn
  "A page with the block `p` whose children `c1` and `c2` come in the opposite order of their ids, `c1` having the child `g`."
  []
  (let [conn (db-test/create-conn-with-blocks
              [{:page {:block/title "page1"}
                :blocks [{:block/title "p"
                          :build/children [{:block/title "c1" :build/children [{:block/title "g"}]}
                                           {:block/title "c2"}]}]}])
        c1 (db-test/find-block-by-content @conn "c1")
        c2 (db-test/find-block-by-content @conn "c2")]
    (d/transact! conn [[:db/add (:db/id c1) :block/order (:block/order c2)]
                       [:db/add (:db/id c2) :block/order (:block/order c1)]])
    conn))

;; Fails if, in `block-descendants`, `:block/order` becomes `:block/page`.
(deftest block-descendants-lists-the-children-in-block-order-then-their-own-descendants
  (let [conn (family-conn)
        p (db-test/find-block-by-content @conn "p")
        titles (mapv :block/title (#'sync-apply/block-descendants p))]
    (is (= ["c2" "c1" "g"] titles))))

;; Fails if, in `block-entity-ref`, `:db/id` becomes `:db/retract`.
(deftest block-entity-ref-prefers-the-uuid-and-falls-back-to-the-entity-id
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        {:keys [db-after tempids]} (d/transact! conn [{:db/id -1 :block/title "no uuid"}])
        no-uuid (d/entity db-after (get tempids -1))]
    (is (= [:block/uuid (:block/uuid b)] (#'sync-apply/block-entity-ref b)))
    (is (= (:db/id no-uuid) (#'sync-apply/block-entity-ref no-uuid)))))

;; Fails if, in `retract-entity-op?`, `:db.fn/retractEntity` becomes `:db.fn/cas`.
(deftest retract-entity-op-recognizes-both-retract-entity-forms
  (let [f #'sync-apply/retract-entity-op?]
    (is (true? (f [:db/retractEntity 1])))
    (is (true? (f [:db.fn/retractEntity 1])))
    (is (false? (f [:db/retract 1 :a 2])))
    (is (false? (f {:db/id 1})))))

;; Fails if, in `expand-block-retracts-to-descendants`, the `(keep (fn [item]` step is dropped, the `set` step is dropped, the `:db/id` step is dropped, `:db/id` becomes `:db/retract` or the `(remove #(contains? explicit-retracts...` step is dropped.
(deftest expand-block-retracts-to-descendants-retracts-descendants-ahead-of-each-block-retract
  (let [conn (family-conn)
        db @conn
        p (db-test/find-block-by-content db "p")
        c1 (db-test/find-block-by-content db "c1")
        c2 (db-test/find-block-by-content db "c2")
        g (db-test/find-block-by-content db "g")
        p-retract [:db/retractEntity [:block/uuid (:block/uuid p)]]
        c1-retract [:db/retractEntity (:db/id c1)]
        other [:db/add (:db/id c1) :block/title "x"]]
    (is (= [[:db/retractEntity [:block/uuid (:block/uuid c2)]]
            [:db/retractEntity [:block/uuid (:block/uuid g)]]
            p-retract
            [:db/retractEntity [:block/uuid (:block/uuid g)]]
            c1-retract
            other]
           (vec (#'sync-apply/expand-block-retracts-to-descendants db [p-retract c1-retract other])))
        "c1 has its own retract, so only c2 and g (in block order) are added ahead of the retract of p")
    (is (= [other] (vec (#'sync-apply/expand-block-retracts-to-descendants db [other]))))))

;; Fails if, in `reverse-history-action!`, the `(map (partial resolve-temp-id db))` step is dropped, the `normalize-tx-data-for-rebase` step is dropped, the `:outliner-op` key is dropped, the `:reverse?` key is dropped, the `:reason` key is dropped or the `:tx-id` key is dropped.
(deftest reverse-history-action-replays-reversed-tx-data-with-resolved-ids
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        transacts (atom [])
        f #'sync-apply/reverse-history-action!
        error (try
                (f conn {:tx-id 7 :outliner-op :save-block})
                nil
                (catch :default e e))]
    (with-redefs [ldb/transact! (fn [& args] (swap! transacts conj (vec (rest args))) :done)]
      (is (= :done (f conn {:outliner-op :save-block
                            :reversed-tx [[:db/add (str (:block/uuid b)) :block/title "x" 123]]})))
      (is (nil? (f conn {:outliner-op :fix}))))
    (is (= [[[[:db/add (:db/id b) :block/title "x"]]
             {:outliner-op :save-block :reverse? true :skip-validate-db? true}]]
           @transacts))
    (is (= "invalid rebase op" (ex-message error)))
    (is (= {:op :reverse-history-action
            :reason :missing-reversed-tx-data
            :tx-id 7
            :outliner-op :save-block}
           (ex-data error)))))

;; conflicts

;; Fails if, in `tx-item-components`, `:db/retract` becomes `:db/retractEntity`.
(deftest tx-item-components-reads-title-adds-and-retracts
  (let [f #'sync-apply/tx-item-components]
    (is (= {:op :db/add :e 1 :a :block/title :v "x"} (f [:db/add 1 :block/title "x"])))
    (is (= {:op :db/retract :e 1 :a :block/title :v "x"} (f [:db/retract 1 :block/title "x"])))
    (is (nil? (f [:db/add 1 :block/name "x"])))
    (is (nil? (f [:db/retractEntity 1])))
    (is (nil? (f [:db/cas 1 :block/title "x" "y"])))))

;; Fails if, in `tx-entity-uuid`, `:block/uuid` becomes `:block/_raw-parent` or the `:block/uuid` step is dropped.
(deftest tx-entity-uuid-resolves-uuids-strings-lookup-refs-temp-ids-and-entity-ids
  (let [conn (three-blocks-conn)
        db @conn
        b (db-test/find-block-by-content db "b")
        [u1 u2] (repeatedly 2 random-uuid)
        f #'sync-apply/tx-entity-uuid]
    (is (= u1 (f db {} u1)))
    (is (= u1 (f db {} (str u1))))
    (is (= u1 (f db {} [:block/uuid u1])))
    (is (= u2 (f db {5 u2} 5)))
    (is (= (:block/uuid b) (f db {} (:db/id b))))
    (is (= (:block/uuid b) (f db {} [:block/uuid (:block/uuid b)])))
    (is (nil? (f db {} 987654)))))

;; remote transactions

;; Fails if, in `transact-remote-txs!`, the `(map (partial resolve-temp-id db))` step is dropped.
(deftest transact-remote-txs-resolves-a-uuid-string-entity-to-the-existing-block
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")]
    (#'sync-apply/transact-remote-txs! conn [{:tx-data [[:db/add (str (:block/uuid b)) :block/title "remote b" 536870913]]}])
    (is (= "remote b" (:block/title (d/entity @conn (:db/id b)))))))

;; Fails if, in `apply-remote-tx-with-local-changes!`, the `distinct` step is dropped or the `:remote-asset-tx-data` key is dropped.
(deftest apply-remote-tx-with-local-changes-returns-the-applied-data-and-marks-each-stale-tx-once
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        u (random-uuid)
        stale-tx {:tx-id u :outliner-op :save-block :forward-outliner-ops [[:delete-blocks [[] {}]]]}
        local-txs [stale-tx stale-tx]
        *pending (atom local-txs)
        stale (atom [])
        apply! (fn [title]
                 (#'sync-apply/apply-remote-tx-with-local-changes!
                  {:repo "r"
                   :conn conn
                   :local-txs local-txs
                   :remote-txs [{:tx-data [[:db/add (:db/id b) :block/title title]]}]}))
        title #(:block/title (d/entity @conn (:db/id b)))]
    (with-redefs [sync-apply/pending-txs (fn [_repo & _] @*pending)
                  sync-apply/mark-pending-txs-false! (fn [repo ids] (swap! stale conj [repo ids]))
                  worker-undo-redo/clear-history! (fn [_repo] nil)]
      (let [result (apply! "remote b")]
        (is (= "remote b" (title)))
        (is (some #(and (= :block/title (:a %)) (= "remote b" (:v %)))
                  (:remote-asset-tx-data result))
            "The datoms of the applied remote tx are returned for the asset download")
        (is (= [["r" [u]]] @stale) "A stale tx is no longer pending, and is marked once"))
      (reset! *pending [])
      (let [error (try (apply! "lost") nil (catch :default e e))]
        (is (= :pending-tx-snapshot-changed (:code (ex-data error))))
        (is (= "remote b" (title)) "Nothing is committed when the pending txs changed meanwhile")))))

;; Fails if, in `apply-remote-tx-without-local-changes!`, the `:before-commit` key is dropped.
(deftest apply-remote-tx-without-local-changes-commits-nothing-when-a-local-tx-came-meanwhile
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        error (with-redefs [sync-apply/pending-txs (fn [_repo & _] [{:tx-id (random-uuid)}])]
                (try
                  (#'sync-apply/apply-remote-tx-without-local-changes!
                   {:repo "r"
                    :conn conn
                    :local-txs []
                    :remote-txs [{:tx-data [[:db/add (:db/id b) :block/title "lost"]]}]})
                  nil
                  (catch :default e e)))]
    (is (= :pending-tx-snapshot-changed (:code (ex-data error))))
    (is (= "b" (:block/title (d/entity @conn (:db/id b)))))))

;; Fails if, in `apply-remote-txs-with-retry!`, the `:has-local-changes?` key is dropped, the `:remote-txs` key is dropped or the `:local-txs` key is dropped.
(deftest apply-remote-txs-reports-a-failed-apply-with-its-counts
  (let [conn (three-blocks-conn)
        posted (atom [])
        error (ex-info "boom" {})
        local-txs [{:tx-id (random-uuid) :outliner-op :save-block}]
        thrown (with-redefs [worker-state/get-datascript-conn (constantly conn)
                             sync-apply/pending-txs (fn [_repo & _] local-txs)
                             worker-undo-redo/clear-history! (fn [_repo] nil)
                             ldb/batch-transact-with-temp-conn! (fn [& _] (throw error))
                             platform/current (fn [] {:broadcast {:post-message! (fn [type payload] (swap! posted conj [type payload]))}})]
                 (try
                   (sync-apply/apply-remote-txs! "r" nil [{:tx-data []} {:tx-data []}])
                   nil
                   (catch :default e e)))]
    (is (identical? error thrown))
    (is (= [[:capture-error {:source "db-sync"
                             :operation "apply-remote-txs"
                             :has-local-changes true
                             :remote-tx-count 2
                             :local-tx-count 1}]]
           (mapv (fn [[type payload]] [type (:payload payload)]) @posted)))))

;; Fails if, in `apply-remote-txs!`, the `:remote-tx-data` key is dropped.
(deftest apply-remote-txs-hands-the-remote-data-to-the-title-rehydration
  (async done
    (let [conn (three-blocks-conn)
          b (db-test/find-block-by-content @conn "b")
          tx-data [[:db/add (:db/id b) :block/title "remote b"]]
          calls (atom [])
          original sync-apply/rehydrate-large-titles!]
      (set! sync-apply/rehydrate-large-titles! (fn [repo opts] (swap! calls conj [repo opts]) nil))
      (-> (p/do
            (with-redefs [worker-state/get-datascript-conn (constantly conn)
                          sync-apply/pending-txs (fn [_repo & _] [])]
              (sync-apply/apply-remote-txs! "r" nil [{:tx-data tx-data}])))
          (p/finally (fn [_ _]
                       (set! sync-apply/rehydrate-large-titles! original)
                       (is (= "remote b" (:block/title (d/entity @conn (:db/id b)))))
                       (is (= [["r" {:tx-data tx-data :graph-id nil}]] @calls))
                       (done)))))))

;; Fails if, in `apply-remote-txs!`, the `:snapshot-retry-count` key is dropped.
(deftest apply-remote-txs-past-the-retry-limit-waits-then-starts-the-count-over
  (async done
    (let [conn (three-blocks-conn)
          original sync-apply/apply-remote-txs!
          retries (atom [])
          remote-txs [{:tx-data []}]]
      ;; both arities: a call inside the namespace goes straight to an arity's method
      (set! sync-apply/apply-remote-txs! (fn
                                           ([repo client txs] (swap! retries conj [repo client txs]) :retried)
                                           ([repo client txs n] (swap! retries conj [repo client txs n]) :retried)))
      (-> (p/do
            (with-redefs [worker-state/get-datascript-conn (constantly conn)
                          sync-apply/pending-txs (fn [_repo & _] [])
                          ldb/batch-transact-with-temp-conn! (fn [& _] (throw (ex-info "drift" {:code :pending-tx-snapshot-changed})))]
              ;; the arity's own method: a plain call dispatches through the var, to the recorder
              (.cljs$core$IFn$_invoke$arity$4 ^js original "r" nil remote-txs 3)))
          (p/then (fn [result] (is (= :retried result))))
          (p/finally (fn [_ _]
                       (set! sync-apply/apply-remote-txs! original)
                       (is (= [["r" nil remote-txs 0]] @retries)
                           "At the limit of 3 retries the apply is tried again later with a count of 0")
                       (done)))))))

;; local transactions

;; Fails if, in `handle-local-tx!`, the `:enqueue-asset-task-f` key is dropped, the `:current-client-f` key is dropped, the `:broadcast-rtc-state!-f` key is dropped or the `:fail-fast-f` key is dropped.
(deftest handle-local-tx-hands-the-asset-sync-its-worker-callbacks
  (let [conn (three-blocks-conn)
        _ (d/transact! conn [{:db/ident :logseq.kv/graph-remote? :kv/value true}])
        db @conn
        calls (atom [])
        client {:repo "r"}
        original-client @worker-state/*db-sync-client]
    (reset! worker-state/*db-sync-client client)
    (try
      (with-redefs [sync-apply/enqueue-local-tx! (fn [& _] nil)
                    asset-db-listener/generate-asset-ops (fn [& _] nil)
                    sync-assets/enqueue-asset-sync! (fn [& args] (swap! calls conj (vec args)))]
        (sync-apply/handle-local-tx! "r" {:tx-data [1] :tx-meta {} :db-before db :db-after db}))
      (finally
        (reset! worker-state/*db-sync-client original-client)))
    (is (= [["r" client {:enqueue-asset-task-f sync-assets/enqueue-asset-task!
                         :current-client-f @#'sync-apply/current-client
                         :broadcast-rtc-state!-f @#'sync-apply/broadcast-rtc-state!
                         :fail-fast-f sync-util/fail-fast}]]
           @calls))))

;; template replay

;; Fails if, in `sanitize-template-block`, `:block/uuid` becomes `:block/_raw-parent`.
(deftest sanitize-template-block-keeps-the-uuid-the-block-carries
  (let [conn (three-blocks-conn)
        a (db-test/find-block-by-content @conn "a")
        copy-uuid (random-uuid)]
    (is (= {:block/title "copy" :block/uuid copy-uuid :block/parent nil}
           (#'sync-apply/sanitize-template-block @conn @conn {:db/id (:db/id a)
                                                              :block/uuid copy-uuid
                                                              :block/title "copy"}))
        "A block's own uuid wins over the uuid of the entity its :db/id names")))

(defn- replayed-template-ops
  "Replays an :apply-template op, returns the [ops opts] it hands to the outliner."
  [conn args rebase-db-before]
  (let [applied (atom [])]
    (with-redefs [outliner-op/apply-ops! (fn [_conn ops opts] (swap! applied conj [ops opts]))]
      (#'sync-apply/replay-canonical-outliner-op! conn [:apply-template args] rebase-db-before))
    @applied))

;; Fails if, in `sanitize-template-block`, the `:block/uuid` step is dropped or `:block/uuid` becomes `:block/_raw-parent`.
;; Fails if, in `replay-canonical-outliner-op!`, the `(map-indexed` step is dropped, the `(remove nil?)` step is dropped, the `seq` step is dropped, `:block/uuid` becomes `:block/_raw-parent`, the `(dissoc :template-blocks)` step is dropped or the `:gen-undo-ops?` key is dropped.
(deftest replaying-apply-template-sanitizes-the-recorded-blocks
  (let [conn (three-blocks-conn)
        [a b c] (map #(db-test/find-block-by-content @conn %) ["a" "b" "c"])
        [a-uuid b-uuid c-uuid] (map :block/uuid [a b c])]
    (is (= [[[[:apply-template [c-uuid b-uuid {:sibling? true
                                               :template-blocks [{:block/title "copy" :block/parent nil :block/uuid a-uuid}]}]]]
             {:gen-undo-ops? false}]]
           (replayed-template-ops conn [c-uuid b-uuid {:sibling? true
                                                       :template-blocks [{:db/id (:db/id a) :block/title "copy" :block/order "a0" :block/page 1}
                                                                         {:block/title "no uuid"}]}]
                                  nil))
        "Position data is dropped, a block without a uuid is left out, and the replay records no undo")
    (is (= [[[[:apply-template [c-uuid b-uuid {:replace-empty-target? true
                                               :sibling? nil
                                               :template-blocks [{:block/title "first" :block/parent nil :block/uuid b-uuid}]}]]]
             {:gen-undo-ops? false}]]
           (replayed-template-ops conn [c-uuid b-uuid {:replace-empty-target? true
                                                       :template-blocks [{:block/title "first"} {:block/title "second"}]}]
                                  nil))
        "Replacing an empty target, the first block takes the target's uuid")
    (is (= [[[[:apply-template [c-uuid b-uuid {:replace-empty-target? true
                                               :sibling? nil
                                               :template-blocks [{:block/title "first" :block/parent nil :block/uuid a-uuid}]}]]]
             {:gen-undo-ops? false}]]
           (replayed-template-ops conn [c-uuid b-uuid {:replace-empty-target? true
                                                       :template-blocks [{:block/uuid a-uuid :block/title "first"}]}]
                                  nil))
        "A first block with its own uuid keeps it")
    (is (= [[[[:apply-template [c-uuid b-uuid {:sibling? false}]]] {:gen-undo-ops? false}]]
           (replayed-template-ops conn [c-uuid b-uuid {:sibling? false :template-blocks [{:block/title "no uuid"}]}] nil))
        "Without a usable recorded block none is passed on, and the outliner takes the template's own children")))

;; Fails if, in `replay-canonical-outliner-op!`, the `(assoc :sibling? sibling?)` step is dropped.
(deftest replaying-apply-template-on-a-deleted-first-block-goes-under-its-parent
  (let [conn (three-blocks-conn)
        a (db-test/find-block-by-content @conn "a")
        c (db-test/find-block-by-content @conn "c")
        page-uuid (:block/uuid (:block/parent a))
        db-before @conn]
    (d/transact! conn [[:db/retractEntity (:db/id a)]])
    (is (= [[[[:apply-template [(:block/uuid c) page-uuid {:sibling? false}]]] {:gen-undo-ops? false}]]
           (replayed-template-ops conn [(:block/uuid c) {:block/uuid (:block/uuid a)} {:sibling? true}] db-before))
        "The deleted block had no left sibling, so the template goes in as the page's first child")))

;; Fails if, in `replay-canonical-outliner-op!`, the `:args` key is dropped or the `:reason` key is dropped.
(deftest replaying-apply-template-of-an-entity-without-a-uuid-reports-why
  (let [conn (three-blocks-conn)
        b (db-test/find-block-by-content @conn "b")
        {:keys [tempids]} (d/transact! conn [{:db/id -1 :block/title "no uuid"}])
        args [(get tempids -1) (:block/uuid b) {}]]
    (is (= {:args args :reason :missing-template-or-target-uuid :op :apply-template}
           (replay-error-data conn :apply-template args)))))
