(ns frontend.worker.db-sync-sim-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.data :as data]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [frontend.db.conn-state :as db-conn-state]
            [frontend.state :as state]
            [frontend.undo-redo :as undo-redo]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [promesa.core :as p]))

(def ^:private repo-a "db-sync-sim-repo-a")
(def ^:private repo-b "db-sync-sim-repo-b")
(def ^:private repo-c "db-sync-sim-repo-c")
(def ^:private base-page-title "Home")
(def ^:private default-seed 1337)

(defn- env-seed []
  (try
    (when (exists? js/process)
      (when-let [raw (.. js/process -env -DB_SYNC_SIM_SEED)]
        (let [parsed (js/parseInt raw 10)]
          (when-not (js/isNaN parsed) parsed))))
    (catch :default _ nil)))

(defn- make-rng [seed]
  (let [state (atom seed)]
    (fn []
      (let [next (mod (+ (* 1664525 @state) 1013904223) 4294967296)]
        (reset! state next)
        (/ next 4294967296)))))

(defn- rand-int! [rng n]
  (int (js/Math.floor (* (rng) n))))

(defn- rand-nth! [rng coll]
  (when (seq coll)
    (nth coll (rand-int! rng (count coll)))))

(defn- byte->hex [n]
  (let [s (.toString n 16)]
    (if (= 1 (count s))
      (str "0" s)
      s)))

