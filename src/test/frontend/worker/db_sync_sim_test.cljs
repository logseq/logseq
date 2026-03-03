(ns frontend.worker.db-sync-sim-test
  (:require [cljs.test :refer [deftest is testing]]
            [clojure.data :as data]
            [datascript.core :as d]
            [frontend.worker.handler.page :as worker-page]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.client-op :as client-op]
            [logseq.db :as ldb]
            [logseq.db.common.normalize :as db-normalize]
            [logseq.db.test.helper :as db-test]
            [logseq.outliner.core :as outliner-core]
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
  (let [db-prev @worker-state/*datascript-conns
        ops-prev @worker-state/*client-ops-conns
        listeners (atom [])]
    (reset! worker-state/*datascript-conns (into {} (map (fn [[repo {:keys [conn]}]]
                                                           [repo conn])
                                                         repo->conns)))
    (reset! worker-state/*client-ops-conns (into {} (map (fn [[repo {:keys [ops-conn]}]]
                                                           [repo ops-conn])
                                                         repo->conns)))
    (doseq [[repo {:keys [conn ops-conn]}] repo->conns]
      (when ops-conn
        (let [key (keyword "db-sync-sim" repo)]
          (d/listen! conn key
                     (fn [tx-report]
                       (db-sync/enqueue-local-tx! repo tx-report)))
          (swap! listeners conj [conn key]))))
    (try
      (f)
      (finally
        (doseq [[conn key] @listeners]
          (d/unlisten! conn key))
        (reset! worker-state/*datascript-conns db-prev)
        (reset! worker-state/*client-ops-conns ops-prev)))))

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
    (when (< i 8)
      (let [progress? (atom false)]
        (doseq [client clients]
          (when (sync-client! server client)
            (reset! progress? true)))
        (when @progress?
          (recur (inc i))))))
  (let [conns (keep (fn [c] (when (:online? c) (:conn c))) clients)]
    (when (seq conns)
      (let [block-counts (map #(count (d/datoms (deref %) :avet :block/uuid)) conns)]
        (when-not (= (count (distinct block-counts)) 1)
          (throw (ex-info "blocks count not equal after sync"
                          {:block-counts block-counts
                           :clients (keep (fn [c]
                                            (when (:online? c)
                                              {:repo (:repo c)
                                               :datoms-count (count (d/datoms (deref (:conn c)) :avet :block/uuid))}))
                                          clients)})))))))

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

(defn- op-delete-block! [rng conn state]
  (let [db @conn
        block (rand-nth! rng (vec (existing-blocks db (:blocks @state))))]
    (when (and block (d/entity @conn [:block/uuid (:block/uuid block)]))
      (delete-block! conn (:block/uuid block))
      (swap! state update :blocks disj (:block/uuid block))
      {:op :delete-block :uuid (:block/uuid block)})))

;; TODO: add tag/property/migrate/undo/redo ops
(def ^:private op-table
  [{:name :create-page :weight 6 :f op-create-page!}
   {:name :delete-page :weight 2 :f op-delete-page!}
   {:name :create-block :weight 10 :f op-create-block!}
   {:name :move-block :weight 6 :f op-move-block!}
   {:name :delete-block :weight 4 :f op-delete-block!}
   {:name :update-title :weight 8 :f op-update-title!}])

(defn- pick-op [rng {:keys [disable-ops]}]
  (let [op-table' (if (seq disable-ops)
                    (remove (fn [item] (contains? disable-ops (:name item))) op-table)
                    op-table)
        total (reduce + (map :weight op-table'))
        target (rand-int! rng total)]
    (loop [remaining target
           [op & rest-ops] op-table']
      (if (nil? op)
        (first op-table')
        (let [weight (:weight op)]
          (if (< remaining weight)
            op
            (recur (- remaining weight) rest-ops)))))))

(defn- run-ops! [rng {:keys [repo conn base-uuid state gen-uuid]} steps history & {:keys [pick-op-opts context]}]
  (dotimes [step steps]
    (let [{:keys [f name]} (pick-op rng pick-op-opts)
          ;; _ (prn :debug :client (:repo client) :name name)
          result (case name
                   :create-page (f rng conn state {:gen-uuid gen-uuid})
                   :delete-page (f rng conn base-uuid state)
                   :create-block (f rng conn state base-uuid {:gen-uuid gen-uuid})
                   :update-title (f rng conn state base-uuid)
                   :move-block (f rng conn state base-uuid)
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
          (let [{:keys [restore]} (install-invalid-tx-repro! seed history)]
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
                              {:context {:phase :phase-a}})
                    (sync-loop! server clients)))

                ;; Phase B: offline
                (prn :debug :phase-b-offline)
                (let [clients-a [{:repo repo-a :conn conn-a :client client-a :online? false}]]
                  (dotimes [_ 500]
                    (run-ops! rng {:repo repo-a :conn conn-a :base-uuid base-uuid :state state-a :gen-uuid gen-uuid}
                              1
                              history
                              {:context {:phase :phase-b-offline}})
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

(defonce op-runs 50)

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
          (let [{:keys [restore]} (install-invalid-tx-repro! seed history)]
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
                                 {:context {:phase :phase-a}}
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
                    run-ops-opts {}]
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
                (sync-loop! server clients)

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
                (sync-loop! server clients)

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
                  (assert-synced-attrs! seed history attrs-a attrs-b attrs-c)))
              (finally
                (restore)))))))))
