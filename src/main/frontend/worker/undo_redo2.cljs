(ns frontend.worker.undo-redo2
  "Undo redo new implementation"
  (:require [datascript.core :as d]
            [frontend.worker.db-listener :as db-listener]
            [frontend.worker.state :as worker-state]))

(def ^:private boundary [::boundary])

(defonce max-stack-length 500)
(defonce *undo-ops (:undo/repo->ops @worker-state/*state))
(defonce *redo-ops (:redo/repo->ops @worker-state/*state))

(defn- conj-ops
  [col ops]
  (let [result (apply (fnil conj []) col ops)]
    (if (>= (count result) max-stack-length)
      (subvec result 0 (/ max-stack-length 2))
      result)))

(defn- pop-ops-helper
  [stack]
  (loop [ops []
         stack stack]
    (let [last-op (peek stack)]
      (cond
        (empty? stack)
        nil
        (= boundary last-op)
        [(reverse (conj ops last-op)) (pop stack)]
        :else
        (recur (conj ops last-op) (pop stack))))))

(defn- push-undo-ops
  [repo ops]
  (swap! *undo-ops update repo conj-ops ops))

(defn- pop-undo-ops
  [repo]
  (let [undo-stack (get @*undo-ops repo)
        [ops undo-stack*] (pop-ops-helper undo-stack)]
    (swap! *undo-ops assoc repo undo-stack*)
    ops))

(defn- empty-undo-stack?
  [repo]
  (empty? (get @*undo-ops repo)))

(defn- empty-redo-stack?
  [repo]
  (empty? (get @*redo-ops repo)))

(defn- push-redo-ops
  [repo ops]
  (swap! *redo-ops update repo conj-ops ops))

(defn- pop-redo-ops
  [repo]
  (let [undo-stack (get @*redo-ops repo)
        [ops redo-stack*] (pop-ops-helper undo-stack)]
    (swap! *redo-ops assoc repo redo-stack*)
    ops))

(defn get-reversed-datoms
  [conn redo? {:keys [tx-data tx-meta added-ids retracted-ids]}]
  (try
    (let [e->datoms (->> (if redo? tx-data (reverse tx-data))
                         (group-by :e))
          schema (:schema @conn)]
      (->>
       (mapcat
        (fn [[e datoms]]
          (cond
            ;; block has been moved by another client
            (and
             (= :move-blocks (:outliner-op tx-meta))
             (let [b (d/entity @conn e)
                   cur-parent (:db/id (:block/parent b))
                   cur-order (:block/order b)
                   move-datoms (filter (fn [d] (contains? #{:block/parent :block/order} (:a d))) datoms)
                   cur [cur-parent cur-order]]
               (when (and cur-parent cur-order)
                 (let [before-parent (some (fn [d] (when (and (= :block/parent (:a d)) (not (:added d))) (:v d))) move-datoms)
                       after-parent (some (fn [d] (when (and (= :block/parent (:a d)) (:added d)) (:v d))) move-datoms)
                       before-order (some (fn [d] (when (and (= :block/order (:a d)) (not (:added d))) (:v d))) move-datoms)
                       after-order (some (fn [d] (when (and (= :block/order (:a d)) (:added d)) (:v d))) move-datoms)
                       before [before-parent before-order]
                       after [after-parent after-order]]
                   (if redo?
                     (not= cur before)
                     (not= cur after))))))
            ;; skip this tx
            (throw (ex-info "This block has been moved"
                            {:error :block-moved}))

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
      (when (not= :block-moved (:error (ex-data e)))
        (throw e)))))

(defn undo
  [repo conn]
  (if-let [ops (not-empty (pop-undo-ops repo))]
    (let [{:keys [tx-data tx-meta] :as data} (some #(when (= ::db-transact (first %))
                                             (second %)) ops)]
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
            (push-redo-ops repo ops)
            (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) ops)
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
  (if-let [ops (not-empty (pop-redo-ops repo))]
    (let [{:keys [tx-meta tx-data] :as data} (some #(when (= ::db-transact (first %))
                                                      (second %)) ops)]
      (when (seq tx-data)
        (let [reversed-tx-data (get-reversed-datoms conn true data)
              tx-meta' (-> tx-meta
                           (dissoc :pipeline-replace?
                                   :batch-tx/batch-tx-mode?)
                           (assoc
                            :gen-undo-ops? false
                            :redo? true))]
          (d/transact! conn reversed-tx-data tx-meta')
          (push-undo-ops repo ops)
          (let [editor-cursors (->> (filter #(= ::record-editor-info (first %)) ops)
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
           (when (seq stack)
             (conj stack [::record-editor-info editor-info])))))

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
            ops (->> [boundary
                      (when editor-info [::record-editor-info editor-info])
                      [::db-transact
                       {:tx-data tx-data
                        :tx-meta tx-meta
                        :added-ids added-ids
                        :retracted-ids retracted-ids}]]
                     (remove nil?))]
        (push-undo-ops repo ops)))))
