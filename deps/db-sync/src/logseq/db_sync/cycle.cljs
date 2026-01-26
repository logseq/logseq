(ns logseq.db-sync.cycle
  "Generic cycle repair utilities for DataScript graphs.

  Supports:
  - :block/parent (cardinality-one)
  - :logseq.property.class/extends (cardinality-many)

  Runs AFTER rebase:
  - Detect cycles reachable from touched entities and break enough edges until
    the graph becomes acyclic (within a bounded number of iterations).

  Notes:
  - Repairs are plain datoms: [:db/retract e attr v] (and optional add).
  - For cardinality-many attrs, we retract ONE edge on the detected cycle path
    per iteration; we iterate to handle multiple/overlapping cycles."
  (:refer-clojure :exclude [cycle])
  (:require
   [datascript.core :as d]
   [logseq.db :as ldb]))

;; -----------------------------------------------------------------------------
;; Config
;; -----------------------------------------------------------------------------

(defn- entid
  "Resolve to an entity id.
   Accepts eid, entity map, or keyword ident."
  [db x]
  (cond
    (nil? x) nil
    (number? x) x
    (map? x) (:db/id x)
    (keyword? x) (d/entid db x)
    :else x))

(defn- safe-target-for-block-parent
  "Default safe target for :block/parent.
   If your outliner requires a page-root BLOCK instead of the page entity,
   replace this to return that block eid."
  [db e _attr _bad-v]
  (some-> (d/entity db e) :block/page :db/id))

(defn- safe-target-for-class-extends
  "Default safe target for :logseq.property.class/extends.
   Must resolve to an existing entity. If you prefer 'retract only', return nil."
  [db _e _attr _bad-v]
  (d/entid db :logseq.class/Root))

