(ns logseq.tasks.db-graph.demo-assembly
  "Assembles AI-generated demo graph intermediate files (JSON + EDN) into
   a single sqlite.build EDN file ready for import via `bb dev:create`.

   Reads numbered files from a directory:
     00-ontology.edn           - Properties + classes (deterministic)
     01-cast.json              - People, projects, books, tools
     02-journals-*.json        - Journal entries (1 file per 2-month batch)

   Outputs assembled.edn in the same directory."
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [babashka.cli :as cli]
            [cljs.pprint :as pprint]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [nbb.core :as nbb]))

;; =============================================================================
;; Reserved page names (must never be created)
;; =============================================================================

(def reserved-page-names
  #{"Library" "Quick add" "Contents" "$$$favorites" "$$$views"})

;; =============================================================================
;; JSON parsing helpers
;; =============================================================================

(defn- read-json
  "Read and parse a JSON file."
  [path]
  (-> path fs/readFileSync str js/JSON.parse (js->clj :keywordize-keys true)))

(defn- read-edn
  "Read and parse an EDN file."
  [path]
  (-> path fs/readFileSync str edn/read-string))

;; =============================================================================
;; Timestamp generation
;; =============================================================================

(defn- date-int->timestamp
  "Convert YYYYMMDD integer to Unix milliseconds (9am UTC on that day)."
  [date-int]
  (let [year  (quot date-int 10000)
        month (rem (quot date-int 100) 100)
        day   (rem date-int 100)]
    (.getTime (js/Date. year (dec month) day 9 0 0 0))))

(defn- block-timestamp
  "Generate a timestamp for a block within a journal day.
   Offsets each block by 30 minutes from 9am."
  [date-int block-index]
  (+ (date-int->timestamp date-int) (* block-index 30 60 1000)))

;; =============================================================================
;; Closed value UUID resolution
;; =============================================================================

(defn- ensure-closed-value-uuids
  "Ensure all closed values in the ontology have UUIDs.
   Mutates the ontology in place by adding generated UUIDs where missing."
  [ontology]
  (update ontology :properties
          (fn [props]
            (into {}
                  (map (fn [[k v]]
                         (if (:build/closed-values v)
                           [k (update v :build/closed-values
                                      (fn [cvs]
                                        (mapv (fn [cv]
                                                (if (:uuid cv)
                                                  cv
                                                  (assoc cv :uuid (random-uuid))))
                                              cvs)))]
                           [k v]))
                       props)))))

(defn- build-closed-value-index
  "Build a lookup index: {prop-key {\"value-string\" uuid}} for fast resolution."
  [ontology]
  (into {}
        (keep (fn [[prop-key prop-def]]
                (when-let [cvs (:build/closed-values prop-def)]
                  [prop-key (into {}
                                  (map (fn [cv] [(:value cv) (:uuid cv)])
                                       cvs))]))
              (:properties ontology))))

;; =============================================================================
;; JSON → EDN conversion: Cast
;; =============================================================================

(defn- convert-property-value
  "Convert a JSON property value to EDN format based on property type.
   For node properties (arrays of names), wraps in [:build/page ...] refs.
   For closed-value properties, resolves string to [:block/uuid ...] ref.
   For simple strings/numbers, passes through."
  [prop-key value ontology closed-value-index]
  (let [prop-def (get-in ontology [:properties prop-key])
        prop-type (:logseq.property/type prop-def)
        cardinality (:db/cardinality prop-def)
        closed-values (get closed-value-index prop-key)]
    (cond
      ;; Closed value property — resolve string to UUID ref
      (and closed-values (string? value))
      (if-let [uuid (get closed-values value)]
        [:block/uuid uuid]
        (do (println "WARNING: No closed value match for" prop-key "=" (pr-str value))
            value))

      ;; Node property with cardinality many — set of page refs
      (and (= prop-type :node) (= cardinality :many) (sequential? value))
      (set (mapv (fn [name] [:build/page {:block/title name}]) value))

      ;; Node property single — page ref
      (and (= prop-type :node) (string? value))
      [:build/page {:block/title value}]

      ;; Date property — journal page ref
      (and (= prop-type :date) (number? value))
      [:build/page {:build/journal value}]

      ;; Date property many
      (and (= prop-type :date) (= cardinality :many) (sequential? value))
      (set (mapv (fn [d] [:build/page {:build/journal d}]) value))

      ;; URL, default, number, checkbox — pass through
      :else value)))

(defn- convert-cast-entity
  "Convert a single cast entity from JSON to sqlite.build EDN page format."
  [entity ontology closed-value-index]
  (let [{:keys [name tags properties]} entity
        build-tags (mapv keyword tags)
        build-props (when properties
                      (into {}
                            (map (fn [[k v]]
                                   [(keyword k) (convert-property-value (keyword k) v ontology closed-value-index)])
                                 properties)))]
    {:page (cond-> {:block/title name
                    :build/tags build-tags}
             build-props (assoc :build/properties build-props))}))

(defn- convert-cast
  "Convert the full cast JSON to sqlite.build :pages-and-blocks entries."
  [cast-data ontology closed-value-index]
  (mapv #(convert-cast-entity % ontology closed-value-index) cast-data))

;; =============================================================================
;; JSON → EDN conversion: Journals
;; =============================================================================

(defn- convert-task-block
  "Convert a task shorthand to built-in :logseq.class/Task with built-in properties."
  [task-map]
  (let [{:keys [status priority deadline]} task-map
        status-kw (when status
                    (keyword "logseq.property" (str "status." status)))
        priority-kw (when priority
                      (keyword "logseq.property" (str "priority." priority)))]
    (cond-> {:build/tags [:logseq.class/Task]}
      status-kw   (assoc-in [:build/properties :logseq.property/status] status-kw)
      priority-kw (assoc-in [:build/properties :logseq.property/priority] priority-kw)
      deadline    (assoc-in [:build/properties :logseq.property/deadline]
                            (date-int->timestamp deadline)))))

(defn- convert-journal-block
  "Convert a single journal block from JSON to EDN format."
  [block date-int block-index ontology closed-value-index]
  (let [{:keys [text tags properties children task]} block
        base {:block/title text
              :block/created-at (block-timestamp date-int block-index)}
        ;; Add tags
        base (if (seq tags)
               (assoc base :build/tags (mapv keyword tags))
               base)
        ;; Add task tags/properties (merges with existing tags)
        base (if task
               (let [task-data (convert-task-block task)
                     existing-tags (or (:build/tags base) [])
                     task-tags (:build/tags task-data)
                     merged-tags (vec (distinct (concat existing-tags task-tags)))]
                 (-> base
                     (assoc :build/tags merged-tags)
                     (update :build/properties merge (:build/properties task-data))))
               base)
        ;; Add regular properties
        base (if (seq properties)
               (let [converted (into {}
                                     (map (fn [[k v]]
                                            [(keyword k)
                                             (convert-property-value (keyword k) v ontology closed-value-index)])
                                          properties))]
                 (update base :build/properties merge converted))
               base)
        ;; Add children (recursive)
        base (if (seq children)
               (assoc base :build/children
                      (vec (map-indexed
                            (fn [i child]
                              (convert-journal-block child date-int (+ block-index 1 i) ontology closed-value-index))
                            children)))
               base)]
    base))

(defn- convert-journal-day
  "Convert a single journal day from JSON to EDN format."
  [day-data ontology closed-value-index]
  (let [{:keys [date blocks]} day-data
        timestamp (date-int->timestamp date)]
    (if (seq blocks)
      {:page (cond-> {:build/journal date
                      :block/created-at timestamp
                      :block/updated-at (+ timestamp (* (count blocks) 30 60 1000))}
               true identity)
       :blocks (vec (map-indexed
                     (fn [i block]
                       (convert-journal-block block date i ontology closed-value-index))
                     blocks))}
      ;; Empty day
      {:page {:build/journal date}})))

(defn- convert-journals
  "Convert journal JSON files to sqlite.build :pages-and-blocks entries."
  [journal-data ontology closed-value-index]
  (mapv #(convert-journal-day % ontology closed-value-index) journal-data))

(defn- parse-journal-file
  "Parse a journal JSON file, handling both old format (bare array of entries)
   and new format (object with :entries and optional :new-people).
   Returns {:entries [...] :new-people [...]}."
  [path]
  (let [data (read-json path)]
    (if (vector? data)
      ;; Old format: bare array of day entries
      {:entries data :new-people []}
      ;; New format: object with :entries and optional :new-people
      {:entries (or (:entries data) [])
       :new-people (or (vec (:new-people data)) [])})))

(defn- convert-new-people
  "Convert new-people declarations from journal files into cast-style page entries.
   Uses the same conversion as cast entities."
  [new-people-list ontology closed-value-index]
  (when (seq new-people-list)
    (println (str "\n--- Emergent Characters ---"))
    (println (str "  " (count new-people-list) " new people declared in journal files:"))
    (doseq [p new-people-list]
      (println (str "    " (:name p) " (" (first (:tags p)) ")")))
    (mapv #(convert-cast-entity % ontology closed-value-index) new-people-list)))

;; =============================================================================
;; Block object reference rewriting
;; =============================================================================
;; When a block object (a tagged block in a journal entry, e.g. a #Book) is
;; later referenced via [[wiki link]], the build system's add-new-pages-from-refs
;; creates a duplicate plain page because it doesn't know about block objects.
;;
;; Fix: assign stable UUIDs to block objects, then rewrite [[Name]] → [[uuid]]
;; in all block titles so the build system resolves them to the block, not a page.

(defn- collect-block-object-titles
  "Walk blocks recursively, collecting titles of block objects (blocks with
   :build/tags that aren't solely :logseq.class/Task)."
  [blocks]
  (mapcat (fn [block]
            (let [tags (:build/tags block)
                  non-task-tags (when (seq tags)
                                  (seq (remove #(= % :logseq.class/Task) tags)))
                  own (when non-task-tags
                        [(:block/title block)])
                  child-results (collect-block-object-titles
                                 (or (:build/children block) []))]
              (concat own child-results)))
          blocks))

(defn- build-block-object-index
  "Build a {title → uuid} map for all block objects across all pages-and-blocks."
  [pages-and-blocks]
  (let [all-titles (mapcat (fn [{:keys [blocks]}]
                             (collect-block-object-titles (or blocks [])))
                           pages-and-blocks)]
    (into {} (map (fn [title] [title (random-uuid)]) (distinct all-titles)))))

(defn- rewrite-title-refs
  "Replace [[block-object-title]] with [[uuid]] in a block title string.
   Returns {:title new-title :rewrites count}."
  [title block-object-index]
  (if (and title (string/includes? title "[["))
    (let [rewrites (atom 0)
          new-title (string/replace title #"\[\[(.*?)\]\]"
                                    (fn [[full-match inner]]
                                      (if-let [uuid (get block-object-index inner)]
                                        (do (swap! rewrites inc)
                                            (str "[[" uuid "]]"))
                                        full-match)))]
      {:title new-title :rewrites @rewrites})
    {:title title :rewrites 0}))

(defn- rewrite-block
  "Assign UUID to block object and rewrite wiki link refs in title.
   Recurses into children. Returns {:block updated-block :rewrites count}."
  [block block-object-index]
  (let [tags (:build/tags block)
        non-task-tags (when (seq tags)
                        (seq (remove #(= % :logseq.class/Task) tags)))
        ;; Assign UUID if this is a block object
        block (if (and non-task-tags
                       (get block-object-index (:block/title block)))
                (assoc block
                       :block/uuid (get block-object-index (:block/title block))
                       :build/keep-uuid? true)
                block)
        ;; Rewrite wiki links in title
        {:keys [title rewrites]} (rewrite-title-refs (:block/title block) block-object-index)
        block (assoc block :block/title title)
        ;; Recurse into children
        child-results (when (:build/children block)
                        (mapv #(rewrite-block % block-object-index)
                              (:build/children block)))
        child-rewrites (reduce + 0 (map :rewrites (or child-results [])))
        block (if child-results
                (assoc block :build/children (mapv :block child-results))
                block)]
    {:block block :rewrites (+ rewrites child-rewrites)}))

(defn- rewrite-block-object-refs
  "Post-process all pages-and-blocks to:
   1. Assign stable UUIDs to block objects (tagged blocks in journals)
   2. Rewrite [[block-object-title]] → [[uuid]] in all block titles
   This prevents the build system from creating duplicate plain pages."
  [pages-and-blocks]
  (let [block-object-index (build-block-object-index pages-and-blocks)]
    (if (empty? block-object-index)
      pages-and-blocks
      (let [total-rewrites (atom 0)
            result (mapv (fn [entry]
                           (if (:blocks entry)
                             (let [results (mapv #(rewrite-block % block-object-index)
                                                 (:blocks entry))
                                   entry-rewrites (reduce + 0 (map :rewrites results))]
                               (swap! total-rewrites + entry-rewrites)
                               (assoc entry :blocks (mapv :block results)))
                             entry))
                         pages-and-blocks)]
        (println (str "\n--- Block Object Ref Rewriting ---"))
        (println (str "  Indexed " (count block-object-index) " block objects"))
        (println (str "  Rewrote " @total-rewrites " [[wiki links]] → [[uuid]] refs"))
        result))))

;; =============================================================================
;; Validation
;; =============================================================================

(defn- collect-page-names
  "Collect all page names from :pages-and-blocks."
  [pages-and-blocks]
  (set (keep (fn [{:keys [page]}]
               (:block/title page))
             pages-and-blocks)))

(defn- collect-page-refs
  "Collect all [:build/page {:block/title ...}] references from nested data."
  [data]
  (cond
    (and (vector? data) (= :build/page (first data)))
    (when-let [title (get-in data [1 :block/title])]
      [title])

    (map? data)
    (mapcat collect-page-refs (vals data))

    (set? data)
    (mapcat collect-page-refs data)

    (sequential? data)
    (mapcat collect-page-refs data)

    :else nil))

(defn- collect-journal-block-tags
  "Collect all tags used on journal blocks (including nested children).
   Returns a seq of {:tag keyword :text string :date int}."
  [pages-and-blocks]
  (letfn [(walk-block [block date-int]
            (let [tags (:build/tags block)
                  title (:block/title block)
                  own (keep (fn [t]
                              (when-not (= t :logseq.class/Task)
                                {:tag t :text title :date date-int}))
                            tags)
                  child-results (mapcat #(walk-block % date-int)
                                        (or (:build/children block) []))]
              (concat own child-results)))]
    (mapcat (fn [{:keys [page blocks]}]
              (when-let [date (:build/journal page)]
                (mapcat #(walk-block % date) (or blocks []))))
            pages-and-blocks)))

(defn- validate-journal-tags
  "Validate that journal blocks don't use page-only tags.
   Uses class-placement from the ontology if present.
   Returns a vector of warning strings and prints block object stats."
  [pages-and-blocks ontology]
  (let [class-placement (:class-placement ontology)
        page-only-tags (or (:page-only class-placement) #{})
        block-only-tags (or (:block-only class-placement) #{})
        mixed-tags (or (:mixed class-placement) #{})
        all-tag-usages (collect-journal-block-tags pages-and-blocks)
        warnings (atom [])
        stripped-count (atom 0)
        block-object-counts (atom {})]
    (when (seq page-only-tags)
      (doseq [{:keys [tag text date]} all-tag-usages]
        (cond
          ;; Page-only tag on a journal block — always wrong
          (page-only-tags tag)
          (do (swap! stripped-count inc)
              (swap! warnings conj
                     (str "WARNING: Page-only tag " tag " on journal block \""
                          (subs text 0 (min 60 (count text))) "\" (date " date ")")))

          ;; Block-only or mixed tag — this is a valid block object
          (or (block-only-tags tag) (mixed-tags tag))
          (swap! block-object-counts update tag (fnil inc 0)))))
    ;; Print block object stats
    (when (seq @block-object-counts)
      (println "\n--- Block Objects in Journals ---")
      (doseq [[tag cnt] (sort-by (comp str key) @block-object-counts)]
        (println (str "  " tag ": " cnt " block objects")))
      (println (str "  Total: " (reduce + (vals @block-object-counts)) " block objects")))
    (when (pos? @stripped-count)
      (println (str "\n  " @stripped-count " page-only tags found on journal blocks (see warnings)")))
    @warnings))

(defn- validate-assembled
  "Validate the assembled EDN before writing. Returns a vector of error strings."
  [assembled]
  (let [pages-and-blocks (:pages-and-blocks assembled)
        page-names (collect-page-names pages-and-blocks)
        all-refs (set (collect-page-refs pages-and-blocks))
        errors (atom [])]
    ;; Check reserved page names
    (doseq [name page-names]
      (when (reserved-page-names name)
        (swap! errors conj (str "Reserved page name used: " name))))
    ;; Check referential integrity (warn, not error, since :auto-create-ontology? handles some)
    (doseq [ref all-refs]
      (when-not (page-names ref)
        (swap! errors conj (str "WARNING: Referenced page not found in cast: " ref
                                " (will be auto-created as plain page)"))))
    ;; Check journal block tags against class-placement
    (let [ontology-with-placement {:class-placement (:class-placement assembled)}
          tag-warnings (validate-journal-tags pages-and-blocks ontology-with-placement)]
      (swap! errors into tag-warnings))
    @errors))

;; =============================================================================
;; Stats reporting
;; =============================================================================

(defn- block-depth
  "Compute the max nesting depth of a block (1 = leaf, 2 = has children, etc.)."
  [block]
  (if-let [children (:build/children block)]
    (inc (apply max (map block-depth children)))
    1))

(defn- count-all-blocks
  "Count total blocks including nested children."
  [block]
  (inc (reduce + 0 (map count-all-blocks (or (:build/children block) [])))))

(defn- collect-all-text
  "Collect all :block/title text from a block and its children."
  [block]
  (cons (:block/title block)
        (mapcat collect-all-text (or (:build/children block) []))))

(defn- report-stats
  "Print depth distribution, block count stats, and em dash count for journal entries."
  [pages-and-blocks]
  (let [journal-entries (filter #(:build/journal (:page %)) pages-and-blocks)
        non-empty (filter #(seq (:blocks %)) journal-entries)
        empty-count (- (count journal-entries) (count non-empty))
        ;; Per-day stats
        day-stats (map (fn [entry]
                         (let [blocks (:blocks entry)
                               top-level (count blocks)
                               max-depth (apply max (map block-depth blocks))
                               total-blocks (reduce + (map count-all-blocks blocks))]
                           {:top-level top-level :max-depth max-depth :total-blocks total-blocks}))
                       non-empty)
        total-non-empty (count non-empty)
        ;; Depth distribution
        depth-freq (frequencies (map :max-depth day-stats))
        depth-3+ (count (filter #(>= (:max-depth %) 3) day-stats))
        depth-4+ (count (filter #(>= (:max-depth %) 4) day-stats))
        ;; Block counts
        top-level-counts (map :top-level day-stats)
        avg-top (when (pos? total-non-empty)
                  (/ (reduce + top-level-counts) (double total-non-empty)))
        max-top (when (seq top-level-counts) (apply max top-level-counts))
        ;; Em dash count
        all-texts (mapcat (fn [entry] (mapcat collect-all-text (:blocks entry))) non-empty)
        em-dash-count (reduce + (map #(count (re-seq #"\u2014" (or % ""))) all-texts))]
    (println "\n--- Journal Stats ---")
    (println (str "  Days: " (count journal-entries) " total, " total-non-empty " non-empty, " empty-count " empty"))
    (println "  Depth distribution:")
    (doseq [[d c] (sort depth-freq)]
      (let [pct (Math/round (* 100 (/ c (double total-non-empty))))]
        (println (str "    depth " d ": " c " days (" pct "%)"))))
    (println (str "  Blocks/day: avg " (Math/round avg-top) ", max " max-top))
    (println (str "  Em dashes: " em-dash-count))
    (when (and (pos? total-non-empty) (< (/ depth-3+ (double total-non-empty)) 0.15))
      (println (str "  WARNING: Only " depth-3+ "/" total-non-empty " days have depth 3+ (target: >=15%)")))
    (when (and (pos? total-non-empty) (< (/ depth-4+ (double total-non-empty)) 0.05))
      (println (str "  WARNING: Only " depth-4+ "/" total-non-empty " days have depth 4+ (target: >=5%)")))
    (when (> em-dash-count 30)
      (println (str "  WARNING: High em dash count (" em-dash-count "). Target: <30 across all journals.")))))

;; =============================================================================
;; Assembly
;; =============================================================================

(defn- list-numbered-files
  "List files matching NN-*.json or NN-*.edn pattern, sorted by prefix."
  [dir]
  (->> (js->clj (.readdirSync fs dir))
       (filter #(re-matches #"\d{2}-.*\.(json|edn)" %))
       sort))

(defn assemble
  "Assemble a demo graph directory into a single sqlite.build EDN map."
  [dir]
  (let [files (list-numbered-files dir)
        _ (when (empty? files)
            (println "Error: No numbered files found in" dir)
            (js/process.exit 1))
        ;; Read ontology (00-ontology.edn)
        ontology-file (first (filter #(string/starts-with? % "00-") files))
        _ (when-not ontology-file
            (println "Error: No 00-ontology.edn found in" dir)
            (js/process.exit 1))
        raw-ontology (read-edn (node-path/join dir ontology-file))
        ;; Ensure closed values have UUIDs and build lookup index
        ontology (ensure-closed-value-uuids raw-ontology)
        closed-value-index (build-closed-value-index ontology)
        ;; Read cast (01-cast.json)
        cast-file (first (filter #(string/starts-with? % "01-") files))
        _ (when-not cast-file
            (println "Error: No 01-cast.json found in" dir)
            (js/process.exit 1))
        cast-data (read-json (node-path/join dir cast-file))
        cast-pages (convert-cast cast-data ontology closed-value-index)
        ;; Read all journal files (02-*.json, 03-*.json, etc.)
        journal-files (filter #(and (string/ends-with? % ".json")
                                    (not (string/starts-with? % "01-")))
                              files)
        parsed-journals (mapv (fn [f] (parse-journal-file (node-path/join dir f)))
                              journal-files)
        journal-pages (mapcat (fn [{:keys [entries]}]
                                (convert-journals entries ontology closed-value-index))
                              parsed-journals)
        ;; Collect and convert new-people from all journal files
        all-new-people (mapcat :new-people parsed-journals)
        new-people-pages (or (convert-new-people all-new-people ontology closed-value-index) [])
        ;; Rewrite block object refs: assign UUIDs to block objects and
        ;; convert [[block-object-title]] → [[uuid]] to prevent duplicate pages
        all-pages (rewrite-block-object-refs (vec (concat cast-pages new-people-pages journal-pages)))
        ;; Assemble final EDN
        assembled (cond-> {:auto-create-ontology? true
                           :properties  (:properties ontology)
                           :classes     (:classes ontology)
                           :pages-and-blocks all-pages}
                    ;; Pass through class-placement for validation (not consumed by sqlite.build)
                    (:class-placement ontology)
                    (assoc :class-placement (:class-placement ontology)))]
    assembled))

;; =============================================================================
;; CLI
;; =============================================================================

(def spec
  {:help {:alias :h
          :desc "Print help"}})

(defn -main [args]
  (let [options (cli/parse-opts args {:spec spec})
        dir (first args)
        _ (when (or (nil? dir) (:help options))
            (println "Usage: $0 DIRECTORY\n\nAssembles numbered JSON/EDN files into assembled.edn")
            (js/process.exit 1))
        dir (if (node-path/isAbsolute dir)
              dir
              (node-path/join (or js/process.env.ORIGINAL_PWD ".") dir))
        _ (when-not (fs/existsSync dir)
            (println "Error: Directory does not exist:" dir)
            (js/process.exit 1))
        assembled (assemble dir)
        errors (validate-assembled assembled)
        output-path (node-path/join dir "assembled.edn")]
    ;; Print validation results
    (when (seq errors)
      (println "\nValidation issues:")
      (doseq [e errors]
        (println " " e))
      (println))
    ;; Write assembled EDN (strip class-placement — only used for validation)
    (fs/writeFileSync output-path (with-out-str (pprint/pprint (dissoc assembled :class-placement))))
    (let [page-count (count (:pages-and-blocks assembled))
          block-count (reduce + (map #(count (:blocks % [])) (:pages-and-blocks assembled)))
          class-count (count (:classes assembled))]
      (println (str "Assembled " page-count " pages, " block-count " blocks, "
                    class-count " classes → " output-path))
      (report-stats (:pages-and-blocks assembled)))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
