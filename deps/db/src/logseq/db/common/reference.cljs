(ns logseq.db.common.reference
  "References"
  (:require [cljs.reader :as reader]
            [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.log :as log]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.initial-data :as common-initial-data]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]))

;; -----------------------------------------------------------------------------
;; Helpers (fast datoms access)
;; -----------------------------------------------------------------------------

(defn- has-datom? [db e a v]
  (boolean (seq (d/datoms db :eavt e a v))))

(defn- entid
  "Normalize a datom value into an entity id.
   In DataScript, ref values are often raw entids (numbers), not maps."
  [v]
  (cond
    (nil? v) nil
    (number? v) v
    (and (map? v) (contains? v :db/id)) (:db/id v)
    :else v))

(defn- datom-v
  "Return the first value for attr a on entity e, normalized to entid."
  [db e a]
  (some-> (first (d/datoms db :eavt e a))
          :v
          entid))

(defn- datom-vs
  "Return all values for attr a on entity e, normalized to entids, as a set."
  [db e a]
  (into #{}
        (comp (map :v) (map entid))
        (d/datoms db :eavt e a)))

(defn- get-path-refs
  [db entity]
  (let [refs (mapcat :block/refs (ldb/get-block-parents db (:block/uuid entity)))
        block-page (:block/page entity)]
    (->> (cond->> refs (some? block-page) (cons block-page))
         distinct)))

