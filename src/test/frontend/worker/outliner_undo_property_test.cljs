(ns frontend.worker.outliner-undo-property-test
  "Property test of the worker's undo and redo. Random sequences of outliner,
  page, tag, property, template, paste and recycle operations run through
  `outliner-op/apply-ops!`, the entry point the app uses, with the worker's
  undo history recording.

  Checks, in order:
  - after every operation: the entities it changed pass the closed DB
    schema; every live block has a live parent on its page, no parent cycle
    and distinct sibling orders; an operation the outliner rejects (throws)
    left the visible graph as it was; an operation that changed the visible
    graph added an undo entry.
  - undo, one operation at a time from the last: each undo gives back the
    visible graph from before that operation, and the checks above hold.
  - redo, one operation at a time: each redo gives back the visible graph
    from after that operation, and the checks above hold.
  - after the undos and after the redos: the whole DB passes `validate-db`.
  The visible graph is every live page and block (and some built-in tags and
  properties) with its title, tags, ordered children and property values.

  An operation is data, `[kind i j flag]`; targets are picked by index among
  the live entities, so a failing sequence replays exactly and shrinks. A
  selection of 2 blocks keeps the order it was picked in (Ctrl+click order),
  so it can be reversed, nested or not consecutive. Every violation has a
  signature: the check, what differs and the operation shape, e.g.
  `undo-mismatch children up-down:cross-parent-down`.

  Known bugs: `known-bugs` lists the signatures of the bugs master still
  has, under the issue or pull request that tracks each, and a sequence that
  hits one counts as a pass, so CI stays green on them. When a fix lands,
  the pull request that lands it removes its entry, and the default run must
  still pass. Any other failure is a regression or a new bug: fix it, or
  file it and add its signature under the new issue.

  The default run is fixed (seed, count, length), so it gives the same
  result every time. To fuzz longer, as CI runs the tests:
    LOGSEQ_STABLE_IDENTS=1 FUZZ_N=500 FUZZ_SEED=$RANDOM node static/tests.js \\
      -n frontend.worker.outliner-undo-property-test
  Env: FUZZ_N sequences, FUZZ_SEED, FUZZ_MAX_OPS operations per sequence,
  FUZZ_KINDS / FUZZ_SKIP_KINDS (comma-separated operation kinds, e.g.
  \"move,up-down\"), FUZZ_KNOWN_FILE (more known signatures, 1 per line),
  FUZZ_DEBUG (trace every step), FUZZ_REPLAY (run 1 sequence, e.g.
  FUZZ_REPLAY='[[:up-down 0 38 false]]'). With FUZZ_N or FUZZ_SEED set, the
  test prints its time and the known signatures it hit, each with its
  shortest sequence."
  (:require [cljs.reader :as reader]
            [cljs.test :refer [deftest is]]
            [clojure.string :as string]
            [clojure.test.check :as tc]
            [clojure.test.check.generators :as gen]
            [clojure.test.check.properties :as prop :include-macros true]
            [datascript.core :as d]
            [frontend.worker.a-test-env]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync :as db-sync]
            [frontend.worker.sync.apply-txs :as sync-apply]
            [frontend.worker.sync.client-op :as client-op]
            [frontend.worker.undo-redo :as worker-undo-redo]
            [goog.object :as gobj]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.validate :as db-validate]
            [logseq.db.test.helper :as db-test]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.op :as outliner-op]))

(def ^:private test-repo "test-outliner-undo-property")

(def ^:private default-seed 20260926)
(def ^:private default-num-sequences 12)
(def ^:private default-max-ops 12)

