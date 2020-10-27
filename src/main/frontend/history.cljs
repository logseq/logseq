(ns frontend.history
  (:require [frontend.db :as db]))

;; Undo && Redo that works with files
;; TODO:
;; 1. undo-tree
;; 2. db-only version, store transactions instead of file patches

;; repo file -> contents transactions sequence
(defonce history (atom {}))
;; repo -> idx
(defonce history-idx (atom {}))

(defonce history-limit 100)

;; TODO: replace with patches to reduce memory usage
;; tx [[file1-path original new] [file2-path original new]]
(defn add-history!
  [repo tx]
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
      (swap! history-idx assoc repo idx'))))

(defn undo!
  [repo alter-file]
  (let [idx (get @history-idx repo 0)]
    (when (> idx 0)
      (let [idx' (dec idx)
            tx (get-in @history [repo idx'])]
        (doseq [[path original-content _content] tx]
          (alter-file repo path original-content
                      {:add-history? false
                       :re-render-root? true}))
        (swap! history-idx assoc repo idx')))))

(defn redo!
  [repo alter-file]
  (let [idx (get @history-idx repo 0)
        txs (get @history repo)]
    (when (> (count txs) idx)
      (let [tx (get-in @history [repo idx])]
        (doseq [[path _original-content content] tx]
          (alter-file repo path content
                      {:add-history? false
                       :re-render-root? true}))
        (swap! history-idx assoc repo (inc idx))))))
