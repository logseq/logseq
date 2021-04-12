(ns frontend.modules.editor.undo-redo
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.modules.datascript-report.core :as db-report]
            [frontend.db :as db]
            [frontend.state :as state]
            [frontend.debug :as debug]))

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
  (defn get-content-from-entity
    "For test."
    [entity]
    (filterv (fn [[_ a & y]]
               (= :block/content a))
      (:txs entity)))

  (defn get-content-from-stack
    "For test."
    [stack]
    (mapv #(get-content-from-entity %) stack))

  (debug/pprint "pop entity" (get-content-from-entity removed-e))
  (debug/pprint "undo-stack" (get-content-from-stack @undo-stack)))

(defn pop-undo
  []
  (let [undo-stack (get-undo-stack)]
   (when-let [removed-e (peek @undo-stack)]
     (swap! undo-stack pop)
     removed-e)))

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

(defn- transact!
  [txs]
  (let [conn (conn/get-conn false)]
    (d/transact! conn txs)))

(defn- refresh
  [opts]
  (let [repo (state/get-current-repo)]
   (db/refresh repo opts)))

(defn undo
  []
  (when-let [{:keys [blocks txs] :as e} (pop-undo)]
    (let [new-txs (get-txs false txs)]
      (push-redo e)
      (transact! new-txs)
      (refresh {:key :block/change :data blocks})
      (assoc e :txs-op new-txs))))

(defn redo
  []
  (when-let [{:keys [blocks txs]:as e} (pop-redo)]
    (let [new-txs (get-txs true txs)]
      (push-undo e)
      (transact! new-txs)
      (refresh {:key :block/change :data blocks})
      (assoc e :txs-op new-txs))))

(defn listen-outliner-operation
  [{:keys [tx-data tx-meta] :as tx-report}]
  (when-not (empty? tx-data)
    (debug/pprint "tx-data" tx-data)
    (reset-redo)
    (let [updated-blocks (db-report/get-blocks tx-report)
          entity {:blocks updated-blocks :txs tx-data
                  :editor-cursor (:editor-cursor tx-meta)}]
      (push-undo entity))))
