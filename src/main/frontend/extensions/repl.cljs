(ns frontend.extensions.repl
  "Persistent notebook-style REPL engine.
  Maintains a SCI context across evaluations so that defs accumulate,
  and exposes the current graph's DataScript database for interactive querying."
  (:require [sci.core :as sci]
            [datascript.core :as d]
            [frontend.db.conn :as db-conn]
            [frontend.util :as util]))

;; Persistent state — survives hot-reload and navigation
;; =====================================================

(defonce *repl-sci-ctx (atom nil))
(defonce *repl-cells (atom []))

;; SCI context
;; ===========

(defn- current-db
  "Returns the current graph's DataScript db value."
  []
  (db-conn/get-db))

(defn- make-sci-ctx
  "Builds a SCI context with DataScript and utility bindings."
  []
  (sci/init
   {:bindings {'q       (fn [& args] (apply d/q (first args) (current-db) (rest args)))
               'pull    (fn [& args] (apply d/pull (current-db) args))
               'entity  (fn [eid] (d/entity (current-db) eid))
               'db      current-db
               'sum     (partial apply +)
               'average (fn [coll] (/ (reduce + coll) (count coll)))
               'pprint  util/pp-str
               'log     js/console.log}
    :namespaces {'d {'q        d/q
                     'pull     d/pull
                     'pull-many d/pull-many
                     'entity   d/entity
                     'datoms   d/datoms}}}))

(defn get-ctx!
  "Returns the persistent SCI context, creating it lazily."
  []
  (or @*repl-sci-ctx
      (let [ctx (make-sci-ctx)]
        (reset! *repl-sci-ctx ctx)
        ctx)))

;; Completions
;; ===========

(defn completions
  "Returns a sorted vector of all available symbol names (strings) in the
  SCI context, including user defs and namespace-qualified symbols.
  Safe to call before any evaluation — returns initial bindings."
  []
  (when-let [ctx @*repl-sci-ctx]
    (try
      (let [nss (sci/eval-string* ctx "(mapv ns-name (all-ns))")
            syms (sci/eval-string* ctx
                   "(vec (mapcat (fn [ns]
                                  (let [ns-str (str (ns-name ns))
                                        qualify? (not= ns-str \"user\")]
                                    (map (fn [sym]
                                           (if qualify?
                                             (str ns-str \"/\" sym)
                                             (str sym)))
                                         (keys (ns-publics ns)))))
                                (all-ns)))")]
        (vec (sort (distinct syms))))
      (catch :default _
        []))))

;; Evaluation
;; ==========

(defn eval-cell!
  "Evaluates `code` in the persistent SCI context.
  Returns {:result ... :error? bool}."
  [code]
  (try
    {:result (sci/eval-string* (get-ctx!) code)
     :error? false}
    (catch :default e
      {:result (ex-message e)
       :error? true})))

;; Cell CRUD
;; =========

(defn- make-cell
  ([] (make-cell ""))
  ([code]
   {:id (str (random-uuid))
    :code code
    :result nil
    :error? false
    :running? false}))

(defn add-cell!
  "Appends a new empty cell."
  []
  (let [cell (make-cell)]
    (swap! *repl-cells conj cell)
    (:id cell)))

(defn remove-cell!
  "Removes the cell with the given id."
  [id]
  (swap! *repl-cells (fn [cells] (vec (remove #(= (:id %) id) cells)))))

(defn update-cell-code!
  "Updates the code of the cell with the given id."
  [id code]
  (swap! *repl-cells
         (fn [cells]
           (mapv #(if (= (:id %) id) (assoc % :code code) %) cells))))

(defn run-cell!
  "Evaluates the cell with the given id and stores the result."
  [id]
  (swap! *repl-cells
         (fn [cells]
           (mapv (fn [cell]
                   (if (= (:id cell) id)
                     (let [{:keys [result error?]} (eval-cell! (:code cell))]
                       (assoc cell :result result :error? error? :running? false))
                     cell))
                 cells))))

(defn run-all-cells!
  "Evaluates all cells in order."
  []
  (doseq [{:keys [id]} @*repl-cells]
    (run-cell! id)))

(defn clear-all!
  "Resets the SCI context and removes all cells."
  []
  (reset! *repl-sci-ctx nil)
  (reset! *repl-cells []))
