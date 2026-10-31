(ns frontend.worker.undo-redo
  "Undo redo new implementation.

  On a local graph (not synced, see `local-graph?`) an entry keeps
  DataScript's own record of its change, the tx report's datoms in the order
  DataScript applied them (`:tx-datoms`). Undo transacts them flipped, last
  first; redo transacts them as recorded; each keeps its own transaction's
  record for the next. Nothing can land between a change and its undo on
  such a graph, so this gives back the exact state before (after) the
  change, whatever the operation. On a synced graph undo and redo replay
  the entry's semantic inverse and forward ops, which a rebase can reapply
  over remote changes."
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.client-op :as client-op]
            [lambdaisland.glogi :as log]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.db :as ldb]
            [malli.core :as m]
            [malli.util :as mu]))

(defkeywords
  ::record-editor-info {:doc "record current editor and cursor"}
  ::db-transact {:doc "db tx"}
  ::ui-state {:doc "ui state such as route && sidebar blocks"})

(defonce *apply-history-action! (atom nil))

;; TODO: add other UI states such as `::ui-updates`.
(comment
  ;; TODO: convert it to a qualified-keyword
  (sr/defkeyword :gen-undo-ops?
    "tx-meta option, generate undo ops from tx-data when true (default true)"))

(def ^:private selection-editor-info-schema
  [:map
   [:selected-block-uuids [:sequential :uuid]]
   [:selection-direction {:optional true} [:maybe [:enum :up :down]]]])

(def ^:private editor-cursor-info-schema
  [:map
   [:block-uuid :uuid]
   [:container-id [:or :int [:enum :unknown-container]]]
   [:start-pos [:maybe :int]]
   [:end-pos [:maybe :int]]
   [:selected-block-uuids {:optional true} [:sequential :uuid]]
   [:selection-direction {:optional true} [:maybe [:enum :up :down]]]])

(def ^:private undo-op-item-schema
  (mu/closed-schema
   [:multi {:dispatch first}
    [::db-transact
     [:cat :keyword
      [:map
       [:tx-meta [:map {:closed false}
                  [:outliner-op :keyword]]]
       [:added-ids [:set :int]]
       [:retracted-ids [:set :int]]
       ;; Local graphs only: the tx report's datoms as [e a v added], in
       ;; order. Checked as a vector only, since a paste can record many.
       [:tx-datoms {:optional true} vector?]
       [:db-sync/tx-id {:optional true} :uuid]
       [:db-sync/forward-outliner-ops {:optional true}
        [:maybe [:sequential :any]]]
       [:db-sync/inverse-outliner-ops {:optional true}
        [:maybe [:sequential :any]]]]]]

    [::record-editor-info
     [:cat :keyword
      [:or
       editor-cursor-info-schema
       selection-editor-info-schema]]]

    [::ui-state
     [:cat :keyword :string]]]))

(def ^:private undo-op-validator (m/validator [:sequential undo-op-item-schema]))

(defonce max-stack-length 250)
(defonce *undo-ops (atom {}))
(defonce *redo-ops (atom {}))
(defonce *pending-editor-info (atom {}))

(defn clear-history!
  [repo]
  (swap! *undo-ops assoc repo [])
  (swap! *redo-ops assoc repo [])
  (swap! *pending-editor-info dissoc repo))

(defn set-pending-editor-info!
  [repo editor-info]
  (if editor-info
    (swap! *pending-editor-info assoc repo editor-info)
    (swap! *pending-editor-info dissoc repo)))

(defn- take-pending-editor-info!
  [repo]
  (let [editor-info (get @*pending-editor-info repo)]
    (swap! *pending-editor-info dissoc repo)
    editor-info))

(defn- conj-op
  "Pushes op; a full stack drops its oldest half. The newest entries must
  stay: each undo meets the state the entry above it left."
  [col op]
  (let [result (conj (if (empty? col) [] col) op)]
    (if (>= (count result) max-stack-length)
      (subvec result (- (count result) (quot max-stack-length 2)))
      result)))

(defn- pop-stack
  [stack]
  (when (seq stack)
    [(last stack) (pop stack)]))

(defn- push-undo-op
  [repo op]
  (assert (undo-op-validator op) {:op op})
  (swap! *undo-ops update repo conj-op op))

(defn- push-redo-op
  [repo op]
  (assert (undo-op-validator op) {:op op})
  (swap! *redo-ops update repo conj-op op))

(defn- pop-undo-op
  [repo]
  (let [undo-stack (get @*undo-ops repo)
        [op undo-stack*] (pop-stack undo-stack)]
    (swap! *undo-ops assoc repo undo-stack*)
    op))

