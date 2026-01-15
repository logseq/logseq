(ns logseq.db-sync.cycle
  "Generic cycle / bad-ref repair utilities for DataScript graphs.

  Goal:
  - Support multiple ref attributes that can form chains/cycles, e.g.
    :block/parent, :logseq.property.class/extends, etc.
    * Cycle repair (after rebase): detect & break cycles, preferably breaking edges
      introduced by local rebase (if available).

  Notes:
  - We assume attributes are single-valued refs (cardinality-one).
  - We intentionally keep repairs as simple datoms (db/retract + db/add) to avoid
    triggering complex outliner logic."

  (:refer-clojure :exclude [cycle])
  (:require
   [datascript.core :as d]
   [logseq.db :as ldb]))

;; FIXME: `extends` cardinality-many

;; -----------------------------------------------------------------------------
;; Configure which ref attributes should be repaired, and how to find a safe target
;; -----------------------------------------------------------------------------

(def ^:private repair-attrs
  "Ref attributes that can form chains/cycles and should be repaired client-side."
  #{:block/parent
    :logseq.property.class/extends})

(defn- safe-target-for-block-parent
  "Default safe target for :block/parent.
   We attach to the page entity by default. If your tree requires a page-root BLOCK
   instead of the page entity, replace this to return that block eid."
  [db e _attr _bad-v]
  (some-> (d/entity db e) :block/page :db/id))

(defn- safe-target-for-class-extends
  "Default safe target for :logseq.property.class/extends."
  [_db _e _attr _bad-v]
  :logseq.class/Root)

(def ^:private default-attr-opts
  {;; Keep blocks inside a sane container
   :block/parent
   {:safe-target-fn safe-target-for-block-parent}

   ;; For class inheritance cycles, safest default is to retract the edge.
   :logseq.property.class/extends
   {:safe-target-fn safe-target-for-class-extends}})

;; -----------------------------------------------------------------------------
;; Basics
;; -----------------------------------------------------------------------------

(defn ref-eid
  "Read a cardinality-one ref attribute as eid."
  [db e attr]
  (some-> (d/entity db e) (get attr) :db/id))

(defn touched-eids
  "Collect entity ids whose `attr` was added/changed (added=true) in tx-data."
  [tx-data attr]
  (->> tx-data
       (keep (fn [[e a _v _t added]]
               (when (and added (= a attr)) e)))
       distinct))

(defn touched-eids-many
  "Collect touched entity ids for repair attrs.
   Returns {attr #{eid ...}}"
  [tx-data]
  (reduce (fn [m attr]
            (let [xs (touched-eids tx-data attr)]
              (if (seq xs) (assoc m attr (set xs)) m)))
          {}
          repair-attrs))

;; -----------------------------------------------------------------------------
;; Cycle detection
;; -----------------------------------------------------------------------------

(defn reachable-cycle
  "Detect a ref-cycle reachable by repeatedly following (e --attr--> v).

  Returns a vector like [a b c a] or nil.
  Only follows `attr` edges.

  `skip?` can be used to ignore certain edges in traversal."
  [db start-eid attr {:keys [skip?] :as _attr-opts}]
  (let [visited  (volatile! #{})
        stack    (volatile! [])
        in-stack (volatile! #{})
        cycle    (volatile! nil)]
    (letfn [(next-eid [e]
              (let [v (ref-eid db e attr)]
                (when (and v (not (and skip? (skip? db e attr v))))
                  v)))
            (dfs! [e]
              (when-not @cycle
                (cond
                  (contains? @in-stack e)
                  (let [stk @stack
                        idx (.indexOf stk e)]
                    (when (>= idx 0)
                      (vreset! cycle (conj (subvec stk idx) e))))

                  (contains? @visited e)
                  nil

                  :else
                  (do
                    (vswap! visited conj e)
                    (vswap! in-stack conj e)
                    (vswap! stack conj e)
                    (when-let [n (next-eid e)]
                      (dfs! n))
                    (vswap! stack pop)
                    (vswap! in-stack disj e)))))]
      (dfs! start-eid)
      @cycle)))

(defn- pick-victim
  "Pick which node in the cycle to detach.

  Inputs:
  - cycle: [a b c a]
  - local-touched?: (fn [eid] -> boolean) ; edge likely introduced by local rebase
  - remote-touched?: (fn [eid] -> boolean) ; edge likely introduced by remote tx

  Strategy:
  1) Prefer nodes touched by local rebase
  2) else nodes touched by remote
  3) else first node"
  [cycle local-touched? remote-touched?]
  (let [nodes (vec (distinct (butlast cycle)))]
    (or (some (fn [e] (when (local-touched? e) e)) nodes)
        (some (fn [e] (when (remote-touched? e) e)) nodes)
        (first nodes))))

