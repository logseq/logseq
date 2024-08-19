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
            [logseq.graph-parser.property :as gp-property]))

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

(defn- find-or-create-class
  [db class-name all-idents]
  (if-let [db-ident (get @all-idents (keyword class-name))]
    {:db/ident db-ident}
    (let [m (db-class/build-new-class db {:block/title class-name
                                          :block/name (common-util/page-name-sanity-lc class-name)})]
      (swap! all-idents assoc (keyword class-name) (:db/ident m))
      m)))

(defn- convert-tag-to-class
  "Converts a tag block with class or returns nil if this tag should be removed
   because it has been moved"
  [db tag-block page-names-to-uuids tag-classes all-idents]
  (if-let [new-class (:block.temp/new-class tag-block)]
    (let [class-m (find-or-create-class db new-class all-idents)]
      (merge class-m
             (if-let [existing-tag-uuid (get page-names-to-uuids (common-util/page-name-sanity-lc new-class))]
               {:block/uuid existing-tag-uuid}
               {:block/uuid (common-uuid/gen-uuid :db-ident-block-uuid (:db/ident class-m))})))
    (when (contains? tag-classes (:block/name tag-block))
      (if-let [existing-tag-uuid (first
                                  (d/q '[:find [?uuid ...]
                                         :in $ ?name
                                         :where [?b :block/uuid ?uuid] [?b :block/type "class"] [?b :block/name ?name]]
                                       db
                                       (:block/name tag-block)))]
        [:block/uuid existing-tag-uuid]
        ;; Creates or updates page within same tx
        (-> (merge tag-block
                   (find-or-create-class db (:block/title tag-block) all-idents))
            ;; override with imported timestamps
            (dissoc :block/created-at :block/updated-at)
            (merge (add-missing-timestamps
                    (select-keys tag-block [:block/created-at :block/updated-at]))))))))

(defn- get-page-uuid [page-names-to-uuids page-name]
  (or (get page-names-to-uuids page-name)
      (throw (ex-info (str "No uuid found for page name " (pr-str page-name))
                      {:page-name page-name}))))