(defn- ancestor?
  "Return true if `ancestor-eid` appears in the parent chain of `start-eid`."
  [db ancestor-eid start-eid]
  (loop [current start-eid
         seen #{}]
    (cond
      (nil? current) false
      (= current ancestor-eid) true
      (contains? seen current) false
      :else
      (let [parent (some-> (d/entity db current) :block/parent :db/id)]
        (recur parent (conj seen current))))))

(def ^:private default-attr-opts
  {;; Cardinality-one
   :block/parent
   {:cardinality :one
    :safe-target-fn safe-target-for-block-parent}

   ;; Cardinality-many
   :logseq.property.class/extends
   {:cardinality :many
    :safe-target-fn safe-target-for-class-extends}})

(def ^:private repair-attrs
  (set (keys default-attr-opts)))

;; -----------------------------------------------------------------------------
;; Basics
;; -----------------------------------------------------------------------------

(defn- ref-eids
  "Read a ref attribute as a set of eids.

  Supports:
  - cardinality-one: returns #{v} or #{}
  - cardinality-many: returns #{v1 v2 ...} or #{}"
  [db e attr {:keys [cardinality] :or {cardinality :one}}]
  (let [v (some-> (d/entity db e) (get attr))]
    (case cardinality
      :many (cond
              (nil? v) #{}
              (set? v) (into #{} (keep #(entid db %)) v)
              (sequential? v) (into #{} (keep #(entid db %)) v)
              :else (let [id (entid db v)] (if id #{id} #{})))
      ;; :one
      (let [id (entid db v)] (if id #{id} #{})))))

(defn- touched-eids
  "Collect entity ids whose `attr` was added/changed (added=true) in tx-data."
  [tx-data attr]
  (->> tx-data
       (keep (fn [[e a _v _t added]]
               (when (and added (= a attr)) e)))
       distinct))

(defn- touched-eids-many
  "Collect touched entity ids for repair attrs.
   Returns {attr #{eid ...}}"
  [tx-data]
  (reduce (fn [m attr]
            (let [xs (touched-eids tx-data attr)]
              (if (seq xs) (assoc m attr (set xs)) m)))
          {}
          repair-attrs))

;; -----------------------------------------------------------------------------
;; Cycle detection (DFS; cardinality-one and cardinality-many)
;; -----------------------------------------------------------------------------

(defn- reachable-cycle
  "Detect a ref-cycle reachable from `start-eid` following edges of `attr`.

  Returns a vector like [a b c a] or nil.
  For cardinality-many attrs, we DFS across ALL outgoing edges.

  attr-opts:
  - :cardinality :one|:many
  - :skip? (fn [db from attr to] -> boolean) ; ignore a specific edge"
  [db start-eid attr {:keys [skip?] :as attr-opts}]
  (let [visited  (volatile! #{})
        stack    (volatile! [])
        in-stack (volatile! #{})
        cycle    (volatile! nil)]
    (letfn [(neighbors [e]
              (->> (ref-eids db e attr attr-opts)
                   (remove nil?)
                   (remove (fn [to] (and skip? (skip? db e attr to))))
                   vec))
            (record-cycle! [e]
              (let [stk @stack
                    idx (.indexOf stk e)]
                (when (>= idx 0)
                  (vreset! cycle (conj (subvec stk idx) e)))))
            (dfs! [e]
              (when-not @cycle
                (cond
                  (contains? @in-stack e) (record-cycle! e)
                  (contains? @visited e)  nil
                  :else
                  (do
                    (vswap! visited conj e)
                    (vswap! in-stack conj e)
                    (vswap! stack conj e)
                    (doseq [n (neighbors e)]
                      (when-not @cycle
                        (dfs! n)))
                    (vswap! stack pop)
                    (vswap! in-stack disj e)))))]
      (dfs! start-eid)
      @cycle)))

;; -----------------------------------------------------------------------------
;; Breaking cycles
;; -----------------------------------------------------------------------------

(defn- cycle-edges
  "Convert cycle path [a b c a] into directed edges [[a b] [b c] [c a]]."
  [cycle]
  (when (and (vector? cycle) (>= (count cycle) 2))
    (mapv (fn [i] [(nth cycle i) (nth cycle (inc i))])
          (range (dec (count cycle))))))

(defn- pick-victim
  "Pick which node in the cycle to detach.

  Preference:
  1) touched by local rebase (prefer remote value)
  2) touched by remote (detach the remote-changed edge)
  3) untouched by remote/local
  4) first node"
  [cycle {:keys [local-touched remote-touched]}]
  (let [nodes (vec (distinct (butlast cycle)))
        local?  (fn [e] (contains? (or local-touched #{}) e))
        remote? (fn [e] (contains? (or remote-touched #{}) e))
        untouched? (fn [e] (and (not (local? e)) (not (remote? e))))]
    (or (some (fn [e] (when (local? e) e)) nodes)
        (some (fn [e] (when (remote? e) e)) nodes)
        (some (fn [e] (when (untouched? e) e)) nodes)
        (first nodes))))

(defn- break-cycle-edge!
  "Given a detected cycle, retract ONE edge on the cycle path.

  Returns a tx vector (possibly with an add), or nil."
  [db cycle attr {:keys [safe-target-fn skip?] :as attr-opts} touched]
  (let [edges (cycle-edges cycle)
        cycle-nodes (set (distinct (butlast cycle)))
        remote-parent-fn (:remote-parent-fn attr-opts)
        remote-candidates (when (and (= :block/parent attr) remote-parent-fn)
                            (keep (fn [[from to]]
                                    (let [remote-parent (remote-parent-fn db from to)
                                          remote-parent (entid db remote-parent)
                                          to-id (entid db to)]
                                      (when (and remote-parent
                                                 (not= remote-parent to-id))
                                        {:victim from
                                         :bad-v to-id
                                         :safe remote-parent
                                         :outside? (not (contains? cycle-nodes remote-parent))})))
                                  edges))
        remote-choice (or (some #(when (:outside? %) %) remote-candidates)
                          (first remote-candidates))
        victim (or (:victim remote-choice) (pick-victim cycle touched))
        [_from bad-v] (or (when (and remote-choice (:bad-v remote-choice))
                            [victim (:bad-v remote-choice)])
                          (some (fn [[from _to :as e]]
                                  (when (= from victim) e))
                                edges))
        bad-v (entid db bad-v)]
    (when (and victim bad-v)
      (when-not (and skip? (skip? db victim attr bad-v))
        ;; Ensure the edge still exists in current db.
        (when (contains? (ref-eids db victim attr attr-opts) bad-v)
          (let [safe (or (:safe remote-choice)
                         (when safe-target-fn (safe-target-fn db victim attr bad-v)))
                safe (if (and (= :block/parent attr)
                              (number? safe)
                              (nil? remote-choice)
                              (ancestor? db victim safe))
                       (safe-target-for-block-parent db victim attr bad-v)
                       safe)]
            (prn :debug
                 :victim victim
                 :page-id (:db/id (:block/page (d/entity db victim)))
                 :attr attr
                 :safe safe
                 :bad-v bad-v
                 :fix-tx (cond
                           (and safe (not= safe bad-v))
                           [[:db/retract victim attr bad-v]
                            [:db/add     victim attr safe]]

                           :else
                           [[:db/retract victim attr bad-v]]))
            (cond
              (and safe (not= safe bad-v))
              [[:db/retract victim attr bad-v]
               [:db/add     victim attr safe]]

              :else
              [[:db/retract victim attr bad-v]])))))))

;; -----------------------------------------------------------------------------
;; Iterative repair (THIS is the key fix)
;; -----------------------------------------------------------------------------

(def ^:private fix-cycle-tx-meta
  {:outliner-op :fix-cycle
   :gen-undo-ops? false
   :persist-op? false})

(defn- apply-cycle-repairs!
  "Detect & break cycles AFTER rebase, iterating until stable.

  Why iteration:
  - With cardinality-many (extends), you can end up with multiple disjoint or
    overlapping cycles after merging remote + local edges.
  - Breaking one cycle edge may still leave other cycles (e.g. 1<->2 and 2<->3).

  Inputs:
  - candidates-by-attr: {attr #{eid ...}}
  - touched-by-attr: {attr {:local-touched #{...} :remote-touched #{...}}}
  - attr-opts: {attr {:cardinality :one|:many :safe-target-fn ... :skip? ...}}

  We cap iterations to avoid infinite loops if something keeps reintroducing cycles."
  [transact! temp-conn candidates-by-attr touched-by-attr attr-opts tx-meta]
  (let [max-iterations 16]
    (loop [it 0
           ;; Track edges we already retracted to avoid repeating identical work.
           ;; Edge key is [e attr v].
           seen-edges #{}]
      (when (< it max-iterations)
        (let [db @temp-conn
              ;; Collect a set of edge-breaking txs for this iteration.
              ;; We dedupe by edge key, not by tx vector.
              {tx :tx
               seen-edges' :seen}
              (reduce
               (fn [acc [attr es]]
                 (let [opts    (merge {:cardinality :one} (get attr-opts attr {}))
                       touched (get touched-by-attr attr {})]
                   (reduce
                    (fn [{:keys [tx seen] :as acc2} e]
                      (if-let [cycle (reachable-cycle db e attr opts)]
                        (do
                          (prn :debug :cycle-detected cycle)
                          (if-let [t (break-cycle-edge! db cycle attr opts touched)]
                            (let [[_op e2 a2 v2] (first t)
                                  edge [e2 a2 v2]]
                              ;; Skip if we've already retracted this exact edge.
                              (if (contains? seen edge)
                                acc2
                                {:tx (into tx t)
                                 :seen (conj seen edge)}))
                            acc2))
                        acc2))
                    acc
                    es)))
               {:tx [] :seen seen-edges}
               candidates-by-attr)]

          (if (seq tx)
            (do
              (transact! temp-conn tx (merge tx-meta fix-cycle-tx-meta))
              (recur (inc it) seen-edges'))
            ;; No more cycles detected from these candidates => done
            nil))))))

(defn- union-candidates
  "Union remote + local candidates: {attr #{...}}"
  [remote-by-attr local-by-attr]
  (reduce
   (fn [m attr]
     (let [r (get remote-by-attr attr #{})
           l (get local-by-attr attr #{})
           u (into (set r) l)]
       (if (seq u) (assoc m attr u) m)))
   {}
   (distinct (concat (keys remote-by-attr) (keys local-by-attr)))))

(defn- touched-info-by-attr
  "Build {attr {:remote-touched #{...} :local-touched #{...}}}."
  [remote-by-attr local-by-attr]
  (reduce
   (fn [m attr]
     (let [r (get remote-by-attr attr #{})
           l (get local-by-attr attr #{})]
       (assoc m attr {:remote-touched r :local-touched l})))
   {}
   (distinct (concat (keys remote-by-attr) (keys local-by-attr)))))

(defn fix-cycle!
  "Entry point: call AFTER rebase.

  - Computes candidates from remote + rebase tx reports for configured attrs.
  - Iteratively breaks cycles until stable."
  [temp-conn remote-tx-report rebase-tx-report & {:keys [transact! tx-meta]
                                                  :or {transact! ldb/transact!}}]
  (let [remote-db (:db-after remote-tx-report)
        attr-opts (cond-> default-attr-opts
                    remote-db
                    (assoc-in [:block/parent :remote-parent-fn]
                              (fn [_db e _bad-v]
                                (some-> (d/entity remote-db e) :block/parent :db/id)))
                    remote-db
                    (assoc-in [:block/parent :safe-target-fn]
                              (fn [db e attr bad-v]
                                (let [remote-parent (some-> (d/entity remote-db e) :block/parent :db/id)
                                      remote-parent (when (and remote-parent (not= remote-parent bad-v)) remote-parent)]
                                  (or remote-parent (safe-target-for-block-parent db e attr bad-v))))))
        remote-touched-by-attr (touched-eids-many (:tx-data remote-tx-report))
        local-touched-by-attr  (touched-eids-many (:tx-data rebase-tx-report))
        candidates-by-attr     (union-candidates remote-touched-by-attr local-touched-by-attr)
        touched-info           (touched-info-by-attr remote-touched-by-attr local-touched-by-attr)]
    (when (seq candidates-by-attr)
      (apply-cycle-repairs! transact! temp-conn candidates-by-attr touched-info attr-opts tx-meta))))
