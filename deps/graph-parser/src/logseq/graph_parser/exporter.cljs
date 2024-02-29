(ns logseq.graph-parser.exporter
  "Exports a file graph to DB graph. Used by the File to DB graph importer"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [clojure.edn :as edn]
            [datascript.core :as d]
            [logseq.graph-parser.extract :as extract]
            [logseq.common.util :as common-util]
            [logseq.common.config :as common-config]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [logseq.common.util.macro :as macro-util]
            [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.rules :as rules]
            [promesa.core :as p]))

(defn- get-pid
  "Get a property's id (name or uuid) given its name. For db graphs"
  [db property-name]
  (:block/uuid (d/entity db [:block/name (common-util/page-name-sanity-lc (name property-name))])))

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

(defn- convert-tag-to-class
  "Converts a tag block with class or returns nil if this tag should be removed
   because it has been moved"
  [tag-block tag-classes]
  (if-let [new-class (:block.temp/new-class tag-block)]
    (sqlite-util/build-new-class
     {:block/original-name new-class
      :block/name (common-util/page-name-sanity-lc new-class)})
    (when (contains? tag-classes (:block/name tag-block))
      (-> tag-block
          add-missing-timestamps
          ;; don't use build-new-class b/c of timestamps
          (merge {:block/journal? false
                  :block/format :markdown
                  :block/type "class"})))))

