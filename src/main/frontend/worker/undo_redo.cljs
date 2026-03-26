(ns frontend.worker.undo-redo
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.state :as worker-state]
            [lambdaisland.glogi :as log]
            [logseq.common.defkeywords :refer [defkeywords]]
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

(declare undo-redo-aux)

(defn- empty-stack-result
  [undo?]
  (if undo? ::empty-undo-stack ::empty-redo-stack))

(defn- push-opposite-op!
  [repo undo? op]
  (let [sanitize-db-transact
        (fn [data]
          ;; Keep undo/redo history op-only. Drop any legacy/raw tx payloads.
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

(defn- run-worker-path
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
            (log/error ::undo-redo-worker-action-unavailable
                       {:undo? undo?
                        :repo repo
                        :tx-id tx-id
                        :result worker-result})
            (clear-history! repo)
            (empty-stack-result undo?))))
      (catch :default e
        (if (skippable-worker-error? e)
          (skip-op-and-recur repo undo?)
          (do
            (log/error ::undo-redo-worker-failed e)
            (clear-history! repo)
            (throw e)
            (empty-stack-result undo?)))))
    (do
      (log/error ::undo-redo-worker-action-unavailable
                 {:undo? undo?
                  :repo repo
                  :tx-id tx-id
                  :tx-meta tx-meta'
                  :reason :missing-apply-history-action})
      (clear-history! repo)
      (empty-stack-result undo?))))

(defn- process-db-op
  [repo conn undo? op]
  (when-let [data (some #(when (= ::db-transact (first %))
                           (second %))
                        op)]
    (let [tx-id (:db-sync/tx-id data)
          forward-outliner-ops (:db-sync/forward-outliner-ops data)
          inverse-outliner-ops (:db-sync/inverse-outliner-ops data)
          tx-meta' (-> (undo-redo-action-meta data undo?)
                       (assoc :forward-outliner-ops forward-outliner-ops
                              :inverse-outliner-ops inverse-outliner-ops
                              :db-sync/forward-outliner-ops forward-outliner-ops
                              :db-sync/inverse-outliner-ops inverse-outliner-ops))]
      (run-worker-path repo conn undo? op tx-meta' tx-id))))

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
    (when-let [conn (get @worker-state/*client-ops-conns repo)]
      (when-let [ent (d/entity @conn [:db-sync/tx-id tx-id])]
        {:db-sync/forward-outliner-ops (some-> (:db-sync/forward-outliner-ops ent) seq vec)
         :db-sync/inverse-outliner-ops (some-> (:db-sync/inverse-outliner-ops ent) seq vec)}))))

(defn gen-undo-ops!
  [repo {:keys [tx-data tx-meta db-after db-before]} tx-id
   {:keys [apply-history-action!]}]
  (when (nil? @*apply-history-action!)
    (reset! *apply-history-action! apply-history-action!))
  (let [{:keys [outliner-op local-tx?]} tx-meta
        {:db-sync/keys [forward-outliner-ops inverse-outliner-ops]} (pending-history-action-ops repo tx-id)]
    (when (and
           (true? local-tx?)
           outliner-op
           (not (false? (:gen-undo-ops? tx-meta)))
           (not (:create-today-journal? tx-meta))
           (seq forward-outliner-ops)
           (seq inverse-outliner-ops))
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
                          :db-sync/inverse-outliner-ops inverse-outliner-ops})
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
