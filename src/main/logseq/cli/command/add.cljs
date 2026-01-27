(ns logseq.cli.command.add
  "Add-related CLI commands."
  (:require ["fs" :as fs]
            [cljs-time.coerce :as tc]
            [cljs.reader :as reader]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.uuid :as common-uuid]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.type :as db-property-type]
            [promesa.core :as p]))

(def ^:private content-add-spec
  {:content {:desc "Block content for add"}
   :blocks {:desc "EDN vector of blocks for add"}
   :blocks-file {:desc "EDN file of blocks for add"}
   :tags {:desc "EDN vector of tags (id, :db/ident, or :block/title)"}
   :properties {:desc "EDN map of built-in properties (id, :db/ident, or :block/title)"}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"}
   :target-page-name {:desc "Target page name"}
   :pos {:desc "Position (first-child, last-child, sibling)"}
   :status {:desc "Task status (todo, doing, done, etc.)"}})

(def ^:private add-page-spec
  {:page {:desc "Page name"}
   :tags {:desc "EDN vector of tags (id, :db/ident, or :block/title)"}
   :properties {:desc "EDN map of built-in properties (id, :db/ident, or :block/title)"}})

(def entries
  [(core/command-entry ["add" "block"] :add-block "Add blocks" content-add-spec)
   (core/command-entry ["add" "page"] :add-page "Create page" add-page-spec)])

(defn- today-page-title
  [config repo]
  (p/let [journal (transport/invoke config :thread-api/pull false
                                    [repo [:logseq.property.journal/title-format] :logseq.class/Journal])
          formatter (or (:logseq.property.journal/title-format journal) "MMM do, yyyy")
          now (tc/from-date (js/Date.))]
    (date-time-util/format now formatter)))

(defn- ensure-page!
  [config repo page-name]
  (p/let [page (transport/invoke config :thread-api/pull false
                                 [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])]
    (if (:db/id page)
      page
      (p/let [_ (transport/invoke config :thread-api/apply-outliner-ops false
                                  [repo [[:create-page [page-name {}]]] {}])]
        (transport/invoke config :thread-api/pull false
                          [repo [:db/id :block/uuid :block/name :block/title] [:block/name page-name]])))))