(defn- rng-uuid [rng]
  (let [payload (vec (repeatedly 16 #(rand-int! rng 256)))
        payload (-> payload
                    (assoc 6 (bit-or 0x40 (bit-and (nth payload 6) 0x0f)))
                    (assoc 8 (bit-or 0x80 (bit-and (nth payload 8) 0x3f))))
        hexes (map byte->hex payload)
        uuid-str (str (apply str (take 4 hexes)) "-"
                      (apply str (take 2 (drop 4 hexes))) "-"
                      (apply str (take 2 (drop 6 hexes))) "-"
                      (apply str (take 2 (drop 8 hexes))) "-"
                      (apply str (drop 10 hexes)))]
    (uuid uuid-str)))

(defn- record-meta! [history meta]
  (swap! history conj (assoc meta :type :meta)))

(defn- report-history! [seed history extra]
  (prn :db-sync-sim-repro (cond-> {:seed seed :history @history}
                            extra (assoc :extra extra))))

(defn- install-invalid-tx-repro!
  [seed history]
  (let [prev @ldb/*transact-invalid-callback
        repro (atom nil)
        handler (fn [tx-report errors]
                  (let [payload {:type :invalid-tx
                                 :tx-meta (:tx-meta tx-report)
                                 :tx-data (:tx-data tx-report)
                                 :errors errors}]
                    (reset! repro payload)
                    (report-history! seed history payload)))]
    (reset! ldb/*transact-invalid-callback handler)
    {:repro repro
     :restore (fn [] (reset! ldb/*transact-invalid-callback prev))}))

(declare op-runs assert-synced-attrs! assert-no-invalid-tx!)

(deftest ^:long rng-uuid-deterministic-test
  (testing "rng-uuid produces stable sequences for the same seed"
    (let [rng-a (make-rng 42)
          rng-b (make-rng 42)
          rng-c (make-rng 43)
          seq-a (repeatedly 3 #(rng-uuid rng-a))
          seq-b (repeatedly 3 #(rng-uuid rng-b))
          seq-c (repeatedly 3 #(rng-uuid rng-c))]
      (is (= seq-a seq-b))
      (is (not= seq-a seq-c)))))

(deftest ^:long invalid-tx-repro-callback-test
  (testing "invalid tx callback captures sim repro payload"
    (let [seed 7
          history (atom [{:type :op :op :create-page}])
          tx-report {:tx-meta {:db-sync-sim true}
                     :tx-data [[:db/add 1 :block/title "oops"]]}
          errors [{:entity-map {:block/title "oops"}
                   :errors {:block/page ["missing required key"]}}]
          {:keys [repro restore]} (install-invalid-tx-repro! seed history)]
      (try
        ((deref ldb/*transact-invalid-callback) tx-report errors)
        (is (= {:type :invalid-tx
                :tx-meta {:db-sync-sim true}
                :tx-data [[:db/add 1 :block/title "oops"]]
                :errors errors}
               @repro))
        (finally
          (restore))))))

(defn- with-test-repos
  [repo->conns f]
  (let [worker-db-prev @worker-state/*datascript-conns
        ops-prev @worker-state/*client-ops-conns
        db-prev @db-conn-state/conns
        listeners (atom [])]
    (reset! worker-state/*datascript-conns (into {} (map (fn [[repo {:keys [conn]}]]
                                                           [repo conn])
                                                         repo->conns)))
    (reset! db-conn-state/conns (into {} (map (fn [[repo {:keys [conn]}]]
                                                [repo conn])
                                              repo->conns)))
    (reset! worker-state/*client-ops-conns (into {} (map (fn [[repo {:keys [ops-conn]}]]
                                                           [repo ops-conn])
                                                         repo->conns)))
    (doseq [[repo _] repo->conns]
      (undo-redo/clear-history! repo))
    (doseq [[repo {:keys [conn ops-conn]}] repo->conns]
      (when ops-conn
        (let [key (keyword "db-sync-sim" repo)]
          (d/listen! conn key
                     (fn [tx-report]
                       (db-sync/enqueue-local-tx! repo tx-report)
                       (undo-redo/gen-undo-ops!
                        repo
                        (-> tx-report
                            (assoc-in [:tx-meta :client-id] (:client-id @state/state))
                            (update-in [:tx-meta :local-tx?]
                                       (fn [local-tx?]
                                         (if (nil? local-tx?)
                                           true
                                           local-tx?)))))))
          (swap! listeners conj [conn key]))))
    (try
      (f)
      (finally
        (doseq [[conn key] @listeners]
          (d/unlisten! conn key))
        (reset! worker-state/*datascript-conns worker-db-prev)
        (reset! worker-state/*client-ops-conns ops-prev)
        (reset! db-conn-state/conns db-prev)
        (doseq [[repo _] repo->conns]
          (undo-redo/clear-history! repo))
        (reset! undo-redo/*undo-ops {})
        (reset! undo-redo/*redo-ops {})))))

(defn- make-client [repo]
  {:repo repo
   :graph-id nil
   :asset-queue (atom (p/resolved nil))
   :inflight (atom [])})

(defn- page? [ent]
  (ldb/page? ent))

(defn- ensure-base-page! [conn base-uuid]
  (when-not (d/entity @conn [:block/uuid base-uuid])
    (worker-page/create! conn base-page-title :uuid base-uuid)))

(defn- create-page! [conn title uuid]
  ;; (prn :debug :create-page :title title :uuid uuid)
  (worker-page/create! conn title :uuid uuid))

(defn- delete-page! [conn uuid]
  ;; (prn :debug :delete-page :title (:block/title (d/entity @conn [:block/uuid uuid])) :uuid uuid)
  (worker-page/delete! conn uuid))

(defn- create-block! [conn parent title uuid]
  ;; (prn :debug :create-block :parent (:db/id parent) (:block/uuid parent) :parent-title (:block/title parent) :title title :uuid uuid)
  (outliner-core/insert-blocks! conn
                                [{:block/title title
                                  :block/uuid uuid}]
                                parent
                                {:sibling? false
                                 :keep-uuid? true}))

(defn- update-title! [conn uuid new-title]
  ;; (prn :debug :update-title uuid :from (:block/title (d/entity @conn [:block/uuid uuid])) :to new-title)
  (outliner-core/save-block! conn
                             {:block/uuid uuid
                              :block/title new-title}))

(defn- move-block! [conn block parent]
  (let [block (d/entity @conn [:block/uuid (:block/uuid block)])
        parent (d/entity @conn [:block/uuid (:block/uuid parent)])]
    (when (and block parent)
      ;; (prn :debug :move (:db/id block) (:block/uuid block) (:block/title block)
      ;;      :to (:db/id parent) (:block/uuid parent) (:block/title parent))
      (outliner-core/move-blocks! conn [block] parent {:sibling? false}))))

(defn- delete-block! [conn uuid]
  (when-let [block (d/entity @conn [:block/uuid uuid])]
    ;; (prn :debug :delete-block! (:db/id block) (:block/uuid block) (:block/title block))
    (outliner-core/delete-blocks! conn [block] {})))

(defn- existing-entities
  [db uuids]
  (->> uuids
       (keep (fn [uuid]
               (when-let [ent (d/entity db [:block/uuid uuid])]
                 (when (:block/uuid ent) ent))))))

(defn- existing-blocks
  [db uuids]
  (->> (existing-entities db uuids)
       (remove page?)))

(defn- make-server []
  (atom {:t 0
         :txs []
         :conn (db-test/create-conn)}))

(defn- server-pull [server since]
  (let [{:keys [txs]} @server]
    (->> (filter (fn [{:keys [t]}] (> t since)) txs)
         (mapv :tx))))

(defn- server-upload! [server t-before tx-data]
  (swap! server
         (fn [{:keys [t txs conn] :as state}]
           (if (not= t t-before)
             state
             (let [{:keys [db-before db-after tx-data]} (ldb/transact! conn tx-data {:op :apply-client-tx})
                   normalized-data (->> tx-data
                                        (db-normalize/normalize-tx-data db-after db-before))
                   next-t (inc t)]
               (assoc state :t next-t :txs (conj txs {:t next-t :tx normalized-data})))))))

(defn- build-upload-tx [conn pending]
  (let [txs (mapcat :tx pending)]
    (->> txs
         (db-normalize/remove-retract-entity-ref @conn)
         (#'db-sync/drop-missing-block-ref-datoms @conn)
         distinct
         vec)))

(defn- sync-client! [server {:keys [repo conn client online?]}]
  (when online?
    (let [progress? (atom false)
          local-tx (or (client-op/get-local-tx repo) 0)
          server-t (:t @server)]
      ;; (prn :debug :repo repo :local-tx local-tx :server-t server-t)
      (when (< local-tx server-t)
        (let [txs (server-pull server local-tx)]
          ;; (prn :debug :apply-remote-tx :repo repo
          ;;      :tx tx)
          (#'db-sync/apply-remote-tx! repo client txs)
          (client-op/update-local-tx repo server-t)
          (reset! progress? true)))
      (let [pending (#'db-sync/pending-txs repo)
            local-tx' (or (client-op/get-local-tx repo) 0)
            server-t' (:t @server)]
        (when (and (seq pending) (= local-tx' server-t'))
          (let [tx-data (build-upload-tx conn pending)
                tx-ids (mapv :tx-id pending)]
            ;; (prn :debug :upload :repo repo :tx-data tx-data)
            (when (seq tx-data)
              (server-upload! server local-tx' tx-data)
              (#'db-sync/remove-pending-txs! repo tx-ids)
              (client-op/update-local-tx repo (:t @server))
              (reset! progress? true)))))
      @progress?)))

(defn- sync-loop! [server clients]
  (loop [i 0]
    (when (< i 32)
      (let [progress? (atom false)]
        (doseq [client clients]
          (when (sync-client! server client)
            (reset! progress? true)))
        (when @progress?
          (recur (inc i))))))
  (let [conns (keep (fn [c] (when (:online? c) (:conn c))) clients)]
    (when (seq conns)
      (let [online-clients (filter :online? clients)
            client-block-uuids (mapv (fn [c]
                                       (let [uuids (->> (d/datoms (deref (:conn c)) :avet :block/uuid)
                                                        (map :v)
                                                        set)]
                                         {:repo (:repo c)
                                          :uuids uuids
                                          :datoms-count (count uuids)}))
                                     online-clients)
            server-uuids (->> (d/datoms @(get @server :conn) :avet :block/uuid)
                              (map :v)
                              set)
            client-sync-states (mapv (fn [c]
                                       {:repo (:repo c)
                                        :pending-count (count (#'db-sync/pending-txs (:repo c)))
                                        :local-tx (client-op/get-local-tx (:repo c))
                                        :server-t (:t @server)})
                                     online-clients)
            base-uuids (:uuids (first client-block-uuids))
            block-counts (map :datoms-count client-block-uuids)
            block-uuid-diffs (mapv (fn [{:keys [repo uuids]}]
                                     {:repo repo
                                      :missing-count (count (set/difference base-uuids uuids))
                                      :extra-count (count (set/difference uuids base-uuids))
                                      :missing-sample (->> (set/difference base-uuids uuids)
                                                           (take 5)
                                                           vec)
                                      :extra-sample (->> (set/difference uuids base-uuids)
                                                         (take 5)
                                                         vec)})
                                   client-block-uuids)]
        (when-not (= (count (distinct block-counts)) 1)
          (throw (ex-info "blocks count not equal after sync"
                          {:block-counts block-counts
                           :clients (mapv #(select-keys % [:repo :datoms-count]) client-block-uuids)
                           :sync-states client-sync-states
                           :server {:datoms-count (count server-uuids)
                                    :missing-from-a (->> (set/difference base-uuids server-uuids)
                                                         (take 5)
                                                         vec)
                                    :extra-vs-a (->> (set/difference server-uuids base-uuids)
                                                     (take 5)
                                                     vec)}
                           :block-uuid-diffs block-uuid-diffs})))))))

(defn- sync-until-idle!
  [server clients max-rounds]
  (loop [i 0]
    (if (< i max-rounds)
      (let [progress? (atom false)]
        (doseq [client clients]
          (when (sync-client! server client)
            (reset! progress? true)))
        (if @progress?
          (recur (inc i))
          i))
      i)))

(deftest ^:long sync-loop-all-offline-no-error-test
  (testing "sync-loop tolerates all clients offline"
    (let [server (make-server)
          conn (db-test/create-conn)
          client (make-client repo-a)
          clients [{:repo repo-a :conn conn :client client :online? false}]]
      (is (nil? (sync-loop! server clients))))))

(defn- db-issues [db]
  (let [blocks (->> (d/q '[:find [?e ...]
                           :where
                           [?e :block/uuid]
                           [?e :block/page]]
                         db)
                    (map (fn [e] (d/entity db e))))]
    (concat
     (for [ent blocks
           :let [parent (:block/parent ent)]
           :when (nil? parent)]
       {:type :missing-parent :uuid (:block/uuid ent)})
     (for [ent blocks
           :let [page (:block/page ent)]
           :when (nil? page)]
       {:type :missing-page :uuid (:block/uuid ent)})
     (for [ent blocks
           :let [parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (page? parent) parent (:block/page parent)))]
           :when (and parent page expected-page (not= (:block/uuid expected-page)
                                                      (:block/uuid page)))]
       {:type :page-mismatch :uuid (:block/uuid ent)})
     (for [ent blocks
           :when (let [start (:block/uuid ent)]
                   (loop [current ent
                          seen #{start}
                          steps 0]
                     (cond
                       (>= steps 200) true
                       (nil? (:block/parent current)) false
                       :else (let [next-ent (:block/parent current)
                                   next-uuid (:block/uuid next-ent)]
                               (if (contains? seen next-uuid)
                                 true
                                 (recur next-ent (conj seen next-uuid) (inc steps)))))))]
       {:type :cycle :uuid (:block/uuid ent)}))))

(defn- block-attr-map [db]
  (->> (d/q '[:find [?e ...]
              :where
              [?e :block/uuid]
              [?e :block/page]]
            db)
       (map (fn [e]
              (let [ent (d/entity db e)
                    parent (:block/parent ent)
                    page (:block/page ent)]
                [(:block/uuid ent)
                 {:block/title (:block/title ent)
                  :block/parent (when parent (:block/uuid parent))
                  :block/page (when page (:block/uuid page))}])))
       (into {})))

(def ^:private sim-default-property-title "Sim Default Property")

(defn- find-property-by-title
  [db title]
  (some->> (d/q '[:find [?e ...]
                  :in $ ?title
                  :where
                  [?e :block/title ?title]
                  [?e :block/tags :logseq.class/Property]]
                db title)
           first
           (d/entity db)))

(defn- ensure-property!
  [conn title schema]
  (or (find-property-by-title @conn title)
      (do
        (outliner-op/apply-ops!
         conn
         [[:upsert-property [nil schema {:property-name title}]]]
         {})
        (find-property-by-title @conn title))))

(defn- user-classes
  [db]
  (->> (d/q '[:find [?e ...]
              :where
              [?e :block/tags :logseq.class/Tag]
              [?e :block/uuid]]
            db)
       (map (fn [e] (d/entity db e)))
       (remove ldb/built-in?)))

(defn- ensure-class!
  [rng conn]
  (or (rand-nth! rng (vec (user-classes @conn)))
      (let [title (str "Class-" (rand-int! rng 1000000))
            class-uuid (rng-uuid rng)]
        (worker-page/create! conn title :uuid class-uuid :class? true)
        (d/entity @conn [:block/uuid class-uuid]))))

(defn- op-create-page! [rng conn state {:keys [gen-uuid]}]
  (let [uuid ((or gen-uuid random-uuid))
        title (str "Page-" (rand-int! rng 1000000))]
    (create-page! conn title uuid)
    (swap! state update :pages conj uuid)
    {:op :create-page :uuid uuid :title title}))

(defn- op-delete-page! [rng conn base-uuid state]
  (let [db @conn
        pages (->> (existing-entities db (:pages @state))
                   (remove #(= (:block/uuid %) base-uuid)))
        page (rand-nth! rng (vec pages))]
    (when page
      (delete-page! conn (:block/uuid page))
      (swap! state update :pages disj (:block/uuid page))
      {:op :delete-page :uuid (:block/uuid page)})))

(defn- op-create-block! [rng conn state base-uuid {:keys [gen-uuid]}]
  (let [db @conn
        pages (concat (existing-entities db (:pages @state))
                      (keep (fn [uuid]
                              (when (= uuid base-uuid)
                                (d/entity db [:block/uuid uuid])))
                            [base-uuid]))
        blocks (existing-blocks db (:blocks @state))
        parents (concat pages blocks)
        parent (rand-nth! rng (vec parents))]
    (when (and parent (:block/uuid parent)
               (or (ldb/page? parent)
                   (:block/page parent)))
      (let [parent-uuid (:block/uuid parent)
            parent (d/entity db [:block/uuid parent-uuid])]
        (when parent
          (let [uuid ((or gen-uuid random-uuid))]
            (create-block! conn parent "" uuid)
            (swap! state update :blocks conj uuid)
            {:op :create-block :uuid uuid :parent parent-uuid}))))))

(defn- ensure-random-block!
  [rng conn state base-uuid gen-uuid]
  (or (rand-nth! rng (vec (existing-blocks @conn (:blocks @state))))
      (when-let [result (op-create-block! rng conn state base-uuid {:gen-uuid gen-uuid})]
        (d/entity @conn [:block/uuid (:uuid result)]))))

(defn- op-update-title! [rng conn state _base-uuid]
  (let [db @conn
        ents (existing-entities db (:blocks @state))
        ent (rand-nth! rng (vec ents))
        block (d/entity db [:block/uuid (:block/uuid ent)])]
    (when (and block (not (ldb/page? block)))
      (let [uuid (:block/uuid block)
            new-title (str "title-" (:db/id block))]
        (update-title! conn uuid new-title)
        {:op :update-title :uuid uuid :title new-title}))))

(defn- op-save-block! [rng conn state base-uuid]
  (when-let [result (op-update-title! rng conn state base-uuid)]
    (assoc result :op :save-block)))

(defn- op-insert-blocks! [rng conn state base-uuid {:keys [gen-uuid]}]
  (when-let [result (op-create-block! rng conn state base-uuid {:gen-uuid gen-uuid})]
    (assoc result :op :insert-blocks)))

(defn- op-move-block! [rng conn state base-uuid]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))
        parents (concat (existing-entities db (:pages @state))
                        (existing-blocks db (:blocks @state))
                        (keep (fn [uuid]
                                (when (= uuid base-uuid)
                                  (d/entity db [:block/uuid uuid])))
                              [base-uuid]))
        parent (rand-nth! rng (vec parents))]
    (when (and block parent (not= (:block/uuid block) (:block/uuid parent)))
      (move-block! conn block parent)
      {:op :move-block
       :uuid (:block/uuid block)
       :parent (:block/uuid parent)})))

(defn- op-move-blocks! [rng conn state base-uuid]
  (when-let [result (op-move-block! rng conn state base-uuid)]
    (assoc result :op :move-blocks)))

(defn- op-move-blocks-up-down! [rng conn state]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))
        up? (zero? (rand-int! rng 2))]
    (when block
      (try
        (outliner-core/move-blocks-up-down! conn [block] up?)
        {:op :move-blocks-up-down
         :uuid (:block/uuid block)
         :up? up?}
        (catch :default _
          nil)))))

(defn- op-indent-outdent-blocks! [rng conn state]
  (let [db @conn
        blocks (vec (existing-blocks db (:blocks @state)))
        indent? (zero? (rand-int! rng 2))
        candidates (if indent?
                     ;; Indent requires a left sibling.
                     (filter (fn [b]
                               (some? (ldb/get-left-sibling b)))
                             blocks)
                     ;; Outdent through outliner-core uses sibling move to parent.
                     ;; Parent without parent triggers "not-allowed-move-block-page".
                     ;; Avoid picking top-level page children for this op.
                     (filter (fn [b]
                               (let [parent (:block/parent b)]
                                 (and parent (:block/parent parent))))
                             blocks))
        block (rand-nth! rng (vec candidates))]
    (when block
      (try
        (outliner-core/indent-outdent-blocks! conn [block] indent? {})
        {:op :indent-outdent-blocks
         :uuid (:block/uuid block)
         :indent? indent?}
        (catch :default _
          nil)))))

(defn- op-delete-block! [rng conn state]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))]
    (when (and block (d/entity @conn [:block/uuid (:block/uuid block)]))
      (delete-block! conn (:block/uuid block))
      (swap! state update :blocks disj (:block/uuid block))
      {:op :delete-block :uuid (:block/uuid block)})))

(defn- op-delete-blocks! [rng conn state]
  (when-let [result (op-delete-block! rng conn state)]
    (assoc result :op :delete-blocks)))

(defn- op-rename-page! [rng conn state base-uuid]
  (let [db @conn
        pages (->> (existing-entities db (:pages @state))
                   (remove #(= (:block/uuid %) base-uuid)))
        page (rand-nth! rng (vec pages))]
    (when page
      (let [page-uuid (:block/uuid page)
            new-title (str "Renamed-" (rand-int! rng 1000000))]
        (try
          (outliner-core/save-block! conn {:block/uuid page-uuid
                                           :block/title new-title})
          {:op :rename-page
           :uuid page-uuid
           :title new-title}
          (catch :default _
            nil))))))

(defn- op-toggle-reaction! [rng conn state]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))]
    (when block
      (let [block-uuid (:block/uuid block)]
        (try
          (outliner-op/apply-ops! conn [[:toggle-reaction [block-uuid "+1" nil]]] {})
          {:op :toggle-reaction
           :uuid block-uuid
           :emoji "+1"}
          (catch :default _
            nil))))))

(defn- op-transact! [rng conn state]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))]
    (when block
      (let [uuid (:block/uuid block)
            new-title (str "tx-title-" (rand-int! rng 1000000))]
        (ldb/transact! conn [[:db/add [:block/uuid uuid] :block/title new-title]])
        {:op :transact
         :uuid uuid
         :title new-title}))))

(defn- op-upsert-property! [_rng conn]
  (let [title sim-default-property-title
        schema {:logseq.property/type :default}
        existing (find-property-by-title @conn title)]
    (outliner-op/apply-ops!
     conn
     [[:upsert-property [(or (:db/ident existing) nil)
                         schema
                         {:property-name title}]]]
     {})
    (when-let [property (find-property-by-title @conn title)]
      {:op :upsert-property
       :property (:db/ident property)})))

(defn- op-set-block-property! [rng conn state base-uuid gen-uuid]
  (when-let [block (ensure-random-block! rng conn state base-uuid gen-uuid)]
    (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
      (let [value (str "prop-value-" (rand-int! rng 1000000))]
        (try
          (outliner-op/apply-ops!
           conn
           [[:set-block-property [(:db/id block) (:db/ident property) value]]]
           {})
          {:op :set-block-property
           :uuid (:block/uuid block)
           :property (:db/ident property)
           :value value}
          (catch :default _
            nil))))))

(defn- op-remove-block-property! [rng conn state base-uuid gen-uuid]
  (when-let [block (ensure-random-block! rng conn state base-uuid gen-uuid)]
    (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
      (try
        (outliner-op/apply-ops!
         conn
         [[:set-block-property [(:db/id block) (:db/ident property) (str "remove-prop-" (rand-int! rng 1000000))]]
          [:remove-block-property [(:db/id block) (:db/ident property)]]]
         {})
        {:op :remove-block-property
         :uuid (:block/uuid block)
         :property (:db/ident property)}
        (catch :default _
          nil)))))

(defn- op-create-property-text-block! [rng conn]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (let [value (str "value-block-" (rand-int! rng 1000000))]
      (try
        (let [value-uuid (outliner-op/apply-ops!
                          conn
                          [[:create-property-text-block [nil (:db/id property) value {}]]]
                          {})]
          {:op :create-property-text-block
           :property (:db/ident property)
           :value-uuid value-uuid})
        (catch :default _
          nil)))))

(defn- op-batch-set-property! [rng conn state base-uuid gen-uuid]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (let [blocks (->> (repeatedly 2 #(ensure-random-block! rng conn state base-uuid gen-uuid))
                      (remove nil?)
                      distinct
                      vec)]
      (when (seq blocks)
        (let [block-ids (mapv :db/id blocks)
              value (str "batch-prop-" (rand-int! rng 1000000))]
          (try
            (outliner-op/apply-ops!
             conn
             [[:batch-set-property [block-ids (:db/ident property) value {}]]]
             {})
            {:op :batch-set-property
             :blocks (mapv :block/uuid blocks)
             :property (:db/ident property)}
            (catch :default _
              nil)))))))

(defn- op-batch-remove-property! [rng conn state base-uuid gen-uuid]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (let [blocks (->> (repeatedly 2 #(ensure-random-block! rng conn state base-uuid gen-uuid))
                      (remove nil?)
                      distinct
                      vec)]
      (when (seq blocks)
        (let [block-ids (mapv :db/id blocks)]
          (try
            (outliner-op/apply-ops!
             conn
             [[:batch-set-property [block-ids (:db/ident property) (str "to-remove-" (rand-int! rng 1000000)) {}]]
              [:batch-remove-property [block-ids (:db/ident property)]]]
             {})
            {:op :batch-remove-property
             :blocks (mapv :block/uuid blocks)
             :property (:db/ident property)}
            (catch :default _
              nil)))))))

(defn- op-class-add-property! [rng conn]
  (when-let [class (ensure-class! rng conn)]
    (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
      (try
        (outliner-op/apply-ops!
         conn
         [[:class-add-property [(:db/id class) (:db/ident property)]]]
         {})
        {:op :class-add-property
         :class (:block/uuid class)
         :property (:db/ident property)}
        (catch :default _
          nil)))))

(defn- op-class-remove-property! [rng conn]
  (when-let [class (ensure-class! rng conn)]
    (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
      (try
        (outliner-op/apply-ops!
         conn
         [[:class-add-property [(:db/id class) (:db/ident property)]]
          [:class-remove-property [(:db/id class) (:db/ident property)]]]
         {})
        {:op :class-remove-property
         :class (:block/uuid class)
         :property (:db/ident property)}
        (catch :default _
          nil)))))

(defn- op-upsert-closed-value! [rng conn]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (let [value (str "choice-" (rand-int! rng 1000000))]
      (try
        (outliner-op/apply-ops!
         conn
         [[:upsert-closed-value [(:db/id property) {:value value}]]]
         {})
        {:op :upsert-closed-value
         :property (:db/ident property)
         :value value}
        (catch :default _
          nil)))))

(defn- op-delete-closed-value! [rng conn]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (let [value (str "delete-choice-" (rand-int! rng 1000000))]
      (try
        (outliner-op/apply-ops!
         conn
         [[:upsert-closed-value [(:db/id property) {:value value}]]]
         {})
        (when-let [value-block (first (:block/_closed-value-property (d/entity @conn (:db/id property))))]
          (outliner-op/apply-ops!
           conn
           [[:delete-closed-value [(:db/id property) (:db/id value-block)]]]
           {})
          {:op :delete-closed-value
           :property (:db/ident property)
           :value-id (:db/id value-block)})
        (catch :default _
          nil)))))

(defn- op-add-existing-values-to-closed-values! [rng conn]
  (when-let [property (ensure-property! conn sim-default-property-title {:logseq.property/type :default})]
    (try
      (let [value-a (str "existing-a-" (rand-int! rng 1000000))
            value-b (str "existing-b-" (rand-int! rng 1000000))
            uuid-a (outliner-op/apply-ops!
                    conn
                    [[:create-property-text-block [nil (:db/id property) value-a {}]]]
                    {})
            uuid-b (outliner-op/apply-ops!
                    conn
                    [[:create-property-text-block [nil (:db/id property) value-b {}]]]
                    {})
            uuids (vec (remove nil? [uuid-a uuid-b]))]
        (when (seq uuids)
          (outliner-op/apply-ops!
           conn
           [[:add-existing-values-to-closed-values [(:db/id property) uuids]]]
           {})
          {:op :add-existing-values-to-closed-values
           :property (:db/ident property)
           :uuids uuids}))
      (catch :default _
        nil))))

(defn- op-delete-property-value! [rng conn state base-uuid gen-uuid]
  (when-let [class (ensure-class! rng conn)]
    (when-let [block (ensure-random-block! rng conn state base-uuid gen-uuid)]
      (try
        (outliner-op/apply-ops!
         conn
         [[:set-block-property [(:db/id block) :block/tags (:db/id class)]]
          [:delete-property-value [(:db/id block) :block/tags (:db/id class)]]]
         {})
        {:op :delete-property-value
         :uuid (:block/uuid block)
         :class (:block/uuid class)}
        (catch :default _
          nil)))))

(defn- op-batch-delete-property-value! [rng conn state base-uuid gen-uuid]
  (when-let [class (ensure-class! rng conn)]
    (let [blocks (->> (repeatedly 2 #(ensure-random-block! rng conn state base-uuid gen-uuid))
                      (remove nil?)
                      distinct
                      vec)]
      (when (seq blocks)
        (let [block-ids (mapv :db/id blocks)]
          (try
            (outliner-op/apply-ops!
             conn
             [[:batch-set-property [block-ids :block/tags (:db/id class) {}]]
              [:batch-delete-property-value [block-ids :block/tags (:db/id class)]]]
             {})
            {:op :batch-delete-property-value
             :blocks (mapv :block/uuid blocks)
             :class (:block/uuid class)}
            (catch :default _
              nil)))))))

(defn- block-and-descendant-uuids
  [db block]
  (->> (cons (:db/id block) (ldb/get-block-full-children-ids db (:db/id block)))
       (keep (fn [id]
               (:block/uuid (d/entity db id))))
       set))

(defn- op-cut-paste-block-with-child! [rng conn state _base-uuid]
  (let [db @conn
        sources (->> (existing-blocks db (:blocks @state))
                     (filter (fn [block]
                               (seq (ldb/sort-by-order (:block/_parent block))))))
        source (rand-nth! rng (vec sources))]
    (when source
      (let [source-uuid (:block/uuid source)
            source-page-uuid (:block/uuid (:block/page source))
            source-descendants (block-and-descendant-uuids db source)
            targets (->> (existing-blocks db (:blocks @state))
                         (remove (fn [target]
                                   (contains? source-descendants (:block/uuid target))))
                         (filter (fn [target]
                                   (and (= source-page-uuid
                                           (:block/uuid (:block/page target)))
                                        (string/blank? (or (:block/title target) ""))
                                        (empty? (:block/_parent target))))))
            target (rand-nth! rng (vec targets))]
        (when target
          (let [target-uuid (:block/uuid target)
                direct-children (ldb/sort-by-order (:block/_parent source))]
            (when (seq direct-children)
              ;; Simulate "cut + paste into empty target block" in a single outliner
              ;; transaction to avoid intermediate sync states.
              (outliner-op/apply-ops!
               conn
               [[:move-blocks [[(:db/id source)] (:db/id target) {:sibling? true}]]
                [:delete-blocks [[(:db/id target)] {}]]]
               {})
              (swap! state update :blocks disj target-uuid)
              {:op :cut-paste-block-with-child
               :uuid source-uuid
               :target target-uuid
               :children (mapv :block/uuid direct-children)})))))))

(defn- op-undo! [_rng repo]
  (when repo
    (let [result (undo-redo/undo repo)]
      (when (not= :frontend.undo-redo/empty-undo-stack result)
        {:op :undo}))))

(defn- op-redo! [_rng repo]
  (when repo
    (let [result (undo-redo/redo repo)]
      (when (not= :frontend.undo-redo/empty-redo-stack result)
        {:op :redo}))))

(def ^:private op-table
  [{:name :create-page :weight 6 :f op-create-page!}
   {:name :rename-page :weight 2 :f op-rename-page!}
   {:name :delete-page :weight 2 :f op-delete-page!}
   {:name :save-block :weight 4 :f op-save-block!}
   {:name :upsert-property :weight 2 :f op-upsert-property!}
   {:name :set-block-property :weight 3 :f op-set-block-property!}
   {:name :remove-block-property :weight 2 :f op-remove-block-property!}
   {:name :delete-property-value :weight 1 :f op-delete-property-value!}
   {:name :create-property-text-block :weight 2 :f op-create-property-text-block!}
   {:name :batch-set-property :weight 2 :f op-batch-set-property!}
   {:name :batch-remove-property :weight 2 :f op-batch-remove-property!}
   {:name :batch-delete-property-value :weight 1 :f op-batch-delete-property-value!}
   {:name :class-add-property :weight 1 :f op-class-add-property!}
   {:name :class-remove-property :weight 1 :f op-class-remove-property!}
   {:name :upsert-closed-value :weight 1 :f op-upsert-closed-value!}
   {:name :delete-closed-value :weight 1 :f op-delete-closed-value!}
   {:name :add-existing-values-to-closed-values :weight 1 :f op-add-existing-values-to-closed-values!}
   {:name :insert-blocks :weight 10 :f op-insert-blocks!}
   {:name :delete-blocks :weight 4 :f op-delete-blocks!}
   {:name :move-blocks :weight 6 :f op-move-blocks!}
   {:name :move-blocks-up-down :weight 3 :f op-move-blocks-up-down!}
   {:name :indent-outdent-blocks :weight 3 :f op-indent-outdent-blocks!}
   {:name :toggle-reaction :weight 2 :f op-toggle-reaction!}
   {:name :transact :weight 3 :f op-transact!}
   {:name :undo :weight 10 :f op-undo!}
   {:name :redo :weight 10 :f op-redo!}
   {:name :create-block :weight 10 :f op-create-block!}
   {:name :move-block :weight 6 :f op-move-block!}
   {:name :cut-paste-block-with-child :weight 4 :f op-cut-paste-block-with-child!}
   {:name :delete-block :weight 4 :f op-delete-block!}
   {:name :update-title :weight 8 :f op-update-title!}])

(deftest ^:long cut-paste-op-registered-in-sim-op-table-test
  (testing "sim op-table includes cut-paste op for random sync stress"
    (is (contains? (set (map :name op-table))
                   :cut-paste-block-with-child))))

(deftest ^:long undo-redo-ops-registered-in-sim-op-table-test
  (testing "sim op-table includes undo/redo ops for random sync stress"
    (let [registered (set (map :name op-table))]
      (is (contains? registered :undo))
      (is (contains? registered :redo)))))

(deftest ^:long core-outliner-ops-registered-in-sim-op-table-test
  (testing "sim op-table includes core logseq.outliner.op operations"
    (let [registered (set (map :name op-table))
          required #{:save-block
                     :insert-blocks
                     :delete-blocks
                     :move-blocks
                     :move-blocks-up-down
                     :indent-outdent-blocks
                     :upsert-property
                     :set-block-property
                     :remove-block-property
                     :delete-property-value
                     :create-property-text-block
                     :batch-set-property
                     :batch-remove-property
                     :batch-delete-property-value
                     :class-add-property
                     :class-remove-property
                     :upsert-closed-value
                     :delete-closed-value
                     :add-existing-values-to-closed-values
                     :create-page
                     :rename-page
                     :delete-page
                     :toggle-reaction
                     :transact}]
      (is (empty? (set/difference required registered))
          (str "missing ops: " (set/difference required registered))))))

(defn- pick-op [rng {:keys [disable-ops enable-ops]}]
  (let [op-table' (cond->> op-table
                    (seq enable-ops)
                    (filter (fn [item] (contains? enable-ops (:name item))))

                    (seq disable-ops)
                    (remove (fn [item] (contains? disable-ops (:name item)))))
        op-table' (vec op-table')]
    (when (empty? op-table')
      (throw (ex-info "No available sim ops after filtering"
                      {:enable-ops enable-ops
                       :disable-ops disable-ops})))
    (let [total (reduce + (map :weight op-table'))
          target (rand-int! rng total)]
      (loop [remaining target
             [op & rest-ops] op-table']
        (if (nil? op)
          (first op-table')
          (let [weight (:weight op)]
            (if (< remaining weight)
              op
              (recur (- remaining weight) rest-ops))))))))

(defn- run-ops! [rng {:keys [repo conn base-uuid state gen-uuid]} steps history & {:keys [pick-op-opts context]}]
  (dotimes [step steps]
    (let [{:keys [f name]} (pick-op rng pick-op-opts)
          ;; _ (prn :debug :client (:repo client) :name name)
          result (case name
                   :create-page (f rng conn state {:gen-uuid gen-uuid})
                   :rename-page (f rng conn state base-uuid)
                   :delete-page (f rng conn base-uuid state)
                   :save-block (f rng conn state base-uuid)
                   :upsert-property (f rng conn)
                   :set-block-property (f rng conn state base-uuid gen-uuid)
                   :remove-block-property (f rng conn state base-uuid gen-uuid)
                   :delete-property-value (f rng conn state base-uuid gen-uuid)
                   :create-property-text-block (f rng conn)
                   :batch-set-property (f rng conn state base-uuid gen-uuid)
                   :batch-remove-property (f rng conn state base-uuid gen-uuid)
                   :batch-delete-property-value (f rng conn state base-uuid gen-uuid)
                   :class-add-property (f rng conn)
                   :class-remove-property (f rng conn)
                   :upsert-closed-value (f rng conn)
                   :delete-closed-value (f rng conn)
                   :add-existing-values-to-closed-values (f rng conn)
                   :insert-blocks (f rng conn state base-uuid {:gen-uuid gen-uuid})
                   :delete-blocks (f rng conn state)
                   :move-blocks (f rng conn state base-uuid)
                   :move-blocks-up-down (f rng conn state)
                   :indent-outdent-blocks (f rng conn state)
                   :toggle-reaction (f rng conn state)
                   :transact (f rng conn state)
                   :undo (f rng repo)
                   :redo (f rng repo)
                   :create-block (f rng conn state base-uuid {:gen-uuid gen-uuid})
                   :update-title (f rng conn state base-uuid)
                   :move-block (f rng conn state base-uuid)
                   :cut-paste-block-with-child (f rng conn state base-uuid)
                   :delete-block (f rng conn state)
                   (f rng conn))]
      (when result
        (swap! history conj (cond-> (assoc result :type :op :step step)
                              repo (assoc :repo repo)
                              context (assoc :context context)))))))

(deftest ^:long two-clients-online-offline-sim-test
  (testing "db-sync convergence with online/offline client and random ops"
    (prn :debug "run two-clients-online-offline-sim-test")
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}}
        (fn []
          (let [{:keys [_repro restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (ensure-base-page! conn-a base-uuid)
              (client-op/update-local-tx repo-a 0)
              (let [clients [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}]]
                (prn :debug :phase-a)
                ;; Phase A: online
                (dotimes [_ 500]
                  (let [client (first clients)]
                    (run-ops! rng (assoc client :base-uuid base-uuid :state state-a)
                              1
                              history
                              {:pick-op-opts {:disable-ops #{:undo :redo}}
                               :context {:phase :phase-a}})
                    (sync-loop! server clients)))

                ;; Phase B: offline
                (prn :debug :phase-b-offline)
                (let [clients-a [{:repo repo-a :conn conn-a :client client-a :online? false}]]
                  (dotimes [_ 500]
                    (run-ops! rng {:repo repo-a :conn conn-a :base-uuid base-uuid :state state-a :gen-uuid gen-uuid}
                              1
                              history
                              {:pick-op-opts {:disable-ops #{:undo :redo}}
                               :context {:phase :phase-b-offline}})
                    (sync-loop! server clients-a)))

                ;; Phase C: reconnect
                (prn :debug :phase-c-reconnect)
                (sync-loop! server clients)

                ;; Final sync
                (prn :debug :final-sync)
                (sync-loop! server clients)

                (let [issues-a (db-issues @conn-a)]
                  (when (seq issues-a)
                    (report-history! seed history {:type :db-issues :repo repo-a :issues issues-a}))
                  (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a))))

                (let [attrs-a (block-attr-map @conn-a)]
                  (is (seq attrs-a)
                      (str "db empty seed=" seed " history=" (count @history)))))
              (finally
                (restore)))))))))

(deftest ^:long ^:large-vars/cleanup-todo two-clients-offline-concurrent-undo-redo-merge-sim-test
  (testing "client B keeps anchor blocks/titles after reconnect while client A does heavy undo/redo"
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})
          state-b (atom {:pages #{base-uuid} :blocks #{}})]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}}
        (fn []
          (let [{:keys [repro restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (doseq [conn [conn-a conn-b]]
                (ensure-base-page! conn base-uuid))
              (doseq [repo [repo-a repo-b]]
                (client-op/update-local-tx repo 0))

              ;; Seed stable anchors (non-empty titles) that A won't touch.
              (let [base-a (d/entity @conn-a [:block/uuid base-uuid])
                    anchor-uuids (vec
                                  (for [i (range 10)]
                                    (let [u (gen-uuid)]
                                      (create-block! conn-a base-a (str "anchor-" i) u)
                                      u)))
                    clients-online [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                                    {:repo repo-b :conn conn-b :client client-b :online? true :gen-uuid gen-uuid}]
                    clients-a-only [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                                    {:repo repo-b :conn conn-b :client client-b :online? false :gen-uuid gen-uuid}]]
                (sync-loop! server clients-online)

                ;; A online: heavy add/remove/cut-paste + undo/redo while B offline.
                (let [a-parent (gen-uuid)
                      a-child (gen-uuid)
                      a-target (gen-uuid)
                      base-a (d/entity @conn-a [:block/uuid base-uuid])]
                  (create-block! conn-a base-a "a-parent" a-parent)
                  (create-block! conn-a (d/entity @conn-a [:block/uuid a-parent]) "a-child" a-child)
                  (create-block! conn-a base-a "" a-target)
                  (swap! state-a update :blocks into #{a-parent a-child a-target}))

                ;; B local workspace (separate from anchors).
                (let [b-parent (gen-uuid)
                      b-child (gen-uuid)
                      b-target (gen-uuid)
                      base-b (d/entity @conn-b [:block/uuid base-uuid])]
                  (create-block! conn-b base-b "b-parent" b-parent)
                  (create-block! conn-b (d/entity @conn-b [:block/uuid b-parent]) "b-child" b-child)
                  (create-block! conn-b base-b "" b-target)
                  (swap! state-b update :blocks into #{b-parent b-child b-target}))

                (dotimes [_ op-runs]
                  (run-ops! rng {:repo repo-a
                                 :conn conn-a
                                 :base-uuid base-uuid
                                 :state state-a
                                 :gen-uuid gen-uuid}
                            1
                            history
                            {:pick-op-opts {:enable-ops #{:undo
                                                          :redo
                                                          :create-block
                                                          :delete-block
                                                          :cut-paste-block-with-child}}
                             :context {:phase :a-online-b-offline}})
                  (sync-loop! server clients-a-only))

                ;; B offline: local edits to anchors + local block ops.
                (dotimes [i op-runs]
                  (when-let [anchor-uuid (rand-nth! rng anchor-uuids)]
                    (when-let [ent (d/entity @conn-b [:block/uuid anchor-uuid])]
                      (let [new-title (str "b-local-" i)]
                        (update-title! conn-b anchor-uuid new-title)
                        (swap! history conj {:type :op
                                             :op :update-title
                                             :repo repo-b
                                             :uuid anchor-uuid
                                             :title new-title
                                             :step i
                                             :anchor-existed? (some? ent)
                                             :context {:phase :b-offline-local-anchor-edit}}))))
                  (run-ops! rng {:repo repo-b
                                 :conn conn-b
                                 :base-uuid base-uuid
                                 :state state-b
                                 :gen-uuid gen-uuid}
                            1
                            history
                            {:pick-op-opts {:enable-ops #{:undo
                                                          :redo
                                                          :create-block
                                                          :delete-block
                                                          :cut-paste-block-with-child}}
                             :context {:phase :b-offline-local-ops}}))

                ;; Reconnect and merge (large backlogs need many rounds).
                (let [rounds (sync-until-idle! server clients-online 300)]
                  (is (< rounds 300)
                      (str "sync did not become idle seed=" seed " rounds=" rounds)))

                (let [issues-a (db-issues @conn-a)
                      issues-b (db-issues @conn-b)
                      attrs-a (block-attr-map @conn-a)
                      attrs-b (block-attr-map @conn-b)]
                  (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a)))
                  (is (empty? issues-b) (str "db B issues seed=" seed " " (pr-str issues-b)))
                  (assert-synced-attrs! seed history attrs-a attrs-b attrs-b)
                  (doseq [anchor-uuid anchor-uuids]
                    (let [ent-a (d/entity @conn-a [:block/uuid anchor-uuid])
                          ent-b (d/entity @conn-b [:block/uuid anchor-uuid])]
                      (is (some? ent-a) (str "anchor missing in A seed=" seed " uuid=" anchor-uuid))
                      (is (some? ent-b) (str "anchor missing in B seed=" seed " uuid=" anchor-uuid))
                      (is (not (string/blank? (or (:block/title ent-a) ""))) (str "anchor title blank in A seed=" seed " uuid=" anchor-uuid))
                      (is (not (string/blank? (or (:block/title ent-b) ""))) (str "anchor title blank in B seed=" seed " uuid=" anchor-uuid))))
                  (assert-no-invalid-tx! seed history repro)))
              (finally
                (restore)))))))))

(deftest ^:long two-clients-rebase-keeps-local-title-after-reverse-tx-test
  (testing "two clients keep local title after reverse tx with newer tx id"
    (let [base-uuid (uuid "11111111-1111-1111-1111-111111111111")
          block-uuid (uuid "22222222-2222-2222-2222-222222222222")
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          server (make-server)]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}}
        (fn []
          (reset! db-sync/*repo->latest-remote-tx {})
          (client-op/update-local-tx repo-a 0)
          (client-op/update-local-tx repo-b 0)
          (ensure-base-page! conn-a base-uuid)
          (let [base (d/entity @conn-a [:block/uuid base-uuid])]
            (create-block! conn-a base "before" block-uuid))
          (sync-loop! server [{:repo repo-a :conn conn-a :client client-a :online? true}])
          (sync-loop! server [{:repo repo-b :conn conn-b :client client-b :online? true}])
          (is (= "before" (:block/title (d/entity @conn-b [:block/uuid block-uuid]))))
          (update-title! conn-a block-uuid "test")
          (is (seq (#'db-sync/pending-txs repo-a)))
          (d/transact! conn-b [[:db/add [:block/uuid block-uuid] :block/updated-at 1710000000000]])
          (sync-loop! server [{:repo repo-b :conn conn-b :client client-b :online? true}])
          (sync-loop! server [{:repo repo-a :conn conn-a :client client-a :online? true}])
          (is (= "test" (:block/title (d/entity @conn-a [:block/uuid block-uuid])))))))))

(defonce op-runs 200)

(defn- run-random-ops!
  [rng server clients repo->state base-uuid history run-ops-opts steps]
  (dotimes [_ steps]
    (let [client (rand-nth! rng clients)
          state (get repo->state (:repo client))]
      (run-ops! rng (assoc client :base-uuid base-uuid :state state) 1 history run-ops-opts)
      (sync-loop! server clients))))

(defn- run-local-ops!
  [rng conn base-uuid state history run-ops-opts steps gen-uuid]
  (dotimes [_ steps]
    (run-ops! rng {:conn conn :base-uuid base-uuid :state state :gen-uuid gen-uuid} 1 history run-ops-opts)))

(defn- assert-synced-attrs!
  [seed history attrs-a attrs-b attrs-c]
  (when-not (= attrs-a attrs-b)
    (let [[a b] (take 2 (data/diff attrs-a attrs-b))]
      (prn :debug :diff :attrs-a a :attrs-b b)))
  (when-not (= attrs-a attrs-c)
    (let [[a c] (take 2 (data/diff attrs-a attrs-c))]
      (prn :debug :diff :attrs-a a :attrs-c c)))
  (when (or (not= attrs-a attrs-b) (not= attrs-a attrs-c))
    (report-history! seed history {:type :attrs-mismatch}))
  (is (= attrs-a attrs-b)
      (str "db mismatch A/B seed=" seed
           " a=" (count attrs-a)
           " b=" (count attrs-b)
           " history=" (count @history)))
  (is (= attrs-a attrs-c)
      (str "db mismatch A/C seed=" seed
           " a=" (count attrs-a)
           " c=" (count attrs-c)
           " history=" (count @history))))

(defn- assert-no-invalid-tx!
  [seed history repro]
  (when-let [payload @repro]
    (report-history! seed history {:type :unexpected-invalid-tx
                                   :tx-meta (:tx-meta payload)
                                   :errors (:errors payload)}))
  (is (nil? @repro)
      (str "unexpected invalid tx seed=" seed
           " tx-meta=" (pr-str (:tx-meta @repro))
           " errors=" (pr-str (:errors @repro)))))

(deftest ^:long two-clients-online-sim-test
  (testing "db-sync convergence with two online clients"
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})
          state-b (atom {:pages #{base-uuid} :blocks #{}})
          repo->state {repo-a state-a
                       repo-b state-b}]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}}
        (fn []
          (let [{:keys [_repro restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (doseq [conn [conn-a conn-b]]
                (ensure-base-page! conn base-uuid))
              (doseq [repo [repo-a repo-b]]
                (client-op/update-local-tx repo 0))
              (let [clients [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                             {:repo repo-b :conn conn-b :client client-b :online? true :gen-uuid gen-uuid}]]
                (prn :debug :phase-a)
                (run-random-ops! rng server clients repo->state base-uuid history
                                 {:pick-op-opts {:disable-ops #{:undo :redo}}
                                  :context {:phase :phase-a}}
                                 op-runs)
                (prn :debug :final-sync)
                (sync-loop! server clients)
                (let [issues-a (db-issues @conn-a)
                      issues-b (db-issues @conn-b)]
                  (when (seq issues-a)
                    (report-history! seed history {:type :db-issues :repo repo-a :issues issues-a}))
                  (when (seq issues-b)
                    (report-history! seed history {:type :db-issues :repo repo-b :issues issues-b}))
                  (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a)))
                  (is (empty? issues-b) (str "db B issues seed=" seed " " (pr-str issues-b))))
                (let [attrs-a (block-attr-map @conn-a)
                      attrs-b (block-attr-map @conn-b)]
                  (assert-synced-attrs! seed history attrs-a attrs-b attrs-b)))
              (finally
                (restore)))))))))

(deftest ^:long two-clients-cut-paste-random-sim-test
  (testing "db-sync convergence under random cut-paste with child operations"
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}}
        (fn []
          (let [{:keys [repro restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (doseq [conn [conn-a conn-b]]
                (ensure-base-page! conn base-uuid))
              (doseq [repo [repo-a repo-b]]
                (client-op/update-local-tx repo 0))
              (let [clients [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                             {:repo repo-b :conn conn-b :client client-b :online? true :gen-uuid gen-uuid}]
                    base-a (d/entity @conn-a [:block/uuid base-uuid])
                    parent-uuid (gen-uuid)
                    child-uuid (gen-uuid)
                    target-uuid (gen-uuid)]
                (create-block! conn-a base-a "seed-parent" parent-uuid)
                (let [parent (d/entity @conn-a [:block/uuid parent-uuid])]
                  (create-block! conn-a parent "seed-child" child-uuid))
                (create-block! conn-a base-a "" target-uuid)
                (swap! state-a update :blocks into #{parent-uuid child-uuid target-uuid})

                (dotimes [_ op-runs]
                  (run-ops! rng {:repo repo-a
                                 :conn conn-a
                                 :base-uuid base-uuid
                                 :state state-a
                                 :gen-uuid gen-uuid}
                            1
                            history
                            {:pick-op-opts {:enable-ops #{:cut-paste-block-with-child
                                                          :create-block
                                                          :move-block}}
                             :context {:phase :cut-paste-random}})
                  (sync-loop! server clients))
                (sync-loop! server clients)

                (let [issues-a (db-issues @conn-a)
                      issues-b (db-issues @conn-b)
                      attrs-a (block-attr-map @conn-a)
                      attrs-b (block-attr-map @conn-b)
                      cut-paste-ops (filter #(= :cut-paste-block-with-child (:op %)) @history)]
                  (is (seq cut-paste-ops)
                      (str "expected cut-paste ops seed=" seed " history=" (count @history)))
                  (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a)))
                  (is (empty? issues-b) (str "db B issues seed=" seed " " (pr-str issues-b)))
                  (assert-synced-attrs! seed history attrs-a attrs-b attrs-b)
                  (assert-no-invalid-tx! seed history repro)))
              (finally
                (restore)))))))))

(deftest ^:long two-clients-undo-redo-add-remove-cut-paste-random-sim-test
  (testing "db-sync convergence under undo/redo with add/remove/cut-paste operations"
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}}
        (fn []
          (let [{:keys [repro restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (doseq [conn [conn-a conn-b]]
                (ensure-base-page! conn base-uuid))
              (doseq [repo [repo-a repo-b]]
                (client-op/update-local-tx repo 0))
              (let [clients [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                             {:repo repo-b :conn conn-b :client client-b :online? true :gen-uuid gen-uuid}]
                    base-a (d/entity @conn-a [:block/uuid base-uuid])
                    parent-uuid (gen-uuid)
                    child-uuid (gen-uuid)
                    target-uuid (gen-uuid)]
                (create-block! conn-a base-a "seed-parent" parent-uuid)
                (let [parent (d/entity @conn-a [:block/uuid parent-uuid])]
                  (create-block! conn-a parent "seed-child" child-uuid))
                (create-block! conn-a base-a "" target-uuid)
                (swap! state-a update :blocks into #{parent-uuid child-uuid target-uuid})

                (dotimes [_ op-runs]
                  (run-ops! rng {:repo repo-a
                                 :conn conn-a
                                 :base-uuid base-uuid
                                 :state state-a
                                 :gen-uuid gen-uuid}
                            1
                            history
                            {:pick-op-opts {:enable-ops #{:undo
                                                          :redo
                                                          :create-block
                                                          :delete-block
                                                          :cut-paste-block-with-child}}
                             :context {:phase :undo-redo-add-remove-cut-paste}})
                  (sync-loop! server clients))
                (sync-loop! server clients)

                (let [issues-a (db-issues @conn-a)
                      issues-b (db-issues @conn-b)
                      attrs-a (block-attr-map @conn-a)
                      attrs-b (block-attr-map @conn-b)
                      undo-redo-ops (filter #(contains? #{:undo :redo} (:op %)) @history)]
                  (is (seq undo-redo-ops)
                      (str "expected undo/redo ops seed=" seed " history=" (count @history)))
                  (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a)))
                  (is (empty? issues-b) (str "db B issues seed=" seed " " (pr-str issues-b)))
                  (assert-synced-attrs! seed history attrs-a attrs-b attrs-b)
                  (assert-no-invalid-tx! seed history repro)))
              (finally
                (restore)))))))))

(deftest ^:long ^:large-vars/cleanup-todo three-clients-single-repo-sim-test
  (prn :debug "run three-clients-single-repo-sim-test")
  (testing "db-sync convergence with three clients sharing one repo"
    (let [seed (or (env-seed) default-seed)
          rng (make-rng seed)
          gen-uuid #(rng-uuid rng)
          base-uuid (gen-uuid)
          conn-a (db-test/create-conn)
          conn-b (db-test/create-conn)
          conn-c (db-test/create-conn)
          ops-a (d/create-conn client-op/schema-in-db)
          ops-b (d/create-conn client-op/schema-in-db)
          ops-c (d/create-conn client-op/schema-in-db)
          client-a (make-client repo-a)
          client-b (make-client repo-b)
          client-c (make-client repo-c)
          server (make-server)
          history (atom [])
          state-a (atom {:pages #{base-uuid} :blocks #{}})
          state-b (atom {:pages #{base-uuid} :blocks #{}})
          state-c (atom {:pages #{base-uuid} :blocks #{}})
          repo->state {repo-a state-a
                       repo-b state-b
                       repo-c state-c}]
      (with-test-repos {repo-a {:conn conn-a :ops-conn ops-a}
                        repo-b {:conn conn-b :ops-conn ops-b}
                        repo-c {:conn conn-c :ops-conn ops-c}}
        (fn []
          (let [{:keys [restore]} (install-invalid-tx-repro! seed history)]
            (try
              (reset! db-sync/*repo->latest-remote-tx {})
              (record-meta! history {:seed seed :base-uuid base-uuid})
              (doseq [conn [conn-a conn-b conn-c]]
                (ensure-base-page! conn base-uuid))
              (doseq [repo [repo-a repo-b repo-c]]
                (client-op/update-local-tx repo 0))
              (let [clients [{:repo repo-a :conn conn-a :client client-a :online? true :gen-uuid gen-uuid}
                             {:repo repo-b :conn conn-b :client client-b :online? true :gen-uuid gen-uuid}
                             {:repo repo-c :conn conn-c :client client-c :online? true :gen-uuid gen-uuid}]
                    ;; run-ops-opts {:pick-op-opts {:disable-ops #{:move-block}}}
                    run-ops-opts {:pick-op-opts {:disable-ops #{:undo :redo}}}]
                (letfn [(sync-or-report! [phase]
                          (try
                            (sync-loop! server clients)
                            (catch :default e
                              (report-history! seed history
                                               (merge {:type :sync-loop-error
                                                       :phase phase}
                                                      (ex-data e)))
                              (throw e))))]
                  (prn :debug :phase-a)
                ;; Phase A: all online
                  (run-random-ops! rng server clients repo->state base-uuid history
                                   (assoc run-ops-opts :context {:phase :phase-a})
                                   op-runs)

                ;; Phase B: C offline, A/B online
                  (prn :debug :phase-b-c-offline)
                  (let [clients-phase-b [{:repo repo-a :conn conn-a :client client-a :online? true}
                                         {:repo repo-b :conn conn-b :client client-b :online? true}
                                         {:repo repo-c :conn conn-c :client client-c :online? false}]]
                    (run-random-ops! rng server
                                     (subvec (vec (mapv #(assoc % :gen-uuid gen-uuid) clients-phase-b)) 0 2)
                                     repo->state
                                     base-uuid
                                     history
                                     (assoc run-ops-opts :context {:phase :phase-b-ab-online})
                                     op-runs)
                    (run-local-ops! rng conn-c base-uuid state-c history
                                    (assoc run-ops-opts :context {:phase :phase-b-c-offline})
                                    op-runs
                                    gen-uuid))

                ;; Phase C: reconnect C
                  (prn :debug :phase-c-reconnect)
                  (sync-or-report! :phase-c-reconnect)

                ;; Phase D: A offline, B/C online
                  (prn :debug :phase-d-a-offline)
                  (let [clients-phase-d [{:repo repo-a :conn conn-a :client client-a :online? false}
                                         {:repo repo-b :conn conn-b :client client-b :online? true}
                                         {:repo repo-c :conn conn-c :client client-c :online? true}]]
                    (run-random-ops! rng server
                                     (subvec (vec (mapv #(assoc % :gen-uuid gen-uuid) clients-phase-d)) 1 3)
                                     repo->state
                                     base-uuid
                                     history
                                     (assoc run-ops-opts :context {:phase :phase-d-bc-online})
                                     op-runs)
                    (run-local-ops! rng conn-a base-uuid state-a history
                                    (assoc run-ops-opts :context {:phase :phase-d-a-offline})
                                    op-runs
                                    gen-uuid))

                ;; Final sync
                  (prn :debug :final-sync)
                  (sync-or-report! :final-sync)

                  (let [issues-a (db-issues @conn-a)
                        issues-b (db-issues @conn-b)
                        issues-c (db-issues @conn-c)]
                    (when (seq issues-a)
                      (report-history! seed history {:type :db-issues :repo repo-a :issues issues-a}))
                    (when (seq issues-b)
                      (report-history! seed history {:type :db-issues :repo repo-b :issues issues-b}))
                    (when (seq issues-c)
                      (report-history! seed history {:type :db-issues :repo repo-c :issues issues-c}))
                    (is (empty? issues-a) (str "db A issues seed=" seed " " (pr-str issues-a)))
                    (is (empty? issues-b) (str "db B issues seed=" seed " " (pr-str issues-b)))
                    (is (empty? issues-c) (str "db C issues seed=" seed " " (pr-str issues-c))))

                  (let [attrs-a (block-attr-map @conn-a)
                        attrs-b (block-attr-map @conn-b)
                        attrs-c (block-attr-map @conn-c)]
                    (assert-synced-attrs! seed history attrs-a attrs-b attrs-c))))
              (finally
                (restore)))))))))