(defn break-cycle-tx
  "Generate tx to break one cycle for one attr.

  We detach victim by retracting its current (e attr v) and optionally add a safe
  target from `safe-target-fn`. If safe-target-fn returns nil, we just retract.

  touched-info:
  - {:local-touched #{...} :remote-touched #{...}} ; per attr
  "
  [db cycle attr {:keys [safe-target-fn skip?] :as _attr-opts} {:keys [local-touched remote-touched]}]
  (when (seq cycle)
    (let [local-touched?  (fn [e] (contains? (or local-touched #{}) e))
          remote-touched? (fn [e] (contains? (or remote-touched #{}) e))
          victim          (pick-victim cycle local-touched? remote-touched?)]
      (when victim
        (let [bad-v (ref-eid db victim attr)]
          (when (and bad-v (not (and skip? (skip? db victim attr bad-v))))
            (let [safe (when safe-target-fn (safe-target-fn db victim attr bad-v))]
              (cond
                (and safe (not= safe bad-v))
                [[:db/retract victim attr bad-v]
                 [:db/add     victim attr safe]]

                :else
                [[:db/retract victim attr bad-v]]))))))))

(defn apply-cycle-repairs!
  "Detect & break cycles AFTER rebase.

  Inputs:
  - candidates-by-attr: {attr #{eid ...}}  (usually union of remote+local touched)
  - touched-by-attr: {attr {:local-touched #{...} :remote-touched #{...}}}
  - attr-opts: {attr {:safe-target-fn ... :skip? ...}}

  We de-dup repairs by `distinct` tx vectors to reduce repeated work."
  [transact! temp-conn candidates-by-attr touched-by-attr attr-opts]
  (let [db @temp-conn
        tx (->> candidates-by-attr
                (mapcat (fn [[attr es]]
                          (let [opts (get attr-opts attr {})
                                touched (get touched-by-attr attr {})]
                            (keep (fn [e]
                                    (when-let [cycle (reachable-cycle db e attr opts)]
                                      (prn :debug :detected-cycle cycle)
                                      (break-cycle-tx db cycle attr opts touched)))
                                  es))))
                distinct
                (apply concat))]
    (when (seq tx)
      (prn :debug :tx tx)
      (transact! temp-conn tx {:outliner-op :fix-cycle :gen-undo-ops? false}))))

(defn union-candidates
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

(defn touched-info-by-attr
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
  [temp-conn remote-tx-report rebase-tx-report]
  (let [remote-touched-by-attr (touched-eids-many (:tx-data remote-tx-report))
        local-touched-by-attr (touched-eids-many (:tx-data rebase-tx-report))
        ;; Union candidates (remote + local) for cycle detection
        candidates-by-attr (union-candidates remote-touched-by-attr local-touched-by-attr)

        ;; Per-attr touched info to prefer breaking local edges first
        touched-info (touched-info-by-attr remote-touched-by-attr local-touched-by-attr)]
    (when (seq candidates-by-attr)
      (apply-cycle-repairs! ldb/transact! temp-conn candidates-by-attr touched-info default-attr-opts))))
