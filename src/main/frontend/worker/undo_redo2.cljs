(ns frontend.worker.undo-redo2
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]
            [clojure.set :as set]
            [logseq.db :as ldb]))

;; TODO: add malli schema for op
;; Each `op` is a combination of `::record-editor-info`, `::db-transact` and maybe
;; other UI states such as `::ui/route` and `:ui/sidebar-blocks`.
(defonce max-stack-length 500)
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
  (swap! *undo-ops update repo conj-op op))

(defn- pop-undo-op
  [repo]
  (let [undo-stack (get @*undo-ops repo)
        [op undo-stack*] (pop-stack undo-stack)]
    (swap! *undo-ops assoc repo undo-stack*)
    op))

(defn- empty-undo-stack?
  [repo]
  (empty? (get @*undo-ops repo)))

(defn- empty-redo-stack?
  [repo]
  (empty? (get @*redo-ops repo)))

(defn- push-redo-op
  [repo op]
  (swap! *redo-ops update repo conj-op op))

(defn- pop-redo-op
  [repo]
  (let [undo-stack (get @*redo-ops repo)
        [op redo-stack*] (pop-stack undo-stack)]
    (swap! *redo-ops assoc repo redo-stack*)
    op))

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

(defn get-reversed-datoms
  [conn redo? {:keys [tx-data added-ids retracted-ids]}]
  (try
    (when (and (seq added-ids) (seq retracted-ids))
      (throw (ex-info "entities are created and deleted in the same tx"
                      {:error :entities-created-and-deleted-same-tx})))
    (let [undo? (not redo?)
          e->datoms (->> (if redo? tx-data (reverse tx-data))
                         (group-by :e))
          moved-blocks (get-moved-blocks e->datoms)
          schema (:schema @conn)
          added-and-retracted-ids (set/union added-ids retracted-ids)
          rtc-graph? (some? (ldb/get-graph-rtc-uuid @conn))
          transact-reverse-datoms-f (fn [datoms]
                                      (keep
                                       (fn [[id attr value _tx add?]]
                                         (let [ref? (= :db.type/ref (get-in schema [attr :db/valueType]))
                                               op (if (or (and redo? add?) (and undo? (not add?)))
                                                    :db/add
                                                    :db/retract)]
                                           (when-not (and ref?
                                                          (not (d/entity @conn value))
                                                          (not (and (retracted-ids value) undo?))
                                                          (not (and (added-ids value) redo?))) ; ref has been deleted
                                             [op id attr value])))
                                       datoms))]
      (->>
       (mapcat
        (fn [[e datoms]]
          (let [entity (d/entity @conn e)]
            ;; FIXME: files graphs may need to reset undo stack when there're changes from disk
            (if-not rtc-graph?
              (transact-reverse-datoms-f datoms)
              (cond
                ;; entity has been deleted
                (and (nil? entity)
                     (not (contains? added-and-retracted-ids e)))
                (throw (ex-info "Entity has been deleted"
                                {:error :entity-deleted}))

                ;; block has been moved or target got deleted by another client
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
                                      (nil? (d/entity @conn before-parent)))))))))
                (throw (ex-info (str "This block has been moved or its target has been deleted"
                                     {:redo? redo?})
                                {:error :block-moved-or-target-deleted}))

                ;; new children blocks have been added
                (or (and (contains? retracted-ids e) redo?
                         (other-children-exist? entity retracted-ids)) ; redo delete-blocks
                    (and (contains? added-ids e) undo?                 ; undo insert-blocks
                         (other-children-exist? entity added-ids)))
                (throw (ex-info "Children still exists"
                                {:error :block-children-exists}))

                ;; The entity should be deleted instead of retracting its attributes
                (or (and (contains? retracted-ids e) redo?) ; redo delete-blocks
                    (and (contains? added-ids e) undo?)) ; undo insert-blocks
                [[:db/retractEntity e]]

                ;; reverse datoms
                :else
                (transact-reverse-datoms-f datoms)))))
        e->datoms)
       (remove nil?)))
    (catch :default e
      (throw e)
      (when-not (contains? #{:entities-created-and-deleted-same-tx
                             :block-moved-or-target-deleted :block-children-exists
                             :entity-deleted}
                           (:error (ex-data e)))
        (throw e)))))

(defn undo
  [repo conn]
  (if-let [op (not-empty (pop-undo-op repo))]
    (let [{:keys [tx-data tx-meta] :as data} (some #(when (= ::db-transact (first %))
                                             (second %)) op)]
      (when (seq tx-data)
        (let [reversed-tx-data (get-reversed-datoms conn false data)
              tx-meta' (-> tx-meta
                           (dissoc :pipeline-replace?
                                   :batch-tx/batch-tx-mode?)
                           (assoc
                            :gen-undo-ops? false
                            :undo? true))]
          (when (seq reversed-tx-data)
            (d/transact! conn reversed-tx-data tx-meta')
            (push-redo-op repo op)
            (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) op)
                                      (map second))
                  block-content (:block/content (d/entity @conn [:block/uuid (:block-uuid (first editor-cursors))]))]
              {:undo? true
               :editor-cursors editor-cursors
               :block-content block-content})))))

    (when (empty-undo-stack? repo)
      (prn "No further undo information")
      ::empty-undo-stack)))

(defn redo
  [repo conn]
  (if-let [op (not-empty (pop-redo-op repo))]
    (let [{:keys [tx-meta tx-data] :as data} (some #(when (= ::db-transact (first %))
                                                      (second %)) op)]
      (when (seq tx-data)
        (let [reversed-tx-data (get-reversed-datoms conn true data)
              tx-meta' (-> tx-meta
                           (dissoc :pipeline-replace?
                                   :batch-tx/batch-tx-mode?)
                           (assoc
                            :gen-undo-ops? false
                            :redo? true))]
          (d/transact! conn reversed-tx-data tx-meta')
          (push-undo-op repo op)
          (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) op)
                                    (map second))
                block-content (:block/content (d/entity @conn [:block/uuid (:block-uuid (last editor-cursors))]))]
            {:redo? true
             :editor-cursors editor-cursors
             :block-content block-content}))))

    (when (empty-redo-stack? repo)
      (prn "No further redo information")
      ::empty-redo-stack)))

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
            tx-data' (remove (fn [d] (contains? #{:block/path-refs} (:a d))) tx-data)
            op (->> [(when editor-info [::record-editor-info editor-info])
                     [::db-transact
                      {:tx-data tx-data'
                       :tx-meta tx-meta
                       :added-ids added-ids
                       :retracted-ids retracted-ids}]]
                    (remove nil?))]
        (push-undo-op repo op)))))