(def ^:private known-bugs
  "The issue or pull request that tracks a bug master still has -> the
  signatures of that bug. A signature ending in * matches every signature
  that starts with the rest. Remove an entry when its fix lands; a
  signature listed under 2 entries stays known until both are gone."
  {;; Redo of a move of 2 blocks with different parents can reverse them.
   "logseq/db-test#1297" ["redo-mismatch children up-down:cross-*"
                          "redo-mismatch children up-down:nested*"
                          "redo-mismatch children move:cross-*"
                          "redo-mismatch children move:nested*"]
   ;; Redo of creating a namespaced page (\"ns/child\") makes new pages.
   "logseq/db-test#1298" ["redo-mismatch nodes create-page:*"
                          "redo-mismatch nodes create-tag:*"]
   ;; Undo of a rename is refused while another page holds the old title.
   "logseq/db-test#1296" ["undo-mismatch title rename-page:*"]
   ;; Undo of creating a property named like an existing one leaves it.
   "logseq/db-test#1299" ["undo-mismatch nodes new-property:*"]
   ;; Undo of deleting a property does not give back its values.
   "logseq/db-test#1304" ["undo-mismatch props delete-page:property"
                          "undo-mismatch children+nodes+props delete-page:property"]
   ;; Undo of deleting a tag leaves its nodes untagged and changes its parents.
   "logseq/db-test#1305" ["undo-mismatch props delete-page:tag"
                          "undo-mismatch props+tags delete-page:tag"
                          "undo-mismatch tags delete-page:tag"]
   ;; Undo of changing a property to multiple values does nothing.
   "logseq/db-test#1306" ["undo-mismatch props retype:*"]})

(defn- env [k] (gobj/get (.-env js/process) k))

(defn- env-int
  [k default]
  (if-let [v (env k)]
    (js/parseInt v 10)
    default))

;;; Setup

(defn- new-client-ops-db
  []
  (let [Database (js/require "better-sqlite3")
        db (new Database ":memory:")]
    (client-op/ensure-sqlite-schema! db)
    db))

(defn- fixed-uuid
  [prefix n]
  (uuid (str "00000000-0000-4000-" prefix "-" (.padStart (str n) 12 "0"))))

(defn- initial-graph
  "Pages, nested blocks, a template, a journal, user properties (one with
  choices) and a tag extending another. Fixed uuids, so every run is alike."
  []
  (let [id (fn [n] (fixed-uuid "a000" n))]
    (db-test/create-conn-with-blocks
     {:properties {:rating {:logseq.property/type :number}
                   :note {:logseq.property/type :default}
                   :related {:logseq.property/type :node
                             :db/cardinality :db.cardinality/many}
                   :stage {:logseq.property/type :default
                           :build/closed-values [{:value "draft" :uuid (id 20)}
                                                 {:value "done" :uuid (id 21)}]}}
      :classes {:Topic {:block/title "Topic"
                        :build/class-properties [:rating]}
                :Movie {:block/title "Movie"
                        :build/class-extends [:Topic]
                        :build/class-properties [:stage]}}
      :pages-and-blocks
      [{:page {:block/title "page 1" :block/uuid (id 1)}
        :blocks [{:block/title "a" :block/uuid (id 2)}
                 {:block/title "b" :block/uuid (id 3)
                  :build/children [{:block/title "b1" :block/uuid (id 4)}
                                   {:block/title "b2" :block/uuid (id 5)
                                    :build/children [{:block/title "b2x" :block/uuid (id 6)}]}]}
                 {:block/title "c" :block/uuid (id 7)
                  :build/tags [:Movie]}]}
       {:page {:block/title "page 2" :block/uuid (id 8)}
        :blocks [{:block/title "d" :block/uuid (id 9)}
                 {:block/title "tmpl" :block/uuid (id 10)
                  :build/tags [:logseq.class/Template]
                  :build/children [{:block/title "tmpl child" :block/uuid (id 11)}]}]}
       {:page {:build/journal 20260925}
        :blocks [{:block/title "e" :block/uuid (id 12)}]}]})))

(defonce ^:private *initial-db (atom nil))

(defn- initial-conn
  "A conn on the initial graph. The graph is built once: building the
  built-in DB is most of the time of a short sequence."
  []
  (let [db (or @*initial-db (reset! *initial-db @(initial-graph)))]
    (entity-plus/reset-immutable-entities-cache!)
    (d/conn-from-db db)))

(def ^:private *tx-reports
  "The transactions since the last check of changed entities."
  (atom []))

