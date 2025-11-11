(ns frontend.undo-redo
  "Undo redo new implementation"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [logseq.common.defkeywords :refer [defkeywords]]
            [logseq.db :as ldb]
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
(defonce *undo-ops (atom {}))
(defonce *redo-ops (atom {}))

(defn clear-history!
  [repo]
  (prn :debug :clear-undo-history repo)
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

(defn- block-moved-and-target-deleted?
  [conn e->datoms e moved-blocks tx-data]
  (let [datoms (get e->datoms e)]
    (and (moved-blocks e)
         (let [b (d/entity @conn e)
               cur-parent (:db/id (:block/parent b))
               move-datoms (filter (fn [d] (contains? #{:block/parent} (:a d))) datoms)]
           (when cur-parent
             (let [before-parent (some (fn [d] (when (and (= :block/parent (:a d)) (not (:added d))) (:v d))) move-datoms)
                   not-exists-in-current-db (nil? (d/entity @conn before-parent))
                   ;; reverse tx-data will add parent before back
                   removed-before-parent (some (fn [d] (and (= :block/uuid (:a d))
                                                            (= before-parent (:e d))
                                                            (not (:added d)))) tx-data)]
               (and before-parent
                    not-exists-in-current-db
                    (not removed-before-parent))))))))

(defn get-reversed-datoms
  [conn undo? {:keys [tx-data added-ids retracted-ids] :as op} tx-meta]
  (try
    (let [redo? (not undo?)
          e->datoms (->> (if redo? tx-data (reverse tx-data))
                         (group-by :e))
          schema (:schema @conn)
          moved-blocks (get-moved-blocks e->datoms)]
      (->>
       (mapcat
        (fn [[e datoms]]
          (let [entity (d/entity @conn e)]
            (cond
              ;; new children blocks have been added
              (and
               (not (:local-tx? tx-meta))
               (or (and (contains? retracted-ids e) redo?
                        (other-children-exist? entity retracted-ids)) ; redo delete-blocks
                   (and (contains? added-ids e) undo?                 ; undo insert-blocks
                        (other-children-exist? entity added-ids))))
              (throw (ex-info "Children still exists"
                              (merge op {:error :block-children-exists
                                         :undo? undo?})))

              ;; block has been moved or target got deleted by another client
              (block-moved-and-target-deleted? conn e->datoms e moved-blocks tx-data)
              (throw (ex-info "This block has been moved or its target has been deleted"
                              (merge op {:error :block-moved-or-target-deleted
                                         :undo? undo?})))

              ;; The entity should be deleted instead of retracting its attributes
              (and entity
                   (or (and (contains? retracted-ids e) redo?) ; redo delete-blocks
                       (and (contains? added-ids e) undo?)))   ; undo insert-blocks
              [[:db/retractEntity e]]

              :else
              (reverse-datoms conn datoms schema added-ids retracted-ids undo? redo?))))
        e->datoms)
       (remove nil?)))
    (catch :default e
      (prn :debug :undo-redo :error (:error (ex-data e)))
      (when-not (contains? #{:block-moved-or-target-deleted
                             :block-children-exists}
                           (:error (ex-data e)))
        (throw e)))))

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
            (let [reversed-tx-data (cond-> (get-reversed-datoms conn undo? data tx-meta)
                                     undo?
                                     reverse)
                  tx-meta' (-> tx-meta
                               (dissoc :batch-tx/batch-tx-mode?)
                               (assoc
                                :gen-undo-ops? false
                                :undo? undo?
                                :redo? (not undo?)))
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
                               :block-content block-content}))]
              (when (seq reversed-tx-data)
                (if util/node-test?
                  (do
                    (ldb/transact! conn reversed-tx-data tx-meta')
                    (handler))
                  (->
                   (p/do!
                    ;; async write to the master worker
                    (ldb/transact! repo reversed-tx-data tx-meta')
                    (handler))
                   (p/catch (fn [e]
                              (log/error ::undo-redo-failed e)
                              (clear-history! repo)))))))))))

    (when ((if undo? empty-undo-stack? empty-redo-stack?) repo)
      (prn (str "No further " (if undo? "undo" "redo") " information"))
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
  (let [{:keys [outliner-op]} tx-meta]
    (when (and
           (= (:client-id tx-meta) (:client-id @state/state))
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
            op (->> [(when editor-info [::record-editor-info editor-info])
                     [::db-transact
                      {:tx-data tx-data'
                       :tx-meta tx-meta
                       :added-ids added-ids
                       :retracted-ids retracted-ids}]]
                    (remove nil?)
                    vec)]
        (push-undo-op repo op)))))

(defn listen-db-changes!
  [repo conn]
  (d/listen! conn ::gen-undo-ops
             (fn [tx-report] (gen-undo-ops! repo tx-report))))
