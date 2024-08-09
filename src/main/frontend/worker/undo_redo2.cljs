(ns frontend.worker.undo-redo2
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]
            [clojure.set :as set]
            [frontend.common.schema-register :include-macros true :as sr]
            [malli.core :as m]
            [malli.util :as mu]
            [logseq.db :as ldb]))

;; TODO: add other UI states such as `::ui-updates`.
(sr/defkeyword :gen-undo-ops?
  "tx-meta option, generate undo ops from tx-data when true (default true)")

(sr/defkeyword ::record-editor-info
  "record current editor and cursor")

(sr/defkeyword ::db-transact
  "db tx")

(sr/defkeyword ::ui-state
  "ui state such as route && sidebar blocks")

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
       [:retracted-ids [:set :int]]]]]

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
(defonce *undo-ops (:undo/repo->ops @worker-state/*state))
(defonce *redo-ops (:redo/repo->ops @worker-state/*state))

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
  [repo conn]
  (let [undo-stack (get @*undo-ops repo)
        [op undo-stack*] (pop-stack undo-stack)]
    (swap! *undo-ops assoc repo undo-stack*)
    (let [op' (mapv (fn [item]
                      (if (= (first item) ::db-transact)
                        (let [m (second item)
                              tx-data' (vec
                                        (keep
                                         (fn [{:keys [e a v _tx add] :as datom}]
                                           (let [one-value? (= :db.cardinality/one (:db/cardinality (d/entity @conn a)))
                                                 new-value (when (and one-value? add) (get (d/entity @conn e) a))
                                                 value-not-matched? (and (some? new-value) (not= v new-value))]
                                             (when-not value-not-matched?
                                               datom)))
                                         (:tx-data m)))]
                          (if (seq tx-data')
                            [::db-transact (assoc m :tx-data tx-data')]
                            ::db-transact-no-tx-data))
                        item))
                    op)]
      (when-not (some #{::db-transact-no-tx-data} op')
        op'))))

(defn- pop-redo-op
  [repo conn]
  (let [redo-stack (get @*redo-ops repo)
        [op redo-stack*] (pop-stack redo-stack)]
    (swap! *redo-ops assoc repo redo-stack*)
    (let [op' (mapv (fn [item]
                      (if (= (first item) ::db-transact)
                        (let [m (second item)
                              tx-data' (vec
                                        (keep
                                         (fn [{:keys [e a v _tx add] :as datom}]
                                           (let [one-value? (= :db.cardinality/one (:db/cardinality (d/entity @conn a)))
                                                 new-value (when (and one-value? (not add)) (get (d/entity @conn e) a))
                                                 value-not-matched? (and (some? new-value) (not= v new-value))]
                                             (when-not value-not-matched?
                                               datom)))
                                         (:tx-data m)))]
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

(defn- get-moved-blocks
  [e->datoms]
  (->>
   (keep (fn [[e datoms]]
           (when (some
                  (fn [k]
                    (and (some (fn [d] (and (= k (:a d)) (:added d))) datoms)
                         (some (fn [d] (and (= k (:a d)) (not (:added d)))) datoms)))
                  [:block/parent :block/order])
             e)) e->datoms)
   (set)))

(defn- other-children-exist?
  "return true if there are other children existing(not included in `ids`)"
  [entity ids]
  (seq
   (set/difference
    (set (map :db/id (:block/_parent entity)))
    ids)))

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

(defn- moved-block-or-target-deleted?
  [conn e->datoms e moved-blocks redo?]
  (let [datoms (get e->datoms e)]
    (and (moved-blocks e)
         (let [b (d/entity @conn e)
               cur-parent (:db/id (:block/parent b))
               move-datoms (filter (fn [d] (contains? #{:block/parent} (:a d))) datoms)]
           (when cur-parent
             (let [before-parent (some (fn [d] (when (and (= :block/parent (:a d)) (not (:added d))) (:v d))) move-datoms)
                   after-parent (some (fn [d] (when (and (= :block/parent (:a d)) (:added d)) (:v d))) move-datoms)]
               (and before-parent after-parent ; parent changed
                    (if redo?
                      (or (not= cur-parent before-parent)
                          (nil? (d/entity @conn after-parent)))
                      (or (not= cur-parent after-parent)
                          (nil? (d/entity @conn before-parent)))))))))))

(defn get-reversed-datoms
  [conn undo? {:keys [tx-data added-ids retracted-ids] :as op} _tx-meta]
  (try
    (let [redo? (not undo?)
          e->datoms (->> (if redo? tx-data (reverse tx-data))
                         (group-by :e))
          schema (:schema @conn)
          added-and-retracted-ids (set/union added-ids retracted-ids)
          moved-blocks (get-moved-blocks e->datoms)]
      (->>
       (mapcat
        (fn [[e datoms]]
          (let [entity (d/entity @conn e)]
            (cond
              ;; entity has been deleted
              (and (nil? entity)
                   (not (contains? added-and-retracted-ids e)))
              (throw (ex-info "Entity has been deleted"
                              (merge op {:error :entity-deleted
                                         :undo? undo?})))

              ;; new children blocks have been added
              (or (and (contains? retracted-ids e) redo?
                       (other-children-exist? entity retracted-ids)) ; redo delete-blocks
                  (and (contains? added-ids e) undo?                 ; undo insert-blocks
                       (other-children-exist? entity added-ids)))
              (throw (ex-info "Children still exists"
                              (merge op {:error :block-children-exists
                                         :undo? undo?})))

              ;; block has been moved or target got deleted by another client
              (moved-block-or-target-deleted? conn e->datoms e moved-blocks redo?)
              (throw (ex-info "This block has been moved or its target has been deleted"
                              (merge op {:error :block-moved-or-target-deleted
                                         :undo? undo?})))

              ;; The entity should be deleted instead of retracting its attributes
              (and entity
                   (or (and (contains? retracted-ids e) redo?) ; redo delete-blocks
                       (and (contains? added-ids e) undo?)))   ; undo insert-blocks
              [[:db/retractEntity e]]

              ;; reverse datoms
              :else
              (reverse-datoms conn datoms schema added-ids retracted-ids undo? redo?))))
        e->datoms)
       (remove nil?)))
    (catch :default e
      (prn :debug :undo-redo :error (:error (ex-data e)))
      (when-not (contains? #{:entity-deleted
                             :block-moved-or-target-deleted
                             :block-children-exists}
                           (:error (ex-data e)))
        (throw e)))))

(defn- undo-redo-aux
  [repo conn undo?]
  (if-let [op (not-empty ((if undo? pop-undo-op pop-redo-op) repo conn))]
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
          (let [reversed-tx-data (get-reversed-datoms conn undo? data tx-meta)
                tx-meta' (-> tx-meta
                             (dissoc :pipeline-replace?
                                     :batch-tx/batch-tx-mode?)
                             (assoc
                              :gen-undo-ops? false
                              :undo? undo?))]
            (when (seq reversed-tx-data)
              (ldb/transact! conn reversed-tx-data tx-meta')
              ((if undo? push-redo-op push-undo-op) repo op)
              (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) op)
                                        (map second))
                    block-content (:block/title (d/entity @conn [:block/uuid (:block-uuid
                                                                                (if undo?
                                                                                  (first editor-cursors)
                                                                                  (last editor-cursors)))]))]
                {:undo? undo?
                 :editor-cursors editor-cursors
                 :block-content block-content}))))))

    (when ((if undo? empty-undo-stack? empty-redo-stack?) repo)
      (prn (str "No further " (if undo? "undo" "redo") " information"))
      (if undo? ::empty-undo-stack ::empty-redo-stack))))

(defn undo
  [repo conn]
  (undo-redo-aux repo conn true))

(defn redo
  [repo conn]
  (undo-redo-aux repo conn false))

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

(defmethod db-listener/listen-db-changes :gen-undo-ops
  [_ {:keys [repo tx-data tx-meta db-after db-before]}]
  (let [{:keys [outliner-op]} tx-meta]
    (when (and outliner-op (not (false? (:gen-undo-ops? tx-meta))))
      (let [editor-info (:editor-info tx-meta)
            all-ids (distinct (map :e tx-data))
            retracted-ids (set
                           (filter
                            (fn [id] (and (nil? (d/entity db-after id)) (d/entity db-before id)))
                            all-ids))
            added-ids (set
                       (filter
                        (fn [id] (and (nil? (d/entity db-before id)) (d/entity db-after id)))
                        all-ids))
            tx-data' (->> (remove (fn [d] (contains? #{:block/path-refs} (:a d))) tx-data)
                          vec)
            op (->> [(when editor-info [::record-editor-info editor-info])
                     [::db-transact
                      {:tx-data tx-data'
                       :tx-meta tx-meta
                       :added-ids added-ids
                       :retracted-ids retracted-ids}]]
                    (remove nil?)
                    vec)]
        (push-undo-op repo op)))))