(defn- update-page-tags
  [block db tag-classes page-names-to-uuids all-idents]
  (if (seq (:block/tags block))
    (let [page-tags (->> (:block/tags block)
                         (remove #(or (:block.temp/new-class %) (contains? tag-classes (:block/name %))))
                         (map #(vector :block/uuid (get-page-uuid page-names-to-uuids (:block/name %))))
                         set)]
      (cond-> block
        true
        (update :block/tags
                (fn [tags]
                  ;; Don't lazy load as this needs to build before the page does
                  (vec (keep #(convert-tag-to-class db % page-names-to-uuids tag-classes all-idents) tags))))
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
    tags)
   (string/trim)))

(defn- update-block-tags
  [block db tag-classes page-names-to-uuids all-idents]
  (if (seq (:block/tags block))
    (let [original-tags (remove :block.temp/new-class (:block/tags block))]
      (-> block
          (update :block/title
                  content-without-tags-ignore-case
                  (->> original-tags
                       (filter #(tag-classes (:block/name %)))
                       (map :block/title)))
          (update :block/title
                  db-content/replace-tags-with-page-refs
                  (->> original-tags
                       (remove #(tag-classes (:block/name %)))
                       (map #(add-uuid-to-page-map % page-names-to-uuids))))
          (update :block/tags
                  (fn [tags]
                    (vec (keep #(convert-tag-to-class db % page-names-to-uuids tag-classes all-idents) tags))))))
    block))

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
          ;; FIXME: block/refs property calculation should be handled by a listener
          (update :block/refs (fn [refs]
                                (into (remove #(= marker (:block/title %)) refs)
                                      [:logseq.class/Task :logseq.task/status])))
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
          ;; FIXME: block/refs property calculation should be handled by a listener
          (update :block/refs (fn [refs]
                                (into (remove #(= priority (:block/title %)) refs)
                                      [:logseq.task/priority])))
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
          deadline-page (or existing-journal-page
                            ;; FIXME: Register new pages so that two different refs to same new page
                            ;; don't create different uuids and thus an invalid page
                            (let [page-m (sqlite-util/build-new-page
                                          (date-time-util/int->journal-title date-int (common-config/get-date-formatter user-config)))]
                              (assoc page-m
                                     :block/uuid (common-uuid/gen-uuid :journal-page-uuid date-int)
                                     :block/type "journal"
                                     :block/journal-day date-int)))]
      {:block
       (-> block
           (assoc :logseq.task/deadline [:block/uuid (:block/uuid deadline-page)])
           (update :block/refs (fnil into []) [:logseq.task/deadline [:block/uuid (:block/uuid deadline-page)]])
           (dissoc :block/deadline :block/scheduled :block/repeated?))
       :properties-tx (when-not existing-journal-page [deadline-page])})
    {:block block :properties-tx []}))

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
      ;; :filters is not in built-in-properties because it maps to 2 new properties
      (conj :filters)))

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

(defn- update-built-in-property-values
  [props {:keys [ignored-properties all-idents]} {:block/keys [title name]} options]
  (->> props
       (keep (fn [[prop val]]
               ;; FIXME: Migrate :filters to :logseq.property.linked-references/* properties
               (if (#{:icon :filters} prop)
                 (do (swap! ignored-properties
                            conj
                            {:property prop :value val :location (if name {:page name} {:block title})})
                     nil)
                 [(built-in-property-name-to-idents prop)
                  (case prop
                    :query-properties
                    (let [property-classes (set (map keyword (:property-classes options)))]
                      (try
                        (mapv #(cond (#{:page :block :created-at :updated-at} %)
                                     %
                                     (property-classes %)
                                     :block/tags
                                     (= :tags %)
                                     ;; This could also be :logseq.property/page-tags
                                     :block/tags
                                     :else
                                     (get-ident @all-idents %))
                              (edn/read-string val))
                        (catch :default e
                          (js/console.error "Translating query properties failed with:" e)
                          [])))
                    :query-sort-by
                    (if (#{:page :block :created-at :updated-at} (keyword val)) (keyword val) (get-ident @all-idents (keyword val)))
                    val)])))
       (into {})))

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
          (swap! upstream-properties assoc prop {:schema {:type :default}})
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
                    (if (= :default (get-in @property-schemas [prop :type]))
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
   {:keys [import-state] :as options}]
  (let [{:keys [all-idents property-schemas]} import-state
        get-ident' #(get-ident @all-idents %)
        user-properties (apply dissoc props file-built-in-property-names)]
    (when (seq user-properties)
      (swap! (:block-properties-text-values import-state)
             assoc
             ;; For pages, valid uuid is in page-names-to-uuids, not in block
             (if (:block/name block) (get-page-uuid page-names-to-uuids (:block/name block)) (:block/uuid block))
             properties-text-values))
    ;; TODO: Add import support for :template. Ignore for now as they cause invalid property types
    (if (contains? props :template)
      {}
      (let [props' (-> (update-built-in-property-values
                        (select-keys props file-built-in-property-names)
                        (select-keys import-state [:ignored-properties :all-idents])
                        (select-keys block [:block/name :block/title])
                        (select-keys options [:property-classes]))
                       (merge (update-user-property-values user-properties page-names-to-uuids properties-text-values import-state options)))
            pvalue-tx-m (->property-value-tx-m block props' #(get @property-schemas %) @all-idents)
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
   :logseq.color :logseq.table.borders :logseq.table.stripes :logseq.table.max-width
   :logseq.table.version :logseq.table.compact :logseq.table.headers :logseq.table.hover])

(defn- pre-update-properties
  "Updates page and block properties before their property types are inferred"
  [properties class-related-properties]
  (let [dissoced-props (concat ignored-built-in-properties
                               ;; TODO: Add import support for these dissoced built-in properties
                               [:title :created-at :updated-at
                                :card-last-interval :card-repeats :card-last-reviewed :card-next-schedule
                                :card-ease-factor :card-last-score]
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
   {:keys [import-state macros property-classes property-parent-classes] :as options}]
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
                                           (select-keys block [:block/properties-text-values :block/name :block/title :block/uuid])
                                           options')]
          {:block
           (cond-> block
             true
             (merge block-properties)
             (seq classes-from-properties)
             ;; Add a map of {:block.temp/new-class TAG} to be processed later
             (update :block/tags
                     (fnil into [])
                     (map #(hash-map :block.temp/new-class %) classes-from-properties)))
           :properties-tx pvalues-tx})
        {:block block :properties-tx []})
      (update :block dissoc :block/properties :block/properties-text-values :block/properties-order :block/invalid-properties)))

(defn- handle-page-properties
  [{:block/keys [properties] :as block*} db page-names-to-uuids refs
   {:keys [property-parent-classes log-fn import-state] :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)
        block'
        (if (seq properties)
          (let [parent-classes-from-properties (->> (select-keys properties property-parent-classes)
                                                    (mapcat (fn [[_k v]] (if (coll? v) v [v])))
                                                    distinct)]
            (cond-> block
              (seq parent-classes-from-properties)
              (merge (find-or-create-class db (:block/title block) (:all-idents import-state)))
              (seq parent-classes-from-properties)
              (assoc :class/parent
                     (let [new-class (first parent-classes-from-properties)
                           class-m (find-or-create-class db new-class (:all-idents import-state))]
                       (when (> (count parent-classes-from-properties) 1)
                         (log-fn :skipped-parent-classes "Only one parent class is allowed so skipped ones after the first one" :classes parent-classes-from-properties))
                       (merge class-m
                              (if-let [existing-tag-uuid (get page-names-to-uuids (common-util/page-name-sanity-lc new-class))]
                                {:block/uuid existing-tag-uuid}
                                {:block/uuid (common-uuid/gen-uuid :db-ident-block-uuid (:db/ident class-m))}))))))
          (dissoc block* :block/properties))]
    {:block block' :properties-tx properties-tx}))

(defn- handle-block-properties
  "Does everything page properties does and updates a couple of block specific attributes"
  [block* db page-names-to-uuids refs {:keys [property-classes] :as options}]
  (let [{:keys [block properties-tx]} (handle-page-and-block-properties block* db page-names-to-uuids refs options)]
    {:block
     (cond-> block
       (and (seq property-classes) (seq (:block/refs block*)))
       ;; remove unused, nonexistent property page
       (update :block/refs (fn [refs] (remove #(property-classes (keyword (:block/name %))) refs))))
     :properties-tx properties-tx}))

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
                     (if-let [existing-uuid (some->> (:block/name ref) (get page-names-to-uuids))]
                       [:block/uuid existing-uuid]
                       [:block/uuid (:block/uuid ref)])
                     ref))
                 refs)))
        (:block/title block)
        (update :block/title
                db-content/page-ref->special-id-ref
                ;; TODO: Handle refs for whiteboard block which has none
                (->> (:block/refs block)
                     (remove #(or (ref-to-ignore? %)
                                  ;; ignore deadline related refs that don't affect content
                                  (and (keyword? %) (db-malli-schema/internal-ident? %))))
                     (map #(add-uuid-to-page-map % page-names-to-uuids)))))
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
  [db block* pre-blocks page-names-to-uuids {:keys [tag-classes import-state] :as options}]
  ;; (prn ::block-in block)
  (let [;; needs to come before update-block-refs to detect new property schemas
        {:keys [block properties-tx]}
        (handle-block-properties block* db page-names-to-uuids (:block/refs block*) options)
        {block-after-built-in-props :block deadline-properties-tx :properties-tx} (update-block-deadline block db options)
        block' (-> block-after-built-in-props
                   (fix-pre-block-references pre-blocks page-names-to-uuids)
                   (fix-block-name-lookup-ref page-names-to-uuids)
                   (update-block-refs page-names-to-uuids options)
                   (update-block-tags db tag-classes page-names-to-uuids (:all-idents import-state))
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
  [m db tag-classes page-names-to-uuids all-idents]
  (-> (cond-> m
        ;; Fix pages missing :block/title. Shouldn't happen
        (not (:block/title m))
        (assoc :block/title (:block/name m))
        (seq (:block/alias m))
        (update-page-alias page-names-to-uuids))
      add-missing-timestamps
      ;; TODO: org-mode content needs to be handled
      (assoc :block/format :markdown)
      (dissoc :block/whiteboard?)
      (update-page-tags db tag-classes page-names-to-uuids all-idents)))

(defn- build-pages-tx
  "Given all the pages and blocks parsed from a file, return a map containing
  all non-whiteboard pages to be transacted, pages' properties and additional
  data for subsequent steps"
  [conn pages blocks {:keys [tag-classes property-classes property-parent-classes notify-user import-state]
                      :as options}]
  (let [all-pages (->> (extract/with-ref-pages pages blocks)
                       ;; remove unused property pages unless the page has content
                       (remove #(and (contains? (into property-classes property-parent-classes) (keyword (:block/name %)))
                                     (not (:block/file %))))
                       ;; remove file path relative
                       (map #(dissoc % :block/file)))
        existing-pages (keep #(first
                               ;; don't fetch built-in as that would give the wrong entity if a user used
                               ;; a db-only built-in property name e.g. description
                               (d/q '[:find [(pull ?b [*]) ...]
                                      :in $ ?name
                                      :where [?b :block/name ?name] [(missing? $ ?b :logseq.property/built-in?)]]
                                    @conn
                                    (:block/name %)))
                             all-pages)
        existing-page-names-to-uuids (into {} (map (juxt :block/name :block/uuid) existing-pages))
        new-pages (->> all-pages
                       (remove #(contains? existing-page-names-to-uuids (:block/name %)))
                       ;; fix extract incorrectly assigning user pages built-in uuids
                       (map #(if (contains? all-built-in-names (keyword (:block/name %)))
                               (assoc % :block/uuid (d/squuid))
                               %)))
        page-names-to-uuids (merge existing-page-names-to-uuids
                                   (into {} (map (juxt :block/name :block/uuid) new-pages)))
        all-pages-m (mapv #(handle-page-properties % @conn page-names-to-uuids all-pages options)
                          all-pages)
        pages-tx (keep (fn [m]
                         (if-let [page-uuid (existing-page-names-to-uuids (:block/name m))]
                           (let [;; These attributes are not allowed to be transacted because they must not change across files
                                 disallowed-attributes [:block/name :block/uuid :block/format :block/title :block/journal-day
                                                        :block/created-at :block/updated-at]
                                 allowed-attributes (into [:block/tags :block/alias :class/parent :block/type :db/ident]
                                                          (keep #(when (db-malli-schema/user-property? (key %)) (key %))
                                                                m))
                                 block-changes (cond-> (select-keys m allowed-attributes)
                                                 ;; disallow any type -> "page" but do allow any conversion to a non-page type
                                                 (= (:block/type m) "page")
                                                 (dissoc :block/type))]
                             (when-let [ignored-attrs (not-empty (apply dissoc m (into disallowed-attributes allowed-attributes)))]
                               (notify-user {:msg (str "Import ignored the following attributes on page " (pr-str (:block/title m)) ": "
                                                       ignored-attrs)}))
                             (when (seq block-changes)
                               (cond-> (merge block-changes {:block/uuid page-uuid})
                                 (seq (:block/alias m))
                                 (update-page-alias page-names-to-uuids)
                                 (:block/tags m)
                                 (update-page-tags @conn tag-classes page-names-to-uuids (:all-idents import-state)))))

                           (when (or (= "class" (:block/type m))
                                     ;; Don't build a new page if it overwrites an existing class
                                     (not (some-> (get @(:all-idents import-state) (keyword (:block/title m)))
                                                  db-malli-schema/class?)))
                             (let [m' (if (contains? all-built-in-names (keyword (:block/name m)))
                                        ;; Use fixed uuid from above
                                        (cond-> (assoc m :block/uuid (get page-names-to-uuids (:block/name m)))
                                          ;; only happens for few file built-ins like tags and alias
                                          (not (:block/type m))
                                          (assoc :block/type "page"))
                                        m)]
                               (build-new-page-or-class m' @conn tag-classes page-names-to-uuids (:all-idents import-state))))))
                       (map :block all-pages-m))]
    {:pages-tx pages-tx
     :page-properties-tx (mapcat :properties-tx all-pages-m)
     :existing-pages existing-page-names-to-uuids
     :page-names-to-uuids page-names-to-uuids}))

(defn- build-upstream-properties-tx-for-default
  "Builds upstream-properties-tx for properties that change to :default type"
  [db prop property-ident block-properties-text-values]
  (let [get-pvalue-content (fn get-pvalue-content [block-uuid prop']
                             (or (get-in block-properties-text-values [block-uuid prop'])
                                 (throw (ex-info (str "No :block/text-properties-values found when changing property values: " (pr-str block-uuid))
                                                 {:property prop'
                                                  :block/uuid block-uuid}))))
        existing-blocks
        (map first
             (d/q '[:find (pull ?b [*])
                    :in $ ?p %
                    :where (or (has-page-property ?b ?p)
                               (has-property ?b ?p))]
                  db
                  property-ident
                  (rules/extract-rules rules/db-query-dsl-rules)))
        existing-blocks-tx
        (mapcat (fn [m]
                  (let [prop-value (get m property-ident)
                        prop-value-content (get-pvalue-content (:block/uuid m) prop)
                        new-value (db-property-build/build-property-value-block
                                   m {:db/ident property-ident} prop-value-content)]
                    (into (mapv #(vector :db/retractEntity (:db/id %))
                                (if (sequential? prop-value) prop-value [prop-value]))
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
           (fn [[prop {:keys [schema]}]]
             (let [prop-ident (get-ident all-idents prop)
                   upstream-tx
                   (when (= :default (:type schema))
                     (build-upstream-properties-tx-for-default db prop prop-ident block-properties-text-values))
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
    :tag-classes (set (map string/lower-case (:tag-classes user-options)))
    :property-classes (set/difference
                       (set (map (comp keyword string/lower-case) (:property-classes user-options)))
                       file-built-in-property-names)
    :property-parent-classes (set/difference
                              (set (map (comp keyword string/lower-case) (:property-parent-classes user-options)))
                              file-built-in-property-names)}))

(defn- split-pages-and-properties-tx
  "Separates new pages from new properties tx in preparation for properties to
  be transacted separately. Also builds property pages tx and converts existing
  pages that are now properties"
  [pages-tx old-properties existing-pages import-state]
  (let [new-properties (set/difference (set (keys @(:property-schemas import-state))) (set old-properties))
        ;; _ (when (seq new-properties) (prn :new-properties new-properties))
        [properties-tx pages-tx'] ((juxt filter remove)
                                   #(contains? new-properties (keyword (:block/name %))) pages-tx)
        property-pages-tx (map (fn [{:block/keys [title uuid]}]
                                 (let [db-ident (get @(:all-idents import-state) (keyword (string/lower-case title)))]
                                   (sqlite-util/build-new-property db-ident
                                                                   (get @(:property-schemas import-state) (keyword title))
                                                                   {:title title :block-uuid uuid})))
                               properties-tx)
        converted-property-pages-tx
        (map (fn [kw-name]
               (let [existing-page-uuid (get existing-pages (name kw-name))
                     db-ident (get @(:all-idents import-state) kw-name)
                     new-prop (sqlite-util/build-new-property db-ident
                                                              (get @(:property-schemas import-state) kw-name)
                                                              {:title (name kw-name)})]
                 (assert existing-page-uuid)
                 (merge (select-keys new-prop [:block/type :block/schema :db/ident :db/index :db/cardinality :db/valueType])
                        {:block/uuid existing-page-uuid})))
             (set/intersection new-properties (set (map keyword (keys existing-pages)))))
        ;; Save properties on new property pages separately as they can contain new properties and thus need to be
        ;; transacted separately the property pages
        property-page-properties-tx (keep (fn [b]
                                            (when-let [page-properties (not-empty (db-property/properties b))]
                                              (merge page-properties {:block/uuid (:block/uuid b)})))
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

(defn- extract-pages-and-blocks
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
          (extract/extract file content extract-options')

          (common-config/whiteboard? file)
          (-> (extract/extract-whiteboard-edn file content extract-options')
              (update :pages (fn [pages]
                               (->> pages
                                    ;; migrate previous attribute for :block/title
                                    (map #(-> %
                                              (assoc :block/title (:block/original-name %))
                                              (dissoc :block/original-name))))))
              (update :blocks update-whiteboard-blocks format))

          :else
          (notify-user {:msg (str "Skipped file since its format is not supported: " file)}))))

(defn add-file-to-db-graph
  "Parse file and save parsed data to the given db graph. Options available:

* :extract-options - Options map to pass to extract/extract
* :user-options - User provided options maps that alter how a file is converted to db graph. Current options
   are :tag-classes (set) and :property-classes (set).
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
        tx-options (build-tx-options options)
        old-properties (keys @(get-in options [:import-state :property-schemas]))
        ;; Build page and block txs
        {:keys [pages-tx page-properties-tx page-names-to-uuids existing-pages]} (build-pages-tx conn pages blocks tx-options)
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
                       (mapcat #(build-block-tx @conn % pre-blocks page-names-to-uuids
                                                (assoc tx-options :whiteboard? (some? (seq whiteboard-pages)))))
                       vec)

        {:keys [property-pages-tx property-page-properties-tx] pages-tx' :pages-tx}
        (split-pages-and-properties-tx pages-tx old-properties existing-pages (:import-state options))
        ;; Necessary to transact new property entities first so that block+page properties can be transacted next
        main-props-tx-report (d/transact! conn property-pages-tx {:new-graph? true})

        ;; Build indices
        pages-index (->> (map #(select-keys % [:block/uuid]) pages-tx')
                         ;; For new classes which may also be referenced elsewhere in the same page
                         (concat (mapcat (fn [p] (map #(select-keys % [:block/uuid]) (:block/tags p))) pages-tx'))
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
        tx (concat whiteboard-pages pages-index page-properties-tx property-page-properties-tx pages-tx' blocks-index blocks-tx)
        tx' (common-util/fast-remove-nils tx)
        ;; _ (prn :tx-counts (map count (vector whiteboard-pages pages-index page-properties-tx property-page-properties-tx pages-tx' blocks-index blocks-tx)))
        ;; _ (when (not (seq whiteboard-pages)) (cljs.pprint/pprint {:tx tx'}))
        ;; :new-graph? needed for :block/path-refs to be calculated
        main-tx-report (d/transact! conn tx' {:new-graph? true})

        upstream-properties-tx
        (build-upstream-properties-tx @conn @(:upstream-properties tx-options) (:import-state options) log-fn)
        upstream-tx-report (when (seq upstream-properties-tx) (d/transact! conn upstream-properties-tx {:new-graph? true}))]

    ;; Return all tx-reports that occurred in this fn as UI needs to know what changed
    [main-props-tx-report main-tx-report upstream-tx-report]))

;; Higher level export fns
;; =======================

(defn- export-doc-file
  [{:keys [path idx] :as file} conn <read-file
   {:keys [notify-user set-ui-state export-file]
    :or {set-ui-state (constantly nil)
         export-file (fn export-file [conn m opts]
                       (add-file-to-db-graph conn (:file/path m) (:file/content m) opts))}
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

(defn- export-config-file
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

(defn- export-class-properties
  [conn repo-or-conn]
  (let [user-classes (->> (d/q '[:find (pull ?b [:db/id :db/ident])
                                 :where [?b :block/type "class"]] @conn)
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
                    [?prop-e :block/type "property"]]
                  @conn
                  (set (map :db/ident user-classes)))
             (remove #(ldb/built-in? (d/entity @conn (second %))))
             (reduce (fn [acc [class-id prop-ident]]
                       (update acc class-id (fnil conj #{}) prop-ident))
                     {}))
        tx (mapv (fn [[class-id prop-ids]]
                   {:db/id class-id
                    :class/schema.properties (vec prop-ids)})
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
     (ldb/create-favorites-page! repo)
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
       :user-options (select-keys options [:tag-classes :property-classes :property-parent-classes])
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
   * :<save-config-file - fn which saves a config file
   * :<save-logseq-file - fn which saves a logseq file
   * :<copy-asset - fn which copies asset file

   Note: See export-doc-files for additional options that are only for it"
  [repo-or-conn conn config-file *files {:keys [<read-file <copy-asset rpath-key log-fn]
                                         :or {rpath-key :path log-fn println}
                                         :as options}]
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
      (log-fn "Importing" (count files) "files ...")
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
        :files files}))))
