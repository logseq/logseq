(ns frontend.modules.editor.undo-redo
  (:require [datascript.core :as d]
            [frontend.db.conn :as conn]
            [frontend.modules.datascript-report.core :as db-report]
            [frontend.db :as db]
            [frontend.state :as state]))

;;;; APIs

(def undo-stack (atom []))
(def redo-stack (atom []))

(defn push-undo
  [txs]
  (swap! undo-stack conj txs))

(defn pop-undo
  []
  (when-let [removed-e (peek @undo-stack)]
    (swap! undo-stack pop)
    removed-e))

(defn push-redo
  [txs]
  (swap! redo-stack conj txs))

(defn pop-redo
  []
  (when-let [removed-e (peek @redo-stack)]
    (swap! redo-stack pop)
    removed-e))

(defn reset-redo
  []
  (reset! redo-stack []))

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
    (reset-redo)
    (let [updated-blocks (db-report/get-blocks tx-report)
          entity {:blocks updated-blocks :txs tx-data
                  :editor-cursor (:editor-cursor tx-meta)}]
      (push-undo entity))))
