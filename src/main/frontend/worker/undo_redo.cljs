(ns frontend.worker.undo-redo
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.db :as ldb]
            [logseq.outliner.recycle :as outliner-recycle]
            [logseq.undo-redo-validate :as undo-validate]
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
       [:tx-data [:sequential [:fn
                               {:error/message "should be a Datom"}
                               d/datom?]]]
       [:tx-meta [:map {:closed false}
                  [:outliner-op :keyword]]]
       [:added-ids [:set :int]]
       [:retracted-ids [:set :int]]
       [:db-sync/tx-id {:optional true} :uuid]
       [:db-sync/forward-outliner-ops {:optional true} [:sequential :any]]
       [:db-sync/inverse-outliner-ops {:optional true} [:sequential :any]]]]]

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
  [col op]
  (let [result (conj (if (empty? col) [] col) op)]
    (if (>= (count result) max-stack-length)
      (subvec result 0 (/ max-stack-length 2))
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

(comment
  ;; This version checks updated datoms by other clients, allows undo and redo back
  ;; to the current state.
  ;; The downside is that it'll undo the changes made by others.
  (defn- pop-undo-op
    [repo conn]
    (let [undo-stack (get @*undo-ops repo)
          [op undo-stack*] (pop-stack undo-stack)]
      (swap! *undo-ops assoc repo undo-stack*)
      (mapv (fn [item]
              (if (= (first item) ::db-transact)
                (let [m (second item)
                      tx-data' (mapv
                                (fn [{:keys [e a v tx add] :as datom}]
                                  (let [one-value? (= :db.cardinality/one (:db/cardinality (d/entity @conn a)))
                                        new-value (when (and one-value? add) (get (d/entity @conn e) a))
                                        value-not-matched? (and (some? new-value) (not= v new-value))]
                                    (if value-not-matched?
                                    ;; another client might updated `new-value`, the datom below will be used
                                    ;; to restore the the current state when redo this undo.
                                      (d/datom e a new-value tx add)
                                      datom)))
                                (:tx-data m))]
                  [::db-transact (assoc m :tx-data tx-data')])
                item))
            op))))

(defn- pop-undo-op
  [repo]
  (let [undo-stack (get @*undo-ops repo)
        [op undo-stack*] (pop-stack undo-stack)]
    (swap! *undo-ops assoc repo undo-stack*)
    (let [op' (mapv (fn [item]
                      (if (= (first item) ::db-transact)
                        (let [m (second item)
                              tx-data' (vec (:tx-data m))]
                          (if (seq tx-data')
                            [::db-transact (assoc m :tx-data tx-data')]
                            ::db-transact-no-tx-data))
                        item))
                    op)]
      (when-not (some #{::db-transact-no-tx-data} op')
        op'))))

(defn- pop-redo-op
  [repo]
  (let [redo-stack (get @*redo-ops repo)
        [op redo-stack*] (pop-stack redo-stack)]
    (swap! *redo-ops assoc repo redo-stack*)
    (let [op' (mapv (fn [item]
                      (if (= (first item) ::db-transact)
                        (let [m (second item)
                              tx-data' (vec (:tx-data m))]
                          (if (seq tx-data')
                            [::db-transact (assoc m :tx-data tx-data')]
                            ::db-transact-no-tx-data))
                        item))
                    op)]
      (when-not (some #{::db-transact-no-tx-data} op')
        op'))))

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

(defn- reverse-datoms
  [conn datoms schema added-ids retracted-ids undo? redo?]
  (keep
   (fn [[e a v _tx add?]]
     (let [ref? (= :db.type/ref (get-in schema [a :db/valueType]))
           op (if (or (and redo? add?) (and undo? (not add?)))
                :db/add
                :db/retract)]
       (when (or (not ref?)
                 (d/entity @conn v)
                 (and (retracted-ids v) undo?)
                 (and (added-ids v) redo?)) ; entity exists
         [op e a v])))
   datoms))

(defn- datom-attr
  [datom]
  (or (nth datom 1 nil)
      (:a datom)))

(defn- datom-value
  [datom]
  (or (nth datom 2 nil)
      (:v datom)))

(defn- datom-added?
  [datom]
  (let [value (nth datom 4 nil)]
    (if (some? value)
      value
      (:added datom))))

(defn- reversed-move-target-ref
  [datoms attr undo?]
  (some (fn [datom]
          (let [a (datom-attr datom)
                v (datom-value datom)
                added (datom-added? datom)]
            (when (and (= a attr)
                       (if undo? (not added) added))
              v)))
        datoms))

(defn- reversed-structural-target-conflicted?
  [conn e->datoms undo?]
  (some (fn [[_e datoms]]
          (let [target-parent (reversed-move-target-ref datoms :block/parent undo?)
                target-page (reversed-move-target-ref datoms :block/page undo?)
                parent-ent (when (int? target-parent) (d/entity @conn target-parent))
                page-ent (when (int? target-page) (d/entity @conn target-page))]
            (or (and target-parent
                     (or (nil? parent-ent)
                         (ldb/recycled? parent-ent)))
                (and target-page
                     (or (nil? page-ent)
                         (ldb/recycled? page-ent))))))
        e->datoms))

(defn get-reversed-datoms
  [conn undo? {:keys [tx-data added-ids retracted-ids]} tx-meta]
  (let [recycle-restore-tx (when (and undo?
                                      (= :delete-blocks (:outliner-op tx-meta)))
                             (->> tx-data
                                  (keep (fn [datom]
                                          (let [e (or (nth datom 0 nil)
                                                      (:e datom))
                                                a (datom-attr datom)
                                                added (datom-added? datom)]
                                            (when (and added
                                                       (= :logseq.property/deleted-at a))
                                              (d/entity @conn e)))))
                                  (mapcat #(outliner-recycle/restore-tx-data @conn %))
                                  seq))
        redo? (not undo?)
        e->datoms (->> (if redo? tx-data (reverse tx-data))
                       (group-by :e))
        schema (:schema @conn)
        structural-target-conflicted? (and undo?
                                           (reversed-structural-target-conflicted? conn e->datoms undo?))
        reversed-tx-data (if structural-target-conflicted?
                           nil
                           (or (some-> recycle-restore-tx reverse seq)
                               (->> (mapcat
                                     (fn [[e datoms]]
                                       (cond
                                         (and undo? (contains? added-ids e))
                                         [[:db/retractEntity e]]

                                         (and redo? (contains? retracted-ids e))
                                         [[:db/retractEntity e]]

                                         :else
                                         (reverse-datoms conn datoms schema added-ids retracted-ids undo? redo?)))
                                     e->datoms)
                                    (remove nil?))))]
    reversed-tx-data))

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

(declare undo-redo-aux)

(defn- empty-stack-result
  [undo?]
  (if undo? ::empty-undo-stack ::empty-redo-stack))

(defn- push-opposite-op!
  [repo undo? op]
  ((if undo? push-redo-op push-undo-op) repo op))

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
  [repo undo? allow-worker? log-tag data]
  (log/warn log-tag (assoc data :undo? undo?))
  (undo-redo-aux repo undo? allow-worker?))

(defn- run-local-path
  [repo conn undo? allow-worker? op {:keys [tx-meta] :as data} tx-meta']
  (let [reversed-tx-data (cond-> (get-reversed-datoms conn undo? data tx-meta)
                           undo?
                           reverse)]
    (cond
      (empty? reversed-tx-data)
      (skip-op-and-recur repo undo? allow-worker? ::undo-redo-skip-conflicted-op
                         {:outliner-op (:outliner-op tx-meta)})

      (not (undo-validate/valid-undo-redo-tx? conn reversed-tx-data))
      (skip-op-and-recur repo undo? allow-worker? ::undo-redo-skip-invalid-op
                         {:outliner-op (:outliner-op tx-meta)})

      :else
      (try
        (ldb/transact! conn reversed-tx-data tx-meta')
        (undo-redo-result repo conn undo? op op)
        (catch :default e
          (log/error ::undo-redo-failed e)
          (clear-history! repo)
          (empty-stack-result undo?))))))

(defn- run-worker-path
  [repo conn undo? allow-worker? op {:keys [tx-meta] :as data} tx-meta' tx-id]
  (if-let [apply-action @*apply-history-action!]
    (try
      (let [worker-result (apply-action repo tx-id undo? tx-meta')]
        (cond
          (:applied? worker-result)
          (undo-redo-result repo conn undo? op
                            (if undo?
                              op
                              (rebind-op-db-sync-tx-id op (:history-tx-id worker-result))))

          (= :missing-history-action (:reason worker-result))
          (do
            (log/warn ::undo-redo-fallback-local-path
                      {:undo? undo?
                       :outliner-op (:outliner-op tx-meta)
                       :tx-id tx-id
                       :result worker-result})
            (run-local-path repo conn undo? allow-worker? op data tx-meta'))

          (skippable-worker-result? undo? worker-result)
          (skip-op-and-recur repo undo? false ::undo-redo-skip-conflicted-op
                             {:outliner-op (:outliner-op tx-meta)
                              :tx-id tx-id
                              :result worker-result})

          :else
          (do
            (log/error ::undo-redo-worker-action-unavailable
                       {:undo? undo?
                        :repo repo
                        :tx-id tx-id
                        :result worker-result})
            (clear-history! repo)
            (empty-stack-result undo?))))
      (catch :default e
        (if (skippable-worker-error? e)
          (skip-op-and-recur repo undo? false ::undo-redo-skip-conflicted-op
                             {:outliner-op (:outliner-op tx-meta)
                              :tx-id tx-id
                              :error e})
          (do
            (log/error ::undo-redo-worker-failed e)
            (clear-history! repo)
            (throw e)
            (empty-stack-result undo?)))))
    (run-local-path repo conn undo? allow-worker? op data tx-meta')))

(defn- process-db-op
  [repo conn undo? allow-worker? op]
  (let [{:keys [tx-data] :as data} (some #(when (= ::db-transact (first %))
                                            (second %))
                                         op)]
    (when (seq tx-data)
      (let [tx-meta' (undo-redo-action-meta data undo?)
            tx-id (:db-sync/tx-id data)]
        (if (and tx-id allow-worker?)
          (run-worker-path repo conn undo? allow-worker? op data tx-meta' tx-id)
          (run-local-path repo conn undo? allow-worker? op data tx-meta'))))))

(defn- undo-redo-aux
  ([repo undo?]
   (undo-redo-aux repo undo? true))
  ([repo undo? allow-worker?]
   (if-let [op (not-empty ((if undo? pop-undo-op pop-redo-op) repo))]
     (if (= ::ui-state (ffirst op))
       (do
         (push-opposite-op! repo undo? op)
         {:undo? undo?
          :ui-state-str (second (first op))})
       (process-db-op repo (worker-state/get-datascript-conn repo) undo? allow-worker? op))
     (when ((if undo? empty-undo-stack? empty-redo-stack?) repo)
       (empty-stack-result undo?)))))

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
    (when-let [conn (get @worker-state/*client-ops-conns repo)]
      (when-let [ent (d/entity @conn [:db-sync/tx-id tx-id])]
        {:db-sync/forward-outliner-ops (some-> (:db-sync/forward-outliner-ops ent) seq vec)
         :db-sync/inverse-outliner-ops (some-> (:db-sync/inverse-outliner-ops ent) seq vec)}))))

(defn gen-undo-ops!
  [repo {:keys [tx-data tx-meta db-after db-before]} tx-id
   {:keys [apply-history-action!]}]
  (when (nil? @*apply-history-action!)
    (reset! *apply-history-action! apply-history-action!))
  (let [{:keys [outliner-op local-tx?]} tx-meta]
    (when (and
           (true? local-tx?)
           outliner-op
           (not (false? (:gen-undo-ops? tx-meta)))
           (not (:create-today-journal? tx-meta)))
      (let [all-ids (distinct (map :e tx-data))
            retracted-ids (set
                           (filter
                            (fn [id] (and (nil? (d/entity db-after id)) (d/entity db-before id)))
                            all-ids))
            added-ids (set
                       (filter
                        (fn [id] (and (nil? (d/entity db-before id)) (d/entity db-after id)))
                        all-ids))
            tx-data' (vec tx-data)
            editor-info (or (:undo-redo/editor-info tx-meta)
                            (take-pending-editor-info! repo))
            {:db-sync/keys [forward-outliner-ops inverse-outliner-ops]}
            (pending-history-action-ops repo tx-id)
            data (cond-> {:db-sync/tx-id tx-id
                          :tx-meta (dissoc tx-meta :outliner-ops)
                          :added-ids added-ids
                          :retracted-ids retracted-ids
                          :tx-data tx-data'}
                   (seq forward-outliner-ops)
                   (assoc :db-sync/forward-outliner-ops forward-outliner-ops)

                   (seq inverse-outliner-ops)
                   (assoc :db-sync/inverse-outliner-ops inverse-outliner-ops))
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
