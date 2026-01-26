(ns logseq.graph-parser.exporter
  "Exports a file graph to DB graph. Used by the File to DB graph importer and
  by nbb-logseq CLIs"
  (:require ["path" :as node-path]
            ["sanitize-filename" :as sanitizeFilename]
            [borkdude.rewrite-edn :as rewrite]
            [cljs-time.coerce :as tc]
            [cljs.pprint]
            [clojure.edn :as edn]
            [clojure.set :as set]
            [clojure.string :as string]
            [clojure.walk :as walk]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.util.block-ref :as block-ref]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.macro :as macro-util]
            [logseq.common.util.namespace :as ns-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.common.uuid :as common-uuid]
            [logseq.db :as ldb]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.asset :as db-asset]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.extract :as extract]
            [logseq.graph-parser.text :as text]
            [logseq.graph-parser.utf8 :as utf8]
            [promesa.core :as p]))

(defn- add-missing-timestamps
  "Add updated-at or created-at timestamps if they doesn't exist"
  [block]
  (let [updated-at (common-util/time-ms)
        block (cond-> block
                (nil? (:block/updated-at block))
                (assoc :block/updated-at updated-at)
                (nil? (:block/created-at block))
                (assoc :block/created-at updated-at))]
    block))

(defn- build-new-namespace-page [block]
  (let [new-title (ns-util/get-last-part (:block/title block))]
    (merge block
           {;; DB graphs only have child name of namespace
            :block/title new-title
            :block/name (common-util/page-name-sanity-lc new-title)})))

(defn- get-page-uuid [page-names-to-uuids page-name ex-data']
  (or (get @page-names-to-uuids (some-> (if (string/includes? (str page-name) "#")
                                          (string/lower-case (gp-block/sanitize-hashtag-name page-name))
                                          page-name)
                                        string/trimr))
      (throw (ex-info (str "No uuid found for page name " (pr-str page-name))
                      (merge ex-data' {:page-name page-name
                                       :page-names (sort (keys @page-names-to-uuids))})))))

(defn- replace-namespace-with-parent [block page-names-to-uuids parent-k]
  (if (:block/namespace block)
    (-> (dissoc block :block/namespace)
        (assoc parent-k
               {:block/uuid (get-page-uuid page-names-to-uuids
                                           (get-in block [:block/namespace :block/name])
                                           {:block block :block/namespace (:block/namespace block)})}))
    block))

(defn- build-class-ident-name
  [class-name]
  (string/replace class-name "/" "___"))

(defn- find-or-create-class
  ([db class-name all-idents]
   (find-or-create-class db class-name all-idents {}))
  ([db class-name all-idents class-block]
   (let [ident (keyword class-name)]
     (if-let [db-ident (get @all-idents ident)]
       {:db/ident db-ident}
       (let [m
             (if (:block/namespace class-block)
               ;; Give namespaced tags a unique ident so they don't conflict with other tags
               (-> (db-class/build-new-class db (merge {:block/title (build-class-ident-name class-name)}
                                                       (select-keys class-block [:block/tags])))
                   (merge {:block/title class-name
                           :block/name (common-util/page-name-sanity-lc class-name)})
                   (build-new-namespace-page))
               (db-class/build-new-class db
                                         (assoc {:block/title class-name
                                                 :block/name (common-util/page-name-sanity-lc class-name)}
                                                :block/tags (:block/tags class-block))))]
         (swap! all-idents assoc ident (:db/ident m))
         (with-meta m {:new-class? true}))))))

(defn- find-or-gen-class-uuid [page-names-to-uuids page-name db-ident & {:keys [temp-new-class?]}]
  (or (if temp-new-class?
        ;; First lookup by possible parent b/c page-names-to-uuids erroneously has the child name
        ;; and full name. To not guess at the parent name we would need to save all properties-from-classes
        (or (some #(when (string/ends-with? (key %) (str ns-util/parent-char page-name))
                     (val %))
                  @page-names-to-uuids)
            (get @page-names-to-uuids page-name))
        (get @page-names-to-uuids page-name))
      (let [new-uuid (common-uuid/gen-uuid :db-ident-block-uuid db-ident)]
        (swap! page-names-to-uuids assoc page-name new-uuid)
        new-uuid)))

