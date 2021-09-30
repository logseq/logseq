(ns frontend.modules.editor.undo-redo
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.modules.datascript-report.core :as db-report]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.debug :as debug]
            [frontend.db.outliner :as db-outliner]
            [frontend.modules.outliner.pipeline :as pipelines]))

;;;; APIs

(def ^:private undo-redo-states (atom {}))

(defn- get-state
  []
  (let [repo (state/get-current-repo)]
    (assert (string? repo) "Repo should satisfy string?")
    (if-let [state (get @undo-redo-states repo)]
      state
      (let [new-state {:undo-stack (atom [])
                       :redo-stack (atom [])}]
        (swap! undo-redo-states assoc repo new-state)
        new-state))))

(defn- get-undo-stack
  []
  (-> (get-state) :undo-stack))

(defn- get-redo-stack
  []
  (-> (get-state) :redo-stack))

(defn push-undo
  [txs]
  (let [undo-stack (get-undo-stack)]
    (swap! undo-stack conj txs)))

(comment
  (defn get-content-from-txs
    "For test."
    [txs]
    (filterv (fn [[_ a & y]]
               (= :block/content a))
      txs))

  (defn get-content-from-stack
    "For test."
    [stack]
    (mapv #(get-content-from-txs (:txs %)) stack))

  (debug/pprint "pop entity" (get-content-from-txs (:txs removed-e)))
  (debug/pprint "undo-stack" (get-content-from-stack @undo-stack)))

(defn pop-undo
  []
  (let [undo-stack (get-undo-stack)]
    (when-let [stack @undo-stack]
      (when (seq stack)
        (let [removed-e (peek stack)
              popped-stack (pop stack)
              prev-e (peek popped-stack)]
          (reset! undo-stack popped-stack)
          [removed-e prev-e])))))

(defn push-redo
  [txs]
  (let [redo-stack (get-redo-stack)]
   (swap! redo-stack conj txs)))

(defn pop-redo
  []
  (let [redo-stack (get-redo-stack)]
   (when-let [removed-e (peek @redo-stack)]
     (swap! redo-stack pop)
     removed-e)))

(defn reset-redo
  []
  (let [redo-stack (get-redo-stack)]
    (reset! redo-stack [])))

(defn get-txs
  [redo? txs]
  (let [txs (if redo? txs (reverse txs))]
    (mapv (fn [[id attr value tx add? :as datom]]
            (let [op (cond
                       (and redo? add?) :db/add
                       (and (not redo?) add?) :db/retract
                       (and redo? (not add?)) :db/retract
                       (and (not redo?) (not add?)) :db/add)]
              [op id attr value tx]))
      txs)))

;;;; Invokes

(defn get-by-id
  [id]
  (let [conn (conn/get-conn false)]
    (db-outliner/get-by-id conn id)))

(defn- transact!
  [txs]
  (let [conn (conn/get-conn false)
        db-report (d/transact! conn txs)]
    (do (pipelines/invoke-hooks db-report))))

(defn- refresh!
  [opts]
  (let [repo (state/get-current-repo)]
   (db/refresh! repo opts)))

(defn undo
  []
  (let [[e prev-e] (pop-undo)]
    (when e
      (let [{:keys [blocks txs]} e
            new-txs (get-txs false txs)
            editor-cursor (if (= (get-in e [:editor-cursor :last-edit-block :block/uuid])
                                 (get-in prev-e [:editor-cursor :last-edit-block :block/uuid])) ; same block
                            (:editor-cursor prev-e)
                            (:editor-cursor e))]
        (push-redo e)
        (transact! new-txs)
        (let [blocks
              (map (fn [x] (get-by-id [:block/uuid (:block/uuid x)])) blocks)]
          (refresh! {:key :block/change :data (vec blocks)}))
        (assoc e
               :txs-op new-txs
               :editor-cursor editor-cursor)))))

(defn redo
  []
  (when-let [{:keys [blocks txs]:as e} (pop-redo)]
    (let [new-txs (get-txs true txs)]
      (push-undo e)
      (transact! new-txs)
      (let [blocks (map (fn [x] (get-by-id [:block/uuid (:block/uuid x)])) blocks)]
        (refresh! {:key :block/change :data (vec blocks)}))
      (assoc e :txs-op new-txs))))

(defn listen-outliner-operation
  [{:keys [tx-data tx-meta] :as tx-report}]
  (when-not (empty? tx-data)
    (reset-redo)
    (let [updated-blocks (db-report/get-blocks tx-report)
          entity {:blocks updated-blocks :txs tx-data
                  :editor-cursor (:editor-cursor tx-meta)
                  :outliner-op (:outliner-op tx-meta)
                  :other-meta (:other-meta tx-meta)}]
      (println "tx-meta: " tx-meta)
      (push-undo entity))))
