(ns frontend.history
  (:require [frontend.diff :as diff]
            [frontend.db :as db]
            [promesa.core :as p]
            ["/frontend/utils" :as utils]))

;; Undo && Redo that works with files

;; TODO:
;; 1. undo-tree
;; 2. db-only version, store transactions instead of file patches

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
                       (let [diffs (diff/diffs new old)
                             patches (diff/get-patches new old diffs)]
                         [file patches]))))]
    (when (seq tx)
      (let [length (count (get @history repo))
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
  [repo alter-file]
  (let [idx (get @history-idx repo 0)]
    (when (and (> idx 0) (false? @*undoing?))
      (let [idx' (dec idx)
            tx (get-in @history [repo idx'])
            _ (reset! *undoing? true)
            promises (for [[path patches] tx]
                       (let [current-content (db/get-file-no-sub path)
                             original-content (diff/apply-patches! current-content patches)]
                         (alter-file repo path original-content
                                     {:add-history? false
                                      :re-render-root? true})))]
        (-> (p/all promises)
            (p/then (fn []
                      (swap! history-idx assoc repo idx')
                      (reset! *undoing? false))))))))

(defonce *redoing? (atom false))
(defn redo!
  [repo alter-file]
  (let [idx (get @history-idx repo 0)
        txs (get @history repo)]
    (when (and (> (count txs) idx) (false? @*redoing?))
      (let [tx (get-in @history [repo idx])
            _ (reset! *redoing? true)
            promises (for [[path patches] tx]
                       (let [current-content (db/get-file-no-sub path)
                             reversed-patches (utils/reversePatch patches)
                             content (diff/apply-patches! current-content reversed-patches)]
                         (alter-file repo path content
                                     {:add-history? false
                                      :re-render-root? true})))]
        (-> (p/all promises)
            (p/then (fn []
                      (swap! history-idx assoc repo (inc idx))
                      (reset! *redoing? false))))))))