(defn- convert-tag? [tag-name {:keys [convert-all-tags? tag-classes]}]
  (and (or convert-all-tags?
           (contains? tag-classes tag-name)
           ;; built-in tags that always convert
           (contains? #{"card"} tag-name))
       ;; Disallow tags as it breaks :block/tags
       (not (contains? #{"tags"} tag-name))))

(defn- find-existing-class
  "Finds a class entity by unique name and parents and returns its :block/uuid if found.
  db is searched because there is no in-memory index only for created classes by unique name"
  [db {full-name :block/name block-ns :block/namespace}]
  (if block-ns
    (->> (d/q '[:find [?b ...]
                :in $ ?name
                :where [?b :block/uuid ?uuid] [?b :block/tags :logseq.class/Tag] [?b :block/name ?name]]
              db
              (ns-util/get-last-part full-name))
         (map #(d/entity db %))
         (some #(let [parents (->> (ldb/get-class-extends %)
                                   (remove (fn [e] (= :logseq.class/Root (:db/ident e))))
                                   vec)]
                  (when (= full-name (string/join ns-util/namespace-char (map :block/name (conj parents %))))
                    (:block/uuid %)))))
    (first
     (d/q '[:find [?uuid ...]
            :in $ ?name
            :where [?b :block/uuid ?uuid] [?b :block/tags :logseq.class/Tag] [?b :block/name ?name]]
          db
          full-name))))

(defn- convert-tag-to-class
  "Converts a tag block with class or returns nil if this tag should be removed
   because it has been moved"
  [db tag-block {:keys [page-names-to-uuids classes-tx]} user-options all-idents]
  (if-let [new-class (:block.temp/new-class tag-block)]
    (let [class-m (find-or-create-class db new-class all-idents)
          class-m' (merge class-m
                          {:block/uuid
                           (find-or-gen-class-uuid page-names-to-uuids (common-util/page-name-sanity-lc new-class) (:db/ident class-m) {:temp-new-class? true})})]
      (when (:new-class? (meta class-m)) (swap! classes-tx conj class-m'))
      (assert (:block/uuid class-m') "Class must have a :block/uuid")
      [:block/uuid (:block/uuid class-m')])
    (when (convert-tag? (:block/name tag-block) user-options)
      (let [existing-tag-uuid (find-existing-class db tag-block)
            internal-tag-conflict? (contains? #{"tag" "property" "page" "journal" "asset"} (:block/name tag-block))]
        (cond
          ;; Don't overwrite internal tags
          (and existing-tag-uuid (not internal-tag-conflict?))
          [:block/uuid existing-tag-uuid]

          :else
          ;; Creates or updates page within same tx
          (let [class-m (find-or-create-class db (:block/title tag-block) all-idents tag-block)
                class-m' (-> (merge tag-block class-m
                                    (if internal-tag-conflict?
                                      {:block/uuid (common-uuid/gen-uuid :db-ident-block-uuid (:db/ident class-m))}
                                      (when-not (:block/uuid tag-block)
                                        (let [id (find-or-gen-class-uuid page-names-to-uuids (:block/name tag-block) (:db/ident class-m))]
                                          {:block/uuid id}))))
                             ;; override with imported timestamps
                             (dissoc :block/created-at :block/updated-at)
                             (merge (add-missing-timestamps
                                     (select-keys tag-block [:block/created-at :block/updated-at])))
                             (replace-namespace-with-parent page-names-to-uuids :logseq.property.class/extends))]
            (when (:new-class? (meta class-m)) (swap! classes-tx conj class-m'))
            (assert (:block/uuid class-m') "Class must have a :block/uuid")
            [:block/uuid (:block/uuid class-m')]))))))

(defn- logseq-class-ident?
  [k]
  (and (qualified-keyword? k) (db-class/logseq-class? k)))

(defn- convert-tags-to-classes
  "Handles converting tags to classes and any post processing of it e.g.
  cleaning :block/tags when a block is tagged with a namespace page"
  [tags db per-file-state user-options all-idents]
  ;; vec needed is needed so that tags are built in order
  (let [tags' (vec (keep #(if (logseq-class-ident? %)
                            %
                            (convert-tag-to-class db % per-file-state user-options all-idents))
                         tags))]
    ;; Only associate leaf child tag with block as other tags are only used to define tag parents.
    ;; This assumes that extract/extract returns :block/tags with their leaf child first and then its parents
    (if-let [child-tag (and (some :block/namespace tags) (first tags'))]
      [child-tag]
      tags')))

(defn- update-page-tags
  [block db user-options per-file-state all-idents]
  (if (seq (:block/tags block))
    (let [page-tags (->> (:block/tags block)
                         (remove #(or (:block.temp/new-class %)
                                      (convert-tag? (:block/name %) user-options)
                                      ;; Ignore new class tags from extract e.g. :logseq.class/Journal
                                      (logseq-class-ident? %)))
                         (map #(vector :block/uuid (get-page-uuid (:page-names-to-uuids per-file-state) (:block/name %) {:block %})))
                         set)]
      (cond-> block
        true
        (update :block/tags convert-tags-to-classes db per-file-state user-options all-idents)
        true
        (update :block/tags (fn [tags]
                              (cond-> (set tags)
                                ;; ensure pages at least have a Page
                                true
                                (conj :logseq.class/Page)
                                ;; Remove Page if another Page-like class is already present
                                (seq (set/intersection (disj (set tags) :logseq.class/Page)
                                                       db-class/page-classes))
                                (disj :logseq.class/Page))))
        (seq page-tags)
        (merge {:logseq.property/page-tags page-tags})))
    ;; ensure page at least have a Page tag
    (assoc block :block/tags [:logseq.class/Page])))

(defn- add-uuid-to-page-map [m page-names-to-uuids]
  (assoc m :block/uuid (get-page-uuid page-names-to-uuids (:block/name m) {:block m})))

(defn- content-without-tags-ignore-case
  "Ignore case because tags in content can have any case and still have a valid ref"
  [content tags]
  (->
   (reduce
    (fn [content tag]
      (-> content
          (common-util/replace-ignore-case (str "#" tag) "")
          (common-util/replace-ignore-case (str "#" page-ref/left-brackets tag page-ref/right-brackets) "")))
    content
    (sort > tags))
   (string/trim)))

(defn- update-block-tags
  [block db {:keys [remove-inline-tags?] :as user-options} per-file-state all-idents]
  (let [block'
        (if (seq (:block/tags block))
          (let [original-tags (remove #(or (:block.temp/new-class %)
                                           ;; Filter out new classes already set on a block e.g. :logseq.class/Query
                                           (logseq-class-ident? %))
                                      (:block/tags block))
                convert-tag?' #(convert-tag? (:block/name %) user-options)]
            (cond-> block
              remove-inline-tags?
              (update :block/title
                      content-without-tags-ignore-case
                      (->> original-tags
                           (filter convert-tag?')
                           (map :block/title)))
              true
              (update :block/title
                      db-content/replace-tags-with-id-refs
                      (->> original-tags
                           (remove convert-tag?')
                           (map #(add-uuid-to-page-map % (:page-names-to-uuids per-file-state)))))
              true
              (update :block/tags convert-tags-to-classes db per-file-state user-options all-idents)))
          block)]
    block'))

(defn- update-block-marker
  "If a block has a marker, convert it to a task object"
  [block {:keys [log-fn]}]
  (if-let [marker (:block/marker block)]
    (let [old-to-new {"TODO" :logseq.property/status.todo
                      "LATER" :logseq.property/status.todo
                      "IN-PROGRESS" :logseq.property/status.doing
                      "NOW" :logseq.property/status.doing
                      "DOING" :logseq.property/status.doing
                      "DONE" :logseq.property/status.done
                      "WAIT" :logseq.property/status.backlog
                      "WAITING" :logseq.property/status.backlog
                      "CANCELED" :logseq.property/status.canceled
                      "CANCELLED" :logseq.property/status.canceled}
          status-ident (or (old-to-new marker)
                           (do
                             (log-fn :invalid-todo (str (pr-str marker) " is not a valid marker so setting it to TODO"))
                             :logseq.property/status.todo))]
      (-> block
          (assoc :logseq.property/status status-ident)
          (update :block/title string/replace-first (re-pattern (str marker "\\s*")) "")
          (update :block/tags (fnil conj []) :logseq.class/Task)
          (dissoc :block/marker)))
    block))

(defn- update-block-priority
  [block {:keys [log-fn]}]
  (if-let [priority (:block/priority block)]
    (let [old-to-new {"A" :logseq.property/priority.high
                      "B" :logseq.property/priority.medium
                      "C" :logseq.property/priority.low}
          priority-value (or (old-to-new priority)
                             (do
                               (log-fn :invalid-priority (str (pr-str priority) " is not a valid priority so setting it to low"))
                               :logseq.property/priority.low))]
      (-> block
          (assoc :logseq.property/priority priority-value)
          (update :block/title string/replace-first (re-pattern (str "\\[#" priority "\\]" "\\s*")) "")
          (dissoc :block/priority)))
    block))

(defn- get-date-formatter
  [config]
  (or
   (:journal/page-title-format config)
   ;; for compatibility
   (:date-formatter config)
   "MMM do, yyyy"))

(defn- journal-entity?
  [entity]
  (or (entity-util/journal? entity)
      (identical? "journal" (:block/type entity))))

(defn- page-entity?
  [entity]
  (or (entity-util/page? entity)
      (contains? #{"page" "journal"} (:block/type entity))))

(defn- find-or-create-deadline-scheduled-value
  "Given a :block/scheduled or :block/deadline value, creates the datetime property value
   and any optional journal tx associated with that value"
  [date-int page-names-to-uuids user-config]
  (let [title (date-time-util/int->journal-title date-int (get-date-formatter user-config))
        existing-journal-page (some->> title
                                       common-util/page-name-sanity-lc
                                       (get @page-names-to-uuids)
                                       (hash-map :block/uuid))
        journal-page (-> (or existing-journal-page
                             (let [page-m (sqlite-util/build-new-page title)]
                               (assoc page-m
                                      :block/uuid (common-uuid/gen-uuid :journal-page-uuid date-int)
                                      :block/journal-day date-int)))
                         (assoc :block/tags #{:logseq.class/Journal}))
        time-long (tc/to-long (date-time-util/int->local-date date-int))]
    {:property-value time-long
     :journal-tx (when-not existing-journal-page [journal-page])}))

(defn- update-block-deadline-and-scheduled
  "Converts :block/deadline and :block/scheduled to their new logseq properties."
  [block page-names-to-uuids {:keys [user-config]}]
  (let [{deadline-value :property-value deadline-tx :journal-tx}
        (when (:block/deadline block)
          (find-or-create-deadline-scheduled-value (:block/deadline block) page-names-to-uuids user-config))
        {scheduled-value :property-value scheduled-tx :journal-tx}
        (when (:block/scheduled block)
          (find-or-create-deadline-scheduled-value (:block/scheduled block) page-names-to-uuids user-config))]
    {:block
     (cond-> (dissoc block :block/deadline :block/scheduled :block/repeated?)
       (some? deadline-value)
       (assoc :logseq.property/deadline deadline-value)
       (some? scheduled-value)
       (assoc :logseq.property/scheduled scheduled-value))
     :properties-tx (distinct (concat deadline-tx scheduled-tx))}))

(defn- text-with-refs?
  "Detects if a property value has text with refs e.g. `#Logseq is #awesome`
  instead of `#Logseq #awesome`. If so the property type is :default instead of :page"
  [prop-vals val-text]
  (let [replace-regex (re-pattern
                       ;; Regex removes all characters of a tag or page-ref
                       ;; so that only ref chars are left
                       (str "([#[])"
                            "("
                            ;; Sorts ref names in descending order so that longer names
                            ;; come first. Order matters since (foo-bar|foo) correctly replaces
                            ;; "foo-bar" whereas (foo|foo-bar) does not
                            (->> prop-vals (sort >) (map common-util/escape-regex-chars) (string/join "|"))
                            ")"))
        remaining-text (string/replace val-text replace-regex "$1")
        non-ref-char (some #(if (or (string/blank? %) (#{"[" "]" "," "#"} %))
                              false
                              %)
                           remaining-text)]
    (some? non-ref-char)))

(defn- create-property-ident [db all-idents property-name]
  (let [db-ident (->> (db-property/create-user-property-ident-from-name (name property-name))
                      ;; TODO: Detect new ident conflicts within same page
                      (db-ident/ensure-unique-db-ident db))]
    (swap! all-idents assoc property-name db-ident)))

(defn- get-ident [all-idents kw]
  (if (and (qualified-keyword? kw) (db-property/logseq-property? kw))
    kw
    (or (get all-idents kw)
        (throw (ex-info (str "No ident found for " (pr-str kw)) {})))))

(defn- get-property-schema [property-schemas kw]
  (or (get property-schemas kw)
      (throw (ex-info (str "No property schema found for " (pr-str kw)) {}))))

(defn- infer-property-schema-and-get-property-change
  "Infers a property's schema from the given _user_ property value and adds new ones to
  the property-schemas atom. If a property's :logseq.property/type changes, returns a map of
  the schema attribute changed and how it changed e.g. `{:type {:from :default :to :url}}`"
  [db prop-val prop prop-val-text refs {:keys [property-schemas all-idents]} macros]
  ;; Explicitly fail an unexpected case rather than cause silent downstream failures
  (when (and (coll? prop-val) (not (every? string? prop-val)))
    (throw (ex-info (str "Import cannot infer schema of unknown property value " (pr-str prop-val))
                    {:value prop-val :property prop})))
  (let [prop-type (cond (and (coll? prop-val)
                             (seq prop-val)
                             (set/subset? prop-val
                                          (set (keep #(when (journal-entity? %)
                                                        (:block/title %)) refs))))
                        :date
                        (and (coll? prop-val) (seq prop-val) (text-with-refs? prop-val prop-val-text))
                        :default
                        (coll? prop-val)
                        :node
                        :else
                        (db-property-type/infer-property-type-from-value
                         (macro-util/expand-value-if-macro prop-val macros)))
        prev-type (get-in @property-schemas [prop :logseq.property/type])]
    ;; Create new property
    (when-not (get @property-schemas prop)
      (create-property-ident db all-idents prop)
      (let [schema (cond-> {:logseq.property/type prop-type}
                     (#{:node :date} prop-type)
                     ;; Assume :many for now as detecting that detecting property values across files are consistent
                     ;; isn't possible yet
                     (assoc :db/cardinality :many))]
        (swap! property-schemas assoc prop schema)))
    (when (and prev-type (not= prev-type prop-type))
      {:type {:from prev-type :to prop-type}})))

(defn- get-file-pid
  "Gets file graph property id given the db graph ident"
  [db-ident]
  ;; Map of unique cases where the db graph keyword name is different than the file graph id
  (let [unique-file-ids {:logseq.property/order-list-type :logseq.order-list-type
                         :logseq.property/publishing-public? :public}]
    (or (get unique-file-ids db-ident)
        (keyword (name db-ident)))))

(def built-in-property-file-to-db-idents
  "Map of built-in property file ids to their db graph idents"
  (->> (keys db-property/built-in-properties)
       (map (fn [k]
              [(get-file-pid k) k]))
       (into {})))

(def all-built-in-property-file-ids
  "All built-in property file ids as a set of keywords"
  (-> built-in-property-file-to-db-idents keys set
      ;; built-in-properties that map to new properties
      (set/union #{:filters :query-table :query-properties :query-sort-by :query-sort-desc :hl-stamp :file :file-path})))

;; TODO: Review whether this should be using :block/title instead of file graph ids
(def all-built-in-names
  "All built-in properties and classes as a set of keywords"
  (set/union all-built-in-property-file-ids
             ;; This should list all new pages introduced with db graph
             (set (->> db-class/built-in-classes
                       vals
                       (map :title)
                       (concat [common-config/library-page-name])
                       (map #(-> % string/lower-case keyword))))))

(def file-built-in-property-names
  "File-graph built-in property names that are supported. Expressed as set of keywords"
  #{:alias :tags :background-color :heading
    :query-table :query-properties :query-sort-by :query-sort-desc
    :ls-type :hl-type :hl-color :hl-page :hl-stamp :hl-value :file :file-path
    :logseq.order-list-type :icon :public :exclude-from-graph-view :filters})

(assert (set/subset? file-built-in-property-names all-built-in-property-file-ids)
        "All file-built-in properties are used in db graph")

(def query-table-special-keys
  "Special keywords in previous query table"
  {:page :block/title
   :block :block/title
   :tags :block/tags
   :alias :block/alias
   :created-at :block/created-at
   :updated-at :block/updated-at})

(defn- translate-query-properties [prop-value all-idents options]
  (let [property-classes (set (map keyword (:property-classes options)))]
    (try
      (->> (edn/read-string prop-value)
           (keep #(cond (get query-table-special-keys %)
                        (get query-table-special-keys %)
                        (property-classes %)
                        :block/tags
                        (= :tags %)
                         ;; This could also be :logseq.property/page-tags
                        :block/tags
                        :else
                        (get-ident @all-idents %)))
           distinct
           vec)
      (catch :default e
        (js/console.error "Translating query properties failed with:" e)
        []))))

(defn- translate-linked-ref-filters
  [prop-value page-names-to-uuids]
  (try
    (let [filters (edn/read-string prop-value)
          filter-by (group-by val filters)
          includes (->> (filter-by true)
                        (map first)
                        (keep #(or (get @page-names-to-uuids %)
                                   (js/console.error (str "No uuid found for linked reference filter page " (pr-str %)))))
                        (mapv #(vector :block/uuid %)))
          excludes (->> (filter-by false)
                        (map first)
                        (keep #(or (get @page-names-to-uuids %)
                                   (js/console.error (str "No uuid found for linked reference filter page " (pr-str %)))))
                        (mapv #(vector :block/uuid %)))]
      (cond-> []
        (seq includes)
        (conj [:logseq.property.linked-references/includes includes])
        (seq excludes)
        (conj [:logseq.property.linked-references/excludes excludes])))
    (catch :default e
      (js/console.error "Translating linked reference filters failed with: " e))))

(defn- update-built-in-property-values
  [props page-names-to-uuids {:keys [ignored-properties all-idents]} {:block/keys [title name]} options]
  (let [m
        (->> props
             (mapcat (fn [[prop prop-value]]
                       (if (#{:icon :file :file-path :hl-stamp} prop)
                         (do (swap! ignored-properties
                                    conj
                                    {:property prop :value prop-value :location (if name {:page name} {:block title})})
                             nil)
                         (case prop
                           :query-properties
                           (when-let [cols (not-empty (translate-query-properties prop-value all-idents options))]
                             [[:logseq.property.table/ordered-columns cols]])
                           :query-table
                           [[:logseq.property.view/type
                             (if prop-value :logseq.property.view/type.table :logseq.property.view/type.list)]]
                           :query-sort-by
                           [[:logseq.property.table/sorting
                             [{:id (or (query-table-special-keys (keyword prop-value))
                                       (get-ident @all-idents (keyword prop-value)))
                               :asc? true}]]]
                           ;; ignore to handle below
                           :query-sort-desc
                           nil
                           :filters
                           (translate-linked-ref-filters prop-value page-names-to-uuids)
                           :ls-type
                           [[:logseq.property/ls-type (keyword prop-value)]]
                           :hl-color
                           (let [color-text-idents
                                 (->> (get-in db-property/built-in-properties [:logseq.property.pdf/hl-color :closed-values])
                                      (map (juxt :value :db-ident))
                                      (into {}))]
                             [[:logseq.property.pdf/hl-color (get color-text-idents prop-value)]])
                           ;; else
                           [[(built-in-property-file-to-db-idents prop) prop-value]]))))
             (into {}))]
    (cond-> m
      (and (contains? props :query-sort-desc) (:query-sort-by props))
      (update :logseq.property.table/sorting
              (fn [v]
                (assoc-in v [0 :asc?] (not (:query-sort-desc props))))))))

(defn- update-page-or-date-values
  "Converts :node or :date names to entity values"
  [page-names-to-uuids property-values]
  (set (map #(vector :block/uuid
                     ;; assume for now a ref's :block/name can always be translated by lc helper
                     (get-page-uuid page-names-to-uuids (common-util/page-name-sanity-lc %) {:original-name %}))
            property-values)))

(defn- handle-changed-property
  "Handles a property's schema changing across blocks. Handling usually means
  converting a property value to a new changed value or nil if the property is
  to be ignored. Sometimes handling a property change results in changing a
  property's previous usages instead of its current value e.g. when changing to
  a :default type. This is done by adding an entry to upstream-properties and
  building the additional tx to ensure this happens"
  [val prop page-names-to-uuids properties-text-values
   {:keys [ignored-properties property-schemas]}
   {:keys [property-changes log-fn upstream-properties]}]
  (let [type-change (get-in property-changes [prop :type])]
    (cond
      ;; ignore :to as any property value gets stringified
      (= :default (:from type-change))
      (or (get properties-text-values prop) (str val))

      ;; treat it the same as a :node
      (= {:from :node :to :date} type-change)
      (update-page-or-date-values page-names-to-uuids val)

      ;; Change to :node as dates can be pages but pages can't be dates
      (= {:from :date :to :node} type-change)
      (do
        (swap! property-schemas assoc-in [prop :logseq.property/type] :node)
        (update-page-or-date-values page-names-to-uuids val))

      ;; Unlike the other property changes, this one changes all the previous values of a property
      ;; in order to accommodate the change
      (= :default (:to type-change))
      (if (get @upstream-properties prop)
        ;; Ignore more than one property schema change per file to keep it simple
        (do
          (log-fn :prop-to-change-ignored {:property prop :val val :change type-change})
          (swap! ignored-properties conj {:property prop :value val :schema (get property-changes prop)})
          nil)
        (do
          (swap! upstream-properties assoc prop {:schema {:logseq.property/type :default}
                                                 :from-type (:from type-change)})
          (swap! property-schemas assoc prop {:logseq.property/type :default})
          (get properties-text-values prop)))

      :else
      (do
        (log-fn :prop-change-ignored {:property prop :val val :change type-change})
        (swap! ignored-properties conj {:property prop :value val :schema (get property-changes prop)})
        nil))))

(defn- update-user-property-values
  [props page-names-to-uuids properties-text-values
   {:keys [property-schemas] :as import-state}
   {:keys [property-changes] :as options}]
  (->> props
       (keep (fn [[prop val]]
               (if (get-in property-changes [prop :type])
                 (when-let [val' (handle-changed-property val prop page-names-to-uuids properties-text-values import-state options)]
                   [prop val'])
                 [prop
                  (if (set? val)
                    (if (= :default (:logseq.property/type (get @property-schemas prop)))
                      (get properties-text-values prop)
                      (update-page-or-date-values page-names-to-uuids val))
                    val)])))
       (into {})))

(defn- ->property-value-tx-m
  "Given a new block and its properties, creates a map of properties which have values of property value tx.
   Similar to sqlite.build/->property-value-tx-m"
  [new-block properties get-schema-fn all-idents]
  (->> properties
       (keep (fn [[k v]]
               (if-let [built-in-type (get-in db-property/built-in-properties [k :schema :type])]
                 (when (and (db-property-type/value-ref-property-types built-in-type)
                            ;; closed values are referenced by their :db/ident so no need to create values
                            (not (get-in db-property/built-in-properties [k :closed-values])))
                   (let [property-map {:db/ident k
                                       :logseq.property/type built-in-type}]
                     [property-map v]))
                 (when (db-property-type/value-ref-property-types (:logseq.property/type (get-schema-fn k)))
                   (let [property-map (merge
                                       {:db/ident (get-ident all-idents k)
                                        :original-property-id k}
                                       (get-schema-fn k))]
                     [property-map v])))))
       (db-property-build/build-property-values-tx-m new-block)))

(defn- build-properties-and-values
  "For given block properties, builds property values tx and returns a map with
  updated properties in :block-properties and any property values tx in :pvalues-tx"
  [props _db page-names-to-uuids
   {:block/keys [properties-text-values] :as block}
   {:keys [import-state user-options] :as options}]
  (let [{:keys [all-idents property-schemas]} import-state
        get-ident' #(get-ident @all-idents %)
        user-properties (apply dissoc props file-built-in-property-names)]
    (when (seq user-properties)
      (swap! (:block-properties-text-values import-state)
             assoc
             ;; For pages, valid uuid is in page-names-to-uuids, not in block
             (if (:block/name block)
               (get-page-uuid page-names-to-uuids ((some-fn ::original-name :block/name) block) {:block block})
               (:block/uuid block))
             properties-text-values))
    ;; TODO: Add import support for :template. Ignore for now as they cause invalid property types
    (if (contains? props :template)
      {}
      (let [props' (-> (update-built-in-property-values
                        (select-keys props file-built-in-property-names)
                        page-names-to-uuids
                        (select-keys import-state [:ignored-properties :all-idents])
                        (select-keys block [:block/name :block/title])
                        (select-keys user-options [:property-classes]))
                       (merge (update-user-property-values user-properties page-names-to-uuids properties-text-values import-state options)))
            pvalue-tx-m (->property-value-tx-m block props' #(get-property-schema @property-schemas %) @all-idents)
            block-properties (-> (merge props' (db-property-build/build-properties-with-ref-values pvalue-tx-m))
                                 (update-keys get-ident'))]
        {:block-properties block-properties
         :pvalues-tx (into (mapcat #(if (set? %) % [%]) (vals pvalue-tx-m)))}))))

(def ignored-built-in-properties
  "Ignore built-in properties that are already imported or not supported in db graphs"
  ;; Already imported via a datascript attribute i.e. have :attribute on property config
  [:tags :alias :collapsed
   ;; Supported
   :id
   ;; Not supported as they have been ignored for a long time and cause invalid built-in pages
   :now :later :doing :done :canceled :cancelled :in-progress :todo :wait :waiting
   ;; deprecated in db graphs
   :background-image :macros :logseq.query/nlp-date
   :card-last-interval :card-repeats :card-last-reviewed :card-next-schedule
   :card-ease-factor :card-last-score
   :logseq.color :logseq.table.borders :logseq.table.stripes :logseq.table.max-width
   :logseq.table.version :logseq.table.compact :logseq.table.headers :logseq.table.hover])

(defn- pre-update-properties
  "Updates page and block properties before their property types are inferred"
  [properties class-related-properties]
  (let [dissoced-props (concat ignored-built-in-properties
                               ;; TODO: Deal with these dissoced built-in properties
                               [:title :created-at :updated-at]
                               class-related-properties)]
    (->> (apply dissoc properties dissoced-props)
         (keep (fn [[prop val]]
                 (if (not (contains? file-built-in-property-names prop))
                  ;; only update user properties
                   (if (string? val)
                    ;; Ignore blank values as they were usually generated by templates
                     (when-not (string/blank? val)
                       [prop
                       ;; handle float strings b/c graph-parser doesn't
                        (or (parse-double val) val)])
                     [prop val])
                   [prop val])))
         (into {}))))

(defn- handle-page-and-block-properties
  "Returns a map of :block with updated block and :properties-tx with any properties tx.
   Handles modifying block properties, updating classes from property-classes
  and removing any deprecated property related attributes. Before updating most
  block properties, their property schemas are inferred as that can affect how
  a property is updated. Only infers property schemas on user properties as
  built-in ones must not change"
  [{:block/keys [properties] :as block} db page-names-to-uuids refs
   {{:keys [property-classes property-parent-classes]} :user-options
    :keys [import-state macros]
    :as options}]
  (-> (if (seq properties)
        (let [classes-from-properties (->> (select-keys properties property-classes)
                                           (mapcat (fn [[_k v]] (if (coll? v) v [v])))
                                           distinct)
              properties' (pre-update-properties properties (into property-classes property-parent-classes))
              properties-to-infer (if (:template properties')
                                    ;; Ignore template properties as they don't consistently have representative property values
                                    {}
                                    (apply dissoc properties' file-built-in-property-names))
              property-changes
              (->> properties-to-infer
                   (keep (fn [[prop val]]
                           (when-let [property-change
                                      (infer-property-schema-and-get-property-change db val prop (get (:block/properties-text-values block) prop) refs import-state macros)]
                             [prop property-change])))
                   (into {}))
              ;; _ (when (seq property-changes) (prn :prop-changes property-changes))
              options' (assoc options :property-changes property-changes)
              {:keys [block-properties pvalues-tx]}
              (build-properties-and-values properties' db page-names-to-uuids
                                           (select-keys block [:block/properties-text-values :block/name :block/title :block/uuid ::original-name])
                                           options')]
          {:block
           (cond-> block
             true
             (merge block-properties)
             (seq classes-from-properties)
             ;; Add a map of {:block.temp/new-class TAG} to be processed later
             (update :block/tags
                     (fn [tags]
                       (let [tags' (if (sequential? tags) tags (set tags))]
                         (into tags' (map #(hash-map :block.temp/new-class %) classes-from-properties))))))
           :properties-tx pvalues-tx})
        {:block block :properties-tx []})
      (update :block dissoc :block/properties :block/properties-text-values :block/properties-order :block/invalid-properties)))

(defn- handle-page-properties
  "Adds page properties including special handling for :logseq.property.class/extends or :block/parent"
  [{:block/keys [properties] :as block*} db {:keys [page-names-to-uuids classes-tx]} refs
   {:keys [user-options log-fn import-state] :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)
        block'
        (if-let [parent-classes-from-properties (->> (select-keys properties (:property-parent-classes user-options))
                                                     (mapcat (fn [[_k v]] (if (coll? v) v [v])))
                                                     distinct
                                                     seq)]
          (let [_ (swap! (:classes-from-property-parents import-state) conj (:block/title block*))
                class-m (find-or-create-class db ((some-fn ::original-title :block/title) block) (:all-idents import-state) block)
                class-m' (-> block
                             (merge class-m)
                             (dissoc :block/namespace)
                             (assoc :logseq.property.class/extends
                                    (let [new-class (first parent-classes-from-properties)
                                          class-m (find-or-create-class db new-class (:all-idents import-state))
                                          class-m' (merge class-m
                                                          {:block/uuid (find-or-gen-class-uuid page-names-to-uuids (common-util/page-name-sanity-lc new-class) (:db/ident class-m))})]
                                      (when (> (count parent-classes-from-properties) 1)
                                        (log-fn :skipped-parent-classes "Only one parent class is allowed so skipped ones after the first one" :classes parent-classes-from-properties))
                                      (when (:new-class? (meta class-m)) (swap! classes-tx conj class-m'))
                                      [:block/uuid (:block/uuid class-m')])))]
            class-m')
          (replace-namespace-with-parent block page-names-to-uuids :block/parent))]
    {:block block' :properties-tx properties-tx}))

(defn- pretty-print-dissoc
  "Remove list of keys from a given map string while preserving whitespace"
  [s dissoc-keys]
  (-> (reduce rewrite/dissoc
              (rewrite/parse-string s)
              dissoc-keys)
      str))

(defn- migrate-advanced-query-string [query-str]
  (try
    (pretty-print-dissoc query-str [:title :group-by-page? :collapsed?])
    (catch :default _e
      ;; rewrite/parse-string can fail on some queries in Advanced Queries in docs graph
      (js/console.error "Failed to parse advanced query string. Falling back to full query string: " (pr-str query-str))
      (if-let [query-map (not-empty (common-util/safe-read-map-string query-str))]
        (pr-str (dissoc query-map :title :group-by-page? :collapsed?))
        query-str))))

(declare extract-block-list ast->text)
(defn- extract-block-list-item
  [{:keys [content items number checkbox]}]
  (let [content* (mapcat #(ast->text % {}) content)
        number* (if number
                  (str number ". ")
                  "* ")
        checkbox* (if (some? checkbox)
                    (if (boolean checkbox)
                      "[X]" "[ ]")
                    "")
        items* (extract-block-list items :in-list? true)]
    (concat [number* checkbox* " "]
            content*
            ["\n"]
            items*
            (when (seq items*) ["\n"]))))

(defn- extract-block-list
  [l & {:keys [in-list?]}]
  (vec (concat (when-not in-list? ["\n"])
               (mapcat extract-block-list-item l)
               (when (and (pos? (count l))
                          (not in-list?))
                 ["\n\n"]))))

(defn- ast->text
  "Given an ast block, convert it to text for use as a block title. This is a
  slimmer version of handler.export.text/export-blocks-as-markdown"
  [ast-block {:keys [log-fn]
              :or {log-fn prn}}]
  (let [extract
        (fn extract [node]
          (let [extract-emphasis
                (fn extract-emphasis [node]
                  (let [[[type'] coll'] node]
                    (case type'
                      "Bold"
                      (vec (concat ["**"] (mapcat extract coll') ["**"]))
                      "Italic"
                      (vec (concat ["*"] (mapcat extract coll') ["*"]))
                      "Strike_through"
                      (vec (concat ["~~"] (mapcat extract coll') ["~~"]))
                      "Highlight"
                      (vec (concat ["^^"] (mapcat extract coll') ["^^"]))
                      (throw (ex-info (str "Failed to wrap Emphasis AST block of type " (pr-str type')) {})))))]
            (cond
              (and (vector? node) (#{"Inline_Html" "Plain" "Inline_Hiccup"} (first node)))
              [(second node)]
              (and (vector? node) (#{"Break_Line" "Hard_Break_Line"} (first node)))
              ["\n"]
              (and (vector? node) (= (first node) "Link"))
              [(:full_text (second node))]
              (and (vector? node) (#{"Paragraph" "Quote"} (first node)))
              (mapcat extract (second node))
              (and (vector? node) (= (first node) "Tag"))
              (into ["#"] (mapcat extract (second node)))
              (and (vector? node) (= (first node) "Emphasis"))
              (extract-emphasis (second node))
              (and (vector? node) (= ["Custom" "query"] (take 2 node)))
              [(get node 4)]
              (and (vector? node) (= (first node) "Code"))
              ["`" (second node) "`"]
              (and (vector? node) (= "Macro" (first node)) (= "query" (:name (second node))))
              (:arguments (second node))
              (and (vector? node) (= (first node) "Example"))
              (second node)
              (and (vector? node) (= (first node) "Latex_Fragment"))
              (let [[type' content] (second node)
                    wrapper (case type' "Inline" "$" "Displayed" "$$")]
                [wrapper content wrapper])
              (and (vector? node) (= (first node) "Src"))
              [(str "\n```" (when-let [lang (:language (second node))] lang))
               (apply str "\n" (:lines (second node)))
               "```"]
              (and (vector? node) (= (first node) "Displayed_Math"))
              ["$$" (second node) "$$"]
              (and (vector? node) (= (first node) "List"))
              (extract-block-list (second node))
              :else
              (do
                (log-fn :ast->text "Ignored ast node" :node node)
                []))))]
    (->> (extract ast-block)
        ;;  ((fn [x] (prn :X x) x))
         (apply str)
         string/trim)))

;; {:url ["Complex" {:protocol "zotero", :link "select/library/items/6VCW9QFJ"}], :label [["Plain" "Dechow and Struppa - 2015 - Intertwingled.pdf"]], :full_text "[Dechow and Struppa - 2015 - Intertwingled.pdf](zotero://select/library/items/6VCW9QFJ)", :metadata ""}
(defn- get-zotero-local-pdf-path
  [config m]
  (when (= "zotero" (:protocol (second (:url m))))
    (let [link (:link (second (:url m)))
          label (second (first (:label m)))
          id (last (string/split link #"/"))]
      (when (and link id label)
        (when-let [zotero-data-dir (get-in config [:zotero/settings-v2 "default" :zotero-data-directory])]
          {:link (str "zotero://" link)
           :path (node-path/join zotero-data-dir "storage" id label)
           :base label})))))

(defn- walk-ast-blocks
  "Walks each ast block in order to its full depth. Saves multiple ast types for
  use in build-block-tx. This walk is only done once for perf reasons"
  [config ast-blocks]
  (let [results (atom {:simple-queries []
                       :asset-links []
                       :embeds []})]
    (walk/prewalk
     (fn [x]
       (cond
         (and (vector? x)
              (= "Link" (first x))
              (let [path-or-map (second (:url (second x)))]
                (cond
                  (string? path-or-map)
                  (or (common-config/local-relative-asset? path-or-map)
                      (string/ends-with? path-or-map ".pdf"))
                  (and (map? path-or-map) (= "zotero" (:protocol path-or-map)) (string? (:link path-or-map)))
                  (:link (get-zotero-local-pdf-path config (second x)))
                  :else
                  nil)))
         (swap! results update :asset-links conj x)
         (and (vector? x)
              (= "Macro" (first x))
              (= "embed" (:name (second x))))
         (swap! results update :embeds conj x)
         (and (vector? x)
              (= "Macro" (first x))
              (= "query" (:name (second x))))
         (swap! results update :simple-queries conj x))
       x)
     ast-blocks)
    @results))

(defn- handle-queries
  "If a block contains a simple or advanced queries, converts block to a #Query node"
  [{:block/keys [title] :as block} db page-names-to-uuids walked-ast-blocks options]
  (if-let [query (some-> (first (:simple-queries walked-ast-blocks))
                         (ast->text (select-keys options [:log-fn]))
                         string/trim)]
    (let [props {:logseq.property/query query}
          {:keys [block-properties pvalues-tx]}
          (build-properties-and-values props db page-names-to-uuids
                                       (select-keys block [:block/properties-text-values :block/name :block/title :block/uuid])
                                       options)
          block'
          (-> (update block :block/tags (fnil conj []) :logseq.class/Query)
              (merge block-properties
                     {:block/title (string/trim (string/replace-first title #"\{\{query(.*)\}\}" ""))}))]
      {:block block'
       :pvalues-tx pvalues-tx})
    (if-let [advanced-query (some-> (first (filter #(= ["Custom" "query"] (take 2 %)) (:block.temp/ast-blocks block)))
                                    (ast->text (select-keys options [:log-fn]))
                                    string/trim)]
      (let [props {:logseq.property/query (migrate-advanced-query-string advanced-query)}
            {:keys [block-properties pvalues-tx]}
            (build-properties-and-values props db page-names-to-uuids
                                         (select-keys block [:block/properties-text-values :block/name :block/title :block/uuid])
                                         options)
            pvalues-tx'
            (concat pvalues-tx [{:block/uuid (second (:logseq.property/query block-properties))
                                 :logseq.property.code/lang "clojure"
                                 :logseq.property.node/display-type :code}])
            block'
            (let [query-map (common-util/safe-read-map-string advanced-query)]
              (cond-> (update block :block/tags (fnil conj []) :logseq.class/Query)
                true
                (merge block-properties)
                true
                (assoc :block/title
                       (or (when-let [title' (:title query-map)]
                             (if (string? title') title' (pr-str title')))
                           ;; Put all non-query content in title for now
                           (string/trim (string/replace-first title #"(?s)#\+BEGIN_QUERY(.*)#\+END_QUERY" ""))))
                (:collapsed? query-map)
                (assoc :block/collapsed? true)))]
        {:block block'
         :pvalues-tx pvalues-tx'})
      {:block block})))

(defn- handle-block-properties
  "Does everything page properties does and updates a couple of block specific attributes"
  [block* db page-names-to-uuids refs walked-ast-blocks
   {{:keys [property-classes]} :user-options :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)
        {block' :block :keys [pvalues-tx]} (handle-queries block db page-names-to-uuids walked-ast-blocks options)]
    {:block
     (cond-> block'
       (and (seq property-classes) (seq (:block/refs block*)))
       ;; remove unused, nonexistent property page
       (update :block/refs (fn [refs] (remove #(property-classes (keyword (:block/name %))) refs))))
     :properties-tx (concat properties-tx (when pvalues-tx pvalues-tx))}))

(defn- update-block-refs
  "Updates the attributes of a block ref as this is where a new page is defined. Also
   updates block content effected by refs"
  [block page-names-to-uuids]
  (if (seq (:block/refs block))
    (cond-> block
      true
      (update
       :block/refs
       (fn [refs]
         (mapv (fn [ref]
                 ;; Only keep :block/uuid as we don't want to re-transact page refs
                 (if (map? ref)
                   ;; a new page's uuid can change across blocks so rely on consistent one from pages-tx
                   (if-let [existing-uuid (some->> (:block/name ref) (get @page-names-to-uuids))]
                     [:block/uuid existing-uuid]
                     [:block/uuid (:block/uuid ref)])
                   ref))
               refs)))
      (:block/title block)
      (assoc :block/title
             (let [refs (->> (:block/refs block)
                             (remove #(or (and (vector? %) (= :block/uuid (first %)))
                                          ;; ignore deadline related refs that don't affect content
                                          (and (keyword? %) (db-malli-schema/internal-ident? %))))
                             (map #(add-uuid-to-page-map % page-names-to-uuids)))]
               (db-content/title-ref->id-ref (:block/title block) refs {:replace-tag? false}))))
    block))

(defn- fix-pre-block-references
  "Point pre-block children to parents since pre blocks don't exist in db graphs"
  [{:block/keys [parent] :as block} pre-blocks page-names-to-uuids]
  (cond-> block
    (and (vector? parent) (contains? pre-blocks (second parent)))
    (assoc :block/parent [:block/uuid (get-page-uuid page-names-to-uuids (second (:block/page block)) {:block block :block/page (:block/page block)})])))

(defn- fix-block-name-lookup-ref
  "Some graph-parser attributes return :block/name as a lookup ref. This fixes
  those to use uuids since block/name is not unique for db graphs"
  [block page-names-to-uuids]
  (cond-> block
    (= :block/name (first (:block/page block)))
    (assoc :block/page [:block/uuid (get-page-uuid page-names-to-uuids (second (:block/page block)) {:block block :block/page (:block/page block)})])
    (:block/name (:block/parent block))
    (assoc :block/parent {:block/uuid (get-page-uuid page-names-to-uuids (:block/name (:block/parent block)) {:block block :block/parent (:block/parent block)})})))

(defn asset-path->name
  "Given an asset's relative or full path, create a unique name for identifying an asset.
   Must handle to paths as ../assets/*, assets/* and with subdirectories"
  [path]
  (when (string? path)
    (or (re-find #"assets/.*$" path)
        ;; pdf outside logseq graphs
        (when (string/ends-with? path ".pdf")
          path))))

(defn- update-asset-links-in-block-title [block-title asset-name-to-uuids ignored-assets]
  (reduce (fn [acc [asset-name asset-uuid]]
            (let [new-title (string/replace acc
                                            (re-pattern (str "!?\\[[^\\]]*?\\]\\([^\\)]*?"
                                                             (common-util/escape-regex-chars asset-name)
                                                             "\\)(\\{[^}]*\\})?"))
                                            (page-ref/->page-ref asset-uuid))]
              (when (string/includes? new-title asset-name)
                (swap! ignored-assets conj
                       {:reason "Some asset links were not updated to block references"
                        :path asset-name
                        :location {:block new-title}}))
              new-title))
          block-title
          asset-name-to-uuids))

(defn find-annotation-children-blocks
  "Given a list of blocks and a set of parent uuids, return all blocks that are
   descendants via :block/parent of given parent uuids"
  [blocks parent-uuids]
  (let [get-descendant-uuids
        (fn get-descendant-uuids [acc-uuids seen]
          (let [new-blocks (filter #(contains? acc-uuids (second (:block/parent %))) blocks)
                new-uuids  (set (map :block/uuid new-blocks))
                unseen     (set/difference new-uuids seen)]
            (if (empty? unseen)
              seen
              (recur unseen (set/union seen unseen)))))
        parent-and-descendant-uuids (get-descendant-uuids parent-uuids parent-uuids)
        only-descendants (set/difference parent-and-descendant-uuids parent-uuids)]
    (filter #(contains? only-descendants (:block/uuid %)) blocks)))

(defn- build-annotation-block
  [m color-text-idents parent-asset image-asset-name-to-uuids md-blocks {:keys [log-fn] :or {log-fn prn}}]
  (let [user-attributes
        {:logseq.property.pdf/hl-color (get color-text-idents (get-in m [:properties :color]))
         :logseq.property.pdf/hl-page (:page m)
         :block/title (get-in m [:content :text])}
        _ (when (some (comp nil? val) user-attributes)
            (log-fn :missing-annotation-attributes "Annotation is missing some attributes so set reasonable defaults for them"
                    {:annotation user-attributes :asset (:block/title parent-asset)}))
        asset-image-uuid (some (fn [[asset-name image-uuid]]
                                 (when (string/includes? asset-name
                                                         (str (:id m)
                                                              (when (get-in m [:content :image])
                                                                (str "_" (get-in m [:content :image])))))
                                   image-uuid))
                               image-asset-name-to-uuids)
        md-block (get md-blocks (:id m))
        annotation (merge
                     ;; Reasonable defaults for user attributes
                    {:logseq.property.pdf/hl-color :logseq.property/color.yellow
                     :logseq.property.pdf/hl-page 1
                     :block/title ""}
                    user-attributes
                    {:block/uuid (:id m)
                     :block/order (db-order/gen-key)
                     :logseq.property/ls-type :annotation
                     :logseq.property.pdf/hl-value m
                     :logseq.property/asset [:block/uuid (:block/uuid parent-asset)]
                     :block/tags [:logseq.class/Pdf-annotation]
                     :block/parent [:block/uuid (:block/uuid parent-asset)]
                     :block/page :logseq.class/Asset}
                    (when asset-image-uuid
                      {:logseq.property.pdf/hl-image [:block/uuid asset-image-uuid]
                       :logseq.property.pdf/hl-type :area})
                    (when md-block
                      (select-keys md-block [:block/title])))]
    (sqlite-util/block-with-timestamps annotation)))

(defn- build-pdf-annotations-tx*
  "Creates annotations for a pdf asset given the asset's edn map and parsed markdown file"
  [asset-edn-map parsed-md parent-asset image-asset-name-to-uuids opts]
  (let [color-text-idents
        (->> (get-in db-property/built-in-properties [:logseq.property.pdf/hl-color :closed-values])
             (map (juxt :value :db-ident))
             (into {}))
        md-blocks
        (->> parsed-md
             :blocks
             ;; Currently we can only import text of any md annotation blocks. No tags or properties
             (map #(vector (:block/uuid %)
                           (select-keys % [:block/title :block/order :block/parent :block/uuid])))
             (into {}))
        annotation-blocks
        (mapv #(build-annotation-block % color-text-idents parent-asset image-asset-name-to-uuids md-blocks opts)
              (get-in asset-edn-map [:edn-content :highlights]))
        md-children-blocks*
        (find-annotation-children-blocks (vals md-blocks) (set (map :id (get-in asset-edn-map [:edn-content :highlights]))))
        md-children-blocks (keep #(sqlite-util/block-with-timestamps (merge % {:block/page :logseq.class/Asset}))
                                 md-children-blocks*)]
    (into annotation-blocks md-children-blocks)))

(defn- build-new-asset [asset-data]
  (merge (sqlite-util/block-with-timestamps
          {:block/order (db-order/gen-key)
           :block/page :logseq.class/Asset
           :block/parent :logseq.class/Asset})
         {:block/tags [:logseq.class/Asset]
          :logseq.property.asset/type (:type asset-data)
          :logseq.property.asset/checksum (:checksum asset-data)
          :logseq.property.asset/size (:size asset-data)}
         (when-let [external-url (:external-url asset-data)]
           {:logseq.property.asset/external-url external-url
            :logseq.property.asset/external-file-name (:external-file-name asset-data)})))

(defn- get-asset-block-id
  [assets path]
  (get-in @assets [path :asset-id]))

(defn- build-annotation-images
  "Builds tx for annotation images and provides a map for mapping image asset names
   to their new uuids"
  [parent-asset-path assets {:keys [notify-user]}]
  (let [image-dir (string/replace-first parent-asset-path #"(?i)\.pdf$" "")
        image-paths (filter #(= image-dir (node-path/dirname %)) (keys @assets))
        txs (keep #(let [asset-id (get-asset-block-id assets %)]
                     (if-not asset-id
                       (notify-user {:msg (str "Skipped creating asset " (pr-str %) " because it has no asset id")
                                     :level :error})
                       (let [new-asset (merge (build-new-asset (get @assets %))
                                              {:block/title "pdf area highlight"
                                               :block/uuid asset-id})]
                         (swap! assets assoc-in [% :asset-created?] true)
                         new-asset)))
                  image-paths)]
    {:txs txs
     :image-asset-name-to-uuids
     (->> (map (fn [image-path tx]
                 [(node-path/basename image-path) (:block/uuid tx)]) image-paths txs)
          (into {}))}))

;; Reference same default class in cljs + nbb without needing .cljc
(def sanitizeFilename' (if (find-ns 'nbb.core) (aget sanitizeFilename "default") sanitizeFilename))

(defn safe-sanitize-file-name
  "Sanitizes filenames for pdf assets"
  [s]
  (sanitizeFilename' (str s)))

(defn- build-pdf-annotations-tx
  "Builds tx for pdf annotations when a pdf has an annotations EDN file under assets/"
  [parent-asset-path assets parent-asset pdf-annotation-pages opts]
  (let [asset-edn-path (node-path/join common-config/local-assets-dir
                                       (safe-sanitize-file-name
                                        (node-path/basename (string/replace-first parent-asset-path #"(?i)\.pdf$" ".edn"))))
        asset-md-name (str "hls__" (safe-sanitize-file-name
                                    (node-path/basename (string/replace-first parent-asset-path #"(?i)\.pdf$" ".md"))))]
    (when-let [asset-edn-map (get @assets asset-edn-path)]
      (let [{:keys [txs image-asset-name-to-uuids]} (build-annotation-images parent-asset-path assets opts)]
        (concat txs
                (build-pdf-annotations-tx* asset-edn-map (get @pdf-annotation-pages asset-md-name) parent-asset image-asset-name-to-uuids opts))))))

(defn- <handle-assets-in-block
  "If a block contains assets, creates them as #Asset nodes in the Asset page and references them in the block."
  [block {:keys [asset-links]} {:keys [assets ignored-assets pdf-annotation-pages]} {:keys [notify-user <get-file-stat user-config] :as opts}]
  (if (seq asset-links)
    (p/let [asset-maps* (p/all (map
                                (fn [asset-link]
                                  (p/let [path* (-> asset-link second :url second)
                                          zotero-asset? (when (map? path*)
                                                          (= "zotero" (:protocol (second (:url (second asset-link))))))
                                          {:keys [path link base]} (if (map? path*)
                                                                     (get-zotero-local-pdf-path user-config (second asset-link))
                                                                     {:path path*})
                                          asset-name (some-> path asset-path->name)
                                          asset-link-or-name (or link (some-> path asset-path->name))
                                          asset-data* (when asset-link-or-name (get @assets asset-link-or-name))
                                          _ (when (and asset-link-or-name
                                                       (not asset-data*)
                                                       (string/ends-with? path ".pdf")
                                                       (fn? <get-file-stat)) ; external pdf
                                              (->
                                               (p/let [^js stat (<get-file-stat path)]
                                                 (swap! assets assoc asset-link-or-name
                                                        {:asset-id (d/squuid)
                                                         :type "pdf"
                                                         ;; avoid using the real checksum since it could be the same with in-graph asset
                                                         :checksum "0000000000000000000000000000000000000000000000000000000000000000"
                                                         :size (.-size stat)
                                                         :external-url (or link path)
                                                         :external-file-name base}))
                                               (p/catch (fn [error]
                                                          (js/console.error error)))))
                                          asset-data (when asset-link-or-name (get @assets asset-link-or-name))]
                                    (if asset-data
                                      (cond
                                        (not (get-asset-block-id assets asset-link-or-name))
                                        (notify-user {:msg (str "Skipped creating asset " (pr-str asset-link-or-name) " because it has no asset id")
                                                      :level :error})

                                        ;; If asset tx is already built, no need to do it again
                                        (:asset-created? asset-data)
                                        {:asset-name-uuid [asset-link-or-name (:asset-id asset-data)]}

                                        :else
                                        (let [new-asset (merge (build-new-asset asset-data)
                                                               {:block/title (db-asset/asset-name->title (node-path/basename asset-name))
                                                                :block/uuid (get-asset-block-id assets asset-link-or-name)}
                                                               (when-let [metadata (not-empty (common-util/safe-read-map-string (:metadata (second asset-link))))]
                                                                 {:logseq.property.asset/resize-metadata metadata}))
                                              pdf-annotations-tx (when (= "pdf" (path/file-ext asset-link-or-name))
                                                                   (build-pdf-annotations-tx asset-link-or-name assets new-asset pdf-annotation-pages opts))
                                              asset-tx (concat [new-asset] pdf-annotations-tx)]
                                          ;; (prn :asset-added! (node-path/basename asset-name))
                                          ;; (cljs.pprint/pprint asset-link)
                                          ;; (prn :debug :asset-tx asset-tx)
                                          (swap! assets assoc-in [asset-link-or-name :asset-created?] true)
                                          {:asset-name-uuid [asset-link-or-name (:block/uuid new-asset)]
                                           :asset-tx asset-tx}))
                                      (when-not zotero-asset? ; no need to report warning for zotero managed pdf files
                                        (swap! ignored-assets conj
                                               {:reason "No asset data found for this asset path"
                                                :path (-> asset-link second :url second)
                                                :location {:block (:block/title block)}})
                                        nil))))
                                asset-links))
            asset-maps (remove nil? asset-maps*)
            asset-blocks (mapcat :asset-tx asset-maps)
            asset-names-to-uuids
            (into {} (map :asset-name-uuid asset-maps))]
      (cond-> {:block
               (update block :block/title update-asset-links-in-block-title asset-names-to-uuids ignored-assets)}
        (seq asset-blocks)
        (assoc :asset-blocks-tx asset-blocks)))
    (p/resolved {:block block})))

(defn- handle-quotes
  "If a block contains a quote, convert block to #Quote node"
  [block opts]
  (if-let [ast-block (first (filter #(= "Quote" (first %)) (:block.temp/ast-blocks block)))]
    (merge block
           {:block/title (ast->text ast-block opts)
            :logseq.property.node/display-type :quote
            :block/tags [:logseq.class/Quote-block]})
    block))

(defn- handle-embeds
  "If a block contains page or block embeds, converts block to a :block/link based embed"
  [block page-names-to-uuids {:keys [embeds]} {:keys [log-fn] :or {log-fn prn}}]
  (if-let [embed-node (first embeds)]
    (cond
      (page-ref/page-ref? (str (first (:arguments (second embed-node)))))
      (let [page-uuid (get-page-uuid page-names-to-uuids
                                     (some-> (text/get-page-name (first (:arguments (second embed-node))))
                                             common-util/page-name-sanity-lc)
                                     {:block block})]
        (merge block
               {:block/title ""
                :block/link [:block/uuid page-uuid]}))
      (block-ref/block-ref? (str (first (:arguments (second embed-node)))))
      (let [block-uuid (uuid (block-ref/get-block-ref-id (first (:arguments (second embed-node)))))]
        (merge block
               {:block/title ""
                :block/link [:block/uuid block-uuid]}))
      :else
      (do
        (log-fn :invalid-embed-arguments "Ignore embed because of invalid arguments" :args (:arguments (second embed-node)))
        block))
    block))

(defn- <build-block-tx
  [db block* pre-blocks {:keys [page-names-to-uuids] :as per-file-state}
   {:keys [import-state journal-created-ats user-config] :as options}]
  ;; (prn ::block-in block*)
  (p/let [walked-ast-blocks (walk-ast-blocks user-config (:block.temp/ast-blocks block*))
        ;; needs to come before update-block-refs to detect new property schemas
          {:keys [block properties-tx]}
          (handle-block-properties block* db page-names-to-uuids (:block/refs block*) walked-ast-blocks options)
          {block-after-built-in-props :block deadline-properties-tx :properties-tx}
          (update-block-deadline-and-scheduled block page-names-to-uuids options)
          {block-after-assets :block :keys [asset-blocks-tx]}
          (<handle-assets-in-block block-after-built-in-props walked-ast-blocks import-state (select-keys options [:log-fn :notify-user :<get-file-stat]))
          ;; :block/page should be [:block/page NAME]

          journal-page-created-at (some-> (:block/page block*) second journal-created-ats)
          prepared-block (cond-> block-after-assets
                           journal-page-created-at
                           (assoc :block/created-at journal-page-created-at))
          block' (-> prepared-block
                     (fix-pre-block-references pre-blocks page-names-to-uuids)
                     (fix-block-name-lookup-ref page-names-to-uuids)
                     (update-block-refs page-names-to-uuids)
                     (update-block-tags db (:user-options options) per-file-state (:all-idents import-state))
                     (handle-embeds page-names-to-uuids walked-ast-blocks (select-keys options [:log-fn]))
                     (handle-quotes (select-keys options [:log-fn]))
                     (update-block-marker options)
                     (update-block-priority options)
                     add-missing-timestamps
                     (dissoc :block/format :block.temp/ast-blocks)
                  ;;  ((fn [x] (prn ::block-out x) x))
                     )]
    ;; Order matters as previous txs are referenced in block
    (concat properties-tx deadline-properties-tx asset-blocks-tx [block'])))

(defn- update-page-alias
  [m page-names-to-uuids]
  (update m :block/alias (fn [aliases]
                           (map #(vector :block/uuid (get-page-uuid page-names-to-uuids (:block/name %) {:block %}))
                                aliases))))

(defn- build-new-page-or-class
  [m db per-file-state all-idents {:keys [user-options journal-created-ats]}]
  (-> (cond-> m
        ;; Fix pages missing :block/title. Shouldn't happen
        (not (:block/title m))
        (assoc :block/title (:block/name m))
        (seq (:block/alias m))
        (update-page-alias (:page-names-to-uuids per-file-state))
        (journal-created-ats (:block/name m))
        (assoc :block/created-at (journal-created-ats (:block/name m))))
      add-missing-timestamps
      (update-page-tags db user-options per-file-state all-idents)))

(defn- get-page-parents
  "Like ldb/get-page-parents but using all-existing-page-uuids"
  [node all-existing-page-uuids]
  (let [get-parent (fn get-parent [n]
                     (let [parent (or (:logseq.property.class/extends n) (:block/parent n))]
                       (when-let [parent-id (:block/uuid parent)]
                         (or (get all-existing-page-uuids parent-id)
                             (throw (ex-info (str "No parent page found for " (pr-str (:block/uuid parent)))
                                             {:node n}))))))]
    (when-let [parent (get-parent node)]
      (loop [current-parent parent
             parents' []]
        (if (and current-parent (not (contains? parents' current-parent)))
          (recur (get-parent current-parent)
                 (conj parents' current-parent))
          (vec (reverse parents')))))))

(defn- get-all-existing-page-uuids
  "Returns a map of unique page names mapped to their uuids. The page names
   are in a format that is compatible with extract/extract e.g. namespace pages have
   their full hierarchy in the name"
  [classes-from-property-parents all-existing-page-uuids]
  (->> all-existing-page-uuids
       (map (fn [[_ p]]
              (vector
               (if-let [parents (and (or (contains? (:block/tags p) :logseq.class/Tag)
                                         (contains? (:block/tags p) :logseq.class/Page))
                                    ;; These classes have parents now but don't in file graphs (and in extract)
                                     (not (contains? classes-from-property-parents (:block/title p)))
                                     (get-page-parents p all-existing-page-uuids))]
                ;; Build a :block/name for namespace pages that matches data from extract/extract
                 (string/join ns-util/namespace-char (map :block/name (conj (vec parents) p)))
                 (:block/name p))
               (or (:block/uuid p)
                   (throw (ex-info (str "No uuid for existing page " (pr-str (:block/name p)))
                                   (select-keys p [:block/name :block/tags])))))))
       (into {})))

(defn- build-existing-page
  [m db page-uuid {:keys [page-names-to-uuids] :as per-file-state} {:keys [notify-user import-state] :as options}]
  (let [;; These attributes are not allowed to be transacted because they must not change across files
        disallowed-attributes [:block/name :block/uuid :block/format :block/title :block/journal-day
                               :block/created-at :block/updated-at]
        allowed-attributes (into [:block/tags :block/alias :block/parent :logseq.property.class/extends :db/ident]
                                 (keep #(when (db-malli-schema/user-property? (key %)) (key %))
                                       m))
        block-changes (select-keys m allowed-attributes)]
    (when-let [ignored-attrs (not-empty (apply dissoc m (into disallowed-attributes allowed-attributes)))]
      (notify-user {:msg (str "Import ignored the following attributes on page " (pr-str (:block/title m)) ": "
                              ignored-attrs)}))
    (when (seq block-changes)
      (cond-> (merge block-changes {:block/uuid page-uuid})
        (seq (:block/alias m))
        (update-page-alias page-names-to-uuids)
        (:block/tags m)
        (update-page-tags db (:user-options options) per-file-state (:all-idents import-state))))))

(defn- modify-page-tx
  "Modifies page tx from graph-parser for use with DB graphs. Currently modifies
  namespaces and blocks with built-in page names"
  [page all-existing-page-uuids]
  (let [page'
        (if (contains? all-existing-page-uuids (:block/name page))
          (cond-> page
            (:block/namespace page)
            ;; Fix uuid for existing pages as graph-parser's :block/name is different than
            ;; the DB graph's version e.g. 'b/c/d' vs 'd'
            (assoc :block/uuid
                   (or (all-existing-page-uuids (:block/name page))
                       (throw (ex-info (str "No uuid found for existing namespace page " (pr-str (:block/name page)))
                                       (select-keys page [:block/name :block/namespace]))))))
          (let [built-in-name? (and (contains? all-built-in-names (keyword (:block/name page)))
                                    ;; Don't create new card page
                                    (not (contains? #{:card} (keyword (:block/name page)))))]
            (cond-> page
              ;; fix extract incorrectly assigning new user pages built-in uuids
              built-in-name?
              (assoc :block/uuid (d/squuid))
              ;; only happens for few file built-ins like tags and alias
              (and built-in-name? (not (:block/tags page)))
              (assoc :block/tags [:logseq.class/Page]))))]
    (cond-> page'
      true
      (dissoc :block/format)
      (:block/namespace page)
      ((fn [block']
         (merge (build-new-namespace-page block')
                {;; save original name b/c it's still used for a few name lookups
                 ::original-name (:block/name block')
                 ::original-title (:block/title block')}))))))

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return a map containing
  all pages to be transacted, pages' properties and additional
  data for subsequent steps"
  [conn pages blocks {:keys [import-state user-options]
                      :as options}]
  (let [all-pages* (->> (extract/with-ref-pages pages blocks)
                        ;; remove unused property pages unless the page has content
                        (remove #(and (contains? (into (:property-classes user-options) (:property-parent-classes user-options))
                                                 (keyword (:block/name %)))
                                      (not (:block/file %))))
                        ;; remove file path relative
                        (map #(dissoc % :block/file)))
        ;; Build all named ents once per import file to speed up named lookups
        all-existing-page-uuids (get-all-existing-page-uuids @(:classes-from-property-parents import-state)
                                                             @(:all-existing-page-uuids import-state))
        all-pages (map #(modify-page-tx % all-existing-page-uuids) all-pages*)
        all-new-page-uuids (->> all-pages
                                (remove #(all-existing-page-uuids (or (::original-name %) (:block/name %))))
                                (map (juxt (some-fn ::original-name :block/name) :block/uuid))
                                (into {}))
        ;; Stateful because new page uuids can occur via tags
        page-names-to-uuids (atom (merge all-existing-page-uuids all-new-page-uuids))
        per-file-state {:page-names-to-uuids page-names-to-uuids
                        :classes-tx (:classes-tx options)}
        all-pages-m (mapv #(handle-page-properties % @conn per-file-state all-pages options)
                          all-pages)
        pages-tx (keep (fn [{m :block _properties-tx :properties-tx}]
                         (let [page (if-let [page-uuid (if (::original-name m)
                                                         (all-existing-page-uuids (::original-name m))
                                                         (all-existing-page-uuids (:block/name m)))]
                                      (build-existing-page (dissoc m ::original-name ::original-title) @conn page-uuid per-file-state options)
                                      (when (or (ldb/class? m)
                                                ;; Don't build a new page if it overwrites an existing class
                                                (not (some-> (get @(:all-idents import-state)
                                                                  (some-> (or (::original-title m) (:block/title m))
                                                                          build-class-ident-name
                                                                          keyword))
                                                             db-malli-schema/class?))
                                                ;; TODO: Enable this when it's valid for all test graphs because
                                                ;; pages with properties must be built or else properties-tx is invalid
                                                #_(seq properties-tx))
                                        (build-new-page-or-class (dissoc m ::original-name ::original-title)
                                                                 @conn per-file-state (:all-idents import-state) options)))]
                           ;;  (when-not ret (println "Skipped page tx for" (pr-str (:block/title m))))
                           page))
                       all-pages-m)]
    {:pages-tx pages-tx
     :page-properties-tx (mapcat :properties-tx all-pages-m)
     :existing-pages (select-keys all-existing-page-uuids (map :block/name all-pages*))
     :per-file-state per-file-state}))

(defn- build-upstream-properties-tx-for-default
  "Builds upstream-properties-tx for properties that change to :default type"
  [db prop property-ident from-prop-type block-properties-text-values]
  (let [get-pvalue-content (fn get-pvalue-content [block-uuid prop']
                             (or (get-in block-properties-text-values [block-uuid prop'])
                                 (throw (ex-info (str "No :block/text-properties-values found when changing property values: " (pr-str block-uuid))
                                                 {:property prop'
                                                  :block/uuid block-uuid}))))
        existing-blocks
        (map first
             (d/q '[:find (pull ?b [*])
                    :in $ ?p %
                    :where (has-property ?b ?p)]
                  db
                  property-ident
                  (rules/extract-rules rules/db-query-dsl-rules)))
        existing-blocks-tx
        (mapcat (fn [m]
                  (let [prop-value (get m property-ident)
                        ;; Don't delete property values from these types b/c those pages are needed
                        ;; for refs and may have content
                        retract-tx (if (#{:node :date} from-prop-type)
                                     [[:db/retract (:db/id m) property-ident]]
                                     (mapv #(vector :db/retractEntity (:db/id %))
                                           (if (sequential? prop-value) prop-value [prop-value])))
                        prop-value-content (get-pvalue-content (:block/uuid m) prop)
                        new-value (db-property-build/build-property-value-block
                                   m {:db/ident property-ident} prop-value-content)]
                    (into retract-tx
                          [new-value
                           {:block/uuid (:block/uuid m)
                            property-ident [:block/uuid (:block/uuid new-value)]}])))
                existing-blocks)]
    existing-blocks-tx))

(defn- build-upstream-properties-tx
  "Builds tx for upstream properties that have changed and any instances of its
  use in db or in given blocks-tx. Upstream properties can be properties that
  already exist in the DB from another file or from earlier uses of a property
  in the same file"
  [db upstream-properties import-state log-fn]
  (if (seq upstream-properties)
    (let [block-properties-text-values @(:block-properties-text-values import-state)
          all-idents @(:all-idents import-state)
          _ (log-fn :props-upstream-to-change upstream-properties)
          txs
          (mapcat
           (fn [[prop {:keys [schema from-type]}]]
             (let [prop-ident (get-ident all-idents prop)
                   upstream-tx
                   (when (= :default (:logseq.property/type schema))
                     (build-upstream-properties-tx-for-default db prop prop-ident from-type block-properties-text-values))
                   property-pages-tx [(merge {:db/ident prop-ident} schema)]]
               ;; If we handle cardinality changes we would need to return these separately
               ;; as property-pages would need to be transacted separately
               (concat property-pages-tx upstream-tx)))
           upstream-properties)]
      txs)
    []))

(defn new-import-state
  "New import state that is used for import of one graph. State is atom per
   key to make code more readable and encourage local mutations"
  []
  {;; Vec of maps with keys :property, :value, :schema and :location.
   ;; Properties are ignored to keep graph valid and notify users of ignored properties.
   ;; Properties with :schema are ignored due to property schema changes
   :ignored-properties (atom [])
   ;; Vec of maps with keys :path and :reason
   :ignored-files (atom [])
   ;; Vec of maps with keys :path, :reason and :location (optional).
   :ignored-assets (atom [])
   ;; Map of annotation page paths and their parsed contents
   :pdf-annotation-pages (atom {})
   ;; Map of property names (keyword) and their current schemas (map of qualified properties).
   ;; Used for adding schemas to properties and detecting changes across a property's usage
   :property-schemas (atom {})
   ;; Indexes all created pages by uuid. Index is used to fetch all parents of a page
   :all-existing-page-uuids (atom {})
   ;; Map of property or class names (keyword) to db-ident keywords
   :all-idents (atom {})
   ;; Set of children pages turned into classes by :property-parent-classes option
   :classes-from-property-parents (atom #{})
   ;; Map of block uuids to their :block/properties-text-values value.
   ;; Used if a property value changes to :default
   :block-properties-text-values (atom {})
   ;; Track asset data for use across asset and doc import steps
   :assets (atom {})})

(defn- build-tx-options [{:keys [user-options] :as options}]
  (merge
   (dissoc options :extract-options :user-options)
   {:import-state (or (:import-state options) (new-import-state))
    ;; Track per file changes to make to existing properties
    ;; Map of property names (keyword) and their changes (map)
    :upstream-properties (atom {})
    ;; Track per file class tx so that their tx isn't embedded in individual :block/tags and can be post processed
    :classes-tx (atom [])
    :user-options
    (merge user-options
           {:tag-classes (set (map string/lower-case (:tag-classes user-options)))
            :property-classes (set/difference
                               (set (map (comp keyword string/lower-case) (:property-classes user-options)))
                               file-built-in-property-names)
            :property-parent-classes (set/difference
                                      (set (map (comp keyword string/lower-case) (:property-parent-classes user-options)))
                                      file-built-in-property-names)})}))

(defn- retract-parent-and-page-tag
  [col]
  (vec
   (mapcat (fn [b]
             (let [eid [:block/uuid (:block/uuid b)]]
               [[:db/retract eid :block/parent]
                [:db/retract eid :block/tags :logseq.class/Page]]))
           col)))

(defn- split-pages-and-properties-tx
  "Separates new pages from new properties tx in preparation for properties to
  be transacted separately. Also builds property pages tx and converts existing
  pages that are now properties"
  [pages-tx old-properties existing-pages import-state upstream-properties]
  (let [new-properties (set/difference (set (keys @(:property-schemas import-state))) (set old-properties))
        ;; _ (when (seq new-properties) (prn :new-properties new-properties))
        [properties-tx pages-tx'] ((juxt filter remove)
                                   #(contains? new-properties (keyword (:block/name %))) pages-tx)
        property-pages-tx (map (fn [{block-uuid :block/uuid :block/keys [title]}]
                                 (let [property-name (keyword (string/lower-case title))
                                       db-ident (get-ident @(:all-idents import-state) property-name)
                                       upstream-property (get upstream-properties property-name)]
                                   (sqlite-util/build-new-property
                                    db-ident
                                    ;; Tweak new properties that have upstream changes in flight to behave like
                                    ;; existing properties i.e. they should be defined by the upstream property
                                    (if (and upstream-property
                                             (#{:date :node} (:from-type upstream-property))
                                             (= :default (get-in upstream-property [:schema :logseq.property/type])))
                                      ;; Assumes :many for :date and :node like infer-property-schema-and-get-property-change
                                      {:logseq.property/type (:from-type upstream-property) :db/cardinality :many}
                                      (get-property-schema @(:property-schemas import-state) property-name))
                                    {:title title :block-uuid block-uuid})))
                               properties-tx)
        converted-property-pages-tx
        (map (fn [kw-name]
               (let [existing-page-uuid (get existing-pages (name kw-name))
                     db-ident (get-ident @(:all-idents import-state) kw-name)
                     new-prop (sqlite-util/build-new-property db-ident
                                                              (get-property-schema @(:property-schemas import-state) kw-name)
                                                              {:title (name kw-name)})]
                 (assert existing-page-uuid)
                 (merge (select-keys new-prop [:block/tags :db/ident :logseq.property/type :db/index :db/cardinality :db/valueType])
                        {:block/uuid existing-page-uuid})))
             (set/intersection new-properties (set (map keyword (keys existing-pages)))))
        ;; Could do this only for existing pages but the added complexity isn't worth reducing the tx noise
        retract-page-tag-from-properties-tx (retract-parent-and-page-tag (concat property-pages-tx converted-property-pages-tx))
        ;; Save properties on new property pages separately as they can contain new properties and thus need to be
        ;; transacted separately the property pages
        property-page-properties-tx (keep (fn [b]
                                            (when-let [page-properties (not-empty (db-property/properties b))]
                                              (merge page-properties {:block/uuid (:block/uuid b)
                                                                      :block/tags (-> (remove #(= :logseq.class/Page %) (:block/tags page-properties))
                                                                                      (conj :logseq.class/Property))})))
                                          properties-tx)]
    {:pages-tx pages-tx'
     :property-pages-tx (concat property-pages-tx converted-property-pages-tx retract-page-tag-from-properties-tx)
     :property-page-properties-tx property-page-properties-tx}))

(defn- fix-extracted-block-tags-and-refs
  "A tag or ref can have different :block/uuid's across extracted blocks. This makes
   sense for most in-app uses but not for importing where we want consistent identity.
   This fn fixes that issue. This fn also ensures that tags and pages have the same uuid"
  [blocks]
  (let [name-uuids (atom {})
        fix-block-uuids
        (fn fix-block-uuids [tags-or-refs {:keys [ref? properties]}]
          ;; mapv to determinastically process in order
          (mapv (fn [b]
                  (if (and ref? (get properties (keyword (:block/name b))))
                    ;; don't change uuid if property since properties and tags have different uuids
                    b
                    (if-let [existing-uuid (some->> (:block/name b) (get @name-uuids))]
                      (if (not= existing-uuid (:block/uuid b))
                        ;; fix unequal uuids for same name
                        (assoc b :block/uuid existing-uuid)
                        b)
                      (if (vector? b)
                        ;; ignore [:block/uuid] refs
                        b
                        (do
                          (assert (and (:block/name b) (:block/uuid b))
                                  (str "Extracted block tag/ref must have a name and uuid: " (pr-str b)))
                          (swap! name-uuids assoc (:block/name b) (:block/uuid b))
                          b)))))
                tags-or-refs))]
    (map (fn [b]
           (cond-> b
             (seq (:block/tags b))
             (update :block/tags fix-block-uuids {})
             (seq (:block/refs b))
             (update :block/refs fix-block-uuids {:ref? true :properties (:block/properties b)})))
         blocks)))

(defn- get-block-pattern
  [format]
  (let [format' (keyword format)]
    (if (= format' :org) "*" "-")))

(defn- extract-pages-and-blocks
  "Main fn which calls graph-parser to convert markdown into data"
  [db file content {:keys [extract-options import-state]}]
  (let [format (common-util/get-format file)
        extract-options' (merge {:block-pattern (get-block-pattern format)
                                 :date-formatter "MMM do, yyyy"
                                 :uri-encoded? false
                                 ;; Alters behavior in gp-block
                                 :export-to-db-graph? true
                                 :filename-format :legacy}
                                extract-options
                                {:db db})
        extracted
        (cond (contains? #{:org :markdown :md} format)
              (-> (extract/extract file content extract-options')
                  (update :pages (fn [pages]
                                   (map #(dissoc % :block.temp/original-page-name) pages)))
                  (update :blocks fix-extracted-block-tags-and-refs))

              :else
              (when-not (re-find #"whiteboards/.*\.edn$" (str file))
                (swap! (:ignored-files import-state) conj
                       {:path file :reason :unsupported-file-format})))]
    ;; Annotation markdown pages are saved for later as they are dependant on the asset being annotated
    (if (string/starts-with? (str (path/basename file)) "hls__")
      (do
        (swap! (:pdf-annotation-pages import-state) assoc (node-path/basename file) extracted)
        nil)
      extracted)))

(defn- build-journal-created-ats
  "Calculate created-at timestamps for journals"
  [pages]
  (->> pages
       (map #(when-let [journal-day (:block/journal-day %)]
               [(:block/name %) (date-time-util/journal-day->ms journal-day)]))
       (into {})))

(defn- clean-extra-invalid-tags
  "If a page/class tx is an existing property or a new or existing class, ensure that
  it only has one tag by removing :logseq.class/Page from its tx"
  [db pages-tx' classes-tx existing-pages]
  ;; TODO: Improve perf if we tracked all created classes in atom
  (let [existing-classes (->> (d/datoms db :avet :block/tags :logseq.class/Tag)
                              (map #(d/entity db (:e %)))
                              (map :block/uuid)
                              set)
        classes (set/union existing-classes
                           (set (map :block/uuid classes-tx)))
        existing-properties (->> (d/datoms db :avet :block/tags :logseq.class/Property)
                                 (map #(d/entity db (:e %)))
                                 (map :block/uuid)
                                 set)
        existing-pages' (set/map-invert existing-pages)
        retract-page-tag-from-existing-pages
        (->> pages-tx'
             ;; Existing pages that have converted to property or class
             (filter #(and (:db/ident %) (get existing-pages' (:block/uuid %))))
             retract-parent-and-page-tag)]
    {:pages-tx
     (mapv (fn [page]
             (if (or (contains? classes (:block/uuid page))
                     (contains? existing-properties (:block/uuid page)))
               (-> page
                   (update :block/tags (fn [tags] (vec (remove #(= % :logseq.class/Page) tags))))
                   (dissoc :block/parent))
               page))
           pages-tx')
     :retract-page-tags-tx
     (into (retract-parent-and-page-tag classes-tx)
           retract-page-tag-from-existing-pages)}))

(defn- save-from-tx
  "Save importer state from given txs"
  [txs {:keys [import-state] :as _opts}]
  ;; (when (string/includes? (:file _opts) "some-file.md") (cljs.pprint/pprint txs))
  (when-let [nodes (seq (filter :block/name txs))]
    (swap! (:all-existing-page-uuids import-state) merge (into {} (map (juxt :block/uuid identity) nodes)))))

(defn- <build-blocks-tx
  [conn blocks pre-blocks per-file-state tx-options]
  (p/loop [tx-data []
           blocks (remove :block/pre-block? blocks)]
    (if-let [block (first blocks)]
      (p/let [block-tx-data (<build-block-tx @conn block pre-blocks per-file-state
                                             tx-options)]
        (p/recur (concat tx-data block-tx-data) (rest blocks)))
      tx-data)))

(defn <add-file-to-db-graph
  "Parse file and save parsed data to the given db graph. Options available:

* :extract-options - Options map to pass to extract/extract
* :user-options - User provided options maps that alter how a file is converted to db graph. Current options
   are: :tag-classes (set), :property-classes (set), :property-parent-classes (set), :convert-all-tags? (boolean)
   and :remove-inline-tags? (boolean)
* :import-state - useful import state to maintain across files e.g. property schemas or ignored properties
* :macros - map of macros for use with macro expansion
* :notify-user - Displays warnings to user without failing the import. Fn receives a map with :msg
* :log-fn - Logs messages for development. Defaults to prn"
  [conn file content {:keys [notify-user log-fn]
                      :or {notify-user #(println "[WARNING]" (:msg %))
                           log-fn prn}
                      :as *options}]
  (p/let [options (assoc *options :notify-user notify-user :log-fn log-fn :file file)
          {:keys [pages blocks]} (extract-pages-and-blocks @conn file content options)
          tx-options (merge (build-tx-options options)
                            {:journal-created-ats (build-journal-created-ats pages)})
          old-properties (keys @(get-in options [:import-state :property-schemas]))
          ;; Build page and block txs
          {:keys [pages-tx page-properties-tx per-file-state existing-pages]} (build-pages-tx conn pages blocks tx-options)
          pre-blocks (->> blocks (keep #(when (:block/pre-block? %) (:block/uuid %))) set)
          blocks-tx (<build-blocks-tx conn blocks pre-blocks per-file-state tx-options)
          {:keys [property-pages-tx property-page-properties-tx] pages-tx' :pages-tx}
          (split-pages-and-properties-tx pages-tx old-properties existing-pages (:import-state options) @(:upstream-properties tx-options))
          ;; _ (when (seq property-pages-tx) (cljs.pprint/pprint {:property-pages-tx property-pages-tx}))
          ;; Necessary to transact new property entities first so that block+page properties can be transacted next
          main-props-tx-report (d/transact! conn property-pages-tx {::new-graph? true ::path file})
          _ (save-from-tx property-pages-tx options)

          classes-tx @(:classes-tx tx-options)
          {:keys [retract-page-tags-tx] pages-tx'' :pages-tx} (clean-extra-invalid-tags @conn pages-tx' classes-tx existing-pages)
          classes-tx' (concat classes-tx retract-page-tags-tx)
          ;; Build indices
          pages-index (->> (map #(select-keys % [:block/uuid]) pages-tx'')
                           (concat (map #(select-keys % [:block/uuid]) classes-tx))
                           distinct)
          block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks-tx)
          block-refs-ids (->> (mapcat :block/refs blocks-tx)
                              (filter (fn [ref] (and (vector? ref)
                                                     (= :block/uuid (first ref)))))
                              (map (fn [ref] {:block/uuid (second ref)}))
                              (seq))
          ;; To prevent "unique constraint" on datascript
          blocks-index (set/union (set block-ids) (set block-refs-ids))
          ;; Order matters. pages-index and blocks-index needs to come before their corresponding tx for
          ;; uuids to be valid. Also upstream-properties-tx comes after blocks-tx to possibly override blocks
          tx (concat pages-index page-properties-tx property-page-properties-tx pages-tx'' classes-tx' blocks-index blocks-tx)
          tx' (common-util/fast-remove-nils tx)
          ;; _ (prn :tx-counts (map #(vector %1 (count %2))
          ;;                        [:pages-index :page-properties-tx :property-page-properties-tx :pages-tx' :classes-tx :blocks-index :blocks-tx]
          ;;                        [pages-index page-properties-tx property-page-properties-tx pages-tx' classes-tx blocks-index blocks-tx]))
          ;; _ (cljs.pprint/pprint {#_:property-pages-tx #_property-pages-tx :pages-tx pages-tx :tx tx'})
          main-tx-report (d/transact! conn tx' {::new-graph? true ::path file})
          _ (save-from-tx tx' options)

          upstream-properties-tx
          (build-upstream-properties-tx @conn @(:upstream-properties tx-options) (:import-state options) log-fn)
          ;; _ (when (seq upstream-properties-tx) (cljs.pprint/pprint {:upstream-properties-tx upstream-properties-tx}))
          upstream-tx-report (when (seq upstream-properties-tx) (d/transact! conn upstream-properties-tx {::new-graph? true ::path file}))
          _ (save-from-tx upstream-properties-tx options)]

    ;; Return all tx-reports that occurred in this fn as UI needs to know what changed
    [main-props-tx-report main-tx-report upstream-tx-report]))

;; Higher level export fns
;; =======================

(defn- export-doc-file
  [{:keys [path idx] :as file} conn <read-file
   {:keys [notify-user set-ui-state <export-file]
    :or {set-ui-state (constantly nil)
         <export-file (fn <export-file [conn m opts]
                        (<add-file-to-db-graph conn (:file/path m) (:file/content m) opts))}
    :as options}]
  ;; (prn :export-doc-file path idx)
  (-> (p/let [_ (set-ui-state [:graph/importing-state :current-idx] (inc idx))
              _ (set-ui-state [:graph/importing-state :current-page] path)
              content (<read-file file)
              m {:file/path path :file/content content}
              _ (<export-file conn m (dissoc options :set-ui-state :<export-file))]
        ;; returning val results in smoother ui updates
        m)
      (p/catch (fn [error]
                 (notify-user {:msg (str "Import failed on " (pr-str path) " with error:\n" (.-message error))
                               :level :error
                               :ex-data {:path path :error error}})))))

(defn export-doc-files
  "Exports all user created files i.e. under journals/ and pages/.
   Recommended to use build-doc-options and pass that as options"
  [conn *doc-files <read-file {:keys [notify-user set-ui-state]
                               :or {set-ui-state (constantly nil) notify-user prn}
                               :as options}]
  (set-ui-state [:graph/importing-state :total] (count *doc-files))
  (let [doc-files (mapv #(assoc %1 :idx %2)
                        ;; Sort files to ensure reproducible import behavior
                        ;; pdf annotation pages sort first because other pages depend on them
                        (sort-by (fn [{:keys [path]}]
                                   [(not (string/starts-with? (node-path/basename path) "hls__")) path])
                                 *doc-files)
                        (range 0 (count *doc-files)))]
    (-> (p/loop [_file-map (export-doc-file (get doc-files 0) conn <read-file options)
                 i 0]
          (when-not (>= i (dec (count doc-files)))
            (p/recur (export-doc-file (get doc-files (inc i)) conn <read-file options)
                     (inc i))))
        (p/catch (fn [e]
                   (notify-user {:msg (str "Import has unexpected error:\n" (.-message e))
                                 :level :error
                                 :ex-data {:error e}}))))))

(defn- default-save-file [conn path content]
  (ldb/transact! conn [{:file/path path
                        :file/content content
                        :file/last-modified-at (js/Date.)}]))

(defn- export-logseq-files
  "Exports files under logseq/"
  [repo-or-conn logseq-files <read-file {:keys [<save-file notify-user]
                                         :or {<save-file default-save-file}}]
  (let [custom-css (first (filter #(string/ends-with? (:path %) "logseq/custom.css") logseq-files))
        custom-js (first (filter #(string/ends-with? (:path %) "logseq/custom.js") logseq-files))]
    (-> (p/do!
         (when custom-css
           (-> (<read-file custom-css)
               (p/then #(<save-file repo-or-conn "logseq/custom.css" %))))
         (when custom-js
           (-> (<read-file custom-js)
               (p/then #(<save-file repo-or-conn "logseq/custom.js" %)))))
        (p/catch (fn [error]
                   (notify-user {:msg (str "Import unexpectedly failed while reading logseq files:\n" (.-message error))
                                 :level :error
                                 :ex-data {:error error}}))))))

(defn export-config-file
  "Exports logseq/config.edn by saving to database and setting any properties related to config"
  [repo-or-conn config-file <read-file {:keys [<save-file notify-user default-config]
                                        :or {default-config {}
                                             <save-file default-save-file}}]
  (-> (<read-file config-file)
      (p/then #(p/do!
                (<save-file repo-or-conn
                            "logseq/config.edn"
                            ;; Converts a file graph config.edn for use with DB graphs. Unlike common-config/create-config-for-db-graph,
                            ;; manually dissoc deprecated keys for config to be valid
                            (pretty-print-dissoc % (keys common-config/file-only-config)))
                (let [config (edn/read-string %)]
                  (when-let [title-format (or (:journal/page-title-format config) (:date-formatter config))]
                    (ldb/transact! repo-or-conn [{:db/ident :logseq.class/Journal
                                                  :logseq.property.journal/title-format title-format}]))
                  ;; Return original config as import process depends on original config e.g. :hidden
                  config)))
      (p/catch (fn [err]
                 (notify-user {:msg "Import may have mistakes due to an invalid config.edn. Recommend re-importing with a valid config.edn"
                               :level :error
                               :ex-data {:error err}})
                 (edn/read-string default-config)))))

(defn- export-class-properties
  [conn repo-or-conn]
  (let [user-classes (->> (d/q '[:find (pull ?b [:db/id :db/ident])
                                 :where [?b :block/tags :logseq.class/Tag]] @conn)
                          (map first)
                          (remove #(db-class/built-in-classes (:db/ident %))))
        class-to-prop-uuids
        (->> (d/q '[:find ?t ?prop #_?class
                    :in $ ?user-classes
                    :where
                    [?b :block/tags ?t]
                    [?t :db/ident ?class]
                    [(contains? ?user-classes ?class)]
                    [?b ?prop _]
                    [?prop-e :db/ident ?prop]
                    [?prop-e :block/tags :logseq.class/Property]]
                  @conn
                  (set (map :db/ident user-classes)))
             (remove #(ldb/built-in? (d/entity @conn (second %))))
             (reduce (fn [acc [class-id prop-ident]]
                       (update acc class-id (fnil conj #{}) prop-ident))
                     {}))
        tx (mapv (fn [[class-id prop-ids]]
                   {:db/id class-id
                    :logseq.property.class/properties (vec prop-ids)})
                 class-to-prop-uuids)]
    (ldb/transact! repo-or-conn tx)))

(defn- <safe-async-loop
  "Calls async-fn with each element in args-to-loop. Catches an unexpected error in loop and notifies user"
  [async-fn args-to-loop notify-user]
  (-> (p/loop [_ (async-fn (get args-to-loop 0))
               i 0]
        (when-not (>= i (dec (count args-to-loop)))
          (p/recur (async-fn (get args-to-loop (inc i)))
                   (inc i))))
      (p/catch (fn [e]
                 (notify-user {:msg (str "Import has an unexpected error:\n" (.-message e))
                               :level :error
                               :ex-data {:error e}})))))

(defn- read-and-copy-asset-files
  "Reads and copies files under assets/"
  [*asset-files <read-and-copy-asset-file {:keys [notify-user set-ui-state assets rpath-key]
                                           :or {set-ui-state (constantly nil)}}]
  (assert <read-and-copy-asset-file "read-and-copy-asset-file fn required")
  (let [asset-files (let [assets (if (keyword? rpath-key)
                                   (common-util/distinct-by rpath-key *asset-files)
                                   *asset-files)]
                      (mapv #(assoc %1 :idx %2)
                            ;; Sort files to ensure reproducible import behavior
                            (sort-by :path assets)
                            (range 0 (count assets))))
        read-and-copy-asset (fn read-and-copy-asset [{:keys [path] :as file}]
                              (-> (<read-and-copy-asset-file
                                   file assets
                                   (fn [buffer]
                                     (let [edn? (= "edn" (path/file-ext path))
                                           edn-content (when edn? (common-util/safe-read-map-string (utf8/decode buffer)))
                                           ;; Have to assume edn file with :highlights is annotation or
                                           ;; this import step becomes coupled to build-pdf-annotations-tx
                                           pdf-annotation? (some #{:highlights} (keys edn-content))
                                           with-edn-content (fn [m]
                                                              (cond-> m
                                                                edn-content
                                                                (assoc :edn-content edn-content)))]
                                       {:with-edn-content with-edn-content
                                        :pdf-annotation? pdf-annotation?})))
                                  (p/catch
                                   (fn [error]
                                     (notify-user {:msg (str "Import failed to read and copy " (pr-str path) " with error:\n" (.-message error))
                                                   :level :error
                                                   :ex-data {:path path :error error}})))))]
    (when (seq asset-files)
      (set-ui-state [:graph/importing-state :current-page] "Read and copy asset files")
      (<safe-async-loop read-and-copy-asset asset-files notify-user))))

(defn- insert-favorites
  "Inserts favorited pages as uuids into a new favorite page"
  [repo-or-conn favorited-ids page-id]
  (let [tx (reduce (fn [acc favorite-id]
                     (conj acc
                           (sqlite-util/block-with-timestamps
                            (merge (ldb/build-favorite-tx favorite-id)
                                   {:block/uuid (d/squuid)
                                    :db/id (or (some-> (:db/id (last acc)) dec) -1)
                                    :block/order (db-order/gen-key nil)
                                    :block/parent page-id
                                    :block/page page-id}))))
                   []
                   favorited-ids)]
    (ldb/transact! repo-or-conn tx)))

(defn- export-favorites-from-config-edn
  [conn repo config {:keys [log-fn] :or {log-fn prn}}]
  (when-let [favorites (seq (:favorites config))]
    (p/do!
     (if-let [favorited-ids
              (keep (fn [page-name]
                      (some-> (ldb/get-page @conn page-name)
                              :block/uuid))
                    favorites)]
       (let [page-entity (ldb/get-page @conn common-config/favorites-page-name)]
         (insert-favorites repo favorited-ids (:db/id page-entity)))
       (log-fn :no-favorites-found {:favorites favorites})))))

(defn build-doc-options
  "Builds options for use with export-doc-files and assets"
  [config options]
  (-> {:extract-options {:date-formatter (get-date-formatter config)
                         ;; Remove config keys that break importing
                         :user-config (dissoc config :property-pages/excludelist :property-pages/enabled?)
                         :filename-format (or (:file/name-format config) :legacy)
                         :verbose (:verbose options)}
       :user-config config
       :user-options (merge {:remove-inline-tags? true :convert-all-tags? true} (:user-options options))
       :import-state (new-import-state)
       :macros (or (:macros options) (:macros config))}
      (merge (select-keys options [:set-ui-state :<export-file :notify-user :<get-file-stat]))))

(defn- move-top-parent-pages-to-library
  [conn repo-or-conn]
  (let [db @conn
        library-page (ldb/get-built-in-page db common-config/library-page-name)
        library-id (:block/uuid library-page)
        top-parent-pages (->> (d/datoms db :avet :block/parent)
                              (keep (fn [d]
                                      (let [child (d/entity db (:e d))
                                            parent (d/entity db (:v d))]
                                        (when (and (nil? (:block/parent parent)) (page-entity? child) (page-entity? parent))
                                          parent))))
                              (common-util/distinct-by :block/uuid))
        tx-data (map
                 (fn [parent]
                   {:db/id (:db/id parent)
                    :block/parent [:block/uuid library-id]
                    :block/order (db-order/gen-key)})
                 top-parent-pages)]
    (ldb/transact! repo-or-conn tx-data)))

(defn export-file-graph
  "Main fn which exports a file graph given its files and imports them
   into a DB graph. Files is expected to be a seq of maps with a :path key.
   The user experiences this as an import so all user-facing messages are
   described as import. options map contains the following keys:
   * :set-ui-state - fn which updates ui to indicate progress of import
   * :notify-user - fn which notifies user of important messages with a map
     containing keys :msg, :level and optionally :ex-data when there is an error
   * :log-fn - fn which logs developer messages
   * :rpath-key - keyword used to get relative path in file map. Default to :path
   * :<read-file - fn which reads a file across multiple steps
   * :<get-file-stat - fn which returns stat of a file path
   * :default-config - default config if config is unable to be read
   * :user-options - map of user specific options. See <add-file-to-db-graph for more
   * :<save-config-file - fn which saves a config file
   * :<save-logseq-file - fn which saves a logseq file
   * :<read-and-copy-asset - fn which reads and copies asset file

   Note: See export-doc-files for additional options that are only for it"
  [repo-or-conn conn config-file *files {:keys [<read-file <read-and-copy-asset rpath-key log-fn]
                                         :or {rpath-key :path log-fn println}
                                         :as options}]
  (reset! gp-block/*export-to-db-graph? true)
  (->
   (p/let [config (export-config-file
                   repo-or-conn config-file <read-file
                   (-> (select-keys options [:notify-user :default-config :<save-config-file])
                       (set/rename-keys {:<save-config-file :<save-file})))]
     (let [files (common-config/remove-hidden-files *files config rpath-key)
           logseq-file? #(string/starts-with? (get % rpath-key) "logseq/")
           asset-file? #(string/starts-with? (get % rpath-key) "assets/")
           doc-files (->> files
                          (remove #(or (logseq-file? %) (asset-file? %)))
                          (filter #(contains? #{"md" "org" "markdown" "edn"} (path/file-ext (:path %)))))
           asset-files (filter asset-file? files)
           doc-options (build-doc-options config options)]
       (log-fn "Importing" (count doc-files) "files ...")
       ;; These export* fns are all the major export/import steps
       (p/do!
        (export-logseq-files repo-or-conn (filter logseq-file? files) <read-file
                             (-> (select-keys options [:notify-user :<save-logseq-file])
                                 (set/rename-keys {:<save-logseq-file :<save-file})))
        ;; Assets are read first as doc-files need data from them to make Asset blocks.
        (read-and-copy-asset-files asset-files
                                   <read-and-copy-asset
                                   (merge (select-keys options [:notify-user :set-ui-state :rpath-key])
                                          {:assets (get-in doc-options [:import-state :assets])}))
        (export-doc-files conn doc-files <read-file doc-options)
        (export-favorites-from-config-edn conn repo-or-conn config {})
        (export-class-properties conn repo-or-conn)
        (move-top-parent-pages-to-library conn repo-or-conn)
        {:import-state (-> (:import-state doc-options)
                           ;; don't leak full asset content (which could be large) out of this ns
                           (dissoc :assets))
         :files files})))
   (p/finally (fn [_]
                (reset! gp-block/*export-to-db-graph? false)))
   (p/catch (fn [e]
              (reset! gp-block/*export-to-db-graph? false)
              (js/console.error e)
              ((:notify-user options)
               {:msg (str "Import has unexpected error:\n" (.-message e))
                :level :error
                :ex-data {:error e}})))))
