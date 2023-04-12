(ns frontend.modules.editor.undo-redo
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.handler.notification :as notification]
            [frontend.modules.datascript-report.core :as db-report]
            [frontend.util.page :as page-util]
            [frontend.state :as state]
            [clojure.set :as set]
            [medley.core :as medley]))

;;;; APIs

(def ^:private undo-redo-states (atom {}))
(def *pause-listener (atom false))

(defn get-state
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

(defn page-pop-redo
  [page-id]
  (prn "[debug] redo: " (:block/original-name (db/pull page-id)))
  (when-let [redo-stack (get-redo-stack)]
    (when-let [stack @redo-stack]
      (when (seq stack)
        (let [reversed-stack (medley/indexed (reverse stack))
              idx (some (fn [[idx item]]
                          (some #(when (or (= (:db/id %) page-id)
                                           (= (:db/id (:block/page %)) page-id)) idx) (:blocks item))) reversed-stack)]
          (when idx
            (let [idx' (- (count stack) idx 1)
                  before (subvec stack 0 idx')
                  after (subvec stack (inc idx'))
                  others (vec (concat before after))]
              (reset! redo-stack others)
              (prn "[debug] redo remove: " (nth stack idx'))
              (nth stack idx'))))))))

(defn- smart-pop-redo
  []
  (if (:history/page-only-mode? @state/state)
    (if-let [page-id (page-util/get-editing-page-id)]
      (page-pop-redo page-id)
      (pop-redo))
    (pop-redo)))

(defn reset-redo
  []
  (let [redo-stack (get-redo-stack)]
    (reset! redo-stack [])))

(defn get-txs
  [redo? txs]
  (let [txs (if redo? txs (reverse txs))]
    (mapv (fn [[id attr value tx add?]]
            (let [op (cond
                       (and redo? add?) :db/add
                       (and (not redo?) add?) :db/retract
                       (and redo? (not add?)) :db/retract
                       (and (not redo?) (not add?)) :db/add)]
              [op id attr value tx]))
      txs)))

;;;; Invokes

(defn- transact!
  [txs tx-meta]
  (let [conn (conn/get-db false)]
    (d/transact! conn txs tx-meta)))

(defn page-pop-undo
  [page-id]
  (let [undo-stack (get-undo-stack)]
    (when-let [stack @undo-stack]
      (when (seq stack)
        (let [reversed-stack (medley/indexed (reverse stack))
              idx (some (fn [[idx item]]
                          (some #(when (or (= (:db/id %) page-id)
                                           (= (:db/id (:block/page %)) page-id)) idx) (:blocks item))) reversed-stack)]
          (when idx
            (let [idx' (- (count stack) idx 1)
                  before (subvec stack 0 idx')
                  after (subvec stack (inc idx'))
                  others (vec (concat before after))]
              (reset! undo-stack others)
              (prn "[debug] undo remove: " (nth stack idx'))
              [(nth stack idx') others])))))))

(defn- smart-pop-undo
  []
  (if (:history/page-only-mode? @state/state)
    (if-let [page-id (page-util/get-editing-page-id)]
      (page-pop-undo page-id)
      (pop-undo))
    (pop-undo)))

(defn undo
  []
  (let [[e prev-e] (smart-pop-undo)]
    (when e
      (let [{:keys [txs tx-meta]} e
            new-txs (get-txs false txs)
            undo-delete-concat-block? (and (= :delete-block (:outliner-op tx-meta))
                                           (seq (:concat-data tx-meta)))
            editor-cursor (cond
                            undo-delete-concat-block?
                            (let [data (:concat-data tx-meta)]
                              (assoc (:editor-cursor e)
                                     :last-edit-block {:block/uuid (:last-edit-block data)}
                                     :pos (if (:end? data) :max 0)))

                            ;; same block
                            (= (get-in e [:editor-cursor :last-edit-block :block/uuid])
                               (get-in prev-e [:editor-cursor :last-edit-block :block/uuid]))
                            (:editor-cursor prev-e)

                            :else
                            (:editor-cursor e))]

        (push-redo e)
        (transact! new-txs (merge {:undo? true}
                                  tx-meta
                                  (select-keys e [:pagination-blocks-range])))

        (when undo-delete-concat-block?
          (when-let [block (state/get-edit-block)]
            (state/set-edit-content! (state/get-edit-input-id)
                                     (:block/content (db/entity (:db/id block))))))

        (when (:whiteboard/transact? tx-meta)
          (state/pub-event! [:whiteboard/undo e]))
        (assoc e
               :txs-op new-txs
               :editor-cursor editor-cursor)))))

(defn redo
  []
  (when-let [{:keys [txs tx-meta] :as e} (smart-pop-redo)]
    (let [new-txs (get-txs true txs)]
      (push-undo e)
      (transact! new-txs (merge {:redo? true}
                                tx-meta
                                (select-keys e [:pagination-blocks-range])))
      (when (:whiteboard/transact? tx-meta)
        (state/pub-event! [:whiteboard/redo e]))
      (assoc e :txs-op new-txs))))

(defn toggle-undo-redo-mode!
  []
  (swap! state/state update :history/page-only-mode? not)
  (let [mode (if (:history/page-only-mode? @state/state) "Page only" "Global")]
    (notification/show!
     [:p (str "Undo/redo mode: " mode)])))

(defn pause-listener!
  []
  (reset! *pause-listener true))

(defn resume-listener!
  []
  (reset! *pause-listener false))

(defn listen-db-changes!
  [{:keys [tx-data tx-meta] :as tx-report}]
  (when (and (seq tx-data)
             (not (or (:undo? tx-meta)
                      (:redo? tx-meta)))
             (not @*pause-listener)
             (not (set/subset?
                   (set (map :a tx-data))
                   #{:block/created-at :block/updated-at})))
    (reset-redo)
    (if (:replace? tx-meta)
      (let [[removed-e _prev-e] (pop-undo)
            entity (update removed-e :txs concat tx-data)]
        (push-undo entity))
      (let [updated-blocks (db-report/get-blocks tx-report)
            entity {:blocks updated-blocks
                    :txs tx-data
                    :tx-meta tx-meta
                    :editor-cursor (:editor-cursor tx-meta)
                    :pagination-blocks-range (get-in [:ui/pagination-blocks-range (get-in tx-report [:db-after :max-tx])] @state/state)
                    :app-state (select-keys @state/state
                                            [:route-match
                                             :ui/sidebar-open?
                                             :ui/sidebar-collapsed-blocks
                                             :sidebar/blocks])}]
        (push-undo entity)))))
