(ns replay-sync-sqlite
  "Replay db-sync rebase/apply flow directly from sqlite artifacts.

  It replays:
  1) server tx_log baseline up to before remote window,
  2) local client ops as applied local changes,
  3) reverse local ops,
  4) apply remote txs,
  5) reapply local ops.

  Supports `legacy` vs `fixed` reapply fallback logic to verify behavior."
  (:require ["better-sqlite3" :as sqlite3]
            ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db :as ldb]
            [logseq.db.common.sqlite-cli :as sqlite-cli]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.schema :as db-schema]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.op :as outliner-op]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [logseq.outliner.recycle :as outliner-recycle]
            [nbb.core :as nbb]))

(def sqlite (if (find-ns 'nbb.core) (aget sqlite3 "default") sqlite3))

(def canonical-transact-op [[:transact nil]])

(def cli-spec
  {:help {:alias :h
          :desc "Show help"}
   :server-db {:alias :s
               :desc "Path to server graph db.sqlite containing tx_log"
               :coerce :string}
   :client-ops-db {:alias :c
                   :desc "Path to client ops sqlite"
                   :coerce :string}
   :from-t {:alias :f
            :desc "Replay remote txs from this t (inclusive). If omitted, use --auto-from-conflict"
            :coerce :long}
   :to-t {:alias :t
          :desc "Replay remote txs to this t (inclusive). Default: all after from-t"
          :coerce :long}
   :remote-limit {:alias :l
                  :desc "Cap remote tx count after from-t"
                  :coerce :long}
   :mode {:alias :m
          :desc "fixed | legacy | both (default both)"
          :coerce :string}
   :pending-only {:desc "Only include rows where :db-sync/pending? true"}
   :local-created-at-min {:desc "Filter local ops by created-at >= value"
                          :coerce :long}
   :local-created-at-max {:desc "Filter local ops by created-at <= value"
                          :coerce :long}
   :local-tx-id {:desc "Repeatable tx-id UUID filter"
                 :coerce []}
   :auto-from-conflict {:desc "Infer from-t from first remote tx referencing uuids deleted by selected local ops"}
   :inspect-only {:desc "Only print inferred conflict info without replay"}
   :pretty {:desc "Pretty-print JSON output"}})

(def local-op-keys
  [:db/id
   :db-sync/tx-id
   :db-sync/created-at
   :db-sync/pending?
   :db-sync/failed?
   :db-sync/outliner-op
   :db-sync/forward-outliner-ops
   :db-sync/inverse-outliner-ops
   :db-sync/inferred-outliner-ops?
   :db-sync/normalized-tx-data
   :db-sync/reversed-tx-data])

(defn usage []
  (str "Usage:\n"
       "  yarn -s nbb-logseq -cp src:../outliner/src:../common/src:../graph-parser/src script/replay_sync_sqlite.cljs \\\n"
       "    --server-db <server-db.sqlite> --client-ops-db <client-ops.sqlite> [--from-t <n>] [--to-t <n>] [--mode both] [--pretty]\n"
       "\n"
       "Examples:\n"
       "  yarn -s nbb-logseq -cp src:../outliner/src:../common/src:../graph-parser/src script/replay_sync_sqlite.cljs \\\n"
       "    --server-db /path/server/db.sqlite --client-ops-db /path/electron_client_ops.sqlite \\\n"
       "    --auto-from-conflict --local-created-at-max 1775717890000 --mode both --pretty\n"
       "\n"
       "Options:\n"
       (cli/format-opts {:spec cli-spec})))

(defn resolve-path
  [path*]
  (if (node-path/isAbsolute path*)
    path*
    (node-path/join (or js/process.env.ORIGINAL_PWD ".") path*)))

(defn parse-uuid
  [value]
  (cond
    (uuid? value)
    value

    (string? value)
    (try
      (uuid value)
      (catch :default _
        nil))

    :else
    nil))

(defn uuid-ref
  [value]
  (cond
    (uuid? value)
    value

    (string? value)
    (parse-uuid value)

    (and (vector? value)
         (= :block/uuid (first value)))
    (parse-uuid (second value))

    (map? value)
    (some-> (:block/uuid value) parse-uuid)

    :else
    nil))

(defn collect-uuids
  [value]
  (cond
    (nil? value)
    []

    (uuid? value)
    [value]

    (string? value)
    (if-let [u (parse-uuid value)] [u] [])

    (vector? value)
    (if (and (= :block/uuid (first value))
             (some? (second value)))
      (if-let [u (parse-uuid (second value))]
        [u]
        [])
      (mapcat collect-uuids value))

    (set? value)
    (mapcat collect-uuids value)

    (sequential? value)
    (mapcat collect-uuids value)

    (map? value)
    (mapcat collect-uuids (vals value))

    :else
    []))

(defn read-server-tx-log
  [server-db-path]
  (let [db (new sqlite server-db-path nil)]
    (try
      (->> (.all (.prepare db "select t, tx, outliner_op from tx_log order by t asc"))
           (mapv (fn [row]
                   (let [t (aget row "t")
                         tx-str (aget row "tx")
                         outliner-op (aget row "outliner_op")]
                     {:t t
                      :outliner-op (when (string? outliner-op)
                                     (keyword outliner-op))
                      :tx-data (ldb/read-transit-str tx-str)}))))
      (finally
        (.close db)))))

(defn entity->local-op
  [db eid]
  (let [ent (d/entity db eid)
        m (into {} ent)]
    {:db/id (:db/id ent)
     :tx-id (:db-sync/tx-id ent)
     :created-at (:db-sync/created-at ent)
     :pending? (:db-sync/pending? ent)
     :failed? (:db-sync/failed? ent)
     :outliner-op (:db-sync/outliner-op ent)
     :forward-outliner-ops (:db-sync/forward-outliner-ops ent)
     :inverse-outliner-ops (:db-sync/inverse-outliner-ops ent)
     :inferred-outliner-ops? (:db-sync/inferred-outliner-ops? ent)
     :tx (:db-sync/normalized-tx-data ent)
     :reversed-tx (:db-sync/reversed-tx-data ent)
     :raw (select-keys m local-op-keys)}))

(defn read-client-ops
  [client-ops-db-path]
  (let [{:keys [conn sqlite]} (sqlite-cli/open-sqlite-datascript! client-ops-db-path)]
    (try
      (let [db @conn]
        (->> (d/q '[:find ?e ?created-at
                    :where
                    [?e :db-sync/tx-id _]
                    [?e :db-sync/created-at ?created-at]]
                  db)
             (sort-by (fn [[e created-at]] [created-at e]))
             (mapv (fn [[e _]]
                     (entity->local-op db e)))))
      (finally
        (when sqlite
          (.close sqlite))))))

(defn parse-tx-id-set
  [tx-id-values]
  (let [values (if (sequential? tx-id-values) tx-id-values [])]
    (->> values
         (mapcat (fn [v]
                   (if (string? v)
                     (remove string/blank? (string/split v #","))
                     [])))
         (map parse-uuid)
         (remove nil?)
         set)))

(defn filter-local-ops
  [ops {:keys [pending-only local-created-at-min local-created-at-max local-tx-id]}]
  (let [tx-id-set (parse-tx-id-set local-tx-id)]
    (->> ops
         (filter (fn [op]
                   (and
                    (if pending-only
                      (true? (:pending? op))
                      true)
                    (if (some? local-created-at-min)
                      (>= (or (:created-at op) -1) local-created-at-min)
                      true)
                    (if (some? local-created-at-max)
                      (<= (or (:created-at op) js/Number.MAX_SAFE_INTEGER) local-created-at-max)
                      true)
                    (if (seq tx-id-set)
                      (contains? tx-id-set (:tx-id op))
                      true))))
         vec)))

(defn delete-op-uuids
  [local-ops]
  (->> local-ops
       (mapcat :forward-outliner-ops)
       (filter (fn [op] (= :delete-blocks (first op))))
       (mapcat (fn [[_ args]]
                 (let [[ids] args]
                   (if (sequential? ids) ids []))))
       (map uuid-ref)
       (remove nil?)
       set))

(defn row-referenced-uuids
  [row]
  (->> (:tx-data row)
       (mapcat collect-uuids)
       set))

(defn infer-conflicts
  [server-rows local-ops]
  (let [deleted-uuids (delete-op-uuids local-ops)
        conflicts (when (seq deleted-uuids)
                    (->> server-rows
                         (keep (fn [row]
                                 (let [refs (row-referenced-uuids row)
                                       hit (seq (clojure.set/intersection deleted-uuids refs))]
                                   (when hit
                                     {:t (:t row)
                                      :outliner-op (:outliner-op row)
                                      :hits (vec (take 10 hit))}))))
                         vec))]
    {:deleted-uuids (vec deleted-uuids)
     :conflicts conflicts
     :first-conflict-t (some-> conflicts first :t)}))

(defn select-remote-rows
  [server-rows from-t to-t remote-limit]
  (let [rows (->> server-rows
                  (filter (fn [{:keys [t]}]
                            (and (if (some? from-t) (>= t from-t) true)
                                 (if (some? to-t) (<= t to-t) true))))
                  vec)]
    (if (some? remote-limit)
      (vec (take remote-limit rows))
      rows)))

(defn baseline-rows
  [server-rows from-t]
  (->> server-rows
       (filter (fn [{:keys [t]}]
                 (if (some? from-t) (< t from-t) true)))
       vec))

(defn usable-history-ops
  [ops]
  (let [ops' (some-> ops seq vec)]
    (when (and (seq ops')
               (not= canonical-transact-op ops'))
      ops')))

(defn entity-id->block-uuid
  [db id]
  (or (uuid-ref id)
      (some-> (d/entity db id) :block/uuid)))

(defn delete-block-root-uuids
  [db forward-outliner-ops]
  (->> (usable-history-ops forward-outliner-ops)
       (mapcat (fn [[op args]]
                 (if (= :delete-blocks op)
                   (let [[ids] args]
                     (if (sequential? ids)
                       (keep #(entity-id->block-uuid db %) ids)
                       []))
                   [])))
       distinct
       vec))

(defn raw-restored-block-uuids
  [raw-tx-data]
  (->> raw-tx-data
       (keep (fn [datom]
               (when (and (vector? datom)
                          (>= (count datom) 4)
                          (= :db/add (nth datom 0))
                          (= :block/uuid (nth datom 2)))
                 (uuid-ref (nth datom 3)))))
       distinct
       vec))

(defn assert-delete-block-roots-restored!
  [conn local-tx]
  (let [root-uuids (delete-block-root-uuids @conn (:forward-outliner-ops local-tx))]
    (when (seq root-uuids)
      (let [missing-root-uuids (->> root-uuids
                                    (remove #(d/entity @conn [:block/uuid %]))
                                    vec)]
        (when (seq missing-root-uuids)
          (throw (ex-info "incomplete delete-blocks reverse"
                          {:error :db-sync/incomplete-delete-blocks-reverse
                           :tx-id (:tx-id local-tx)
                           :outliner-op (:outliner-op local-tx)
                           :root-uuids root-uuids
                           :missing-root-uuids missing-root-uuids})))))))

(defn assert-raw-restored-block-uuids!
  [conn local-tx raw-tx-data]
  (let [restored-uuids (raw-restored-block-uuids raw-tx-data)]
    (when (seq restored-uuids)
      (let [missing-restored-uuids (->> restored-uuids
                                        (remove #(d/entity @conn [:block/uuid %]))
                                        vec)]
        (when (seq missing-restored-uuids)
          (throw (ex-info "incomplete raw restored uuids"
                          {:error :db-sync/incomplete-raw-restored-uuids
                           :tx-id (:tx-id local-tx)
                           :outliner-op (:outliner-op local-tx)
                           :restored-uuids restored-uuids
                           :missing-restored-uuids missing-restored-uuids})))))))

(defn invalid-rebase-op!
  [op data]
  (throw (ex-info "invalid rebase op" (assoc data :op op))))

(defn replay-entity-id-value
  [db v]
  (cond
    (number? v)
    v

    (uuid? v)
    (some-> (d/entity db [:block/uuid v]) :db/id)

    (or (vector? v) (qualified-keyword? v))
    (some-> (d/entity db v) :db/id)

    :else
    v))

(defn stable-entity-ref-like?
  [v]
  (or (qualified-keyword? v)
      (and (vector? v)
           (or (= :block/uuid (first v))
               (= :db/ident (first v))))))

(defn replay-property-value
  [db property-id v]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (cond
        (stable-entity-ref-like? v)
        (replay-entity-id-value db v)

        (set? v)
        (->> v
             (map #(if (stable-entity-ref-like? %)
                     (replay-entity-id-value db %)
                     %))
             set)

        (sequential? v)
        (mapv #(if (stable-entity-ref-like? %)
                 (replay-entity-id-value db %)
                 %)
              v)

        :else
        v)
      v)))

(defn replay-entity-id-coll
  [db ids]
  (mapv #(or (replay-entity-id-value db %) %) ids))

(defn rebase-find-existing-left-sibling
  [current-db target]
  (loop [sibling (ldb/get-left-sibling target)]
    (if (nil? sibling)
      nil
      (if-let [current-sibling (and sibling (d/entity current-db [:block/uuid (:block/uuid sibling)]))]
        current-sibling
        (recur (ldb/get-left-sibling sibling))))))

(defn rebase-resolve-target-and-sibling
  [current-db rebase-db-before target-id sibling?]
  (let [target (d/entity current-db target-id)
        target-before (when rebase-db-before
                        (d/entity rebase-db-before target-id))
        parent-before (when rebase-db-before
                        (:block/parent (d/entity rebase-db-before target-id)))]
    (cond
      target
      [target sibling?]

      (and target-before parent-before sibling?)
      (if-let [left-sibling (rebase-find-existing-left-sibling current-db target-before)]
        [left-sibling true]
        (when-let [parent (d/entity current-db [:block/uuid (:block/uuid parent-before)])]
          [parent false]))

      :else
      nil)))

(defn replay-canonical-outliner-op!
  [conn [op args] rebase-db-before]
  (case op
    :save-block
    (let [[block opts] args
          db @conn
          block-uuid (:block/uuid block)
          block-ent (when block-uuid
                      (d/entity db [:block/uuid block-uuid]))
          block-base (dissoc block :db/id :block/order)
          block' block-base]
      (when (nil? block-ent)
        (invalid-rebase-op! op {:args args
                                :reason :missing-block}))
      (outliner-core/save-block! conn block' opts))

    :insert-blocks
    (let [[blocks target-id opts] args
          db @conn
          [target sibling?] (rebase-resolve-target-and-sibling db rebase-db-before target-id (:sibling? opts))]
      (when-not (and target (seq blocks))
        (invalid-rebase-op! op {:args args}))
      (outliner-core/insert-blocks! conn blocks target (assoc opts :sibling? sibling?)))

    :apply-template
    (let [[template-id target-id opts] args
          template-id' (replay-entity-id-value @conn template-id)
          target-id' (replay-entity-id-value @conn target-id)
          [target sibling?] (rebase-resolve-target-and-sibling @conn rebase-db-before target-id' (:sibling? opts))]
      (when-not (and template-id' (d/entity @conn template-id') target)
        (invalid-rebase-op! op {:args args
                                :reason :missing-template-or-target-block}))
      (outliner-op/apply-ops!
       conn
       [[:apply-template [template-id'
                          target-id'
                          (assoc opts :sibling? sibling?)]]]
       {:gen-undo-ops? false}))

    :move-blocks
    (let [[ids target-id opts] args
          ids' (replay-entity-id-coll @conn ids)
          target-id' (replay-entity-id-value @conn target-id)
          blocks (keep #(d/entity @conn %) ids')
          [target sibling?] (rebase-resolve-target-and-sibling @conn rebase-db-before target-id' (:sibling? opts))]
      (when (or (empty? blocks) (nil? target))
        (invalid-rebase-op! op {:args args}))
      (when (seq blocks)
        (outliner-core/move-blocks! conn blocks target (assoc opts :sibling? sibling?))))

    :move-blocks-up-down
    (let [[ids up?] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      (when (seq blocks)
        (outliner-core/move-blocks-up-down! conn blocks up?)))

    :indent-outdent-blocks
    (let [[ids indent? opts] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      (when (empty? blocks)
        (invalid-rebase-op! op {:args args}))
      (when (seq blocks)
        (outliner-core/indent-outdent-blocks! conn blocks indent? opts)))

    :delete-blocks
    (let [[ids opts] args
          ids' (replay-entity-id-coll @conn ids)
          blocks (keep #(d/entity @conn %) ids')]
      (when (seq blocks)
        (outliner-core/delete-blocks! conn blocks opts)))

    :create-page
    (let [[title opts] args]
      (outliner-page/create! conn title opts))

    :delete-page
    (let [[page-uuid opts] args]
      (outliner-page/delete! conn page-uuid opts))

    :restore-recycled
    (let [[root-id] args
          root-ref (cond
                     (and (vector? root-id)
                          (= :block/uuid (first root-id)))
                     root-id

                     (uuid? root-id)
                     [:block/uuid root-id]

                     :else
                     root-id)
          root (d/entity @conn root-ref)
          tx-data (when root
                    (seq (outliner-recycle/restore-tx-data @conn root)))]
      (when-not tx-data
        (invalid-rebase-op! op {:args args
                                :reason :invalid-restore-target}))
      (ldb/transact! conn tx-data
                     {:outliner-op :restore-recycled}))

    :recycle-delete-permanently
    (let [[root-id] args
          root-ref (cond
                     (and (vector? root-id)
                          (= :block/uuid (first root-id)))
                     root-id

                     (uuid? root-id)
                     [:block/uuid root-id]

                     :else
                     root-id)
          root (d/entity @conn root-ref)
          tx-data (when root
                    (seq (outliner-recycle/permanently-delete-tx-data @conn root)))]
      (when (seq tx-data)
        (ldb/transact! conn tx-data
                       {:outliner-op :recycle-delete-permanently})))

    :set-block-property
    (let [[block-eid property-id v] args
          block-eid' (or (replay-entity-id-value @conn block-eid)
                         block-eid)
          block (d/entity @conn block-eid')
          property (d/entity @conn property-id)
          _ (when-not (and block property)
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/set-block-property! conn block-eid' property-id v'))

    :remove-block-property
    (apply outliner-property/remove-block-property! conn args)

    :batch-set-property
    (let [[block-ids property-id v opts] args
          block-ids' (replay-entity-id-coll @conn block-ids)
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-ids')
                           (every? #(some? (d/entity @conn %)) block-ids'))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          v' (replay-property-value @conn property-id v)]
      (when (and (stable-entity-ref-like? v) (nil? v'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-set-property! conn block-ids' property-id v' opts))

    :batch-remove-property
    (let [[block-ids property-id] args
          block-ids' (replay-entity-id-coll @conn block-ids)]
      (outliner-property/batch-remove-property! conn block-ids' property-id))

    :delete-property-value
    (let [[block-eid property-id property-value] args
          block (d/entity @conn block-eid)
          property (d/entity @conn property-id)
          _ (when-not (and block property)
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/delete-property-value! conn block-eid property-id property-value'))

    :batch-delete-property-value
    (let [[block-eids property-id property-value] args
          block-eids' (replay-entity-id-coll @conn block-eids)
          property (d/entity @conn property-id)
          _ (when-not (and property
                           (seq block-eids')
                           (every? #(some? (d/entity @conn %)) block-eids'))
              (invalid-rebase-op! op {:args args
                                      :reason :missing-block-or-property}))
          property-value' (replay-property-value @conn property-id property-value)]
      (when (and (stable-entity-ref-like? property-value) (nil? property-value'))
        (invalid-rebase-op! op {:args args}))
      (outliner-property/batch-delete-property-value! conn block-eids' property-id property-value'))

    :create-property-text-block
    (apply outliner-property/create-property-text-block! conn args)

    :upsert-property
    (apply outliner-property/upsert-property! conn args)

    :class-add-property
    (apply outliner-property/class-add-property! conn args)

    :class-remove-property
    (apply outliner-property/class-remove-property! conn args)

    :upsert-closed-value
    (apply outliner-property/upsert-closed-value! conn args)

    :add-existing-values-to-closed-values
    (apply outliner-property/add-existing-values-to-closed-values! conn args)

    :delete-closed-value
    (apply outliner-property/delete-closed-value! conn args)

    (let [tx-data (:tx args)]
      (when-let [tx-data (seq tx-data)]
        (ldb/transact! conn tx-data {:outliner-op :transact})))))

(defn replace-uuid-str-with-eid
  [db v]
  (if-let [u (and (string? v) (parse-uuid v))]
    (if-let [entity (d/entity db [:block/uuid u])]
      (:db/id entity)
      v)
    v))

(defn resolve-temp-id
  [db datom-v]
  (if (and (vector? datom-v)
           (= (count datom-v) 5)
           (= (first datom-v) :db/add))
    (let [[op e a v t] datom-v
          e' (replace-uuid-str-with-eid db e)
          v' (replace-uuid-str-with-eid db v)]
      [op e' a v' t])
    datom-v))

(defn reverse-local-tx!
  [conn local-tx]
  (let [preserve-during-rebase? (or (= :create-page (:outliner-op local-tx))
                                    (and (= 1 (count (:forward-outliner-ops local-tx)))
                                         (= :create-page (ffirst (:forward-outliner-ops local-tx)))))
        inferred-history? (true? (:inferred-outliner-ops? local-tx))
        inverse-ops (usable-history-ops (:inverse-outliner-ops local-tx))
        raw-tx-data (seq (:reversed-tx local-tx))]
    (cond
      preserve-during-rebase?
      {:tx-id (:tx-id local-tx)
       :status :preserved}

      (and inferred-history? raw-tx-data)
      (try
        (ldb/transact! conn raw-tx-data
                       {:outliner-op (:outliner-op local-tx)
                        :reverse? true})
        (catch :default error
          (if (seq inverse-ops)
            (do
              (doseq [op inverse-ops]
                (replay-canonical-outliner-op! conn op nil))
              (assert-delete-block-roots-restored! conn local-tx)
              (assert-raw-restored-block-uuids! conn local-tx raw-tx-data))
            (throw error))))

      (seq inverse-ops)
      (try
        (doseq [op inverse-ops]
          (replay-canonical-outliner-op! conn op nil))
        (assert-delete-block-roots-restored! conn local-tx)
        (assert-raw-restored-block-uuids! conn local-tx raw-tx-data)
        (catch :default error
          (if raw-tx-data
            (ldb/transact! conn raw-tx-data
                           {:outliner-op (:outliner-op local-tx)
                            :reverse? true})
            (throw error))))

      raw-tx-data
      (ldb/transact! conn raw-tx-data
                     {:outliner-op (:outliner-op local-tx)
                      :reverse? true})

      :else
      (invalid-rebase-op! :reverse-history-action
                          {:reason :missing-reversed-tx-data
                           :tx-id (:tx-id local-tx)
                           :outliner-op (:outliner-op local-tx)}))))

(defn rebase-history-ops
  [mode local-tx]
  (let [forward-outliner-ops (seq (:forward-outliner-ops local-tx))
        inverse-outliner-ops (seq (:inverse-outliner-ops local-tx))
        fallback-forward-ops (when (and (nil? forward-outliner-ops)
                                        (seq (:tx local-tx))
                                        (if (= mode :legacy)
                                          (= :rebase (:outliner-op local-tx))
                                          true))
                               canonical-transact-op)
        forward-ops (or forward-outliner-ops fallback-forward-ops)
        inverse-ops (or inverse-outliner-ops
                        (when forward-ops canonical-transact-op))]
    {:forward-ops forward-ops
     :inverse-ops inverse-ops
     :fallback? (boolean fallback-forward-ops)}))

(defn transact-remote-txs!
  [conn remote-rows]
  (loop [remaining remote-rows
         idx 0]
    (let [db @conn]
      (if-let [row (first remaining)]
        (let [tx-data (->> (:tx-data row)
                           (map (partial resolve-temp-id db))
                           seq)
              pre-missing-entity-id (when-let [entity-id (some-> tx-data first second)]
                                      (when (and (vector? entity-id)
                                                 (every? (fn [datom]
                                                           (= entity-id (second datom)))
                                                         tx-data)
                                                 (nil? (d/entity db entity-id)))
                                        entity-id))]
          (if pre-missing-entity-id
            nil
            (try
              (when tx-data
                (ldb/transact! conn tx-data {:transact-remote? true}))
              (catch :default e
                (let [error-data (or (ex-data e) {})
                      missing-entity-id (:entity-id error-data)
                      missing-entity-only-tx? (and (= :entity-id/missing (:error error-data))
                                                   (vector? missing-entity-id)
                                                   (seq tx-data)
                                                   (every? (fn [datom]
                                                             (= missing-entity-id (second datom)))
                                                           tx-data))]
                  (when-not missing-entity-only-tx?
                    (throw (ex-info "remote transact failed"
                                    {:stage :remote
                                     :index idx
                                     :t (:t row)
                                     :outliner-op (:outliner-op row)}
                                    e)))))))
          (recur (next remaining) (inc idx)))
        nil))))

(defn seed-local-txs!
  [conn local-ops]
  (doseq [local local-ops]
    (let [forward-ops (usable-history-ops (:forward-outliner-ops local))
          raw-tx (seq (:tx local))]
      (try
        (cond
          (seq forward-ops)
          (doseq [op forward-ops]
            (replay-canonical-outliner-op! conn op nil))

          raw-tx
          (ldb/transact! conn raw-tx {:seed-local? true
                                      :outliner-op (:outliner-op local)})

          :else
          nil)
        (catch :default e
          (throw (ex-info "seed local tx failed"
                          {:stage :seed-local
                           :tx-id (:tx-id local)
                           :outliner-op (:outliner-op local)
                           :seed-source (cond
                                          (seq forward-ops) :semantic
                                          raw-tx :raw
                                          :else :none)}
                          e)))))))

(defn reapply-local-tx!
  [mode conn local-tx rebase-db-before preserved-tx-ids]
  (if (contains? preserved-tx-ids (:tx-id local-tx))
    {:tx-id (:tx-id local-tx)
     :status :preserved
     :fallback? false
     :forward-op-count 0
     :inverse-op-count 0}
    (let [{:keys [forward-ops inverse-ops fallback?]} (rebase-history-ops mode local-tx)]
      (if (seq forward-ops)
        (try
          (if (= canonical-transact-op (vec forward-ops))
            (when-let [tx-data (seq (:tx local-tx))]
              (ldb/transact! conn tx-data {:outliner-op :transact
                                           :reapply-local? true
                                           :tx-id (:tx-id local-tx)}))
            (doseq [op forward-ops]
              (replay-canonical-outliner-op! conn op rebase-db-before)))
          {:tx-id (:tx-id local-tx)
           :status :rebased
           :fallback? fallback?
           :inverse-op-count (count inverse-ops)
           :forward-op-count (count forward-ops)}
          (catch :default error
            {:tx-id (:tx-id local-tx)
             :status :failed
             :fallback? fallback?
             :error (ex-message error)
             :error-data (select-keys (or (ex-data error) {})
                                      [:op :reason :error :entity-id])}))
        {:tx-id (:tx-id local-tx)
         :status :skipped
         :fallback? false
         :forward-op-count 0
         :inverse-op-count (count inverse-ops)}))))

(defn replay-mode!
  [{:keys [mode baseline remote local]}]
  (let [conn (d/create-conn db-schema/schema)
        *stage (atom :baseline)
        *current (atom nil)]
    (try
      ;; Replay can pass through transient intermediate states; disable strict
      ;; validation so we can observe end-to-end conflict handling behavior.
      (swap! conn assoc :skip-validate-db? true)
      (doseq [row baseline]
        (when-let [tx-data (seq (:tx-data row))]
          (reset! *current {:t (:t row)})
          (ldb/transact! conn tx-data {:server-baseline? true :t (:t row)})))
      (reset! *stage :seed-local)
      (seed-local-txs! conn local)
      (let [rebase-db-before @conn]
        (reset! *stage :reverse-local)
        (let [reverse-results (mapv (fn [local-tx]
                                      (reset! *current {:tx-id (:tx-id local-tx)})
                                      (reverse-local-tx! conn local-tx))
                                    (reverse local))
              preserved-tx-ids (->> reverse-results
                                    (filter #(= :preserved (:status %)))
                                    (keep :tx-id)
                                    set)]

          (reset! *stage :remote)
          (transact-remote-txs! conn remote)

          (reset! *stage :reapply-local)
          (let [reapply-results (mapv (fn [local-tx]
                                        (reset! *current {:tx-id (:tx-id local-tx)})
                                        (reapply-local-tx! mode conn local-tx rebase-db-before preserved-tx-ids))
                                      local)]
            {:mode (name mode)
             :ok? true
             :baseline-count (count baseline)
             :remote-count (count remote)
             :local-count (count local)
             :reapply-results reapply-results
             :reapply-failed-count (count (filter #(= :failed (:status %)) reapply-results))
             :final-datom-count (count (d/datoms @conn :eavt))})))
      (catch :default e
        {:mode (name mode)
         :ok? false
         :stage @*stage
         :current @*current
         :error (ex-message e)
         :error-data (select-keys (or (ex-data e) {})
                                  [:stage :t :index :tx-id :op :reason :error :entity-id])}))))

(defn mode-seq
  [mode-option]
  (case (some-> mode-option string/lower-case)
    "legacy" [:legacy]
    "fixed" [:fixed]
    "both" [:legacy :fixed]
    nil [:legacy :fixed]
    [:legacy :fixed]))

(defn ensure-exists!
  [label path]
  (when-not (.existsSync fs path)
    (binding [*print-fn* *print-err-fn*]
      (println (str label " does not exist: " path)))
    (js/process.exit 1)))

(defn -main
  [argv]
  (let [{:keys [opts]} (cli/parse-args argv {:spec cli-spec})
        {:keys [server-db client-ops-db from-t to-t remote-limit
                auto-from-conflict inspect-only pretty] :as opts} opts]
    (when (:help opts)
      (println (usage))
      (js/process.exit 0))
    (when (or (string/blank? server-db) (string/blank? client-ops-db))
      (binding [*print-fn* *print-err-fn*]
        (println "Missing required --server-db and/or --client-ops-db"))
      (println (usage))
      (js/process.exit 1))
    (let [server-db' (resolve-path server-db)
          client-ops-db' (resolve-path client-ops-db)]
      (ensure-exists! "server-db" server-db')
      (ensure-exists! "client-ops-db" client-ops-db')
      (let [server-rows (read-server-tx-log server-db')
            all-local-ops (read-client-ops client-ops-db')
            local-ops (filter-local-ops all-local-ops opts)
            conflicts (infer-conflicts server-rows local-ops)
            inferred-from-t (when auto-from-conflict
                              (:first-conflict-t conflicts))
            effective-from-t (or from-t inferred-from-t)]
        (when (and (not inspect-only) (nil? effective-from-t))
          (binding [*print-fn* *print-err-fn*]
            (println "Missing --from-t and failed to infer via --auto-from-conflict"))
          (js/process.exit 1))
        (if inspect-only
          (let [payload {:server-db server-db'
                         :client-ops-db client-ops-db'
                         :server-tx-count (count server-rows)
                         :local-op-count (count local-ops)
                         :deleted-uuids (mapv str (:deleted-uuids conflicts))
                         :first-conflict-t (:first-conflict-t conflicts)
                         :conflicts (mapv (fn [c]
                                            (update c :hits #(mapv str %)))
                                          (or (:conflicts conflicts) []))}]
            (if pretty
              (println (js/JSON.stringify (clj->js payload) nil 2))
              (println (js/JSON.stringify (clj->js payload)))))
          (let [remote (select-remote-rows server-rows effective-from-t to-t remote-limit)
                baseline (baseline-rows server-rows effective-from-t)
                results (mapv (fn [mode]
                                (replay-mode! {:mode mode
                                               :baseline baseline
                                               :remote remote
                                               :local local-ops}))
                              (mode-seq (:mode opts)))
                payload {:server-db server-db'
                         :client-ops-db client-ops-db'
                         :input {:from-t from-t
                                 :effective-from-t effective-from-t
                                 :to-t to-t
                                 :remote-limit remote-limit
                                 :mode (:mode opts)
                                 :pending-only (boolean (:pending-only opts))
                                 :local-created-at-min (:local-created-at-min opts)
                                 :local-created-at-max (:local-created-at-max opts)
                                 :local-tx-id (:local-tx-id opts)
                                 :auto-from-conflict (boolean auto-from-conflict)}
                         :counts {:server-tx-total (count server-rows)
                                  :baseline (count baseline)
                                  :remote (count remote)
                                  :local-selected (count local-ops)
                                  :local-total (count all-local-ops)}
                         :conflicts {:deleted-uuids (mapv str (:deleted-uuids conflicts))
                                     :first-conflict-t (:first-conflict-t conflicts)
                                     :conflict-count (count (:conflicts conflicts))
                                     :sample (->> (:conflicts conflicts)
                                                  (take 10)
                                                  (mapv (fn [c]
                                                          (update c :hits #(mapv str %)))))}
                         :results results}]
            (if pretty
              (println (js/JSON.stringify (clj->js payload) nil 2))
              (println (js/JSON.stringify (clj->js payload))))))))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