(def ^:private add-positions
  #{"first-child" "last-child" "sibling"})

(def ^:private status-aliases
  {"todo" :logseq.property/status.todo
   "doing" :logseq.property/status.doing
   "done" :logseq.property/status.done
   "now" :logseq.property/status.doing
   "later" :logseq.property/status.todo
   "wait" :logseq.property/status.backlog
   "waiting" :logseq.property/status.backlog
   "backlog" :logseq.property/status.backlog
   "canceled" :logseq.property/status.canceled
   "cancelled" :logseq.property/status.canceled
   "in-review" :logseq.property/status.in-review
   "in_review" :logseq.property/status.in-review
   "inreview" :logseq.property/status.in-review
   "in-progress" :logseq.property/status.doing
   "in progress" :logseq.property/status.doing
   "inprogress" :logseq.property/status.doing})

(defn- normalize-status
  [value]
  (let [text (some-> value string/trim)
        parsed (when (and (seq text) (string/starts-with? text ":"))
                 (common-util/safe-read-string {:log-error? false} text))
        normalized (cond
                     (qualified-keyword? parsed)
                     parsed

                     (keyword? parsed)
                     (get status-aliases (name parsed))

                     (seq text)
                     (get status-aliases (string/lower-case text))

                     :else nil)]
    normalized))

(defn- ensure-block-uuids
  [blocks]
  (mapv (fn [block]
          (let [current (:block/uuid block)]
            (cond
              (some? current)
              (update block :block/uuid (fn [value]
                                          (if (and (string? value) (common-util/uuid-string? value))
                                            (uuid value)
                                            value)))

              :else
              (assoc block :block/uuid (common-uuid/gen-uuid)))))
        blocks))

(defn- invalid-options-result
  [message]
  {:ok? false
   :error {:code :invalid-options
           :message message}})

(defn- parse-edn-option
  [value]
  (when (seq value)
    (common-util/safe-read-string {:log-error? false} value)))

(defn- normalize-tag-value
  [value]
  (cond
    (uuid? value) value
    (number? value) value
    (and (string? value) (common-util/uuid-string? (string/trim value)))
    (uuid (string/trim value))
    (keyword? value) value
    (string? value) (let [text (-> value string/trim (string/replace #"^#+" ""))]
                      (cond
                        (string/blank? text) nil
                        (common-util/valid-edn-keyword? text)
                        (common-util/safe-read-string {:log-error? false} text)
                        :else text))
    :else nil))

(defn- parse-tags-option
  [value]
  (if-not (seq value)
    {:ok? true :value nil}
    (let [parsed (parse-edn-option value)]
      (cond
        (nil? parsed)
        (invalid-options-result "tags must be valid EDN vector")

        (not (vector? parsed))
        (invalid-options-result "tags must be a vector")

        (empty? parsed)
        (invalid-options-result "tags must be a non-empty vector")

        :else
        (let [tags (mapv normalize-tag-value parsed)]
          (if (some nil? tags)
            (invalid-options-result "tags must be strings, keywords, uuids, or ids")
            {:ok? true :value tags}))))))

(defn- normalize-property-key
  [value]
  (cond
    (keyword? value) value
    (string? value)
    (let [text (string/trim value)]
      (cond
        (string/blank? text) nil
        (common-util/valid-edn-keyword? text)
        (common-util/safe-read-string {:log-error? false} text)
        :else (keyword text)))
    :else nil))

(def ^:private built-in-properties-by-title
  (into {}
        (keep (fn [[ident {:keys [title]}]]
                (when (string? title)
                  [(common-util/page-name-sanity-lc title) ident])))
        db-property/built-in-properties))

(defn- property-title->ident
  [value]
  (when (string? value)
    (let [text (string/trim value)]
      (when (seq text)
        (get built-in-properties-by-title (common-util/page-name-sanity-lc text))))))

(defn- normalize-property-key-input
  [value]
  (cond
    (keyword? value) {:type :ident :value value}
    (number? value) {:type :id :value value}
    (string? value)
    (let [text (string/trim value)]
      (cond
        (string/blank? text) nil
        (common-util/valid-edn-keyword? text)
        (let [parsed (common-util/safe-read-string {:log-error? false} text)]
          (when (keyword? parsed)
            {:type :ident :value parsed}))
        :else
        (if-let [ident (property-title->ident text)]
          {:type :ident :value ident}
          {:type :ident :value (keyword text)})))
    :else nil))

(defn- parse-boolean-value
  [value]
  (cond
    (or (true? value) (false? value)) {:ok? true :value value}
    (string? value) (let [text (string/lower-case (string/trim value))]
                      (cond
                        (= text "true") {:ok? true :value true}
                        (= text "false") {:ok? true :value false}
                        :else {:ok? false}))
    :else {:ok? false}))

(defn- parse-number-value
  [value]
  (cond
    (number? value) {:ok? true :value value}
    (string? value) (let [parsed (js/parseFloat value)]
                      (if (js/isNaN parsed)
                        {:ok? false}
                        {:ok? true :value parsed}))
    :else {:ok? false}))

(defn- parse-datetime-value
  [value]
  (cond
    (number? value) {:ok? true :value value}
    (string? value) (let [date (js/Date. value)
                          ms (.getTime date)]
                      (if (js/isNaN ms)
                        {:ok? false}
                        {:ok? true :value ms}))
    :else {:ok? false}))

(defn- parse-keyword-value
  [value]
  (cond
    (keyword? value) {:ok? true :value value}
    (string? value) (let [text (string/trim value)]
                      (if (string/blank? text)
                        {:ok? false}
                        (if (common-util/valid-edn-keyword? text)
                          (let [parsed (common-util/safe-read-string {:log-error? false} text)]
                            (if (keyword? parsed)
                              {:ok? true :value parsed}
                              {:ok? false}))
                          {:ok? true :value (keyword text)})))
    :else {:ok? false}))

(defn- coerce-property-value-basic
  [property value]
  (let [type (get-in property [:schema :type] :default)]
    (cond
      (nil? value)
      {:ok? false :message "property value must not be nil"}

      (= type :checkbox)
      (let [{:keys [ok? value]} (parse-boolean-value value)]
        (if ok?
          {:ok? true :value value}
          {:ok? false :message "checkbox property expects true or false"}))

      (= type :number)
      (let [{:keys [ok? value]} (parse-number-value value)]
        (if ok?
          {:ok? true :value value}
          {:ok? false :message "number property expects a numeric value"}))

      (= type :raw-number)
      (if (number? value)
        {:ok? true :value value}
        {:ok? false :message "raw-number property expects a number"})

      (= type :datetime)
      (let [{:keys [ok? value]} (parse-datetime-value value)]
        (if ok?
          {:ok? true :value value}
          {:ok? false :message "datetime property expects an ISO date string"}))

      (= type :keyword)
      (let [{:keys [ok? value]} (parse-keyword-value value)]
        (if ok?
          {:ok? true :value value}
          {:ok? false :message "keyword property expects a keyword"}))

      (= type :string)
      (if (string? value)
        {:ok? true :value value}
        {:ok? false :message "string property expects a string"})

      (= type :map)
      (if (map? value)
        {:ok? true :value value}
        {:ok? false :message "map property expects a map"})

      (= type :coll)
      (if (and (coll? value) (not (string? value)))
        {:ok? true :value (vec value)}
        {:ok? false :message "coll property expects a collection"})

      (= type :url)
      (if (and (string? value) (or (db-property-type/url? value) (db-property-type/macro-url? value)))
        {:ok? true :value value}
        {:ok? false :message "url property expects a valid url"})

      (= type :date)
      (if (string? value)
        {:ok? true :value value}
        {:ok? false :message "date property expects a date string"})

      (contains? #{:entity :page :class :property :node :default :any} type)
      {:ok? true :value value}

      :else
      {:ok? true :value value})))

(defn- normalize-property-values
  [property value]
  (let [many? (= :many (get-in property [:schema :cardinality]))
        values (if many?
                 (if (and (coll? value) (not (string? value))) value [value])
                 [value])]
    (loop [remaining values
           normalized []]
      (if (empty? remaining)
        {:ok? true
         :value (if many? (vec normalized) (first normalized))}
        (let [result (coerce-property-value-basic property (first remaining))]
          (if-not (:ok? result)
            {:ok? false
             :message (:message result)}
            (recur (rest remaining) (conj normalized (:value result)))))))))

(defn- property-public?
  [property]
  (true? (get-in property [:schema :public?])))

(defn- parse-properties-option
  [value]
  (if-not (seq value)
    {:ok? true :value nil}
    (let [parsed (parse-edn-option value)]
      (cond
        (nil? parsed)
        (invalid-options-result "properties must be valid EDN map")

        (not (map? parsed))
        (invalid-options-result "properties must be a map")

        (empty? parsed)
        (invalid-options-result "properties must be a non-empty map")

        :else
        (loop [prop-entries (seq parsed)
               acc {}]
          (if (empty? prop-entries)
            {:ok? true :value acc}
            (let [[k v] (first prop-entries)
                  key-result (normalize-property-key-input k)]
              (if-not key-result
                (invalid-options-result (str "invalid property key: " k))
                (let [{:keys [type value]} key-result
                      key-ident value]
                  (if (= type :id)
                    (recur (rest prop-entries) (assoc acc key-ident v))
                    (let [property (get db-property/built-in-properties key-ident)]
                      (cond
                        (nil? property)
                        (invalid-options-result (str "unknown built-in property: " key-ident))

                        (not (property-public? property))
                        (invalid-options-result (str "property is not public: " key-ident))

                        :else
                        (let [{:keys [ok? value message]} (normalize-property-values property v)
                              normalized-value value]
                          (if-not ok?
                            (invalid-options-result (str "invalid value for " key-ident ": " message))
                            (recur (rest prop-entries) (assoc acc key-ident normalized-value))))))))))))))))

(defn invalid-options?
  [opts]
  (let [pos (some-> (:pos opts) string/trim string/lower-case)
        target-id (:target-id opts)
        target-uuid (some-> (:target-uuid opts) string/trim)
        target-page (some-> (:target-page-name opts) string/trim)
        target-selectors (filter some? [target-id target-uuid target-page])
        has-blocks? (or (seq (:blocks opts)) (seq (:blocks-file opts)))
        has-tags? (seq (some-> (:tags opts) string/trim))
        has-properties? (seq (some-> (:properties opts) string/trim))]
    (cond
      (and (seq pos) (not (contains? add-positions pos)))
      (str "invalid pos: " (:pos opts))

      (> (count target-selectors) 1)
      "only one of --target-id, --target-uuid, or --target-page-name is allowed"

      (and (= pos "sibling") (or (seq target-page) (empty? target-selectors)))
      "--pos sibling is only valid for block targets"

      (and has-blocks? (or has-tags? has-properties?))
      "tags and properties cannot be combined with --blocks or --blocks-file"

      :else
      nil)))

(defn- pull-entity
  [config repo selector lookup]
  (transport/invoke config :thread-api/pull false [repo selector lookup]))

(defn- tag-lookup-ref
  [tag]
  (cond
    (number? tag) tag
    (uuid? tag) [:block/uuid tag]
    (and (string? tag) (common-util/uuid-string? (string/trim tag))) [:block/uuid (uuid (string/trim tag))]
    (keyword? tag) [:db/ident tag]
    (string? tag) [:block/name (common-util/page-name-sanity-lc tag)]
    :else nil))

(defn- resolve-tag-entity
  [config repo tag]
  (let [lookup (tag-lookup-ref tag)]
    (when-not lookup
      (throw (ex-info "invalid tag value" {:code :invalid-tag :tag tag})))
    (p/let [entity (pull-entity config repo
                                [:db/id :block/name :block/title :block/uuid :block/tags
                                 :logseq.property/public? :logseq.property/built-in?]
                                lookup)]
      (cond
        (nil? (:db/id entity))
        (throw (ex-info "tag not found" {:code :tag-not-found :tag tag}))

        (false? (:logseq.property/public? entity))
        (throw (ex-info "tag is not public" {:code :tag-not-public :tag tag}))

        :else
        entity))))

(defn- resolve-tags
  [config repo tags]
  (if (seq tags)
    (p/let [entities (p/all (map #(resolve-tag-entity config repo %) tags))]
      (vec entities))
    (p/resolved nil)))

(defn- resolve-entity-id
  [config repo lookup]
  (p/let [entity (pull-entity config repo [:db/id] lookup)]
    (if-let [id (:db/id entity)]
      id
      (throw (ex-info "entity not found" {:code :entity-not-found :lookup lookup})))))

(defn- resolve-page-id
  [config repo value]
  (cond
    (number? value) (p/resolved value)
    (uuid? value) (resolve-entity-id config repo [:block/uuid value])
    (and (string? value) (common-util/uuid-string? (string/trim value)))
    (resolve-entity-id config repo [:block/uuid (uuid (string/trim value))])
    (string? value)
    (p/let [page (ensure-page! config repo value)]
      (or (:db/id page)
          (throw (ex-info "page not found" {:code :page-not-found :value value}))))
    :else
    (p/rejected (ex-info "page must be a name or uuid" {:code :invalid-page :value value}))))

(defn- resolve-class-id
  [config repo value]
  (p/let [entity (resolve-tag-entity config repo value)]
    (:db/id entity)))

(defn- resolve-property-id
  [config repo value]
  (let [key (normalize-property-key value)]
    (when-not key
      (throw (ex-info "property must be a keyword" {:code :invalid-property :value value})))
    (resolve-entity-id config repo [:db/ident key])))

(defn- resolve-node-id
  [config repo value]
  (cond
    (number? value) (p/resolved value)
    (uuid? value) (resolve-entity-id config repo [:block/uuid value])
    (and (string? value) (common-util/uuid-string? (string/trim value)))
    (resolve-entity-id config repo [:block/uuid (uuid (string/trim value))])
    (string? value)
    (resolve-page-id config repo value)
    :else
    (p/rejected (ex-info "node must be a uuid or page name" {:code :invalid-node :value value}))))

(defn- resolve-date-page-id
  [config repo value]
  (when-not (string? value)
    (throw (ex-info "date must be a string" {:code :invalid-date :value value})))
  (p/let [journal (pull-entity config repo [:logseq.property.journal/title-format] :logseq.class/Journal)
          formatter (or (:logseq.property.journal/title-format journal) "MMM do, yyyy")
          formatters (date-time-util/safe-journal-title-formatters formatter)
          journal-day (date-time-util/journal-title->int value formatters)
          title (or (when journal-day
                      (date-time-util/int->journal-title journal-day formatter))
                    value)
          page (ensure-page! config repo title)]
    (if-let [id (:db/id page)]
      id
      (throw (ex-info "journal page not found" {:code :page-not-found :value value})))))

(defn- resolve-property-value
  [config repo property value]
  (let [type (get-in property [:schema :type] :default)]
    (case type
      :page (resolve-page-id config repo value)
      :class (resolve-class-id config repo value)
      :property (resolve-property-id config repo value)
      :entity (resolve-entity-id config repo (cond
                                               (number? value) value
                                               (uuid? value) [:block/uuid value]
                                               (and (string? value) (common-util/uuid-string? (string/trim value)))
                                               [:block/uuid (uuid (string/trim value))]
                                               :else value))
      :node (resolve-node-id config repo value)
      :date (resolve-date-page-id config repo value)
      (p/resolved value))))

(defn- resolve-properties
  [config repo properties]
  (if-not (seq properties)
    (p/resolved nil)
    (p/let [resolved-entries (p/all
                              (map (fn [[k v]]
                                     (p/let [{:keys [ident property]}
                                             (cond
                                               (keyword? k)
                                               (let [property (get db-property/built-in-properties k)]
                                                 (when-not property
                                                   (throw (ex-info "unknown built-in property"
                                                                   {:code :unknown-property :property k})))
                                                 (when-not (property-public? property)
                                                   (throw (ex-info "property is not public"
                                                                   {:code :property-not-public :property k})))
                                                 (p/resolved {:ident k :property property}))

                                               (number? k)
                                               (p/let [entity (pull-entity config repo [:db/ident] k)
                                                       ident (:db/ident entity)
                                                       property (get db-property/built-in-properties ident)]
                                                 (cond
                                                   (nil? ident)
                                                   (throw (ex-info "property not found"
                                                                   {:code :property-not-found :property k}))

                                                   (nil? property)
                                                   (throw (ex-info "unknown built-in property"
                                                                   {:code :unknown-property :property ident}))

                                                   (not (property-public? property))
                                                   (throw (ex-info "property is not public"
                                                                   {:code :property-not-public :property ident}))

                                                   :else
                                                   {:ident ident :property property}))

                                               (string? k)
                                               (let [ident (or (property-title->ident k)
                                                               (normalize-property-key k))
                                                     property (get db-property/built-in-properties ident)]
                                                 (when-not property
                                                   (throw (ex-info "unknown built-in property"
                                                                   {:code :unknown-property :property k})))
                                                 (when-not (property-public? property)
                                                   (throw (ex-info "property is not public"
                                                                   {:code :property-not-public :property ident})))
                                                 (p/resolved {:ident ident :property property}))

                                               :else
                                               (p/rejected (ex-info "invalid property key"
                                                                    {:code :invalid-property :property k})))
                                             {:keys [ok? value message]} (normalize-property-values property v)]
                                       (when-not ok?
                                         (throw (ex-info "invalid property value"
                                                         {:code :invalid-property-value
                                                          :property ident
                                                          :message message})))
                                       (let [many? (= :many (get-in property [:schema :cardinality]))
                                             values (if many?
                                                      (if (and (coll? value) (not (string? value))) value [value])
                                                      [value])]
                                         (p/let [resolved (p/all (map #(resolve-property-value config repo property %) values))
                                                 final-value (if many? (vec resolved) (first resolved))]
                                           [ident final-value]))))
                                   properties))]
      (into {} resolved-entries))))

(defn- resolve-add-target
  [config {:keys [repo target-id target-uuid target-page-name]}]
  (cond
    (some? target-id)
    (p/let [block (transport/invoke config :thread-api/pull false
                                    [repo [:db/id :block/uuid :block/title] target-id])]
      (if-let [id (:db/id block)]
        id
        (throw (ex-info "target block not found" {:code :target-not-found}))))

    (seq target-uuid)
    (if-not (common-util/uuid-string? target-uuid)
      (p/rejected (ex-info "target must be a uuid" {:code :invalid-target}))
      (p/let [block (transport/invoke config :thread-api/pull false
                                      [repo [:db/id :block/uuid :block/title] [:block/uuid (uuid target-uuid)]])]
        (if-let [id (:db/id block)]
          id
          (throw (ex-info "target block not found" {:code :target-not-found})))))

    :else
    (p/let [page-name (if (seq target-page-name) target-page-name (today-page-title config repo))
            page-entity (ensure-page! config repo page-name)]
      (or (:db/id page-entity)
          (throw (ex-info "page not found" {:code :page-not-found}))))))

(defn- read-blocks
  [options command-args]
  (cond
    (seq (:blocks options))
    {:ok? true :value (reader/read-string (:blocks options))}

    (seq (:blocks-file options))
    (let [contents (.toString (fs/readFileSync (:blocks-file options)) "utf8")]
      {:ok? true :value (reader/read-string contents)})

    (seq (:content options))
    {:ok? true :value [{:block/title (:content options)}]}

    (seq command-args)
    {:ok? true :value [{:block/title (string/join " " command-args)}]}

    :else
    {:ok? false
     :error {:code :missing-content
             :message "content is required"}}))

(defn- ensure-blocks
  [value]
  (if (vector? value)
    {:ok? true :value value}
    {:ok? false
     :error {:code :invalid-blocks
             :message "blocks must be a vector"}}))

(defn build-add-block-action
  [options args repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for add"}}
    (let [blocks-result (read-blocks options args)
          status-text (some-> (:status options) string/trim)
          status (when (seq status-text) (normalize-status status-text))
          tags-result (parse-tags-option (:tags options))
          properties-result (parse-properties-option (:properties options))
          tags (:value tags-result)
          properties (:value properties-result)
          ensure-uuids? (or status (seq tags) (seq properties))]
      (cond
        (and (seq status-text) (nil? status))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid status: " status-text)}}

        (not (:ok? tags-result))
        tags-result

        (not (:ok? properties-result))
        properties-result

        :else
        (if-not (:ok? blocks-result)
          blocks-result
          (let [vector-result (ensure-blocks (:value blocks-result))]
            (if-not (:ok? vector-result)
              vector-result
              (let [blocks (cond-> (:value vector-result)
                             ensure-uuids?
                             ensure-block-uuids)]
                {:ok? true
                 :action {:type :add-block
                          :repo repo
                          :graph (core/repo->graph repo)
                          :target-id (:target-id options)
                          :target-uuid (some-> (:target-uuid options) string/trim)
                          :target-page-name (some-> (:target-page-name options) string/trim)
                          :pos (or (some-> (:pos options) string/trim string/lower-case) "last-child")
                          :status status
                          :tags tags
                          :properties properties
                          :blocks blocks}}))))))))

(defn build-add-page-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for add"}}
    (let [page (some-> (:page options) string/trim)]
      (if (seq page)
        (let [tags-result (parse-tags-option (:tags options))
              properties-result (parse-properties-option (:properties options))]
          (cond
            (not (:ok? tags-result))
            tags-result

            (not (:ok? properties-result))
            properties-result

            :else
            {:ok? true
             :action {:type :add-page
                      :repo repo
                      :graph (core/repo->graph repo)
                      :page page
                      :tags (:value tags-result)
                      :properties (:value properties-result)}}))
        {:ok? false
         :error {:code :missing-page-name
                 :message "page name is required"}}))))

(defn execute-add-block
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              target-id (resolve-add-target cfg action)
              status (:status action)
              tags (resolve-tags cfg (:repo action) (:tags action))
              properties (resolve-properties cfg (:repo action) (:properties action))
              pos (:pos action)
              keep-uuid? (or status (seq tags) (seq properties))
              opts (case pos
                     "last-child" {:sibling? false :bottom? true}
                     "sibling" {:sibling? true}
                     {:sibling? false})
              opts (cond-> opts
                     keep-uuid?
                     (assoc :keep-uuid? true))
              ops [[:insert-blocks [(:blocks action)
                                    target-id
                                    (assoc opts :outliner-op :insert-blocks)]]]
              _ (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])
              block-ids (->> (:blocks action)
                             (map :block/uuid)
                             (remove nil?)
                             vec)
              tag-ids (when (seq tags)
                        (->> tags (map :db/id) (remove nil?) vec))
              _ (when (and status (seq block-ids))
                  (transport/invoke cfg :thread-api/apply-outliner-ops false
                                    [(:repo action)
                                     [[:batch-set-property [block-ids :logseq.property/status status {}]]]
                                     {}]))
              _ (when (and (seq tag-ids) (seq block-ids))
                  (p/all
                   (map (fn [tag-id]
                          (transport/invoke cfg :thread-api/apply-outliner-ops false
                                            [(:repo action)
                                             [[:batch-set-property [block-ids :block/tags tag-id {}]]]
                                             {}]))
                        tag-ids)))
              _ (when (and (seq properties) (seq block-ids))
                  (p/all
                   (map (fn [[k v]]
                          (transport/invoke cfg :thread-api/apply-outliner-ops false
                                            [(:repo action)
                                             [[:batch-set-property [block-ids k v {}]]]
                                             {}]))
                        properties)))]
        {:status :ok
         :data {:result nil}})))

(defn execute-add-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              tags (resolve-tags cfg (:repo action) (:tags action))
              tag-ids (when (seq tags)
                        (->> tags (map :db/id) (remove nil?) vec))
              properties (resolve-properties cfg (:repo action) (:properties action))
              options (cond-> {}
                        (seq properties) (assoc :properties properties))
              ops [[:create-page [(:page action) options]]]
              result (transport/invoke cfg :thread-api/apply-outliner-ops false [(:repo action) ops {}])
              _ (when (seq tag-ids)
                  (p/let [page-name (common-util/page-name-sanity-lc (:page action))
                          page (pull-entity cfg (:repo action) [:db/id :block/uuid] [:block/name page-name])
                          page-uuid (:block/uuid page)]
                    (when-not page-uuid
                      (throw (ex-info "page not found" {:code :page-not-found :page (:page action)})))
                    (p/all
                     (map (fn [tag-id]
                            (transport/invoke cfg :thread-api/apply-outliner-ops false
                                              [(:repo action)
                                               [[:batch-set-property [[page-uuid] :block/tags tag-id {}]]]
                                               {}]))
                          tag-ids))))]
        {:status :ok
         :data {:result result}})))