(defn- get-ref-pages-count
  [db id ref-blocks children-ids]
  (when (seq ref-blocks)
    (let [children (->> children-ids
                        (map (fn [id] (d/entity db id))))]
      (->> (concat (mapcat #(get-path-refs db %) ref-blocks)
                   (mapcat :block/refs (concat ref-blocks children)))
           frequencies
           (keep (fn [[ref size]]
                   (when (and (ldb/page? ref)
                              (not= (:db/id ref) id)
                              (not= :block/tags (:db/ident ref))
                              (not (common-initial-data/hidden-ref? db ref id)))
                     [(:block/title ref) size])))
           (sort-by second #(> %1 %2))))))

(defn- child-ids
  "Direct children via AVET on :block/parent."
  [db parent-eid]
  (into #{} (map :e) (d/datoms db :avet :block/parent parent-eid)))

(defn- own-refs
  "Refs contributed by this block itself:
   - direct :block/refs
   - implicit :block/page as a ref"
  [db eid]
  (let [direct (datom-vs db eid :block/refs)
        page   (datom-v  db eid :block/page)]
    (cond-> direct
      page (conj page))))

(defn- effective-refs-fn
  "effective-refs(eid) = own-refs(eid) ∪ effective-refs(parent(eid))"
  [db]
  (let [memo (volatile! {})]
    (letfn [(eff [eid]
              (if (contains? @memo eid)
                (get @memo eid)
                (let [own (own-refs db eid)
                      res (if-let [p (datom-v db eid :block/parent)]
                            (into own (eff p))
                            own)]
                  (vswap! memo assoc eid res)
                  res)))]
      eff)))

(defn- allowed-subtree-refs-fn
  "Like subtree-refs-fn but PRUNES branches that are under an excluded ref.
  This implements:
    - parent should not be excluded just because a child has an excluded ref
    - BUT refs (e.g. [[bar]]) that appear under an excluded block (e.g. [[baz]])
      should NOT satisfy includes for ancestors.

  Concretely: if (effective-refs node) contains any excludes, this node and its
  descendants contribute NOTHING to the include reachability set."
  [db eff excludes]
  (let [memo (volatile! {})]
    (letfn [(blocked? [eid]
              (and (seq excludes)
                   (some #(contains? (eff eid) %) excludes)))
            (sub [eid]
              (if (contains? @memo eid)
                (get @memo eid)
                (let [res (if (blocked? eid)
                            #{}
                            (reduce (fn [acc c] (into acc (sub c)))
                                    (own-refs db eid)
                                    (child-ids db eid)))]
                  (vswap! memo assoc eid res)
                  res)))]
      sub)))

(defn- matches-filters?
  "Include semantics: AND (must all be present) against include-set.
   Exclude semantics: NONE (must not contain any) against exclude-set."
  [include-set exclude-set includes excludes]
  (and
   (or (empty? includes)
       (every? #(contains? include-set %) includes))
   (or (empty? excludes)
       (not (some #(contains? exclude-set %) excludes)))))

(defn- filter-matched-ref-blocks
  [db top-ref-block-ids includes excludes {:keys [eff class-ok? can-satisfy-includes? allowed-subrefs]}]
  (loop [stack   (vec top-ref-block-ids)
         visited #{}
         out     #{}]
    (if (empty? stack)
      out
      (let [eid   (peek stack)
            stack (pop stack)]
        (if (contains? visited eid)
          (recur stack visited out)
          (let [visited (conj visited eid)
                eff-refs (eff eid)]
            (cond
              ;; don't match this node, but still traverse
              (not (class-ok? eid))
              (recur (into stack (child-ids db eid)) visited out)

                ;; prune: AND includes cannot be satisfied anywhere below
              (not (can-satisfy-includes? eff-refs eid))
              (recur stack visited out)

              :else
              (let [include-set (into eff-refs (allowed-subrefs eid))
                    exclude-set eff-refs
                    out' (if (matches-filters? include-set exclude-set includes excludes)
                           (conj out eid)
                           out)]
                (recur (into stack (child-ids db eid)) visited out')))))))))

(defn- matched-ref-block-ids-under-top
  "Return the set of block ids (top or child) that match filters.

  Semantics (matches your example):
  - Includes (AND) may be satisfied by descendants, BUT only from descendants
    that are NOT under an excluded ref.
    Example:
      - [[foo]]
        - [[baz]]
          - [[bar]]
    With include=bar, exclude=baz => foo should NOT match because bar is under baz.

  - Excludes are checked ONLY against effective-refs(node) (self + parents),
    so a parent isn't excluded just because a child mentions an excluded page.

  Pruning:
  - If includes cannot be satisfied anywhere below (effective + allowed-subtree),
    prune subtree."
  [db top-ref-block-ids includes excludes class-ids]
  (let [eff        (effective-refs-fn db)
        ;; allowed subtree refs for includes (prunes excluded branches)
        allowed-subrefs (allowed-subtree-refs-fn db eff (->> excludes (remove nil?) vec))
        includes   (->> includes (remove nil?) vec)
        excludes   (->> excludes (remove nil?) vec)
        class-ids  (when (seq class-ids) (->> class-ids (remove nil?) vec))

        can-satisfy-includes? (fn [eff-refs node]
                                (or (empty? includes)
                                    (let [possible (into eff-refs (allowed-subrefs node))]
                                      (every? #(contains? possible %) includes))))

        class-ok? (fn [eid]
                    (or (empty? class-ids)
                        (not (some #(has-datom? db eid :block/tags %) class-ids))))]

    (filter-matched-ref-blocks db top-ref-block-ids includes excludes
                               {:eff eff
                                :class-ok? class-ok?
                                :can-satisfy-includes? can-satisfy-includes?
                                :allowed-subrefs allowed-subrefs})))

;; -----------------------------------------------------------------------------
;; Expand matched refs up to top refs
;; -----------------------------------------------------------------------------

(defn- expand-to-top-refs
  "Given matched refs, add ancestors until reaching a top ref in `top-ref-ids`.
   Uses cached parent lookups (datoms only)."
  [db top-ref-ids matched-ref-ids]
  (let [parent-cache (volatile! {}) ;; eid -> parent-eid|nil
        result       (volatile! #{})
        top?         (fn [eid] (contains? top-ref-ids eid))
        parent-of    (fn [eid]
                       (if (contains? @parent-cache eid)
                         (get @parent-cache eid)
                         (let [p (some-> (first (d/datoms db :eavt eid :block/parent))
                                         :v
                                         entid)]
                           (vswap! parent-cache assoc eid p)
                           p)))]
    (doseq [start matched-ref-ids]
      (loop [eid start]
        (when eid
          (cond
            (contains? @result eid)
            nil
            (top? eid)
            (vswap! result conj eid)
            :else
            (do
              (vswap! result conj eid)
              (recur (parent-of eid)))))))
    @result))

;; -----------------------------------------------------------------------------
;; Public API
;; -----------------------------------------------------------------------------

(defn get-filters
  [db page]
  (let [db-based? (entity-plus/db-based-graph? db)]
    (if db-based?
      (let [included-pages (:logseq.property.linked-references/includes page)
            excluded-pages (:logseq.property.linked-references/excludes page)]
        (when (or (seq included-pages) (seq excluded-pages))
          {:included included-pages
           :excluded excluded-pages}))
      (let [k :filters
            properties (:block/properties page)
            properties-str (or (get properties k) "{}")]
        (try (let [result (reader/read-string properties-str)]
               (when (seq result)
                 (let [excluded-pages (->> (filter #(false? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))
                       included-pages (->> (filter #(true? (second %)) result)
                                           (keep first)
                                           (keep #(ldb/get-page db %)))]
                   {:included included-pages
                    :excluded excluded-pages})))
             (catch :default e
               (log/error :syntax/filters e)))))))

(defn get-linked-references [db id]
  (let [entity       (d/entity db id)
        ids          (set (cons id (ldb/get-block-alias db id)))
        page-filters (get-filters db entity)
        excludes     (map :db/id (:excluded page-filters))
        includes     (map :db/id (:included page-filters))
        has-filters? (or (seq excludes) (seq includes))

        class-ids    (when (ldb/class? entity)
                       (let [class-children (db-class/get-structured-children db id)]
                         (set (conj class-children id))))
        ;; Collect all top ref blocks that directly reference the page (or any alias).
        full-ref-block-ids
        (->> ids
             (mapcat (fn [pid] (:block/_refs (d/entity db pid))))
             (remove (fn [ref]
                       (or
                        (when class-ids
                          (some class-ids (map :db/id (:block/tags ref))))
                        (entity-util/hidden? ref)
                        (entity-util/hidden? (:block/page ref)))))
             (map :db/id)
             set)
        ;; matched can be top or child ids
        matched-ref-block-ids
        (when has-filters?
          (matched-ref-block-ids-under-top db full-ref-block-ids includes excludes class-ids))
        ;; Expand matches up to top refs so we can show parent chains and matched children.
        matched-refs-with-children-ids
        (when has-filters?
          (expand-to-top-refs db full-ref-block-ids matched-ref-block-ids))
        final-ref-ids
        (if has-filters?
          (set/intersection full-ref-block-ids matched-refs-with-children-ids)
          full-ref-block-ids)
        ;; Materialize only at the end.
        ref-blocks (map #(d/entity db %) final-ref-ids)
        children-ids
        (if has-filters?
          (set (remove full-ref-block-ids matched-refs-with-children-ids))
          (->> ref-blocks
               (mapcat (fn [ref] (ldb/get-block-children-ids db (:db/id ref))))
               set))]
    {:ref-blocks ref-blocks
     :ref-pages-count (get-ref-pages-count db id ref-blocks children-ids)
     :ref-matched-children-ids (when has-filters? children-ids)}))

(defn get-unlinked-references
  [db id]
  (let [entity (d/entity db id)
        title (string/lower-case (:block/title entity))]
    (when-not (string/blank? title)
      (let [ids (->> (d/datoms db :avet :block/title)
                     (keep (fn [d]
                             (when (and (not= id (:e d))
                                        (string/includes? (string/lower-case (:v d)) title))
                               (:e d)))))]
        (keep
         (fn [eid]
           (let [e (d/entity db eid)]
             (when-not (or (some #(= id %) (map :db/id (:block/refs e)))
                           (:block/link e)
                           (ldb/built-in? e))
               e)))
         ids)))))
