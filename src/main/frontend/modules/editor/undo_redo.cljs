(ns frontend.modules.editor.undo-redo
  (:require [datascript.core :as d]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.modules.datascript-report.core :as db-report]
            [frontend.state :as state]
            [frontend.util.page :as page-util]
            [frontend.db.model :as db-model]
            [clojure.set :as set]))

;;;; APIs

(def undo-redo-states (atom {}))
(def *pause-listener (atom false))

(defn- get-state
  [page]
  (let [repo (state/get-current-repo)]
    (assert (string? repo) "Repo should satisfy string?")
    (when page
      (if-let [state (get-in @undo-redo-states [repo page])]
        state
        (let [new-state {:undo-stack (atom [])
                         :redo-stack (atom [])}]
          (swap! undo-redo-states assoc-in [repo page] new-state)
          new-state)))))

(defn- get-undo-stack
  ([]
   (get-undo-stack (page-util/get-editing-page-id)))
  ([page]
   (-> (get-state page) :undo-stack)))

(defn- get-redo-stack
  ([]
   (get-redo-stack (page-util/get-editing-page-id)))
  ([page]
   (-> (get-state page) :redo-stack)))

(defn reset-history
  [page]
  (when page
    (let [repo (state/get-current-repo)]
      (assert (string? repo) "Repo should satisfy string?")
      (swap! undo-redo-states assoc-in [repo page] {:undo-stack (atom [])
                                                    :redo-stack (atom [])}))))

(defn- get-updated-pages
  [txs]
  (let [txs-page (->> (:txs txs)
                      (filter #(= (second %) :block/page))
                      (map #(nth % 2)))]
    (set (remove nil? (if (empty? txs-page)
                        (map #(get-in % [:block/page :db/id]) (:blocks txs))
                        txs-page)))))

(defn push-undo
  [txs]
  (mapv #(when-let [undo-stack (get-undo-stack %)]
           (swap! undo-stack conj txs)) (get-updated-pages txs)))

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

(defn- valid-context?
  "Checks if the current container is the same or includes the previous container"
  [txs]
  (let [prev-container (:container (:editor-cursor (:tx-meta txs)))
        container (:container (state/get-current-edit-block-and-position))
        container (or container (page-util/get-current-page-name))]
    (or (db-model/page? container) ; always allow on pages (top level context)
        (= prev-container container) ; allow on same context
        (try (.querySelectorAll js/document (str "#" container " [data-block-id='" prev-container "']")) ; allow on nested context
             (catch :default _
               false)))))

(defn- should-undo?
  []
  (when-let [undo-stack (get-undo-stack)]
    (when-let [stack @undo-stack]
      (when (seq stack)
        (valid-context? (peek stack))))))

(defn- should-redo?
  []
  (when-let [redo-stack (get-redo-stack)]
    (when-let [stack @redo-stack]
      (when (seq stack)
        (valid-context? (peek stack))))))

(defn pop-undo
  []
  (when-let [undo-stack (get-undo-stack)]
    (when-let [stack @undo-stack]
      (when (seq stack)
        (let [removed-e (peek stack)
              popped-stack (pop stack)
              prev-e (peek popped-stack)]
          (reset! undo-stack popped-stack)
          [removed-e prev-e])))))

(defn push-redo
  [txs]
  (when-let [redo-stack (get-redo-stack)]
    (swap! redo-stack conj txs)))

(defn pop-redo
  []
  (when-let [redo-stack (get-redo-stack)]
    (when-let [removed-e (peek @redo-stack)]
      (swap! redo-stack pop)
      removed-e)))

(defn reset-redo
  [page]
  (when-let [redo-stack (get-redo-stack page)]
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

(defn undo
  []
  (when (should-undo?)
    (let [[e prev-e] (pop-undo)]
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
                 :editor-cursor editor-cursor))))))

(defn redo
  []
  (when (should-redo?)
    (when-let [{:keys [txs tx-meta] :as e} (pop-redo)]
      (let [new-txs (get-txs true txs)]
        (push-undo e)
        (transact! new-txs (merge {:redo? true}
                                  tx-meta
                                  (select-keys e [:pagination-blocks-range])))
        (when (:whiteboard/transact? tx-meta)
          (state/pub-event! [:whiteboard/redo e]))
        (assoc e :txs-op new-txs)))))

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
    (if (:replace? tx-meta)
      (let [[removed-e _prev-e] (pop-undo)
            entity (update removed-e :txs concat tx-data)]
        (push-undo entity))
      (let [updated-blocks (db-report/get-blocks tx-report)
            entity {:blocks updated-blocks
                    :txs tx-data
                    :tx-meta tx-meta
                    :editor-cursor (:editor-cursor tx-meta)
                    :pagination-blocks-range (get-in [:ui/pagination-blocks-range (get-in tx-report [:db-after :max-tx])] @state/state)}
            pages (get-updated-pages entity)]
        (if (second pages) ; Multi-page actions are not history safe
          (do (mapv reset-history pages) ; Clear history for those pages and don't push the action to the stack
              (state/pub-event! [:capture-error {:error "Multi-page action triggered"
                                                 :payload {:type :outliner/invalid-action
                                                           :data (mapv #(dissoc % :block/content) (:blocks entity))}}]))
          (do (reset-redo (first pages))
              (push-undo entity)))))))
