(ns frontend.history
  (:require [frontend.diff :as diff]
            [frontend.db :as db]
            [frontend.state :as state]
            [promesa.core :as p]
            ["/frontend/utils" :as utils]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.handler.ui :as ui-handler]
            [frontend.date :as date]))

;; TODO:
;; undo-tree

;; repo file -> contents transactions sequence
(defonce history (atom {}))
;; repo -> idx
(defonce history-idx (atom {}))

(defonce history-limit 100)

;; tx [[file1-path patches] [file2-path patches]]
(defn add-history!
  [repo tx]
  (let [tx (->> tx
                (remove (fn [[_ old new]] (= old new)))
                (map (fn [[file old new]]
                       (when (and old new)
                         (let [diffs (diff/diffs new old)]
                           [file {:old old
                                  :new new}]))))
                (remove nil?))]
    (when (seq tx)
      (let [last-edit-block (get @state/state :editor/last-edit-block)
            tx (if last-edit-block
                 {:data tx
                  ;; other state
                  :pos (state/get-edit-pos)
                  ;; TODO: right sidebar, what if multiple buffers later?
                  ;; :right-sidebar? false

                  ;; block-id will be updated when parsing the content, so it's
                  ;; not reliably.
                  ;; :block-id (:block/uuid edit-block)
                  :block-idx (:idx last-edit-block)
                  :block-container (:container last-edit-block)}
                 {:data tx})
            length (count (get @history repo))
            idx (get @history-idx repo 0)]
        (when (and (>= length history-limit)
                   (>= idx history-limit))
          (swap! history assoc repo (vec (drop (/ history-limit 2) (get @history repo))))
          (swap! history-idx assoc repo (dec (/ history-limit 2))))
        (let [idx (get @history-idx repo 0)
              idx' (inc idx)
              txs (vec (take idx' (get @history repo)))]
          ;; TODO: auto-save the block and undo at the same time
          ;; Should we use core.async channel to force serialization?
          (swap! history assoc repo (conj txs tx))
          (swap! history-idx assoc repo idx'))))))

(defonce *undoing? (atom false))

(defn- open-pages-in-sidebar!
  [paths]
  (when-let [repo (state/get-current-repo)]
    (let [current-page (some->
                        (or (state/get-current-page)
                            (date/today))
                        (string/lower-case))]
      (doseq [path paths]
        (when-let [page (db/get-file-page path false)]
          (when (not= page current-page)
            (let [db-id (:db/id (db/entity [:block/name page]))]
              (state/sidebar-add-block! repo db-id :page {:page page}))))))))

;; TODO: history should ignore rename transactions
(defn undo!
  [repo alter-file restore-cursor]
  (let [idx (get @history-idx repo 0)]
    (when (and (> idx 0) (false? @*undoing?))
      (let [idx' (dec idx)
            tx (get-in @history [repo idx'])
            {:keys [data]} tx
            _ (reset! *undoing? true)
            _ (open-pages-in-sidebar! (map first data))
            promises (for [[path {:keys [old]}] data]
                       (let [current-content (db/get-file-no-sub path)]
                         (alter-file repo path old
                                     {:add-history? false
                                      :re-render-root? false})))]
        (-> (p/all promises)
            (p/then (fn []
                      (db/clear-query-state!)
                      (swap! history-idx assoc repo idx')
                      (reset! *undoing? false)
                      ;; restore cursor
                      (when (> idx' 0)
                        (let [prev-tx (get-in @history [repo (dec idx')])]
                          (when restore-cursor (restore-cursor prev-tx))))
                      (ui-handler/re-render-root!))))))))

(defonce *redoing? (atom false))
(defn redo!
  [repo alter-file restore-cursor]
  (let [idx (get @history-idx repo 0)
        txs (get @history repo)]
    (when (and (> (count txs) idx) (false? @*redoing?))
      (let [tx (get-in @history [repo idx])
            _ (reset! *redoing? true)
            promises (for [[path {:keys [new]}] (:data tx)]
                       (let [current-content (db/get-file-no-sub path)]
                         (alter-file repo path new
                                     {:add-history? false
                                      :re-render-root? false})))]
        (-> (p/all promises)
            (p/then (fn []
                      (db/clear-query-state!)
                      (swap! history-idx assoc repo (inc idx))
                      (reset! *redoing? false)
                      (ui-handler/re-render-root!)
                      ;; restore cursor
                      (when restore-cursor (restore-cursor tx)))))))))

(comment
  (prn
   {:history-idx (get @history-idx (frontend.state/get-current-repo))
    :history (get @history (frontend.state/get-current-repo))})
  )