(defn- with-worker
  "Runs (f conn) with the worker state and the undo history set up as the
  worker has them, and restores the previous state afterwards."
  [f]
  (let [datascript-prev @worker-state/*datascript-conns
        client-ops-prev @worker-state/*client-ops-conns
        apply-history-prev @worker-undo-redo/*apply-history-action!
        conn (initial-conn)
        client-ops-conn (new-client-ops-db)]
    (reset! worker-state/*datascript-conns {test-repo conn})
    (reset! worker-state/*client-ops-conns {test-repo client-ops-conn})
    (reset! worker-undo-redo/*apply-history-action! sync-apply/apply-history-action!)
    (reset! *tx-reports [])
    (d/listen! conn ::undo-property
               (fn [tx-report]
                 (swap! *tx-reports conj tx-report)
                 (db-sync/enqueue-local-tx! test-repo tx-report)))
    (worker-undo-redo/clear-history! test-repo)
    (try
      (f conn)
      (finally
        (d/unlisten! conn ::undo-property)
        (worker-undo-redo/clear-history! test-repo)
        (.close client-ops-conn)
        (reset! worker-undo-redo/*apply-history-action! apply-history-prev)
        (reset! worker-state/*datascript-conns datascript-prev)
        (reset! worker-state/*client-ops-conns client-ops-prev)))))

;;; What is live

(def ^:private builtin-class-idents
  [:logseq.class/Task :logseq.class/Tag :logseq.class/Page :logseq.class/Template
   :logseq.class/Property :logseq.class/Journal])

(def ^:private builtin-property-idents
  [:logseq.property/status :logseq.property/priority :logseq.property/deadline])

(defn- live-block?
  [e]
  (and (:block/page e)
       (not (:logseq.property/created-from-property e))
       (not (ldb/page? e))
       (not (ldb/recycled? e))))

(defn- user-page?
  [e]
  (and (not (ldb/built-in? e))
       (ldb/page? e)
       (not (ldb/recycled? e))))

(defn- last-2-by-db
  "f of a db value, remembered for the last 2 db values. A step reads the
  same db several times (targets, visible graph, tree checks)."
  [f]
  (let [*cache (atom [])]
    (fn [db]
      (if-let [[_ v] (some #(when (identical? db (first %)) %) @*cache)]
        v
        (let [v (f db)]
          (swap! *cache #(vec (take-last 2 (conj % [db v]))))
          v)))))

(defn- entities-with
  "Entities that have attribute a (an indexed one), by :db/id."
  [db a]
  (->> (d/datoms db :avet a)
       (map #(d/entity db (:e %)))
       (sort-by :db/id)))

(def ^:private all-blocks (last-2-by-db #(vec (entities-with % :block/page))))
(def ^:private all-pages (last-2-by-db #(vec (entities-with % :block/name))))
(def ^:private live-blocks (last-2-by-db #(filterv live-block? (all-blocks %))))
(def ^:private live-block-ids (last-2-by-db #(set (map :db/id (live-blocks %)))))
(def ^:private user-pages (last-2-by-db #(filterv user-page? (all-pages %))))

(defn- live-children
  "The live child blocks of e, in order."
  [db e]
  (let [live? (live-block-ids db)]
    (->> (:block/_parent e) (filter #(live? (:db/id %))) ldb/sort-by-order)))
(defn- user-classes [db] (filterv ldb/class? (user-pages db)))
(defn- user-properties [db] (filterv ldb/property? (user-pages db)))
(defn- journals [db] (filterv ldb/journal? (user-pages db)))

(defn- recycled-roots
  [db]
  (filterv (fn [e]
             (and (ldb/recycled? e)
                  (or (:block/page e) (ldb/page? e))
                  (not (some-> (:block/parent e) ldb/recycled?))))
           (concat (all-pages db) (all-blocks db))))

(defn- templates
  [db]
  (filterv (fn [e] (some #(= :logseq.class/Template (:db/ident %)) (:block/tags e)))
           (live-blocks db)))

(defn- builtin-entities
  [db idents]
  (vec (keep #(d/entity db %) idents)))

(defn- pick
  [coll i]
  (when (seq coll) (nth coll (mod i (count coll)))))

(defn- pick-2
  "1 or 2 distinct entities from coll, starting at index i, in the order
  picked (a Ctrl+click selection keeps click order)."
  [coll i n]
  (when (seq coll)
    (vec (distinct [(pick coll i) (pick coll (+ i (max 1 n)))]))))

;;; Shapes, for signatures

(defn- document-order
  "Map of block :db/id to its position in a pre-order walk of the live
  pages, pages in :db/id order."
  [db]
  (let [walk (fn walk [e] (cons e (mapcat walk (live-children db e))))]
    (into {} (map-indexed (fn [idx e] [(:db/id e) idx])) (mapcat walk (user-pages db)))))

(defn- ancestor?
  [a b]
  (loop [e (:block/parent b) steps 0]
    (cond
      (or (nil? e) (> steps 200)) false
      (= (:db/id e) (:db/id a)) true
      :else (recur (:block/parent e) (inc steps)))))

(defn- selection-shape
  [db targets]
  (if (< (count targets) 2)
    "one"
    (let [[x y] targets
          position (document-order db)
          reversed? (> (get position (:db/id x) 0) (get position (:db/id y) 0))
          relation (cond
                     (or (ancestor? x y) (ancestor? y x)) "nested"
                     (not= (:db/id (:block/page x)) (:db/id (:block/page y))) "cross-page"
                     (= (:db/id (:block/parent x)) (:db/id (:block/parent y))) "siblings"
                     :else "cross-parent")]
      (str relation (when reversed? "-reversed")))))

(defn- node-kind
  [e]
  (cond
    (nil? e) "none"
    (ldb/built-in? e) (str "built-in-" (cond (ldb/class? e) "tag"
                                             (ldb/property? e) "property"
                                             :else "page"))
    (ldb/class? e) "tag"
    (ldb/property? e) "property"
    (ldb/journal? e) "journal"
    (ldb/page? e) "page"
    :else "block"))

(defn- property-kind
  [p]
  (str (when (ldb/built-in? p) "built-in-")
       (some-> (:logseq.property/type p) name)
       (when (= :db.cardinality/many (:db/cardinality p)) "-many")))

;;; Operations

(def ^:private title-pool
  ["alpha" "Alpha" "beta" "Tag" "Task" "ns/child" "page 1" "rating" "Topic"])

(def ^:private tag-titles
  ["Tag" "Task" "Page" "Property" "Topic" "Movie" "Journal" "Template"])

(def ^:private property-names
  ["score" "Score" "owner" "Tag" "status" "rating" "due"])

(def ^:private property-types
  [:default :number :date :node :checkbox :url])

(def ^:private *uuid-counter (atom 0))

(defn- next-uuid
  []
  (fixed-uuid "8000" (swap! *uuid-counter inc)))

(defn- parsed-tag
  "Tag map produced when search/create parses a hashtag without a db, as
  Ctrl-K `Foo #Tag` does."
  [title]
  (gp-block/page-name->map title nil true nil {:class? true}))

(defn- property-value
  "A value for property p, of the property's type."
  [db p i j flag]
  (let [choices (->> (:block/_closed-value-property p) (sort-by :db/id) vec)]
    (cond
      (seq choices) (:db/id (pick choices j))
      (= :logseq.property/status (:db/ident p))
      (:db/id (d/entity db (if flag :logseq.property/status.todo :logseq.property/status.done)))
      (= :logseq.property/priority (:db/ident p))
      (:db/id (d/entity db (pick [:logseq.property/priority.low :logseq.property/priority.high
                                  :logseq.property/priority.urgent] j)))
      (= :logseq.property/deadline (:db/ident p)) (+ 1790000000000 (* j 86400000))
      :else
      (case (:logseq.property/type p)
        :number (mod j 5)
        :default (str "text " (mod j 3))
        :checkbox flag
        :url (str "https://example.com/" (mod j 3))
        :date (:db/id (pick (journals db) j))
        :node (:db/id (pick (into (live-blocks db) (user-pages db)) (+ i j)))
        (mod j 5)))))

(defn- value-of
  "One current value of property ident on e, as delete-property-value takes it."
  [e ident]
  (let [v (get e ident)
        v (if (set? v) (first (sort-by #(or (:db/id %) %) v)) v)]
    (if (and (some? v) (not (string? v)) (not (number? v)) (not (boolean? v)))
      (:db/id v)
      v)))

(defn- subtree
  [db e]
  (cons e (mapcat #(subtree db %) (live-children db e))))

(defn- op->plan
  "The outliner ops for one generated operation and its signature shape, or
  nil when it has no target. Targets come from the live entities of db."
  [db [kind i j flag]]
  (let [blocks (live-blocks db)
        pages (user-pages db)
        nodes (into blocks pages)
        builtin-classes (builtin-entities db builtin-class-idents)
        builtin-properties (builtin-entities db builtin-property-idents)
        builtin-nodes (into builtin-classes builtin-properties)
        classes (into builtin-classes (user-classes db))
        properties (user-properties db)
        any-properties (into properties builtin-properties)
        uuid-of :block/uuid
        plan (fn [shape ops] {:sig (str (name kind) ":" shape) :ops ops})]
    (case kind
      :insert (when-let [target (pick nodes i)]
                (plan (node-kind target)
                      [[:insert-blocks [(mapv (fn [_] {:block/uuid (next-uuid)
                                                       :block/title (str "new " @*uuid-counter)})
                                              (range (inc (mod j 2))))
                                        (uuid-of target)
                                        {:sibling? (and flag (not (ldb/page? target)))
                                         :keep-uuid? true}]]]))
      :delete (when-let [targets (pick-2 blocks i j)]
                (plan (selection-shape db targets)
                      [[:delete-blocks [(mapv uuid-of targets) {}]]]))
      :move (let [targets (pick-2 blocks i j)
                  target (pick nodes (+ i j 1))]
              (when (and (seq targets) target)
                (plan (str (selection-shape db targets) "->" (node-kind target))
                      [[:move-blocks [(mapv uuid-of targets) (uuid-of target)
                                      {:sibling? (and flag (not (ldb/page? target)))}]]])))
      :up-down (when-let [targets (pick-2 blocks i j)]
                 (plan (str (selection-shape db targets) (if flag "-up" "-down"))
                       [[:move-blocks-up-down [(mapv uuid-of targets) flag]]]))
      :indent (when-let [targets (pick-2 blocks i j)]
                (plan (str (selection-shape db targets) (if flag "-indent" "-outdent"))
                      [[:indent-outdent-blocks [(mapv uuid-of targets) flag {}]]]))
      :save (when-let [target (pick blocks i)]
              (let [variant (mod j 5)
                    other (pick blocks (+ i j 1))
                    title (case variant
                            0 (str "edit " j)
                            1 "edit [[alpha]]"
                            2 "edit #Task"
                            3 (str "edit ((" (uuid-of other) "))")
                            4 "edit #[[Tag]]")]
                (plan (str "text-" variant)
                      [[:save-block [{:block/uuid (uuid-of target) :block/title title} {}]]])))
      :tag (let [target (pick (if flag (into nodes builtin-nodes) nodes) i)
                 class (pick classes j)]
             (when (and target class)
               (plan (str (node-kind target) "#" (node-kind class))
                     [[:set-block-property [(uuid-of target) :block/tags (:db/id class)]]])))
      :untag (let [target (pick nodes i)
                   class (pick (sort-by :db/id (:block/tags target)) j)]
               (when (and target class)
                 (plan (str (node-kind target) "#" (node-kind class))
                       [[:delete-property-value [(uuid-of target) :block/tags (:db/id class)]]])))
      :property (let [p (pick (if flag any-properties properties) j)
                      target (pick nodes i)]
                  (when (and p target)
                    (plan (str (node-kind target) ":" (property-kind p))
                          [[:set-block-property [(uuid-of target) (:db/ident p)
                                                 (property-value db p i j flag)]]])))
      :remove-property (let [p (pick any-properties j)
                             target (pick (filterv #(some? (get % (:db/ident p))) nodes) i)]
                         (when (and p target)
                           (plan (str (node-kind target) ":" (property-kind p))
                                 [[:remove-block-property [(uuid-of target) (:db/ident p)]]])))
      :delete-value (let [p (pick any-properties j)
                          target (pick (filterv #(some? (get % (:db/ident p))) nodes) i)]
                      (when (and p target)
                        (plan (str (node-kind target) ":" (property-kind p))
                              [[:delete-property-value [(uuid-of target) (:db/ident p)
                                                        (value-of target (:db/ident p))]]])))
      :batch-property (let [targets (pick-2 blocks i j)
                            p (pick any-properties (+ i j))]
                        (when (and (seq targets) p)
                          (plan (str (selection-shape db targets) ":" (property-kind p))
                                [[:batch-set-property [(mapv uuid-of targets) (:db/ident p)
                                                       (property-value db p i j flag) {}]]])))
      :new-property (let [type (pick property-types j)
                          many? (and flag (not= :checkbox type))]
                      (plan (str (name type) (when many? "-many"))
                            [[:upsert-property [nil (cond-> {:logseq.property/type type}
                                                      many? (assoc :db/cardinality :db.cardinality/many))
                                                {:property-name (pick property-names i)}]]]))
      :closed-value (when-let [p (pick properties i)]
                      (plan (property-kind p)
                            [[:upsert-closed-value [(:db/ident p)
                                                    {:value (if (= :number (:logseq.property/type p))
                                                              (mod j 5)
                                                              (str "choice " (mod j 3)))}]]]))
      :class-property (let [class (pick (user-classes db) i)
                            p (pick any-properties j)]
                        (when (and class p)
                          (plan (str (if flag "remove-" "add-") (property-kind p))
                                [[(if flag :class-remove-property :class-add-property)
                                  [(uuid-of class) (:db/ident p)]]])))
      :status (when-let [target (pick blocks i)]
                (plan (if flag "todo" "done")
                      [[:set-block-property [(uuid-of target) :logseq.property/status
                                             (:db/id (d/entity db (if flag
                                                                    :logseq.property/status.todo
                                                                    :logseq.property/status.done)))]]]))
      :create-page (plan (if flag (str "tagged-" (pick tag-titles j)) "plain")
                         [[:create-page [(pick title-pool i)
                                         (cond-> {:redirect? false
                                                  :split-namespace? true
                                                  :tags ()}
                                           flag (assoc :tags [(parsed-tag (pick tag-titles j))]))]]])
      :create-tag (plan "tag"
                        [[:create-page [(pick title-pool i) {:redirect? false
                                                             :split-namespace? true
                                                             :class? true}]]])
      :rename-page (when-let [page (pick (if flag (into pages builtin-nodes) pages) i)]
                     (plan (node-kind page)
                           [[:rename-page [(uuid-of page) (pick title-pool j)]]]))
      :delete-page (when-let [page (pick (if flag (into pages builtin-nodes) pages) i)]
                     (plan (node-kind page)
                           [[:delete-page [(uuid-of page) {}]]]))
      :restore (when-let [root (pick (recycled-roots db) i)]
                 (plan (node-kind root) [[:restore-recycled [(uuid-of root)]]]))
      :purge (when-let [root (pick (recycled-roots db) i)]
               (plan (node-kind root) [[:recycle-delete-permanently [(uuid-of root)]]]))
      :template (let [template (pick (templates db) j)
                      target (pick nodes i)]
                  (when (and template target)
                    (plan (node-kind target)
                          [[:apply-template [(uuid-of template) (uuid-of target)
                                             {:sibling? (and flag (not (ldb/page? target)))}]]])))
      ;; Change an existing property's type (and with flag its cardinality)
      ;; while blocks may hold values of it.
      :retype (when-let [p (pick properties i)]
                (let [type (pick property-types j)]
                  (plan (str (property-kind p) "->" (name type) (when flag "-many"))
                        [[:upsert-property [(:db/ident p)
                                            (cond-> {:logseq.property/type type}
                                              flag (assoc :db/cardinality :db.cardinality/many))
                                            {}]]])))
      :delete-choice (let [p (pick (filterv #(seq (:block/_closed-value-property %)) any-properties) i)
                           choice (when p
                                    (pick (->> (:block/_closed-value-property p) (sort-by :db/id) vec) j))]
                       (when choice
                         (plan (property-kind p)
                               [[:delete-closed-value [(:db/ident p) (uuid-of choice)]]])))
      :extends (let [class (pick (into (user-classes db) builtin-classes) i)
                     parent (pick (into (user-classes db) builtin-classes) (+ i j 1))]
                 (when (and class parent)
                   (plan (str (node-kind class) "<" (node-kind parent))
                         [[:set-block-property [(uuid-of class) :logseq.property.class/extends
                                                (:db/id parent)]]])))
      :alias (let [page (pick pages i)
                   other (pick pages (+ i j 1))]
               (when (and page other)
                 (plan (str (node-kind page) "=" (node-kind other))
                       [[:set-block-property [(uuid-of page) :block/alias (:db/id other)]]])))
      ;; Copy a block with its live children and paste the copy, as the
      ;; app's paste does: new uuids, parents inside the copy by uuid.
      :paste (let [source (pick blocks i)
                   target (pick nodes (+ i j 1))]
               (when (and source target)
                 (let [copied-nodes (vec (subtree db source))
                       new-uuid (into {} (map (fn [e] [(uuid-of e) (next-uuid)])) copied-nodes)
                       copied (mapv (fn [e]
                                      (let [parent-uuid (uuid-of (:block/parent e))]
                                        (cond-> {:block/uuid (new-uuid (uuid-of e))
                                                 :block/title (or (:block/title e) "")}
                                          (contains? new-uuid parent-uuid)
                                          (assoc :block/parent [:block/uuid (new-uuid parent-uuid)]))))
                                    copied-nodes)]
                   (plan (str (if (> (count copied) 1) "tree" "one") "->" (node-kind target)
                              (if flag "-sibling" "-child"))
                         [[:insert-blocks [copied (uuid-of target)
                                           {:sibling? (and flag (not (ldb/page? target)))
                                            :outliner-op :paste
                                            :keep-uuid? true}]]])))))))

(def ^:private op-kinds
  [:insert :delete :move :up-down :indent :save :tag :untag :property
   :remove-property :delete-value :batch-property :new-property :closed-value
   :class-property :status :create-page :create-tag :rename-page :delete-page
   :restore :purge :template :paste :retype :delete-choice :extends :alias])

(defn- enabled-op-kinds
  "FUZZ_KINDS restricts the operations to the kinds it names; FUZZ_SKIP_KINDS
  removes some. Default: all of op-kinds."
  []
  (let [parse (fn [s] (set (map keyword (remove empty? (string/split (or s "") #",")))))
        only (parse (env "FUZZ_KINDS"))
        skip (parse (env "FUZZ_SKIP_KINDS"))]
    (vec (remove skip (if (seq only) (filter only op-kinds) op-kinds)))))

(defn- ops-gen
  []
  (gen/vector (gen/tuple (gen/elements (enabled-op-kinds))
                         (gen/choose 0 50) (gen/choose 0 50) gen/boolean)
              1 (env-int "FUZZ_MAX_OPS" default-max-ops)))

;;; Checks

(defn- changed-entity-errors
  "Closed-schema errors of the entities that the transactions since the last
  call changed."
  []
  (let [reports @*tx-reports]
    (reset! *tx-reports [])
    (seq (mapcat #(second (db-validate/validate-tx-report % {:closed-schema? true}))
                 reports))))

(defn- tree-errors
  [db]
  (let [blocks (live-blocks db)]
    (concat
     (for [b blocks
           :let [parent (:block/parent b)]
           :when (or (nil? parent)
                     (ldb/recycled? parent)
                     (not= (:db/id (:block/page b))
                           (:db/id (if (ldb/page? parent) parent (:block/page parent)))))]
       {:problem :parent-or-page :block (:block/title b) :parent (:block/title parent)})
     (for [b blocks
           :when (loop [e b steps 0]
                   (cond
                     (nil? e) false
                     (ldb/page? e) false
                     (> steps 200) true
                     :else (recur (:block/parent e) (inc steps))))]
       {:problem :cycle :block (:block/title b)})
     (for [[parent children] (group-by #(:db/id (:block/parent %)) blocks)
           :let [orders (map :block/order children)]
           :when (not= (count orders) (count (distinct orders)))]
       {:problem :duplicate-order :parent parent :orders (frequencies orders)}))))

(defn- db-errors
  "Checked after every step: the changed entities and the block tree."
  [db]
  (or (when-let [errs (changed-entity-errors)]
        {:problem :invalid :errors (take 2 errs)})
      (when-let [errs (seq (tree-errors db))]
        {:problem (:problem (first errs)) :errors (take 3 errs)})))

(defn- whole-db-violation
  "Checked after the undos and after the redos: every entity."
  [db phase]
  (when-let [errs (seq (:errors (db-validate/validate-db db)))]
    {:sig (str "invalid at end of " phase) :errors (take 2 errs)}))

(defn- value-repr
  [v]
  (cond
    (set? v) (set (map value-repr v))
    (or (string? v) (number? v) (boolean? v) (keyword? v) (nil? v)) v
    ;; A value entity: its content, never its :db/id, which undo and redo
    ;; may renew for the same value.
    :else (let [content (or (:db/ident v)
                            (:logseq.property/value v)
                            (:block/title v))]
            (if (some? content) content [:no-content (:db/id v)]))))

(defn- shown-properties
  [db e]
  (->> (d/datoms db :eavt (:db/id e))
       (map :a)
       distinct
       (filter (fn [a] (or (some #{a} builtin-property-idents)
                           (contains? #{:logseq.property.class/extends :block/alias
                                        :logseq.property/type :db/cardinality}
                                      a)
                           (= "user.property" (namespace a)))))
       (map (fn [a] [a (value-repr (get e a))]))
       (into (sorted-map))))

(def ^:private visible-graph
  "The live pages and blocks, and the built-in tags and properties, as a
  user sees them: titles, tags, property values, ordered children."
  (last-2-by-db
   (fn [db]
     (let [nodes (concat (live-blocks db) (user-pages db)
                         (builtin-entities db builtin-class-idents)
                         (builtin-entities db builtin-property-idents))
           tags-of (fn [e] (set (map #(or (:db/ident %) (:block/title %)) (:block/tags e))))]
       (into {}
             (map (fn [e]
                    [(:block/uuid e)
                     {:title (:block/title e)
                      :tags (tags-of e)
                      :props (shown-properties db e)
                      :children (mapv :block/title (live-children db e))}]))
             nodes)))))

(defn- diff-fields
  "What differs between 2 visible graphs, for signatures: \"nodes\" when a
  node is in only one of them, and the names of the fields that differ on a
  node in both (title, tags, props, children), sorted, joined by +. A lost
  reference shows as props or tags, a misplaced block as children."
  [expected actual]
  (let [fields (reduce (fn [acc k]
                         (let [a (get expected k)
                               b (get actual k)]
                           (cond
                             (= a b) acc
                             (or (nil? a) (nil? b)) (conj acc "nodes")
                             :else (into acc (keep (fn [f] (when (not= (get a f) (get b f)) (name f))))
                                         [:title :tags :props :children]))))
                       (sorted-set)
                       (distinct (concat (keys expected) (keys actual))))]
    (string/join "+" fields)))

(defn- graph-diff
  "Up to 6 differences between 2 visible graphs, each naming the node by
  title and the field that differs, with both values."
  [expected actual]
  (->> (distinct (concat (keys expected) (keys actual)))
       (keep (fn [k]
               (let [a (get expected k)
                     b (get actual k)]
                 (cond
                   (= a b) nil
                   (nil? b) [{:node (:title a) :missing a}]
                   (nil? a) [{:node (:title b) :extra b}]
                   :else (for [f [:title :tags :props :children]
                               :when (not= (get a f) (get b f))]
                           {:node (:title a) f {:expected (get a f) :actual (get b f)}})))))
       (apply concat)
       (take 6)
       vec))

(defn- outline
  "The live user pages as nested titles, for tracing."
  [db]
  (letfn [(node [e] (let [kids (live-children db e)]
                      (if (seq kids) [(:block/title e) (mapv node kids)] (:block/title e))))]
    (mapv node (user-pages db))))

(defn- undo-depth
  []
  (count (:undo-ops (worker-undo-redo/get-debug-state test-repo))))

(defn- run-times!
  "Calls f n times; returns the message of an exception f throws, else nil."
  [n f]
  (try
    (dotimes [_ n] (f test-repo))
    nil
    (catch :default e (or (ex-message e) (str e)))))

;;; Running a sequence

(defn- apply-step!
  [conn op]
  (let [plan (op->plan @conn op)
        before (visible-graph @conn)
        depth-before (undo-depth)
        thrown (when plan
                 (try
                   (outliner-op/apply-ops! conn (:ops plan)
                                           {:local-tx? true
                                            :db-sync/tx-id (random-uuid)
                                            :client-id "undo-property-test"})
                   nil
                   (catch :default e (or (ex-message e) (str e)))))
        after (visible-graph @conn)]
    (when (env "FUZZ_DEBUG")
      (println "FUZZ-OP" (pr-str op) (:sig plan)
               (cond (nil? plan) "no target"
                     thrown (str "rejected: " (subs thrown 0 (min 120 (count thrown))))
                     :else "applied"))
      (println "FUZZ-TREE" (pr-str (outline @conn))))
    {:op op
     :sig (or (:sig plan) (str (name (first op)) ":no-target"))
     :thrown thrown
     :before before
     :after after
     :depth (- (undo-depth) depth-before)}))

(defn- step-violation
  [conn {:keys [op sig thrown before after depth]}]
  (cond
    (and thrown (not= before after))
    {:sig (str "rejected-but-changed " sig) :op op :thrown thrown
     :diff (graph-diff before after)}

    (and (not= before after) (not (pos? depth)))
    {:sig (str "no-undo-entry " sig) :op op :diff (graph-diff before after)}

    :else
    (when-let [v (db-errors @conn)]
      (assoc v :sig (str (name (:problem v)) " after " sig) :op op :thrown thrown))))

(defn- undo-violation
  [conn {:keys [op sig before depth]}]
  (let [thrown (run-times! depth worker-undo-redo/undo)
        now (visible-graph @conn)]
    (when (env "FUZZ_DEBUG")
      (println "FUZZ-UNDO" (pr-str op) (pr-str (outline @conn))))
    (cond
      thrown {:sig (str "undo-threw " sig) :op op :thrown thrown}
      (not= now before) {:sig (str "undo-mismatch " (diff-fields before now) " " sig) :op op
                         :diff (graph-diff before now)}
      :else (when-let [v (db-errors @conn)]
              (assoc v :sig (str (name (:problem v)) " after undo of " sig) :op op)))))

(defn- redo-violation
  [conn {:keys [op sig after depth]}]
  (let [thrown (run-times! depth worker-undo-redo/redo)
        now (visible-graph @conn)]
    (when (env "FUZZ_DEBUG")
      (println "FUZZ-REDO" (pr-str op) (pr-str (outline @conn))))
    (cond
      thrown {:sig (str "redo-threw " sig) :op op :thrown thrown}
      (not= now after) {:sig (str "redo-mismatch " (diff-fields after now) " " sig) :op op
                        :diff (graph-diff after now)}
      :else (when-let [v (db-errors @conn)]
              (assoc v :sig (str (name (:problem v)) " after redo of " sig) :op op)))))

(defn- run-sequence
  "Applies ops in order, then undoes them one by one, then redoes them one by
  one, checking after each step. Returns nil when every check held, else a
  map describing the first violation: its :sig, the :op it concerns, and
  what differs (:diff) or what was thrown."
  [ops]
  (reset! *uuid-counter 0)
  (with-worker
    (fn [conn]
      (when (env "FUZZ_DEBUG")
        (println "FUZZ-TREE start" (pr-str (outline @conn))))
      (loop [remaining ops steps []]
        (if-let [op (first remaining)]
          (let [step (apply-step! conn op)]
            (or (step-violation conn step)
                (recur (rest remaining) (conj steps step))))
          (or (some #(undo-violation conn %) (reverse steps))
              (whole-db-violation @conn "undos")
              (some #(redo-violation conn %) steps)
              (whole-db-violation @conn "redos")))))))

;;; The property

(defn- known-signatures
  "The patterns of known-bugs, and the lines of the file FUZZ_KNOWN_FILE names."
  []
  (let [f (env "FUZZ_KNOWN_FILE")
        fs (js/require "fs")]
    (into (set (apply concat (vals known-bugs)))
          (when (and f (.existsSync fs f))
            (remove string/blank? (string/split-lines (.readFileSync fs f "utf8")))))))

(defn- known-signature?
  [known sig]
  (some (fn [k]
          (if (string/ends-with? k "*")
            (string/starts-with? sig (subs k 0 (dec (count k))))
            (= k sig)))
        known))

(defn- replay
  [ops]
  (let [violation (run-sequence ops)]
    {:pass? (nil? violation) :smallest ops :violation violation}))

(defn- record-known-hit
  "Counts a hit of signature sig and keeps the shortest sequence that hit it."
  [hits sig ops]
  (update hits sig (fn [{:keys [n example]}]
                     {:n (inc (or n 0))
                      :example (if (and example (<= (count example) (count ops))) example ops)})))

(defn- print-known-hits
  [n seed ms hits]
  (println (str "outliner-undo-property: " n " sequences, seed " seed ", in "
                (.toFixed (/ ms 1000) 1) " s, " (count hits) " known signatures hit"))
  (doseq [[sig {:keys [n example]}] (sort-by key hits)]
    (println (str "  " n "x " sig "  e.g. " (pr-str example)))))

(defn- check-sequences
  [n seed]
  (let [start (js/Date.now)
        known (known-signatures)
        *known-hits (atom {})
        property (prop/for-all [ops (ops-gen)]
                   (let [v (run-sequence ops)]
                     (or (nil? v)
                         (when (known-signature? known (:sig v))
                           (swap! *known-hits record-known-hit (:sig v) ops)
                           true))))
        result (tc/quick-check n property :seed seed)
        smallest (first (get-in result [:shrunk :smallest]))]
    (when (or (env "FUZZ_N") (env "FUZZ_SEED"))
      (print-known-hits (:num-tests result) seed (- (js/Date.now) start) @*known-hits))
    (cond-> {:pass? (true? (:pass? result)) :seed seed :num-tests (:num-tests result)}
      (not (true? (:pass? result)))
      (assoc :smallest smallest :violation (run-sequence smallest)))))

(defn- failure-message
  [{:keys [seed smallest violation]}]
  (str "Undo/redo violation, " (if seed (str "seed " seed) "replay") ".\n"
       "Smallest failing sequence (rerun it with FUZZ_REPLAY='" (pr-str smallest) "'):\n"
       "  " (pr-str smallest) "\n"
       "Signature: " (:sig violation) "\n"
       "At operation: " (pr-str (:op violation)) "\n"
       (when-let [thrown (:thrown violation)] (str "Thrown: " thrown "\n"))
       (when-let [diff (seq (:diff violation))]
         (str "What differs:\n" (string/join "\n" (map #(str "  " (pr-str %)) diff)) "\n"))
       (when-let [errors (seq (:errors violation))]
         (str "Errors: " (pr-str errors) "\n"))))

(deftest outliner-ops-undo-redo-property-test
  (let [result (if-let [ops (env "FUZZ_REPLAY")]
                 (replay (reader/read-string ops))
                 (check-sequences (env-int "FUZZ_N" default-num-sequences)
                                  (env-int "FUZZ_SEED" default-seed)))]
    (is (:pass? result) (when-not (:pass? result) (failure-message result)))))
