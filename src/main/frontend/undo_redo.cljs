(ns frontend.undo-redo
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.db :as ldb]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.outliner.recycle :as outliner-recycle]
            [logseq.undo-redo-validate :as undo-validate]
            [malli.core :as m]
            [malli.util :as mu]
            [promesa.core :as p]))

(defkeywords
  ::record-editor-info {:doc "record current editor and cursor"}
  ::db-transact {:doc "db tx"}
  ::ui-state {:doc "ui state such as route && sidebar blocks"})

;; TODO: add other UI states such as `::ui-updates`.
(comment
  ;; TODO: convert it to a qualified-keyword
  (sr/defkeyword :gen-undo-ops?
    "tx-meta option, generate undo ops from tx-data when true (default true)"))

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
      [:map
       [:block-uuid :uuid]
       [:container-id [:or :int [:enum :unknown-container]]]
       [:start-pos [:maybe :int]]
       [:end-pos [:maybe :int]]]]]

    [::ui-state
     [:cat :keyword :string]]]))

(def ^:private undo-op-validator (m/validator [:sequential undo-op-item-schema]))

(defonce max-stack-length 100)
(defonce *undo-ops (atom {}))
(defonce *redo-ops (atom {}))

(def ^:private transient-block-keys
  #{:db/id
    :block/tx-id
    :block/created-at
    :block/updated-at
    :block/meta
    :block/unordered
    :block/level
    :block.temp/ast-title
    :block.temp/ast-body
    :block.temp/load-status
    :block.temp/has-children?})

(defn clear-history!
  [repo]
  (swap! *undo-ops assoc repo [])
  (swap! *redo-ops assoc repo []))

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

(defn- stable-entity-ref
  [db x]
  (cond
    (qualified-keyword? x)
    x

    (and (vector? x) (= 2 (count x)))
    x

    (map? x)
    (or (when-let [u (:block/uuid x)]
          [:block/uuid u])
        (:db/ident x)
        (some-> x :db/id (stable-entity-ref db))
        x)

    (and (integer? x) (not (neg? x)))
    (if-let [ent (d/entity db x)]
      (or (when-let [u (:block/uuid ent)]
            [:block/uuid u])
          (:db/ident ent)
          x)
      x)

    :else
    x))

