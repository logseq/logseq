(ns frontend.history
  (:require [frontend.state :as state]
            [datascript.core :as d]
            [frontend.db :as db]))

;; Inspired by https://github.com/tonsky/datascript-todo

(def state-keys
  #{:route-match
    :search/q
    :search/result
    :ui/toggle-state
    :ui/collapsed-headings
    :ui/sidebar-collapsed-blocks
    :editor/show-page-search?
    :editor/show-date-picker?
    :editor/show-input
    :editor/last-saved-cursor
    :editor/editing?
    :editor/content
    :editor/heading
    :cursor-range
    :cursor-pos
    :selection/mode
    :selection/headings
    :custom-context-menu/show?
    :sidebar/blocks})

;; Undo && Redo
;; We need to track several states:
;; 1. frontend.state/state.
;; 2. Datascript dbs (include the files db).
;; 3. Git files

;; db -> history sequence
(defonce history
  (atom {}))

(def ^:const history-limit 100)

(defonce current-id (atom nil))

(defn find-prev [xs pred]
  (last (take-while #(not (pred %)) xs)))

(defn find-next [xs pred]
  (fnext (drop-while #(not (pred %)) xs)))

(defn drop-tail [xs pred]
  (loop [acc []
         xs  xs]
    (let [x (first xs)]
      (cond
        (nil? x) acc
        (pred x) (conj acc x)
        :else  (recur (conj acc x) (next xs))))))

(defn trim-head [xs n]
  (vec (drop (- (count xs) n) xs)))

(defn add-history!
  [k value]
  (when (and k value)
    (let [id (d/squuid)
          value (assoc value :id id)]
      (prn "History id: " id)
      (swap! history update k
             (fn [col]
               (let [col (if @current-id
                           (do
                             (prn "drop tail id: " @current-id)
                             (drop-tail col #(= @current-id (:id %))))
                           col)])
               (-> col
                   (conj value)
                   (trim-head history-limit))))
      (reset! current-id id))))

(defn traverse!
  [k undo?]
  (when @current-id
    (let [next-fn (if undo? find-prev find-next)]
      (when-let [item (next-fn (get @history k)
                               (fn [{:keys [id] :as item}]
                                 (= id @current-id)))]
        (let [{:keys [id db files-db]} item]
          (when (and (vector? k)
                     (= (first k) :git/repo))
            (println (if undo? "Undo: " "Redo: ") id)
            (let [repo (last k)]
              (db/reset-conn! (db/get-conn repo false) db)
              (db/reset-conn! (db/get-files-conn repo) files-db)
              (reset! current-id id))))))))

(defn undo!
  [k]
  (traverse! k true))

(defn redo!
  [k]
  (traverse! k false))

(comment
  (def k [:git/repo "https://github.com/tiensonqin/notes"])
  (undo! k)
  (redo! k)
  )
