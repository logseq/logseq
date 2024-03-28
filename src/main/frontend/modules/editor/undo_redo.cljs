(ns frontend.modules.editor.undo-redo
  (:require [frontend.db :as db]
            [frontend.handler.notification :as notification]
            [frontend.util.page :as page-util]
            [frontend.state :as state]
            [clojure.set :as set]
            [medley.core :as medley]
            [frontend.handler.route :as route-handler]
            [promesa.core :as p]))

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

(defn pop-undo
  []
  (let [undo-stack (get-undo-stack)]
    (when-let [stack @undo-stack]
      (when (seq stack)
        (let [removed-e (peek stack)
              popped-stack (pop stack)]
          (reset! undo-stack popped-stack)
          removed-e)))))

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
  (db/transact! (state/get-current-repo) txs tx-meta))

(defn- page-pop-undo
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
              (nth stack idx'))))))))

(defn- smart-pop-undo
  []
  (if (:history/page-only-mode? @state/state)
    (if-let [page-id (page-util/get-editing-page-id)]
      (page-pop-undo page-id)
      (pop-undo))
    (pop-undo)))

(defn pause-listener!
  []
  (reset! *pause-listener true))

(defn resume-listener!
  []
  (reset! *pause-listener false))

(defn undo
  []
  (when-let [e (smart-pop-undo)]
    (pause-listener!)
    (state/set-editor-op! :undo)
    (let [{:keys [txs tx-meta tx-id]} e
          new-txs (get-txs false txs)
          editor-cursor (:before (get @(get @state/state :history/tx->editor-cursor) tx-id))]
      (push-redo e)
      (p/do!
       (transact! new-txs (assoc tx-meta :undo? true))

       (when (= :rename-page (:outliner-op tx-meta))
         (when-let [old-page (:old-name (:data tx-meta))]
           (route-handler/redirect-to-page! old-page))))
      (assoc e
             :txs-op new-txs
             :editor-cursor editor-cursor))))

(defn redo
  []
  (when-let [{:keys [txs tx-meta tx-id] :as e} (smart-pop-redo)]
    (pause-listener!)
    (state/set-editor-op! :redo)
    (let [new-txs (get-txs true txs)
          editor-cursor (let [s (get @(get @state/state :history/tx->editor-cursor) tx-id)]
                          (if (= (:outliner-op tx-meta) :save-block)
                            (:before s)
                            (or (:after s) (:before s))))]
      (push-undo e)
      (p/do!
       (transact! new-txs (assoc tx-meta :redo? true))

       (when (= :rename-page (:outliner-op tx-meta))
         (when-let [new-page (:new-name (:data tx-meta))]
           (route-handler/redirect-to-page! new-page))))

      (assoc e
             :txs-op new-txs
             :editor-cursor editor-cursor))))

(defn toggle-undo-redo-mode!
  []
  (swap! state/state update :history/page-only-mode? not)
  (let [mode (if (:history/page-only-mode? @state/state) "Page only" "Global")]
    (notification/show!
     [:p (str "Undo/redo mode: " mode)])))


(defn listen-db-changes!
  [{:keys [tx-id tx-data tx-meta blocks pages]}]
  (when (and (seq tx-data)
             (not (or (:undo? tx-meta)
                      (:redo? tx-meta)))
             (not @*pause-listener)
             (not (set/subset?
                   (set (map :a tx-data))
                   #{:block/created-at :block/updated-at})))
    (reset-redo)
    (if (:replace? tx-meta)
      (when-let [removed-e (pop-undo)]
        (let [entity (update removed-e :txs concat tx-data)]
          (push-undo entity)))
      (let [updated-blocks (concat blocks pages)
            entity {:blocks updated-blocks
                    :tx-id tx-id
                    :txs tx-data
                    :tx-meta tx-meta
                    :app-state (select-keys @state/state
                                            [:route-match
                                             :ui/sidebar-open?
                                             :ui/sidebar-collapsed-blocks
                                             :sidebar/blocks])}]
        (push-undo entity))))
  (resume-listener!))