(defn- stable-ref-value
  [db v]
  (cond
    (set? v) (set (map #(stable-entity-ref db %) v))
    (sequential? v) (mapv #(stable-entity-ref db %) v)
    :else (stable-entity-ref db v)))

(defn- ref-attr?
  [db a]
  (= :db.type/ref (:db/valueType (d/entity db a))))

(defn- block-entity
  [db block]
  (cond
    (map? block)
    (or (when-let [uuid (:block/uuid block)]
          (d/entity db [:block/uuid uuid]))
        (when-let [db-id (:db/id block)]
          (d/entity db db-id)))

    (integer? block)
    (d/entity db block)

    (vector? block)
    (d/entity db block)

    :else
    nil))

(defn- save-block-keys
  [block]
  (->> (keys block)
       (remove transient-block-keys)
       (remove #(= :db/other-tx %))
       (remove nil?)))

(defn- build-inverse-save-block
  [db-before block opts]
  (when-let [before-ent (block-entity db-before block)]
    (let [uuid (:block/uuid before-ent)
          keys-to-restore (save-block-keys block)
          inverse-block (reduce
                         (fn [m k]
                           (let [v (get before-ent k)]
                             (assoc m k
                                    (if (ref-attr? db-before k)
                                      (stable-ref-value db-before v)
                                      v))))
                         {:block/uuid uuid}
                         keys-to-restore)]
      [:save-block [inverse-block opts]])))

(defn- property-ref-value
  [db property-id value]
  (let [property-type (some-> (d/entity db property-id) :logseq.property/type)]
    (if (contains? db-property-type/all-ref-property-types property-type)
      (stable-ref-value db value)
      value)))

(defn- block-property-value
  [db block-id property-id]
  (some-> (d/entity db block-id) (get property-id) (property-ref-value db property-id)))

(defn- build-inverse-property-op
  [db-before [op args]]
  (case op
    :set-block-property
    (let [[block-id property-id _value] args
          before-value (block-property-value db-before block-id property-id)]
      (if (nil? before-value)
        [:remove-block-property [(stable-entity-ref db-before block-id) property-id]]
        [:set-block-property [(stable-entity-ref db-before block-id) property-id before-value]]))

    :remove-block-property
    (let [[block-id property-id] args
          before-value (block-property-value db-before block-id property-id)]
      (when (some? before-value)
        [:set-block-property [(stable-entity-ref db-before block-id) property-id before-value]]))

    nil))

(defn- derive-inverse-outliner-ops
  [db-before tx-meta]
  (some->> (:outliner-ops tx-meta)
           (map (fn [[op args :as op-entry]]
                  (case op
                    :save-block
                    (let [[block opts] args]
                      (build-inverse-save-block db-before block opts))

                    :insert-blocks
                    (let [[blocks _target-id _opts] args
                          ids (->> blocks
                                   (keep (fn [block]
                                           (when-let [u (:block/uuid block)]
                                             [:block/uuid u])))
                                   vec)]
                      (when (seq ids)
                        [:delete-blocks [ids {}]]))

                    (build-inverse-property-op db-before op-entry))))
           (remove nil?)
           vec
           seq))

(defn- ensure-history-action-metadata
  [{:keys [db-before tx-meta] :as data}]
  (let [forward-outliner-ops (some-> (:outliner-ops tx-meta) vec seq)
        inverse-outliner-ops (derive-inverse-outliner-ops db-before tx-meta)]
    (cond-> (-> data
                (dissoc :db-before)
                (assoc
                 :db-sync/tx-id (or (:db-sync/tx-id tx-meta) (random-uuid))))
      forward-outliner-ops
      (assoc :db-sync/forward-outliner-ops (vec forward-outliner-ops))

      inverse-outliner-ops
      (assoc :db-sync/inverse-outliner-ops (vec inverse-outliner-ops)))))

(defn- undo-redo-action-meta
  [{:keys [tx-meta]
    source-tx-id :db-sync/tx-id
    forward-outliner-ops :db-sync/forward-outliner-ops
    inverse-outliner-ops :db-sync/inverse-outliner-ops}
   undo?]
  (let [forward-outliner-ops' (if undo? inverse-outliner-ops forward-outliner-ops)
        inverse-outliner-ops' (if undo? forward-outliner-ops inverse-outliner-ops)]
    (cond-> (-> tx-meta
                (assoc
                 :gen-undo-ops? false
                 :undo? undo?
                 :redo? (not undo?)
                 :db-sync/source-tx-id source-tx-id))
      (seq forward-outliner-ops')
      (assoc :db-sync/forward-outliner-ops (vec forward-outliner-ops'))

      (seq inverse-outliner-ops')
      (assoc :db-sync/inverse-outliner-ops (vec inverse-outliner-ops')))))

(defn- apply-history-action-from-worker!
  [repo data undo? tx-meta]
  (when-let [tx-id (:db-sync/tx-id data)]
    (state/<invoke-db-worker
     :thread-api/apply-history-action
     repo
     tx-id
     undo?
     tx-meta)))

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

(defn- undo-redo-aux
  [repo undo?]
  (if-let [op (not-empty ((if undo? pop-undo-op pop-redo-op) repo))]
    (let [conn (db/get-db repo false)]
      (cond
        (= ::ui-state (ffirst op))
        (do
          ((if undo? push-redo-op push-undo-op) repo op)
          (let [ui-state-str (second (first op))]
            {:undo? undo?
             :ui-state-str ui-state-str}))

        :else
        (let [{:keys [tx-data tx-meta] :as data} (some #(when (= ::db-transact (first %))
                                                          (second %)) op)]
          (when (seq tx-data)
            (let [tx-meta' (undo-redo-action-meta data undo?)
                  tx-id (:db-sync/tx-id data)
                  handler (fn handler []
                            ((if undo? push-redo-op push-undo-op) repo op)
                            (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) op)
                                                      (map second))
                                  block-content (:block/title (d/entity @conn [:block/uuid (:block-uuid
                                                                                            (if undo?
                                                                                              (first editor-cursors)
                                                                                              (last editor-cursors)))]))]
                              {:undo? undo?
                               :editor-cursors editor-cursors
                               :block-content block-content}))
                  run-local-path (fn []
                                   (let [reversed-tx-data (cond-> (get-reversed-datoms conn undo? data tx-meta)
                                                            undo?
                                                            reverse)]
                                     (if (seq reversed-tx-data)
                                       (if (undo-validate/valid-undo-redo-tx? conn reversed-tx-data)
                                         (if util/node-test?
                                           (try
                                             (ldb/transact! conn reversed-tx-data tx-meta')
                                             (handler)
                                             (catch :default e
                                               (log/error ::undo-redo-failed e)
                                               (clear-history! repo)
                                               (if undo? ::empty-undo-stack ::empty-redo-stack)))
                                           (throw (ex-info "browser undo/redo must go through db worker"
                                                           {:type :undo-redo/browser-direct-db-write-disallowed
                                                            :repo repo})))
                                         (do
                                           (log/warn ::undo-redo-skip-invalid-op
                                                     {:undo? undo?
                                                      :outliner-op (:outliner-op tx-meta)})
                                           (undo-redo-aux repo undo?)))
                                       (do
                                         (log/warn ::undo-redo-skip-conflicted-op
                                                   {:undo? undo?
                                                    :outliner-op (:outliner-op tx-meta)})
                                         (undo-redo-aux repo undo?)))))]
              (if util/node-test?
                (run-local-path)
                (->
                 (p/let [worker-result (if tx-id
                                         (apply-history-action-from-worker! repo data undo? tx-meta')
                                         (p/resolved {:applied? false
                                                      :reason :missing-history-action-id}))]
                   (if (:applied? worker-result)
                     (handler)
                     (do
                       (log/error ::undo-redo-worker-action-unavailable
                                  {:undo? undo?
                                   :repo repo
                                   :tx-id tx-id
                                   :result worker-result})
                       (clear-history! repo)
                       (if undo? ::empty-undo-stack ::empty-redo-stack))))
                 (p/catch (fn [e]
                            (log/error ::undo-redo-worker-failed e)
                            (clear-history! repo)
                            (if undo? ::empty-undo-stack ::empty-redo-stack))))))))))

    (when ((if undo? empty-undo-stack? empty-redo-stack?) repo)
      (if undo? ::empty-undo-stack ::empty-redo-stack))))

(defn undo
  [repo]
  (undo-redo-aux repo true))

(defn redo
  [repo]
  (undo-redo-aux repo false))

(defn record-editor-info!
  [repo editor-info]
  (swap! *undo-ops
         update repo
         (fn [stack]
           (if (seq stack)
             (update stack (dec (count stack))
                     (fn [op]
                       (conj (vec op) [::record-editor-info editor-info])))
             stack))))

(defn record-ui-state!
  [repo ui-state-str]
  (when ui-state-str
    (push-undo-op repo [[::ui-state ui-state-str]])))

(defn gen-undo-ops!
  [repo {:keys [tx-data tx-meta db-after db-before]}]
  (let [{:keys [outliner-op local-tx?]} tx-meta]
    (when (and
           (= (:client-id tx-meta) (:client-id @state/state))
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
            editor-info @state/*editor-info
            _ (reset! state/*editor-info nil)
            history-data (ensure-history-action-metadata
                          {:tx-data tx-data'
                           :tx-meta tx-meta
                           :added-ids added-ids
                           :retracted-ids retracted-ids
                           :db-before db-before})
            op (->> [(when editor-info [::record-editor-info editor-info])
                     [::db-transact
                      history-data]]
                    (remove nil?)
                    vec)]
        ;; A new local edit invalidates any redo history.
        (swap! *redo-ops assoc repo [])
        (push-undo-op repo op)))))

(defn listen-db-changes!
  [repo conn]
  (d/listen! conn ::gen-undo-ops
             (fn [tx-report] (gen-undo-ops! repo tx-report))))
