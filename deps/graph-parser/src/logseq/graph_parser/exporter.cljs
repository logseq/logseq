(ns logseq.graph-parser.exporter
  "Exports a file graph to DB graph. Used by the File to DB graph importer and
  by nbb-logseq CLIs"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.common.uuid :as common-uuid]
            [logseq.common.path :as path]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.common.util.macro :as macro-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.rules :as rules]
            [logseq.db.frontend.class :as db-class]
            [logseq.common.util.page-ref :as page-ref]
            [promesa.core :as p]
            [cljs.pprint]
            [logseq.db.frontend.order :as db-order]
            [logseq.db.frontend.db-ident :as db-ident]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.graph-parser.property :as gp-property]
            [logseq.graph-parser.block :as gp-block]
            [logseq.common.util.namespace :as ns-util]))

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

(defn- get-page-uuid [page-names-to-uuids page-name]
  (or (get @page-names-to-uuids (if (string/includes? (str page-name) "#")
                                  (string/lower-case (gp-block/sanitize-hashtag-name page-name))
                                  page-name))
      (throw (ex-info (str "No uuid found for page name " (pr-str page-name))
                      {:page-name page-name}))))

(defn- replace-namespace-with-parent [block page-names-to-uuids]
  (if (:block/namespace block)
    (-> (dissoc block :block/namespace)
        (assoc :logseq.property/parent
               {:block/uuid (get-page-uuid page-names-to-uuids (get-in block [:block/namespace :block/name]))}))
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
               (-> (db-class/build-new-class db {:block/title (build-class-ident-name class-name)
                                                 :block/tags (:block/tags class-block)})
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
         (some #(let [parents (->> (ldb/get-page-parents %)
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
                             (replace-namespace-with-parent page-names-to-uuids))]
            (when (:new-class? (meta class-m)) (swap! classes-tx conj class-m'))
            (assert (:block/uuid class-m') "Class must have a :block/uuid")
            [:block/uuid (:block/uuid class-m')]))))))

(defn- logseq-class-ident?
  [k]
  (and (qualified-keyword? k) (= "logseq.class" (namespace k))))

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
                         (map #(vector :block/uuid (get-page-uuid (:page-names-to-uuids per-file-state) (:block/name %))))
                         set)]
      (cond-> block
        true
        (update :block/tags convert-tags-to-classes db per-file-state user-options all-idents)
        (seq page-tags)
        (merge {:logseq.property/page-tags page-tags})))
    block))

(defn- add-uuid-to-page-map [m page-names-to-uuids]
  (assoc m :block/uuid (get-page-uuid page-names-to-uuids (:block/name m))))

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
    (let [old-to-new {"TODO" :logseq.task/status.todo
                      "LATER" :logseq.task/status.todo
                      "IN-PROGRESS" :logseq.task/status.doing
                      "NOW" :logseq.task/status.doing
                      "DOING" :logseq.task/status.doing
                      "DONE" :logseq.task/status.done
                      "WAIT" :logseq.task/status.backlog
                      "WAITING" :logseq.task/status.backlog
                      "CANCELED" :logseq.task/status.canceled
                      "CANCELLED" :logseq.task/status.canceled}
          status-ident (or (old-to-new marker)
                           (do
                             (log-fn :invalid-todo (str (pr-str marker) " is not a valid marker so setting it to TODO"))
                             :logseq.task/status.todo))]
      (-> block
          (assoc :logseq.task/status status-ident)
          (update :block/title string/replace-first (re-pattern (str marker "\\s*")) "")
          (update :block/tags (fnil conj []) :logseq.class/Task)
          (dissoc :block/marker)))
    block))

(defn- update-block-priority
  [block {:keys [log-fn]}]
  (if-let [priority (:block/priority block)]
    (let [old-to-new {"A" :logseq.task/priority.high
                      "B" :logseq.task/priority.medium
                      "C" :logseq.task/priority.low}
          priority-value (or (old-to-new priority)
                             (do
                               (log-fn :invalid-priority (str (pr-str priority) " is not a valid priority so setting it to low"))
                               :logseq.task/priority.low))]
      (-> block
          (assoc :logseq.task/priority priority-value)
          (update :block/title string/replace-first (re-pattern (str "\\[#" priority "\\]" "\\s*")) "")
          (dissoc :block/priority)))
    block))

(defn- update-block-deadline
  ":block/title doesn't contain DEADLINE.* text so unable to detect timestamp
  or repeater usage and notify user that they aren't supported"
  [block db {:keys [user-config]}]
  (if-let [date-int (or (:block/deadline block) (:block/scheduled block))]
    (let [existing-journal-page (ffirst (d/q '[:find (pull ?b [:block/uuid])
                                               :in $ ?journal-day
                                               :where [?b :block/journal-day ?journal-day]]
                                             db date-int))
          deadline-page (->
                         (or existing-journal-page
                            ;; FIXME: Register new pages so that two different refs to same new page
                            ;; don't create different uuids and thus an invalid page
                             (let [page-m (sqlite-util/build-new-page
                                           (date-time-util/int->journal-title date-int (common-config/get-date-formatter user-config)))]
                               (assoc page-m
                                      :block/uuid (common-uuid/gen-uuid :journal-page-uuid date-int)
                                      :block/journal-day date-int)))
                         (assoc :block/tags #{:logseq.class/Journal}))]
      {:block
       (-> block
           (assoc :logseq.task/deadline [:block/uuid (:block/uuid deadline-page)])
           (dissoc :block/deadline :block/scheduled :block/repeated?))
       :properties-tx (when-not existing-journal-page [deadline-page])})
    {:block block :properties-tx []}))

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
  the property-schemas atom. If a property's :type changes, returns a map of
  the schema attribute changed and how it changed e.g. `{:type {:from :default :to :url}}`"
  [db prop-val prop prop-val-text refs {:keys [property-schemas all-idents]} macros]
  ;; Explicitly fail an unexpected case rather than cause silent downstream failures
  (when (and (coll? prop-val) (not (every? string? prop-val)))
    (throw (ex-info (str "Import cannot infer schema of unknown property value " (pr-str prop-val))
                    {:value prop-val :property prop})))
  (let [prop-type (cond (and (coll? prop-val)
                             (seq prop-val)
                             (set/subset? prop-val
                                          (set (keep #(when (ldb/journal? %)
                                                        (:block/title %)) refs))))
                        :date
                        (and (coll? prop-val) (seq prop-val) (text-with-refs? prop-val prop-val-text))
                        :default
                        (coll? prop-val)
                        :node
                        :else
                        (db-property-type/infer-property-type-from-value
                         (macro-util/expand-value-if-macro prop-val macros)))
        prev-type (get-in @property-schemas [prop :type])]
    ;; Create new property
    (when-not (get @property-schemas prop)
      (create-property-ident db all-idents prop)
      (let [schema (cond-> {:type prop-type}
                     (#{:node :date} prop-type)
                     ;; Assume :many for now as detecting that detecting property values across files are consistent
                     ;; isn't possible yet
                     (assoc :cardinality :many))]
        (swap! property-schemas assoc prop schema)))
    (when (and prev-type (not= prev-type prop-type))
      {:type {:from prev-type :to prop-type}})))

(def built-in-property-name-to-idents
  "Map of all built-in keyword property names to their idents. Using in-memory property
  names because these are legacy names already in a user's file graph"
  (->> db-property/built-in-properties
       (map (fn [[k v]]
              [(:name v) k]))
       (into {})))

(def all-built-in-property-names
  "All built-in property names as a set of keywords"
  (-> built-in-property-name-to-idents keys set
      ;; built-in-properties that map to new properties
      (set/union #{:filters :query-table :query-properties :query-sort-by :query-sort-desc :hl-stamp :file :file-path})))

(def all-built-in-names
  "All built-in properties and classes as a set of keywords"
  (set/union all-built-in-property-names
             (set (->> db-class/built-in-classes
                       vals
                       (map #(-> % :title string/lower-case keyword))))))

(def file-built-in-property-names
  "File-graph built-in property names that are supported. Expressed as set of keywords"
  #{:alias :tags :background-color :background-image :heading
    :query-table :query-properties :query-sort-by :query-sort-desc
    :ls-type :hl-type :hl-color :hl-page :hl-stamp :hl-value :file :file-path
    :logseq.order-list-type :logseq.tldraw.page :logseq.tldraw.shape
    :icon :public :exclude-from-graph-view :filters})

(assert (set/subset? file-built-in-property-names all-built-in-property-names)
        "All file-built-in properties are used in db graph")

(def query-table-special-keys
  "Special keywords in previous query table"
  {:page :block/title
   :block :block/title
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
                           ;; else
                           [[(built-in-property-name-to-idents prop) prop-value]]))))
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
                     (get-page-uuid page-names-to-uuids (common-util/page-name-sanity-lc %)))
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
        (swap! property-schemas assoc-in [prop :type] :node)
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
          (swap! upstream-properties assoc prop {:schema {:type :default}
                                                 :from-type (:from type-change)})
          (swap! property-schemas assoc prop {:type :default})
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
                    (if (= :default (:type (get @property-schemas prop)))
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
                                       :block/schema {:type built-in-type}}]
                     [property-map v]))
                 (when (db-property-type/value-ref-property-types (:type (get-schema-fn k)))
                   (let [property-map {:db/ident (get-ident all-idents k)
                                       :original-property-id k
                                       :block/schema (get-schema-fn k)}]
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
             (if (:block/name block) (get-page-uuid page-names-to-uuids ((some-fn ::original-name :block/name) block)) (:block/uuid block))
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
   :macros :logseq.query/nlp-date
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
  "Adds page properties including special handling for :logseq.property/parent"
  [{:block/keys [properties] :as block*} db {:keys [page-names-to-uuids]} refs
   {:keys [user-options log-fn import-state] :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)
        block'
        (if (seq properties)
          (let [parent-classes-from-properties (->> (select-keys properties (:property-parent-classes user-options))
                                                    (mapcat (fn [[_k v]] (if (coll? v) v [v])))
                                                    distinct)]
            ;; TODO: Mv new classes from these find-or-create-class to :classes-tx as they are the only ones
            ;; that aren't conrolled by :classes-tx
            (cond-> block
              (seq parent-classes-from-properties)
              (merge (find-or-create-class db ((some-fn ::original-title :block/title) block) (:all-idents import-state) block))
              (seq parent-classes-from-properties)
              (assoc :logseq.property/parent
                     (let [new-class (first parent-classes-from-properties)
                           class-m (find-or-create-class db new-class (:all-idents import-state))]
                       (when (> (count parent-classes-from-properties) 1)
                         (log-fn :skipped-parent-classes "Only one parent class is allowed so skipped ones after the first one" :classes parent-classes-from-properties))
                       (merge class-m
                              {:block/uuid (find-or-gen-class-uuid page-names-to-uuids (common-util/page-name-sanity-lc new-class) (:db/ident class-m))})))))
          (dissoc block* :block/properties))
        block'' (replace-namespace-with-parent block' page-names-to-uuids)]
    {:block block'' :properties-tx properties-tx}))

(defn- handle-block-properties
  "Does everything page properties does and updates a couple of block specific attributes"
  [{:block/keys [title] :as block*}
   db page-names-to-uuids refs
   {{:keys [property-classes]} :user-options :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)
        advanced-query (some->> (second (re-find #"(?s)#\+BEGIN_QUERY(.*)#\+END_QUERY" title)) string/trim)
        additional-props (cond-> {}
                           ;; Order matters as we ensure a simple query gets priority
                           (macro-util/query-macro? title)
                           (assoc :logseq.property/query
                                  (or (some->> (second (re-find #"\{\{query(.*)\}\}" title))
                                               string/trim)
                                      title))
                           (seq advanced-query)
                           (assoc :logseq.property/query
                                  (if-let [query-map (not-empty (common-util/safe-read-map-string advanced-query))]
                                    (pr-str (dissoc query-map :title :group-by-page? :collapsed?))
                                    advanced-query)))
        {:keys [block-properties pvalues-tx]}
        (when (seq additional-props)
          (build-properties-and-values additional-props db page-names-to-uuids
                                       (select-keys block [:block/properties-text-values :block/name :block/title :block/uuid])
                                       options))
        pvalues-tx' (if (and pvalues-tx (seq advanced-query))
                      (concat pvalues-tx [{:block/uuid (second (:logseq.property/query block-properties))
                                           :logseq.property.code/lang "clojure"
                                           :logseq.property.node/display-type :code}])
                      pvalues-tx)]
    {:block
     (cond-> block
       (seq block-properties)
       (merge block-properties)

       (macro-util/query-macro? title)
       ((fn [b]
          (merge (update b :block/tags (fnil conj []) :logseq.class/Query)
                 ;; Put all non-query content in title. Could just be a blank string
                 {:block/title (string/trim (string/replace-first title #"\{\{query(.*)\}\}" ""))})))

       (seq advanced-query)
       ((fn [b]
          (let [query-map (common-util/safe-read-map-string advanced-query)]
            (cond-> (update b :block/tags (fnil conj []) :logseq.class/Query)
              true
              (assoc :block/title
                     (or (when-let [title' (:title query-map)]
                           (if (string? title') title' (pr-str title')))
                         ;; Put all non-query content in title for now
                         (string/trim (string/replace-first title #"(?s)#\+BEGIN_QUERY(.*)#\+END_QUERY" ""))))
              (:collapsed? query-map)
              (assoc :block/collapsed? true)))))

       (and (seq property-classes) (seq (:block/refs block*)))
       ;; remove unused, nonexistent property page
       (update :block/refs (fn [refs] (remove #(property-classes (keyword (:block/name %))) refs))))
     :properties-tx (concat properties-tx (when pvalues-tx' pvalues-tx'))}))

(defn- update-block-refs
  "Updates the attributes of a block ref as this is where a new page is defined. Also
   updates block content effected by refs"
  [block page-names-to-uuids {:keys [whiteboard?]}]
  (let [ref-to-ignore? (if whiteboard?
                         #(and (map? %) (:block/uuid %))
                         #(and (vector? %) (= :block/uuid (first %))))]
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
               ;; TODO: Handle refs for whiteboard block which has none
               (let [refs (->> (:block/refs block)
                               (remove #(or (ref-to-ignore? %)
                                  ;; ignore deadline related refs that don't affect content
                                            (and (keyword? %) (db-malli-schema/internal-ident? %))))
                               (map #(add-uuid-to-page-map % page-names-to-uuids)))]
                 (db-content/title-ref->id-ref (:block/title block) refs {:replace-tag? false}))))
      block)))

(defn- fix-pre-block-references
  "Point pre-block children to parents since pre blocks don't exist in db graphs"
  [{:block/keys [parent] :as block} pre-blocks page-names-to-uuids]
  (cond-> block
    (and (vector? parent) (contains? pre-blocks (second parent)))
    (assoc :block/parent [:block/uuid (get-page-uuid page-names-to-uuids (second (:block/page block)))])))

(defn- fix-block-name-lookup-ref
  "Some graph-parser attributes return :block/name as a lookup ref. This fixes
  those to use uuids since block/name is not unique for db graphs"
  [block page-names-to-uuids]
  (cond-> block
    (= :block/name (first (:block/page block)))
    (assoc :block/page [:block/uuid (get-page-uuid page-names-to-uuids (second (:block/page block)))])
    (:block/name (:block/parent block))
    (assoc :block/parent {:block/uuid (get-page-uuid page-names-to-uuids (:block/name (:block/parent block)))})))

(defn- build-block-tx
  [db block* pre-blocks {:keys [page-names-to-uuids] :as per-file-state} {:keys [import-state journal-created-ats] :as options}]
  ;; (prn ::block-in block*)
  (let [;; needs to come before update-block-refs to detect new property schemas
        {:keys [block properties-tx]}
        (handle-block-properties block* db page-names-to-uuids (:block/refs block*) options)
        {block-after-built-in-props :block deadline-properties-tx :properties-tx} (update-block-deadline block db options)
        ;; :block/page should be [:block/page NAME]
        journal-page-created-at (some-> (:block/page block*) second journal-created-ats)
        prepared-block (cond-> block-after-built-in-props
                         journal-page-created-at
                         (assoc :block/created-at journal-page-created-at))
        block' (-> prepared-block
                   (fix-pre-block-references pre-blocks page-names-to-uuids)
                   (fix-block-name-lookup-ref page-names-to-uuids)
                   (update-block-refs page-names-to-uuids options)
                   (update-block-tags db (:user-options options) per-file-state (:all-idents import-state))
                   (update-block-marker options)
                   (update-block-priority options)
                   add-missing-timestamps
                   ;; old whiteboards may have this
                   (dissoc :block/left)
                   ;; ((fn [x] (prn :block-out x) x))
                   ;; TODO: org-mode content needs to be handled
                   (assoc :block/format :markdown))]
    ;; Order matters as properties are referenced in block
    (concat properties-tx deadline-properties-tx [block'])))

(defn- update-page-alias
  [m page-names-to-uuids]
  (update m :block/alias (fn [aliases]
                           (map #(vector :block/uuid (get-page-uuid page-names-to-uuids (:block/name %)))
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
      ;; TODO: org-mode content needs to be handled
      (assoc :block/format :markdown)
      (dissoc :block/whiteboard?)
      (update-page-tags db user-options per-file-state all-idents)))

(defn- get-all-existing-page-uuids
  "Returns a map of unique page names mapped to their uuids. The page names
   are in a format that is compatible with extract/extract e.g. namespace pages have
   their full hierarchy in the name"
  [db]
  (->> db
       ;; don't fetch built-in as that would give the wrong entity if a user used
       ;; a db-only built-in property name e.g. description
       (d/q '[:find [?b ...]
              :where [?b :block/name] [(missing? $ ?b :logseq.property/built-in?)]])
       (map #(d/entity db %))
       (map #(vector
              (if-let [parents (and (or (ldb/internal-page? %) (ldb/class? %))
                                    (->> (ldb/get-page-parents %)
                                         (remove (fn [e] (= :logseq.class/Root (:db/ident e))))
                                         seq))]
                ;; Build a :block/name for namespace pages that matches data from extract/extract
                (string/join ns-util/namespace-char (map :block/name (conj (vec parents) %)))
                (:block/name %))
              (or (:block/uuid %)
                  (throw (ex-info (str "No uuid for existing page " (pr-str (:block/name %)))
                                  (select-keys % [:block/name :block/tags]))))))
       (into {})))

(defn- build-existing-page
  [m db page-uuid {:keys [page-names-to-uuids] :as per-file-state} {:keys [notify-user import-state] :as options}]
  (let [;; These attributes are not allowed to be transacted because they must not change across files
        disallowed-attributes [:block/name :block/uuid :block/format :block/title :block/journal-day
                               :block/created-at :block/updated-at]
        allowed-attributes (into [:block/tags :block/alias :logseq.property/parent :db/ident]
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
          (cond-> page
            ;; fix extract incorrectly assigning new user pages built-in uuids
            (contains? all-built-in-names (keyword (:block/name page)))
            (assoc :block/uuid (d/squuid))
            ;; only happens for few file built-ins like tags and alias
            (and (contains? all-built-in-names (keyword (:block/name page)))
                 (not (:block/tags page)))
            (assoc :block/tags [:logseq.class/Page])))]
    (cond-> page'
      (:block/namespace page)
      ((fn [block']
         (merge (build-new-namespace-page block')
                {;; save original name b/c it's still used for a few name lookups
                 ::original-name (:block/name block')
                 ::original-title (:block/title block')}))))))

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return a map containing
  all non-whiteboard pages to be transacted, pages' properties and additional
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
        ;; Fetch all named ents once per import file to speed up named lookups
        all-existing-page-uuids (get-all-existing-page-uuids @conn)
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
                   (when (= :default (:type schema))
                     (build-upstream-properties-tx-for-default db prop prop-ident from-type block-properties-text-values))
                   property-pages-tx [{:db/ident prop-ident :block/schema schema}]]
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
   ;; Map of property names (keyword) and their current schemas (map).
   ;; Used for adding schemas to properties and detecting changes across a property's usage
   :property-schemas (atom {})
   ;; Map of property or class names (keyword) to db-ident keywords
   :all-idents (atom {})
   ;; Map of block uuids to their :block/properties-text-values value.
   ;; Used if a property value changes to :default
   :block-properties-text-values (atom {})})

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

(defn- split-pages-and-properties-tx
  "Separates new pages from new properties tx in preparation for properties to
  be transacted separately. Also builds property pages tx and converts existing
  pages that are now properties"
  [pages-tx old-properties existing-pages import-state]
  (let [new-properties (set/difference (set (keys @(:property-schemas import-state))) (set old-properties))
        ;; _ (when (seq new-properties) (prn :new-properties new-properties))
        [properties-tx pages-tx'] ((juxt filter remove)
                                   #(contains? new-properties (keyword (:block/name %))) pages-tx)
        property-pages-tx (map (fn [{block-uuid :block/uuid :block/keys [title]}]
                                 (let [property-name (keyword (string/lower-case title))
                                       db-ident (get-ident @(:all-idents import-state) property-name)]
                                   (sqlite-util/build-new-property db-ident
                                                                   (get-property-schema @(:property-schemas import-state) property-name)
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
                 (merge (select-keys new-prop [:block/tags :block/schema :db/ident :db/index :db/cardinality :db/valueType])
                        {:block/uuid existing-page-uuid})))
             (set/intersection new-properties (set (map keyword (keys existing-pages)))))
        ;; Save properties on new property pages separately as they can contain new properties and thus need to be
        ;; transacted separately the property pages
        property-page-properties-tx (keep (fn [b]
                                            (when-let [page-properties (not-empty (db-property/properties b))]
                                              (merge page-properties {:block/uuid (:block/uuid b)
                                                                      :block/tags (conj (:block/tags page-properties) :logseq.class/Property)})))
                                          properties-tx)]
    {:pages-tx pages-tx'
     :property-pages-tx (concat property-pages-tx converted-property-pages-tx)
     :property-page-properties-tx property-page-properties-tx}))

(defn- update-whiteboard-blocks [blocks format]
  (map (fn [b]
         (if (seq (:block/properties b))
           (-> (dissoc b :block/content)
               (update :block/title #(gp-property/remove-properties format %)))
           (cond-> (dissoc b :block/content)
             (:block/content b)
             (assoc :block/title (:block/content b)))))
       blocks))

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

(defn- extract-pages-and-blocks
  "Main fn which calls graph-parser to convert markdown into data"
  [db file content {:keys [extract-options notify-user]}]
  (let [format (common-util/get-format file)
        extract-options' (merge {:block-pattern (common-config/get-block-pattern format)
                                 :date-formatter "MMM do, yyyy"
                                 :uri-encoded? false
                                 :export-to-db-graph? true
                                 :filename-format :legacy}
                                extract-options
                                {:db db})]
    (cond (contains? common-config/mldoc-support-formats format)
          (-> (extract/extract file content extract-options')
              (update :pages (fn [pages]
                               (map #(dissoc % :block.temp/original-page-name) pages)))
              (update :blocks fix-extracted-block-tags-and-refs))

          (common-config/whiteboard? file)
          (-> (extract/extract-whiteboard-edn file content extract-options')
              (update :pages (fn [pages]
                               (->> pages
                                    ;; migrate previous attribute for :block/title
                                    (map #(-> %
                                              (assoc :block/title (or (:block/original-name %) (:block/title %))
                                                     :block/tags #{:logseq.class/Whiteboard})
                                              (dissoc :block/type :block/original-name))))))
              (update :blocks update-whiteboard-blocks format))

          :else
          (notify-user {:msg (str "Skipped file since its format is not supported: " file)}))))

(defn- build-journal-created-ats
  "Calculate created-at timestamps for journals"
  [pages]
  (->> pages
       (map #(when-let [journal-day (:block/journal-day %)]
               [(:block/name %) (date-time-util/journal-day->ms journal-day)]))
       (into {})))

(defn add-file-to-db-graph
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
  (let [options (assoc *options :notify-user notify-user :log-fn log-fn)
        {:keys [pages blocks]} (extract-pages-and-blocks @conn file content options)
        tx-options (merge (build-tx-options options)
                          {:journal-created-ats (build-journal-created-ats pages)})
        old-properties (keys @(get-in options [:import-state :property-schemas]))
        ;; Build page and block txs
        {:keys [pages-tx page-properties-tx per-file-state existing-pages]} (build-pages-tx conn pages blocks tx-options)
        whiteboard-pages (->> pages-tx
                              ;; support old and new whiteboards
                              (filter ldb/whiteboard?)
                              (map (fn [page-block]
                                     (-> page-block
                                         (assoc :block/format :markdown
                                                :logseq.property/ls-type :whiteboard-page)))))
        pre-blocks (->> blocks (keep #(when (:block/pre-block? %) (:block/uuid %))) set)
        blocks-tx (->> blocks
                       (remove :block/pre-block?)
                       (mapcat #(build-block-tx @conn % pre-blocks per-file-state
                                                (assoc tx-options :whiteboard? (some? (seq whiteboard-pages)))))
                       vec)
        {:keys [property-pages-tx property-page-properties-tx] pages-tx' :pages-tx}
        (split-pages-and-properties-tx pages-tx old-properties existing-pages (:import-state options))
        ;; Necessary to transact new property entities first so that block+page properties can be transacted next
        main-props-tx-report (d/transact! conn property-pages-tx {::new-graph? true})

        classes-tx @(:classes-tx tx-options)
        ;; Build indices
        pages-index (->> (map #(select-keys % [:block/uuid]) pages-tx')
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
        tx (concat whiteboard-pages pages-index page-properties-tx property-page-properties-tx pages-tx' classes-tx blocks-index blocks-tx)
        tx' (common-util/fast-remove-nils tx)
        ;; _ (prn :tx-counts (map count (vector whiteboard-pages pages-index page-properties-tx property-page-properties-tx pages-tx' classes-tx blocks-index blocks-tx)))
        ;; _ (when (not (seq whiteboard-pages)) (cljs.pprint/pprint {#_:property-pages-tx #_property-pages-tx :tx tx'}))
        main-tx-report (try
                         (d/transact! conn tx' {::new-graph? true})
                         (catch :default e
                           (js/console.error e)
                           ;; (prn :db (ldb/write-transit-str @conn))
                           ;; (prn :tx (ldb/write-transit-str tx'))
                           (throw e)))

        upstream-properties-tx
        (build-upstream-properties-tx @conn @(:upstream-properties tx-options) (:import-state options) log-fn)
        upstream-tx-report (when (seq upstream-properties-tx) (d/transact! conn upstream-properties-tx {::new-graph? true}))]

    ;; Return all tx-reports that occurred in this fn as UI needs to know what changed
    [main-props-tx-report main-tx-report upstream-tx-report]))

;; Higher level export fns
;; =======================

(defn- export-doc-file
  [{:keys [path idx] :as file} conn <read-file
   {:keys [notify-user set-ui-state export-file]
    :or {set-ui-state (constantly nil)
         export-file (fn export-file [conn m opts]
                       (try
                         (add-file-to-db-graph conn (:file/path m) (:file/content m) opts)
                         (catch :default e
                           (js/console.error e)
                           (prn :debug "failed to parse " (:file/path m)))))}
    :as options}]
  ;; (prn :export-doc-file path idx)
  (-> (p/let [_ (set-ui-state [:graph/importing-state :current-idx] (inc idx))
              _ (set-ui-state [:graph/importing-state :current-page] path)
              content (<read-file file)
              m {:file/path path :file/content content}]
        (export-file conn m (dissoc options :set-ui-state :export-file))
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
                        (sort-by :path *doc-files)
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
                (<save-file repo-or-conn "logseq/config.edn" %)
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

(defn- export-asset-files
  "Exports files under assets/"
  [*asset-files <copy-asset-file {:keys [notify-user set-ui-state]
                                  :or {set-ui-state (constantly nil)}}]
  (let [asset-files (mapv #(assoc %1 :idx %2)
                          ;; Sort files to ensure reproducible import behavior
                          (sort-by :path *asset-files)
                          (range 0 (count *asset-files)))
        copy-asset (fn copy-asset [{:keys [path] :as file}]
                     (p/catch
                      (<copy-asset-file file)
                      (fn [error]
                        (notify-user {:msg (str "Import failed on " (pr-str path) " with error:\n" (.-message error))
                                      :level :error
                                      :ex-data {:path path :error error}}))))]
    (when (seq asset-files)
      (set-ui-state [:graph/importing-state :current-page] "Asset files")
      (-> (p/loop [_ (copy-asset (get asset-files 0))
                   i 0]
            (when-not (>= i (dec (count asset-files)))
              (p/recur (copy-asset (get asset-files (inc i)))
                       (inc i))))
          (p/catch (fn [e]
                     (notify-user {:msg (str "Import has an unexpected error:\n" (.-message e))
                                   :level :error
                                   :ex-data {:error e}})))))))

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
  "Builds options for use with export-doc-files"
  [config options]
  (-> {:extract-options {:date-formatter (common-config/get-date-formatter config)
                         :user-config config
                         :filename-format (or (:file/name-format config) :legacy)
                         :verbose (:verbose options)}
       :user-config config
       :user-options (merge {:remove-inline-tags? true :convert-all-tags? true} (:user-options options))
       :import-state (new-import-state)
       :macros (or (:macros options) (:macros config))}
      (merge (select-keys options [:set-ui-state :export-file :notify-user]))))

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
   * :default-config - default config if config is unable to be read
   * :user-options - map of user specific options. See add-file-to-db-graph for more
   * :<save-config-file - fn which saves a config file
   * :<save-logseq-file - fn which saves a logseq file
   * :<copy-asset - fn which copies asset file

   Note: See export-doc-files for additional options that are only for it"
  [repo-or-conn conn config-file *files {:keys [<read-file <copy-asset rpath-key log-fn]
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
           doc-files (->> files
                          (remove logseq-file?)
                          (filter #(contains? #{"md" "org" "markdown" "edn"} (path/file-ext (:path %)))))
           asset-files (filter #(string/starts-with? (get % rpath-key) "assets/") files)
           doc-options (build-doc-options config options)]
       (log-fn "Importing" (count doc-files) "files ...")
       ;; These export* fns are all the major export/import steps
       (p/do!
        (export-logseq-files repo-or-conn (filter logseq-file? files) <read-file
                             (-> (select-keys options [:notify-user :<save-logseq-file])
                                 (set/rename-keys {:<save-logseq-file :<save-file})))
        (export-asset-files asset-files <copy-asset (select-keys options [:notify-user :set-ui-state]))
        (export-doc-files conn doc-files <read-file doc-options)
        (export-favorites-from-config-edn conn repo-or-conn config {})
        (export-class-properties conn repo-or-conn)
        {:import-state (:import-state doc-options)
         :files files})))
   (p/finally (fn [_]
                (reset! gp-block/*export-to-db-graph? false)))
   (p/catch (fn [e]
              (reset! gp-block/*export-to-db-graph? false)
              ((:notify-user options)
               {:msg (str "Import has unexpected error:\n" (.-message e))
                :level :error
                :ex-data {:error e}})))))