(defn- update-page-tags
  [block tag-classes names-uuids page-tags-uuid]
  (if (seq (:block/tags block))
    (let [page-tags (->> (:block/tags block)
                         (remove #(or (:block.temp/new-class %) (contains? tag-classes (:block/name %))))
                         (map #(or (get names-uuids (:block/name %))
                                   (throw (ex-info (str "No uuid found for tag " (pr-str (:block/name %)))
                                                   {:tag %}))))
                         set)]
      (cond-> block
        true
        (update :block/tags
                (fn [tags]
                  (keep #(convert-tag-to-class % tag-classes) tags)))
        (seq page-tags)
        (update :block/properties merge {page-tags-uuid page-tags})))
    block))

(defn- add-uuid-to-page-map [m page-names-to-uuids]
  (assoc m
         :block/uuid
         (or (get page-names-to-uuids (:block/name m))
             (throw (ex-info (str "No uuid found for page " (pr-str (:block/name m)))
                             {:page m})))))

(defn- update-block-tags
  [block tag-classes page-names-to-uuids]
  (if (seq (:block/tags block))
    (let [original-tags (remove :block.temp/new-class (:block/tags block))]
      (-> block
          (update :block/content
                  db-content/content-without-tags
                  (->> original-tags
                       (filter #(tag-classes (:block/name %)))
                       (map :block/original-name)))
          (update :block/content
                  db-content/replace-tags-with-page-refs
                  (->> original-tags
                       (remove #(tag-classes (:block/name %)))
                       (map #(add-uuid-to-page-map % page-names-to-uuids))))
          (update :block/tags
                  (fn [tags]
                    (keep #(convert-tag-to-class % tag-classes) tags)))))
    block))

(def ignored-built-in-properties
  "Ignore built-in properties that are already imported or not supported in db graphs"
  ;; Already imported via a datascript attribute i.e. have :attribute on property config
  [:tags :alias :collapsed
   ;; Not supported as they have been ignored for a long time and cause invalid built-in pages
   :now :later :doing :done :canceled :cancelled :in-progress :todo :wait :waiting])

(defn- text-with-refs?
  "Detects if a property value has text with refs e.g. `#Logseq is #awesome`
  instead of `#Logseq #awesome`. If so the property type is :default instead of :page"
  [vals val-text]
  (let [replace-regex (re-pattern
                       ;; Regex removes all characters of a tag or page-ref
                       ;; so that only ref chars are left
                       (str "([#[])"
                            "("
                            ;; Sorts ref names in descending order so that longer names
                            ;; come first. Order matters since (foo-bar|foo) correctly replaces
                            ;; "foo-bar" whereas (foo|foo-bar) does not
                            (->> vals (sort >) (map common-util/escape-regex-chars) (string/join "|"))
                            ")"))
        remaining-text (string/replace val-text replace-regex "$1")
        non-ref-char (some #(if (or (string/blank? %) (#{"[" "]" "," "#"} %))
                              false
                              %)
                           remaining-text)]
    (some? non-ref-char)))

(defn- infer-property-schema-and-get-property-change
  "Infers a property's schema from the given _user_ property value and adds new ones to
  the property-schemas atom. If a property's :type changes, returns a map of
  the schema attribute changed and how it changed e.g. `{:type {:from :default :to :url}}`"
  [prop-val prop prop-val-text refs property-schemas macros]
  ;; Explicitly fail an unexpected case rather cause silent downstream failures
  (when (and (coll? prop-val) (not (every? string? prop-val)))
    (throw (ex-info "Import cannot infer schema of unknown property value"
                    {:value prop-val :property prop})))
  (let [prop-type (cond (and (coll? prop-val)
                             (seq prop-val)
                             (set/subset? prop-val
                                          (set (keep #(when (:block/journal? %) (:block/original-name %)) refs))))
                        :date
                        (and (coll? prop-val) (seq prop-val) (text-with-refs? prop-val prop-val-text))
                        :default
                        :else
                        (db-property-type/infer-property-type-from-value
                         (macro-util/expand-value-if-macro prop-val macros)))
        prev-type (get-in @property-schemas [prop :type])]
    (when-not prev-type
      (let [schema (cond-> {:type prop-type}
                     (#{:page :date} prop-type)
                     ;; Assume :many for now as detecting that detecting property values across files are consistent
                     ;; isn't possible yet
                     (assoc :cardinality :many))]
        (swap! property-schemas assoc prop schema)))
    (when (and prev-type (not= prev-type prop-type))
      {:type {:from prev-type :to prop-type}})))

(defn- update-built-in-property-values
  [props db ignored-properties {:block/keys [content name]}]
  (->> props
       (keep (fn [[prop val]]
               (if (= :icon prop)
                 (do (swap! ignored-properties
                            conj
                            {:property prop :value val :location (if name {:page name} {:block content})})
                     nil)
                 [prop
                  (case prop
                    :query-properties
                    (try
                      (mapv #(if (#{:page :block :created-at :updated-at} %) % (get-pid db %))
                            (edn/read-string val))
                      (catch :default e
                        (js/console.error "Translating query properties failed with:" e)
                        []))
                    :query-sort-by
                    (if (#{:page :block :created-at :updated-at} val) val (get-pid db val))
                    (:logseq.color :logseq.table.headers :logseq.table.hover)
                    (:block/uuid (db-property/get-closed-value-entity-by-name db prop val))
                    :logseq.table.version
                    (parse-long val)
                    :filters
                    (try (edn/read-string val)
                         (catch :default e
                           (js/console.error "Translating filters failed with:" e)
                           {}))
                    val)])))
       (into {})))

(defn- handle-changed-property
  "Handles a property's schema changing across blocks. Handling usually means
  converting a property value to a new changed value or nil if the property is
  to be ignored. Sometimes handling a property change results in changing a
  property's previous usages instead of its current value e.g. when changing to
  a :default type. This is done by adding an entry to upstream-properties and
  building the additional tx to ensure this happens"
  [val prop prop-name->uuid properties-text-values
   {:keys [ignored-properties property-schemas]}
   {:keys [property-changes log-fn upstream-properties]}]
  (let [type-change (get-in property-changes [prop :type])]
    (cond
      ;; ignore :to as any property value gets stringified
      (= :default (:from type-change))
      (or (get properties-text-values prop) (str val))
      (= {:from :page :to :date} type-change)
      ;; treat it the same as a :page
      (set (map (comp prop-name->uuid common-util/page-name-sanity-lc) val))
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
          (swap! upstream-properties assoc prop {:schema {:type :default}})
          (swap! property-schemas assoc prop {:type :default})
          (get properties-text-values prop)))
      :else
      (do
        (log-fn :prop-change-ignored {:property prop :val val :change type-change})
        (swap! ignored-properties conj {:property prop :value val :schema (get property-changes prop)})
        nil))))

(defn- user-property-value-to-ignore?
  [val]
  ;; Ignore blank values as they were usually generated by templates
  (and (string? val) (string/blank? val)))

(defn- update-user-property-values
  [props prop-name->uuid properties-text-values
   {:keys [property-schemas] :as import-state}
   {:keys [property-changes] :as options}]
  (->> props
       (keep (fn [[prop val]]
               (if (get-in property-changes [prop :type])
                 (when-let [val' (handle-changed-property val prop prop-name->uuid properties-text-values import-state options)]
                   [prop val'])
                 (when-not (user-property-value-to-ignore? val)
                   [prop
                    (if (set? val)
                      (if (= :default (get-in @property-schemas [prop :type]))
                        (get properties-text-values prop)
                      ;; assume for now a ref's :block/name can always be translated by lc helper
                        (set (map (comp prop-name->uuid common-util/page-name-sanity-lc) val)))
                      val)]))))
       (into {})))

(defn- cached-prop-name->uuid [db page-names-to-uuids k]
  (or (get page-names-to-uuids (name k))
      (get-pid db k)
      (throw (ex-info (str "No uuid found for page " (pr-str k))
                      {:page k}))))

(defn- update-properties
  "Updates block property names and values"
  [props db page-names-to-uuids
   {:block/keys [properties-text-values] :as block}
   {:keys [whiteboard? import-state] :as options}]
  (let [prop-name->uuid (if whiteboard?
                          (fn prop-name->uuid [k]
                            (or (get-pid db k)
                                (throw (ex-info (str "No uuid found for page " (pr-str k))
                                                {:page k}))))
                          (fn prop-name->uuid [k]
                            (cached-prop-name->uuid db page-names-to-uuids k)))
        user-properties (apply dissoc props db-property/built-in-properties-keys)]
    (when (seq user-properties)
      (swap! (:block-properties-text-values import-state)
             assoc
             ;; For pages, valid uuid is in page-names-to-uuids, not in block
             (if (:block/name block) (get page-names-to-uuids (:block/name block)) (:block/uuid block))
             properties-text-values))
    ;; TODO: Add import support for :template. Ignore for now as they cause invalid property types
    (if (contains? props :template)
      {}
      (-> (update-built-in-property-values
           (select-keys props db-property/built-in-properties-keys)
           db
           (:ignored-properties import-state)
           (select-keys block [:block/name :block/content]))
          (merge (update-user-property-values user-properties prop-name->uuid properties-text-values import-state options))
          (update-keys prop-name->uuid)))))

(defn- handle-page-properties
  "Infers property schemas, update :block/properties and remove deprecated
  property attributes. Only infers property schemas on user properties as
  built-in ones shouldn't change"
  [{:block/keys [properties] :as block} db page-names-to-uuids refs
   {:keys [import-state macros property-classes log-fn] :as options}]
  (-> (if (seq properties)
        (let [classes-from-properties (->> (select-keys properties property-classes)
                                           (mapcat (fn [[_k v]] (if (coll? v) v [v])))
                                           distinct)
              dissoced-props (concat ignored-built-in-properties
                                     ;; TODO: Add import support for these dissoced built-in properties
                                     [:title :id :created-at :updated-at
                                      :card-last-interval :card-repeats :card-last-reviewed :card-next-schedule
                                      :card-ease-factor :card-last-score]
                                     property-classes)
              properties' (apply dissoc properties dissoced-props)
              properties-to-infer (if (:template properties')
                                    ;; Ignore template properties as they don't consistently have representative property values
                                    {}
                                    (apply dissoc properties' db-property/built-in-properties-keys))
              property-changes
              (->> properties-to-infer
                   (keep (fn [[prop val]]
                           (when-let [property-change
                                      (and (not (user-property-value-to-ignore? val))
                                           (infer-property-schema-and-get-property-change val prop (get (:block/properties-text-values block) prop) refs (:property-schemas import-state) macros))]
                             [prop property-change])))
                   (into {}))
              _ (when (seq property-changes) (log-fn :prop-changes property-changes))
              options' (assoc options :property-changes property-changes)]
          (cond-> (assoc-in block [:block/properties]
                            (update-properties properties' db page-names-to-uuids
                                               (select-keys block [:block/properties-text-values :block/name :block/content :block/uuid])
                                               options'))
            (seq classes-from-properties)
            ;; Add a map of {:block.temp/new-class TAG} to be processed later
            (update :block/tags
                    (fnil into [])
                    (map #(hash-map :block.temp/new-class %
                                    :block/uuid (or (get-pid db %) (d/squuid)))
                         classes-from-properties))))
        block)
      (dissoc :block/properties-text-values :block/properties-order :block/invalid-properties)))

(defn- handle-block-properties
  "Does everything page properties does and updates a couple of block specific attributes"
  [block db page-names-to-uuids refs {:keys [property-classes] :as options}]
  (cond-> (handle-page-properties block db page-names-to-uuids refs options)
    (and (seq property-classes) (seq (:block/refs block)))
    ;; remove unused, nonexistent property page
    (update :block/refs (fn [refs] (remove #(property-classes (keyword (:block/name %))) refs)))
    (and (seq property-classes) (seq (:block/path-refs block)))
    ;; remove unused, nonexistent property page
    (update :block/path-refs (fn [refs] (remove #(property-classes (keyword (:block/name %))) refs)))))

(defn- update-block-refs
  "Updates the attributes of a block ref as this is where a new page is defined. Also
   updates block content effected by refs"
  [block page-names-to-uuids old-property-schemas {:keys [whiteboard? import-state]}]
  (let [ref-to-ignore? (if whiteboard?
                         #(and (map? %) (:block/uuid %))
                         #(and (vector? %) (= :block/uuid (first %))))
        new-property-schemas (apply dissoc @(:property-schemas import-state) (keys old-property-schemas))]
    (if (seq (:block/refs block))
      (cond-> block
        true
        (update
         :block/refs
         (fn [refs]
           (mapv (fn [ref]
                   (if (ref-to-ignore? ref)
                     ref
                     (merge (assoc ref :block/format :markdown)
                            (when-let [schema (get new-property-schemas (keyword (:block/name ref)))]
                              {:block/type "property"
                               :block/schema schema}))))
                 refs)))
        (:block/content block)
        (update :block/content
                db-content/page-ref->special-id-ref
                ;; TODO: Handle refs for whiteboard block which has none
                (->> (:block/refs block)
                     (remove ref-to-ignore?)
                     (map #(add-uuid-to-page-map % page-names-to-uuids)))))
      block)))

(defn- update-block-macros
  [block db page-names-to-uuids]
  (if (seq (:block/macros block))
    (update block :block/macros
            (fn [macros]
              (mapv (fn [m]
                      (-> m
                          (update :block/properties
                                  (fn [props]
                                    (update-keys props #(cached-prop-name->uuid db page-names-to-uuids %))))
                          (assoc :block/uuid (d/squuid))))
                    macros)))
    block))

(defn- fix-pre-block-references
  [{:block/keys [left parent page] :as block} pre-blocks]
  (cond-> block
    (and (vector? left) (contains? pre-blocks (second left)))
    (assoc :block/left page)
    ;; Children blocks of pre-blocks get lifted up to the next level which can cause conflicts
    ;; TODO: Detect sibling blocks to avoid parent-left conflicts
    (and (vector? parent) (contains? pre-blocks (second parent)))
    (assoc :block/parent page)))

(defn- build-block-tx
  [db block pre-blocks page-names-to-uuids {:keys [import-state tag-classes] :as options}]
  ;; (prn ::block-in block)
  (let [old-property-schemas @(:property-schemas import-state)]
    (-> block
        (fix-pre-block-references pre-blocks)
        (update-block-macros db page-names-to-uuids)
        ;; needs to come before update-block-refs to detect new property schemas
        (handle-block-properties db page-names-to-uuids (:block/refs block) options)
        (update-block-refs page-names-to-uuids old-property-schemas options)
        (update-block-tags tag-classes page-names-to-uuids)
        add-missing-timestamps
        ;; ((fn [x] (prn :block-out x) x))
        ;; TODO: org-mode content needs to be handled
        (assoc :block/format :markdown))))

(defn- build-new-page
  [m new-property-schemas tag-classes page-names-to-uuids page-tags-uuid]
  (-> (merge {:block/journal? false} m)
      ;; Fix pages missing :block/original-name. Shouldn't happen
      ((fn [m']
         (if-not (:block/original-name m')
           (assoc m' :block/original-name (:block/name m'))
           m')))
      (merge (when-let [schema (get new-property-schemas (keyword (:block/name m)))]
               {:block/type "property"
                :block/schema schema}))
      add-missing-timestamps
      ;; TODO: org-mode content needs to be handled
      (assoc :block/format :markdown)
      (dissoc :block/whiteboard?)
      (update-page-tags tag-classes page-names-to-uuids page-tags-uuid)))

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return all non-whiteboard pages to be transacted"
  [conn pages blocks {:keys [page-tags-uuid import-state tag-classes property-classes notify-user] :as options}]
  (let [all-pages (->> (extract/with-ref-pages pages blocks)
                       ;; remove unused property pages unless the page has content
                       (remove #(and (contains? property-classes (keyword (:block/name %)))
                                     (not (:block/file %))))
                       ;; remove file path relative
                       (map #(dissoc % :block/file)))
        existing-pages (keep #(d/entity @conn [:block/name (:block/name %)]) all-pages)
        existing-page-names (set (map :block/name existing-pages))
        new-pages (remove #(contains? existing-page-names (:block/name %)) all-pages)
        page-names-to-uuids (into {}
                                  (map (juxt :block/name :block/uuid) (concat new-pages existing-pages)))
        old-property-schemas @(:property-schemas import-state)
        ;; must come before building tx to detect new-property-schemas
        all-pages' (mapv #(handle-page-properties % @conn page-names-to-uuids all-pages options)
                         all-pages)
        new-property-schemas (apply dissoc @(:property-schemas import-state) (keys old-property-schemas))
        pages-tx (keep #(if (existing-page-names (:block/name %))
                          (let [schema (get new-property-schemas (keyword (:block/name %)))
                                ;; These attributes are not allowed to be transacted because they must not change across files
                                ;; block/uuid was particularly bad as it actually changed the page's identity across files
                                disallowed-attributes [:block/name :block/uuid :block/format :block/journal? :block/original-name :block/journal-day
                                                       :block/type :block/created-at :block/updated-at]
                                allowed-attributes [:block/properties :block/tags :block/alias :block/namespace]
                                block-changes (select-keys % allowed-attributes)]
                            (when-let [ignored-attrs (not-empty (apply dissoc % (into disallowed-attributes allowed-attributes)))]
                              (notify-user {:msg (str "Import ignored the following attributes on page " (pr-str (:block/original-name %)) ": "
                                                      ignored-attrs)}))
                            (when (or schema (seq block-changes))
                              (cond-> (merge {:block/name (:block/name %)} block-changes)
                                (:block/tags %)
                                (update-page-tags tag-classes page-names-to-uuids page-tags-uuid)
                                schema
                                (assoc :block/type "property" :block/schema schema))))
                          (build-new-page % new-property-schemas tag-classes page-names-to-uuids page-tags-uuid))
                       all-pages')]
    {:pages-tx pages-tx
     :page-names-to-uuids page-names-to-uuids}))

(defn- build-upstream-properties-tx
  "Builds tx for upstream properties that have changed and any instances of its
  use in db or in given blocks-tx. Upstream properties can be properties that
  already exist in the DB from another file or from earlier uses of a property
  in the same file"
  [db page-names-to-uuids upstream-properties block-properties-text-values blocks-tx log-fn]
  (if (seq upstream-properties)
    (do
      (log-fn :props-upstream-to-change upstream-properties)
      (mapcat
       (fn [[prop {:keys [schema]}]]
         ;; property schema change
         (let [prop-uuid (cached-prop-name->uuid db page-names-to-uuids prop)]
           (into [{:block/name (name prop) :block/schema schema}]
                 ;; property value changes
                 (when (= :default (:type schema))
                   (let [existing-blocks
                         (map first
                              (d/q '[:find (pull ?b [:block/uuid :block/properties])
                                     :in $ ?p %
                                     :where (or (has-page-property ?b ?p)
                                                (has-property ?b ?p))]
                                   db
                                   prop
                                   (rules/extract-rules rules/db-query-dsl-rules)))
                         ;; blocks in current file
                         pending-blocks (keep #(when (get-in % [:block/properties prop-uuid])
                                                 (select-keys % [:block/uuid :block/properties]))
                                              blocks-tx)]
                     (mapv (fn [m]
                             {:block/uuid (:block/uuid m)
                              :block/properties
                              (merge (:block/properties m)
                                     {prop-uuid (or (get-in block-properties-text-values [(:block/uuid m) prop])
                                                    (throw (ex-info (str "No :block/text-properties-values found when changing property values: " (:block/uuid m))
                                                                    {:property prop
                                                                     :block/uuid (:block/uuid m)})))})})
                           ;; there should always be some blocks to update or else the change wouldn't have
                           ;; been detected
                           (concat existing-blocks pending-blocks)))))))
       upstream-properties))
    []))

(defn new-import-state
  "New import state that is used in add-file-to-db-graph. State is atom per
   key to make code more readable and encourage local mutations"
  []
  {;; Vec of maps with keys :property, :value, :schema and :location.
   ;; Properties are ignored to keep graph valid and notify users of ignored properties.
   ;; Properties with :schema are ignored due to property schema changes
   :ignored-properties (atom [])
   ;; Map of property names (keyword) and their current schemas (map).
   ;; Used for adding schemas to properties and detecting changes across a property's usage
   :property-schemas (atom {})
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
    :tag-classes (set (map string/lower-case (:tag-classes user-options)))
    :property-classes (set/difference
                       (set (map (comp keyword string/lower-case) (:property-classes user-options)))
                       db-property/built-in-properties-keys)}))

(defn add-file-to-db-graph
  "Parse file and save parsed data to the given db graph. Options available:
  
* :extract-options - Options map to pass to extract/extract
* :user-options - User provided options maps that alter how a file is converted to db graph. Current options
   are :tag-classes (set) and :property-classes (set).
* :page-tags-uuid - uuid of pageTags property
* :import-state - useful import state to maintain across files e.g. property schemas or ignored properties
* :macros - map of macros for use with macro expansion
* :notify-user - Displays warnings to user without failing the import. Fn receives a map with :msg
* :log-fn - Logs messages for development. Defaults to prn"
  [conn file content {:keys [extract-options notify-user log-fn]
                      :or {notify-user #(println "[WARNING]" (:msg %))
                           log-fn prn}
                      :as *options}]
  (let [options (assoc *options :notify-user notify-user :log-fn log-fn)
        format (common-util/get-format file)
        extract-options' (merge {:block-pattern (common-config/get-block-pattern format)
                                 :date-formatter "MMM do, yyyy"
                                 :uri-encoded? false
                                 :db-graph-mode? true
                                 :filename-format :legacy}
                                extract-options
                                {:db @conn})
        {:keys [pages blocks]}
        (cond (contains? common-config/mldoc-support-formats format)
              (extract/extract file content extract-options')

              (common-config/whiteboard? file)
              (extract/extract-whiteboard-edn file content extract-options')

              :else
              (notify-user {:msg (str "Skipped file since its format is not supported: " file)}))
        tx-options (build-tx-options options)
        ;; Build page and block txs
        {:keys [pages-tx page-names-to-uuids]} (build-pages-tx conn pages blocks tx-options)
        whiteboard-pages (->> pages-tx
                              ;; support old and new whiteboards
                              (filter #(#{"whiteboard" ["whiteboard"]} (:block/type %)))
                              (map (fn [page-block]
                                     (-> page-block
                                         (assoc :block/journal? false
                                                :block/format :markdown
                                                 ;; fixme: missing properties
                                                :block/properties {(get-pid @conn :ls-type) :whiteboard-page})))))
        pre-blocks (->> blocks (keep #(when (:block/pre-block? %) (:block/uuid %))) set)
        blocks-tx (->> blocks
                       (remove :block/pre-block?)
                       (mapv #(build-block-tx @conn % pre-blocks page-names-to-uuids
                                              (assoc tx-options :whiteboard? (some? (seq whiteboard-pages))))))
        upstream-properties-tx (build-upstream-properties-tx
                                @conn
                                page-names-to-uuids
                                @(:upstream-properties tx-options)
                                @(get-in tx-options [:import-state :block-properties-text-values])
                                blocks-tx
                                log-fn)
        ;; Build indices
        pages-index (map #(select-keys % [:block/name]) pages-tx)
        block-ids (map (fn [block] {:block/uuid (:block/uuid block)}) blocks-tx)
        block-refs-ids (->> (mapcat :block/refs blocks-tx)
                            (filter (fn [ref] (and (vector? ref)
                                                   (= :block/uuid (first ref)))))
                            (map (fn [ref] {:block/uuid (second ref)}))
                            (seq))
        ;; To prevent "unique constraint" on datascript
        block-ids (set/union (set block-ids) (set block-refs-ids))
        ;; Order matters as upstream-properties-tx can override some blocks-tx and indices need
        ;; to come before their corresponding tx
        tx (concat whiteboard-pages pages-index pages-tx block-ids blocks-tx upstream-properties-tx)
        tx' (common-util/fast-remove-nils tx)
        result (d/transact! conn tx')]
    result))

;; UI facing fns
;; =============

(defn setup-import-options
  [db config user-options {:keys [macros notify-user]}]
  (cond-> {:extract-options {:date-formatter (common-config/get-date-formatter config)
                             :user-config config
                             :filename-format (or (:file/name-format config) :legacy)}
           :user-options user-options
           :page-tags-uuid (:block/uuid (d/entity db [:block/name "pagetags"]))
           :import-state (new-import-state)
           :macros (or macros (:macros config))}
    notify-user
    (assoc :notify-user notify-user)))

(defn- import-doc-file
  [{:keys [rpath idx] :as file} conn <read-file
   {:keys [notify-user set-ui-state import-file]
    :or {set-ui-state (constantly nil)
         import-file (fn import-file [conn m opts]
                       (add-file-to-db-graph conn (:file/path m) (:file/content m) opts))}
    :as import-options}]
  ;; (prn :import-doc-file rpath idx)
  (-> (p/let [_ (set-ui-state [:graph/importing-state :current-idx] (inc idx))
              _ (set-ui-state [:graph/importing-state :current-page] rpath)
              content (<read-file file)
              m {:file/path rpath :file/content content}]
        (import-file conn m (dissoc import-options :set-ui-state :import-file))
        ;; returning val results in smoother ui updates
        m)
      (p/catch (fn [error]
                 (notify-user {:msg (str "Import failed on " (pr-str rpath) " with error:\n" error)
                               :level :error
                               :ex-data {:path rpath :error error}})))))

(defn import-from-doc-files!
  [conn *doc-files <read-file {:keys [notify-user set-ui-state]
                               :or {set-ui-state (constantly nil) notify-user prn}
                               :as import-options}]
  (set-ui-state [:graph/importing-state :total] (count *doc-files))
  (let [doc-files (mapv #(assoc %1 :idx %2)
                        ;; Sort files to ensure reproducible import behavior
                        (sort-by :rpath *doc-files)
                        (range 0 (count *doc-files)))]
    (-> (p/loop [_file-map (import-doc-file (get doc-files 0) conn <read-file import-options)
                 i 0]
          (when-not (>= i (dec (count doc-files)))
            (p/recur (import-doc-file (get doc-files (inc i)) conn <read-file import-options)
                     (inc i))))
        (p/catch (fn [e]
                   (notify-user {:msg (str "Import has unexpected error:\n" e)
                                 :level :error}))))))

(defn- default-save-file [conn path content]
  (ldb/transact! conn [{:file/path path
                        :file/content content
                        :file/last-modified-at (js/Date.)}]))

(defn import-logseq-files
  [repo-or-conn logseq-files <read-file {:keys [<save-file notify-user]
                                         :or {<save-file default-save-file}}]
  (let [custom-css (first (filter #(string/ends-with? (:rpath %) "logseq/custom.css") logseq-files))
        custom-js (first (filter #(string/ends-with? (:rpath %) "logseq/custom.js") logseq-files))]
    (-> (p/do!
         (when custom-css
           (-> (<read-file custom-css)
               (p/then #(<save-file repo-or-conn "logseq/custom.css" %))))
         (when custom-js
           (-> (<read-file custom-js)
               (p/then #(<save-file repo-or-conn "logseq/custom.js" %)))))
        (p/catch (fn [error]
                   (notify-user {:msg (str "Import unexpectedly failed while reading logseq files:\n" error)
                                 :level :error}))))))

(defn import-config-file!
  [repo-or-conn config-file <read-file {:keys [<save-file notify-user default-config]
                                        :or {default-config {}
                                             <save-file default-save-file}}]
  (-> (<read-file config-file)
      (p/then #(p/do!
                (<save-file repo-or-conn "logseq/config.edn" %)
                ;; Return original config as import process depends on original config e.g. :hidden
                (edn/read-string %)))
      (p/catch (fn [err]
                 (notify-user {:msg "Import may have mistakes due to an invalid config.edn. Recommend re-importing with a valid config.edn"
                               :level :error
                               :ex-data {:error err}})
                 (edn/read-string default-config)))))
