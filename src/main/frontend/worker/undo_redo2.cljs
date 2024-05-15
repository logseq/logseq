(ns frontend.worker.undo-redo2
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]))

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

(defn get-reversed-datoms
  [conn redo? {:keys [tx-data added-ids retracted-ids]}]
  (try
    (let [e->datoms (->> (if redo? tx-data (reverse tx-data))
                         (group-by :e))
          moved-blocks (get-moved-blocks e->datoms)
          schema (:schema @conn)]
      (->>
       (mapcat
        (fn [[e datoms]]
          (cond
            ;; block has been moved or target got deleted by another client
            (and (moved-blocks e)
                 (let [b (d/entity @conn e)
                       cur-parent (:db/id (:block/parent b))
                       move-datoms (filter (fn [d] (contains? #{:block/parent} (:a d))) datoms)]
                   (when cur-parent
                     (let [before-parent (some (fn [d] (when (and (= :block/parent (:a d)) (not (:added d))) (:v d))) move-datoms)
                           after-parent (some (fn [d] (when (and (= :block/parent (:a d)) (:added d)) (:v d))) move-datoms)]
                       (if redo?
                         (or (not= cur-parent before-parent)
                             (nil? (d/entity @conn after-parent)))
                         (or (not= cur-parent after-parent)
                             (nil? (d/entity @conn before-parent))))))))
            ;; skip this tx
            (throw (ex-info "This block has been moved or its target has been deleted"
                            {:error :block-moved-or-target-deleted}))

            ;; The entity should be deleted instead of retracting its attributes
            (or (and (contains? retracted-ids e) redo?)
                (and (contains? added-ids e) (not redo?)))
            [[:db/retractEntity e]]

            :else
            (keep
             (fn [[id attr value _tx add?]]
               (let [ref? (= :db.type/ref (get-in schema [attr :db/valueType]))
                     op (if (or (and redo? add?) (and (not redo?) (not add?)))
                          :db/add
                          :db/retract)]
                 (when-not (and ref?
                                (not (d/entity @conn value))
                                (not (and (retracted-ids value) (not redo?)))
                                (not (and (added-ids value) redo?))) ; ref has been deleted
                   [op id attr value])))
             datoms)))
        e->datoms)
       (remove nil?)))
    (catch :default e
      (when (not= :block-moved-or-target-deleted (:error (ex-data e)))
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