(defn- pop-redo-op
  [repo]
  (let [redo-stack (get @*redo-ops repo)
        [op redo-stack*] (pop-stack redo-stack)]
    (swap! *redo-ops assoc repo redo-stack*)
    op))

(defn- empty-undo-stack?
  [repo]
  (empty? (get @*undo-ops repo)))

(defn- empty-redo-stack?
  [repo]
  (empty? (get @*redo-ops repo)))

(defn- undo-redo-action-meta
  [{:keys [tx-meta]
    source-tx-id :db-sync/tx-id}
   undo?]
  (-> tx-meta
      (dissoc :db-sync/tx-id)
      (assoc
       :gen-undo-ops? false
       :persist-op? true
       :undo? undo?
       :redo? (not undo?)
       :db-sync/source-tx-id source-tx-id)))

(defn- rebind-op-db-sync-tx-id
  [op history-tx-id]
  (if (uuid? history-tx-id)
    (mapv (fn [item]
            (if (= ::db-transact (first item))
              [::db-transact (assoc (second item) :db-sync/tx-id history-tx-id)]
              item))
          op)
    op))

(defn- skippable-worker-error?
  [error]
  (= :invalid-history-action-ops (:reason (ex-data error))))

(defn- skippable-worker-result?
  [undo? {:keys [reason]}]
  (if undo?
    (contains? #{:invalid-history-action-ops
                 :invalid-history-action-tx
                 :unsupported-history-action}
               reason)
    (contains? #{:invalid-history-action-ops}
               reason)))

(defn- expected-invalid-history-action-reason?
  [reason]
  (contains? #{:invalid-history-action-ops
               :invalid-history-action-tx}
             reason))

(declare undo-redo-aux)

(defn- empty-stack-result
  [undo?]
  (if undo? ::empty-undo-stack ::empty-redo-stack))

(defn- push-opposite-op!
  [repo undo? op]
  (let [sanitize-db-transact
        (fn [data]
          ;; Drop any legacy/raw tx payloads. A local graph's recorded
          ;; datoms (:tx-datoms) stay.
          (dissoc data
                  :tx
                  :tx-data
                  :reversed-tx
                  :reversed-tx-data
                  :db-sync/normalized-tx-data
                  :db-sync/reversed-tx-data))
        op' (mapv (fn [item]
                    (if (= ::db-transact (first item))
                      [::db-transact (sanitize-db-transact (second item))]
                      item))
                  op)]
    ((if undo? push-redo-op push-undo-op) repo op')))

(defn- undo-redo-result
  [repo conn undo? op op']
  (push-opposite-op! repo undo? op')
  (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) op)
                            (map second))
        cursor (if undo?
                 (first editor-cursors)
                 (or (last editor-cursors) (first editor-cursors)))
        block-content (when-let [block-uuid (:block-uuid cursor)]
                        (:block/title (d/entity @conn [:block/uuid block-uuid])))]
    {:undo? undo?
     :editor-cursors editor-cursors
     :block-content block-content}))

(defn- skip-op-and-recur
  [repo undo?]
  (undo-redo-aux repo undo?))

