(ns logseq.tasks.file-sync-actions
  (:require [clojure.test.check.generators :as gen]))


(defmulti gen-action* (fn [& args] (first args)))

(defmethod gen-action* :create-file
  [_ page-index & _args]
  (gen/let [blocks (gen/vector gen/string-alphanumeric 1 10)]
    {:action :create-file
     :args {:file (format "pages/test.page-%d.md" page-index)
            :blocks blocks}}))

(defmethod gen-action* :move-file
  [_ origin-page-index & [moved?]]
  (let [page-name (if moved?
                      (format "pages/test.page-move-%d.md" origin-page-index)
                      (format "pages/test.page-%d.md" origin-page-index))]
    (gen/return
     {:action :move-file
      :args {:file page-name
             :new-file (format "pages/test.page-move-%d.md" origin-page-index)}})))

(defmethod gen-action* :update-file
  [_ page-index & [moved?]]
  (gen/let [append-blocks (gen/vector gen/string-alphanumeric 1 10)]
    (let [page-name (if moved?
                      (format "pages/test.page-move-%d.md" page-index)
                      (format "pages/test.page-%d.md" page-index))]
      {:action :update-file
       :args {:file page-name
              :blocks append-blocks}})))

(defmethod gen-action* :delete-file
  [_ page-index & [moved?]]
  (let [page-name (if moved?
                    (format "pages/test.page-move-%d.md" page-index)
                    (format "pages/test.page-%d.md" page-index))]
    (gen/return
     {:action :delete-file
      :args {:file page-name}})))


(defmacro gen-actions-plan
  "state monad
  state: {:page-index [{:index 1 :moved? false}, ...]
          :generated-action [...]}

  (gen-actions-plan
     [id+moved? get-rand-available-index-op
      _ (when-op id+moved? (apply action-op action id+moved?))]
     nil)"
  [binds val-expr]
  (let [binds (partition 2 binds)
        psym (gensym "state_")
        forms (reduce (fn [acc [id expr]]
                        (concat acc `[[~id ~psym] (~expr ~psym)]))
                      []
                      binds)]
    `(fn [~psym]
       (let [~@forms]
         [~val-expr ~psym]))))

(defn- all-indexes
  [state]
  (let [r (map :index (:page-index state))]
    (if (empty? r) '(0) r)))

(defn- add-index
  [state index moved?]
  (update state :page-index conj {:index index :moved? moved?}))

(defn- assign-page-index-op
  [state]
  (let [max-index (apply max (all-indexes state))
          next-index (inc max-index)]
      [next-index (add-index state next-index false)]))

(defn- get-rand-available-index-op
  [state]
  (let [indexes (:page-index state)]
    (if (empty? indexes)
      [nil state]
      (let [rand-index (rand-nth (vec indexes))]
        [((juxt :index :moved?) rand-index) state]))))

(defn- action-op
  [action id & args]
  (fn [state]
    (let [generated-action (gen/generate (apply gen-action* action id args))
          [moved?] args
          state* (update state :generated-action conj generated-action)
          state* (case action
                   :move-file
                   (update state* :page-index
                           #(-> %
                                (disj {:index id :moved? (boolean moved?)})
                                (conj {:index id :moved? true})))
                   :delete-file
                   (update state* :page-index
                           #(disj % {:index id :moved? (boolean moved?)}))
                   state*)]
      [nil state*])))

(defmacro when-op
  [x f]
  `(fn [state#]
     (if ~x
       (~f state#)
       [nil state#])))

(defn- print-op
  [x]
  (fn [state]
    (println x)
    [nil state]))


(defn rand-action-op
  []
  (let [action (gen/generate
                (gen/frequency [[5 (gen/return :update-file)]
                                [2 (gen/return :create-file)]
                                [2 (gen/return :move-file)]
                                [1 (gen/return :delete-file)]]))]
    (case action
      :create-file
      (gen-actions-plan
       [id assign-page-index-op
        _ (action-op action id)]
       nil)
      :update-file
      (gen-actions-plan
       [id+moved? get-rand-available-index-op
        _ (when-op id+moved? (apply action-op action id+moved?))]
       nil)
      :move-file
      (gen-actions-plan
       [id+moved? get-rand-available-index-op
        _ (when-op id+moved? (apply action-op action id+moved?))]
       nil)
      :delete-file
      (gen-actions-plan
       [id+moved? get-rand-available-index-op
        _ (when-op id+moved? (apply action-op action id+moved? ))]
       nil))))

(def empty-actions-plan {:page-index #{}
                         :generated-action []})


(defmacro generate-rand-actions
  [max-n & {:keys [pre-create-files-n] :or {pre-create-files-n 2}}]
  (let [pre-create-files-binds
        (for [id (map (fn [_] (gensym)) (range pre-create-files-n))]
          `[~id assign-page-index-op
            ~'_ (action-op :create-file ~id)])
        binds (apply concat
                     (concat pre-create-files-binds (repeat max-n `[~'_ (rand-action-op)])))]
    `(second
      ((gen-actions-plan
        ~binds
        nil)
       empty-actions-plan))))
