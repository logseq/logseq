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
            [clojure.edn :as edn]
            [clojure.string :as string]
            [cljs.pprint :as pprint]
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
    @errors))

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
        journal-pages (mapcat (fn [f]
                                (let [data (read-json (node-path/join dir f))]
                                  (convert-journals data ontology closed-value-index)))
                              journal-files)
        ;; Assemble final EDN
        assembled {:auto-create-ontology? true
                   :properties  (:properties ontology)
                   :classes     (:classes ontology)
                   :pages-and-blocks (vec (concat cast-pages journal-pages))}]
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
    ;; Write assembled EDN
    (fs/writeFileSync output-path (with-out-str (pprint/pprint assembled)))
    (let [page-count (count (:pages-and-blocks assembled))
          block-count (reduce + (map #(count (:blocks % [])) (:pages-and-blocks assembled)))
          class-count (count (:classes assembled))]
      (println (str "Assembled " page-count " pages, " block-count " blocks, "
                    class-count " classes → " output-path)))))

(when (= nbb/*file* (nbb/invoked-file))
  (-main *command-line-args*))