(defn- apply-history-action
  [repo conn undo? op tx-meta' tx-id]
  (if-let [apply-action @*apply-history-action!]
    (try
      (let [worker-result (apply-action repo tx-id undo? tx-meta')]
        (cond
          (:applied? worker-result)
          (undo-redo-result repo conn undo? op
                            (if undo?
                              op
                              (rebind-op-db-sync-tx-id op (:history-tx-id worker-result))))

          (skippable-worker-result? undo? worker-result)
          (skip-op-and-recur repo undo?)

          :else
          (do
            (when-not (expected-invalid-history-action-reason? (:reason worker-result))
              (log/error ::undo-redo-worker-action-unavailable
                         {:undo? undo?
                          :repo repo
                          :tx-id tx-id
                          :result worker-result}))
            (clear-history! repo)
            (empty-stack-result undo?))))
      (catch :default e
        (if (skippable-worker-error? e)
          (skip-op-and-recur repo undo?)
          (do
            (log/error ::undo-redo-worker-failed e)
            (clear-history! repo)
            (throw e)))))
    (do
      (log/error ::undo-redo-worker-action-unavailable
                 {:undo? undo?
                  :repo repo
                  :tx-id tx-id
                  :tx-meta tx-meta'
                  :reason :missing-apply-history-action})
      (clear-history! repo)
      (empty-stack-result undo?))))

(defn graph-remote-flag?
  "Upload and download set `:logseq.kv/graph-remote?`; nothing unsets it."
  [db]
  (true? (:kv/value (d/entity db :logseq.kv/graph-remote?))))

(defn local-graph?
  "True unless the graph syncs. A graph syncs once it has the remote flag or
  its client-op store has a remote graph id: a sync connection sets the id
  (`start!`, also when it matches the graph to a remote one by name), and a
  graph downloaded by an app version that did not set the flag has only the
  id. A local graph keeps no client-op rows of its local transactions: its
  undo entries carry `:tx-datoms` and read no row."
  [repo db]
  (not (or (graph-remote-flag? db)
           (some? (client-op/get-graph-uuid repo)))))

(defn- recorded-datoms
  "DataScript's record of a transaction: its tx report's datoms as
  [e a v added], entity ids unchanged, in the order DataScript applied them.
  The report of `ldb/transact!` already holds the datoms the worker pipeline
  added in the same transaction."
  [tx-data]
  (mapv (fn [d] [(:e d) (:a d) (:v d) (:added d)]) tx-data))

(defn- inverse-datoms
  "The change that takes the state after datoms back to the state before
  them: each datom flipped, last first."
  [datoms]
  (mapv (fn [[e a v added]] [e a v (not added)]) (rseq datoms)))

(defn- datoms->tx-data
  "`:block/tx-id` is the revision stamp the worker pipeline writes in every
  transaction, other entries' undo and redo included, so a recorded stamp
  may be outdated: a stamp is retracted whatever its value."
  [datoms]
  (mapv (fn [[e a v added]]
          (cond
            added [:db/add e a v]
            (= :block/tx-id a) [:db/retract e a]
            :else [:db/retract e a v]))
        datoms))

(defn- assoc-tx-datoms
  [op tx-datoms]
  (mapv (fn [item]
          (if (= ::db-transact (first item))
            [::db-transact (assoc (second item) :tx-datoms tx-datoms)]
            item))
        op))

(defn- replay-recorded-datoms!
  "Undo or redo of an entry on a local graph. The entry's `:tx-datoms` is
  its change as DataScript applied it; undo transacts the inverse, redo the
  change itself, in one transaction with the tx meta that
  `apply-history-action!` gives a history action, so the change is recorded
  for sync as an undo or redo. The worker pipeline derives nothing for it
  (`:undo-redo/replay-tx-datoms?`): the datoms already hold what the
  pipeline derived for the change. The entry pushed on the opposite stack
  holds this transaction's own record, the revision stamps the pipeline
  wrote for it included, so the next undo or redo is again the exact
  inverse of the last transaction.
  A replay that throws has changed nothing. The entry goes back on its
  stack and the history stays as it was: this undo (redo) is refused, and
  neither an older entry nor the rest of the history is touched."
  [repo conn undo? op {:keys [tx-datoms tx-meta] :as data}]
  (let [history-tx-id (random-uuid)
        {:db-sync/keys [forward-outliner-ops inverse-outliner-ops]} data
        tx-meta' {:outliner-op (:outliner-op tx-meta)
                  :local-tx? true
                  :gen-undo-ops? false
                  :persist-op? true
                  :undo? undo?
                  :redo? (not undo?)
                  :undo-redo/replay-tx-datoms? true
                  :db-sync/tx-id history-tx-id
                  :db-sync/source-tx-id (:db-sync/tx-id data)
                  :db-sync/forward-outliner-ops (if undo? inverse-outliner-ops forward-outliner-ops)
                  :db-sync/inverse-outliner-ops (if undo? forward-outliner-ops inverse-outliner-ops)}]
    (try
      (let [tx-report (ldb/transact! conn
                                     (datoms->tx-data (if undo? (inverse-datoms tx-datoms) tx-datoms))
                                     tx-meta')
            applied (recorded-datoms (:tx-data tx-report))
            ;; The change the opposite entry stands for: what a redo
            ;; transacts is the inverse of what this undo did.
            tx-datoms' (cond
                         (empty? applied) tx-datoms
                         undo? (inverse-datoms applied)
                         :else applied)]
        (undo-redo-result repo conn undo? op
                          (cond-> (assoc-tx-datoms op tx-datoms')
                            (not undo?)
                            (rebind-op-db-sync-tx-id history-tx-id))))
      (catch :default e
        (log/error ::replay-recorded-datoms-failed
                   {:undo? undo?
                    :repo repo
                    :tx-id (:db-sync/tx-id data)
                    :error e})
        ((if undo? push-undo-op push-redo-op) repo op)
        {:undo? undo?
         :refused? true}))))

(defn- process-db-op
  [repo conn undo? op]
  (when-let [data (some #(when (= ::db-transact (first %))
                           (second %))
                        op)]
    (if (and (seq (:tx-datoms data))
             (local-graph? repo @conn))
      (replay-recorded-datoms! repo conn undo? op data)
      (let [tx-id (:db-sync/tx-id data)
            tx-meta' (merge (undo-redo-action-meta data undo?)
                            (select-keys data [:db-sync/forward-outliner-ops
                                               :db-sync/inverse-outliner-ops]))]
        (apply-history-action repo conn undo? op tx-meta' tx-id)))))

(defn- undo-redo-aux
  [repo undo?]
  (if-let [op (not-empty ((if undo? pop-undo-op pop-redo-op) repo))]
    (if (= ::ui-state (ffirst op))
      (do
        (push-opposite-op! repo undo? op)
        {:undo? undo?
         :ui-state-str (second (first op))})
      (process-db-op repo (worker-state/get-datascript-conn repo) undo? op))
    (when ((if undo? empty-undo-stack? empty-redo-stack?) repo)
      (empty-stack-result undo?))))

(defn undo
  [repo]
  (undo-redo-aux repo true))

(defn redo
  [repo]
  (undo-redo-aux repo false))

(defn record-editor-info!
  [repo editor-info]
  (when editor-info
    (swap! *undo-ops
           update repo
           (fn [stack]
             (if (seq stack)
               (update stack (dec (count stack))
                       (fn [op]
                         (conj (vec op) [::record-editor-info editor-info])))
               stack)))))

(defn record-ui-state!
  [repo ui-state-str]
  (when ui-state-str
    (push-undo-op repo [[::ui-state ui-state-str]])))

(defn- pending-history-action-ops
  [repo tx-id]
  (when (uuid? tx-id)
    (client-op/history-action-ops-by-tx-id repo tx-id)))

(defn gen-undo-ops!
  [repo {:keys [tx-data tx-meta db-after db-before]} tx-id
   {:keys [apply-history-action!]}]
  (when (nil? @*apply-history-action!)
    (reset! *apply-history-action! apply-history-action!))
  (let [{:keys [outliner-op local-tx?]} tx-meta
        local-graph?' (local-graph? repo db-after)
        {:db-sync/keys [forward-outliner-ops inverse-outliner-ops]}
        (when-not local-graph?'
          (pending-history-action-ops repo tx-id))]
    (when (and
           (true? local-tx?)
           outliner-op
           (not (false? (:gen-undo-ops? tx-meta)))
           (not (:create-today-journal? tx-meta))
           (not (contains? #{:create-view} (:source-outliner-op tx-meta))))
      (let [all-ids (distinct (map :e tx-data))
            retracted-ids (set
                           (filter
                            (fn [id] (and (nil? (d/entity db-after id)) (d/entity db-before id)))
                            all-ids))
            added-ids (set
                       (filter
                        (fn [id] (and (nil? (d/entity db-before id)) (d/entity db-after id)))
                        all-ids))
            editor-info (or (:undo-redo/editor-info tx-meta)
                            (take-pending-editor-info! repo))

            data (cond-> {:db-sync/tx-id tx-id
                          :tx-meta (dissoc tx-meta :outliner-ops)
                          :added-ids added-ids
                          :retracted-ids retracted-ids
                          :db-sync/forward-outliner-ops forward-outliner-ops
                          :db-sync/inverse-outliner-ops inverse-outliner-ops}
                   local-graph?'
                   (assoc :tx-datoms (recorded-datoms tx-data)))
            op (->> [(when editor-info [::record-editor-info editor-info])
                     [::db-transact data]]
                    (remove nil?)
                    vec)]
        ;; A new local action invalidates redo history.
        (swap! *redo-ops assoc repo [])
        (push-undo-op repo op)))))

(defn get-debug-state
  [repo]
  {:undo-ops (get @*undo-ops repo [])
   :redo-ops (get @*redo-ops repo [])
   :pending-editor-info (get @*pending-editor-info repo)})

(defn referenced-history-tx-ids
  [repo]
  (->> (concat (get @*undo-ops repo [])
               (get @*redo-ops repo []))
       (mapcat identity)
       (keep (fn [item]
               (when (= ::db-transact (first item))
                 (let [tx-id (:db-sync/tx-id (second item))]
                   (when (uuid? tx-id)
                     tx-id)))))
       set))
