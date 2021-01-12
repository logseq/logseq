(ns frontend.history
  (:require [frontend.diff :as diff]
            [frontend.db :as db]
            [frontend.state :as state]
            [promesa.core :as p]
            ["/frontend/utils" :as utils]
            [goog.dom :as gdom]
            [goog.object :as gobj]
            [clojure.string :as string]
            [frontend.util :as util]))

;; Undo && Redo that works with files

;; TODO:
;; 1. preserve cursor positions when undo/redo
;; 2. undo-tree
;; 3. db-only version, store transactions instead of file patches

;; repo file -> contents transactions sequence
(defonce history (atom {}))
;; repo -> idx
(defonce history-idx (atom {}))

(defonce history-limit 500)

;; tx [[file1-path patches] [file2-path patches]]
(defn add-history!
  [repo tx]
  (let [tx (->> tx
                (remove (fn [[_ old new]] (= old new)))
                (map (fn [[file old new]]
                       (when (and old new)
                         (let [diffs (diff/diffs new old)
                              patches (diff/get-patches new old diffs)]
                           [file patches]))))
                (remove nil?))]
    (when (seq tx)
      ;; FIXME: it's the new edit block instead of the previous one
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
          (swap! history assoc repo (conj txs tx))
          (swap! history-idx assoc repo idx'))))))

(defonce *undoing? (atom false))

(defn undo!
  [repo alter-file restore-cursor]
  (let [idx (get @history-idx repo 0)]
    (when (and (> idx 0) (false? @*undoing?))
      (let [idx' (dec idx)
            tx (get-in @history [repo idx'])
            {:keys [data]} tx
            _ (reset! *undoing? true)
            ;; _ (state/clear-edit!)
            promises (for [[path patches] data]
                       (let [current-content (db/get-file-no-sub path)
                             original-content (diff/apply-patches! current-content patches)]
                         (alter-file repo path original-content
                                     {:add-history? false
                                      :re-render-root? true})))]
        (-> (p/all promises)
            (p/then (fn []
                      (db/clear-query-state!)
                      (swap! history-idx assoc repo idx')
                      (reset! *undoing? false)
                      ;; restore cursor
                      (when (> idx' 0)
                        (let [prev-tx (get-in @history [repo (dec idx')])]
                          (when restore-cursor (restore-cursor prev-tx)))))))))))

(defonce *redoing? (atom false))
(defn redo!
  [repo alter-file restore-cursor]
  (let [idx (get @history-idx repo 0)
        txs (get @history repo)]
    (when (and (> (count txs) idx) (false? @*redoing?))
      (let [tx (get-in @history [repo idx])
            _ (reset! *redoing? true)
            ;; _ (state/clear-edit!)
            promises (for [[path patches] (:data tx)]
                       (let [current-content (db/get-file-no-sub path)
                             reversed-patches (utils/reversePatch patches)
                             content (diff/apply-patches! current-content reversed-patches)]
                         (alter-file repo path content
                                     {:add-history? false
                                      :re-render-root? true})))]
        (-> (p/all promises)
            (p/then (fn []
                      (db/clear-query-state!)
                      (swap! history-idx assoc repo (inc idx))
                      (reset! *redoing? false)
                      ;; restore cursor
                      (when restore-cursor (restore-cursor tx)))))))))
