(ns logseq.db.frontend.schema
  "Main datascript schemas for the Logseq app"
  (:require [clojure.set :as set]
            [clojure.string :as string]))

(def schema-version? (every-pred map? :major))

(def major-schema-version-string-schema
  [:and :string
   [:fn
    {:error/message "should be a major schema-version"}
    (fn [s] (some? (parse-long s)))]])

(defn parse-schema-version
  "Return schema-version({:major <num> :minor <num>}).
  schema-version-old: 10, a number
  schema-version-new: \"12.34\", string, <major-num>.<minor-num>"
  [string-or-compatible-number]
  (cond
    (schema-version? string-or-compatible-number) string-or-compatible-number
    (int? string-or-compatible-number) {:major string-or-compatible-number :minor nil}
    (string? string-or-compatible-number)
    (let [[major minor] (map parse-long (string/split string-or-compatible-number #"\."))]
      (assert (some? major))
      {:major major :minor minor})
    :else
    (throw (ex-info (str "Bad schema version: " string-or-compatible-number) {:data string-or-compatible-number}))))

(defn compare-schema-version
  [x y]
  (if (schema-version? x)
    (cond
      (number? y) (compare (:major x) y)
      (sequential? y) (compare [(:major x) (:minor x)] [(first y) (second y)])
      (schema-version? y)
      (apply compare (map (juxt :major :minor) [x y]))
      :else
      (throw (js/Error. (str "Cannot compare " x " to " y))))
    (compare-schema-version (parse-schema-version x) y)))

(def version (parse-schema-version "64.1"))

(defn major-version
  "Return a number.
  Compatible with current schema-version number.
  schema-version-old: 10, a number
  schema-version-new: \"12.34\", string, <major-num>.<minor-num>"
  [schema-version]
  (if (schema-version? schema-version)
    (:major schema-version)
    (:major (parse-schema-version schema-version))))

(defn schema-version->string
  [schema-version]
  (cond
    (string? schema-version) schema-version
    (int? schema-version) (str schema-version)
    (schema-version? schema-version)
    (if-let [minor (:minor schema-version)]
      (str (:major schema-version) "." minor)
      (str (:major schema-version)))
    :else (throw (ex-info "Not a schema-version" {:data schema-version}))))

;; A page is a special block, a page can corresponds to multiple files with the same ":block/name".
(def ^:large-vars/data-var schema
  {:db/ident        {:db/unique :db.unique/identity}
   :kv/value       {}
   :recent/pages {}

   ;; :block/type is a string type of the current block
   ;; "whiteboard" for whiteboards
   ;; "property" for property blocks
   ;; "class" for structured page
   :block/type {:db/index true}
   :block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref
                  :db/index true}
   :block/order {:db/index true}
   :block/collapsed? {}

   ;; :markdown, :org
   :block/format {}

   ;; belongs to which page
   :block/page {:db/valueType :db.type/ref
                :db/index true}
   ;; reference blocks
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   ;; referenced pages inherited from the parents
   :block/path-refs {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}

   ;; tags are structured classes
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}

   ;; which block this block links to, used for tag, embeds
   :block/link {:db/valueType :db.type/ref
                :db/index true}

   ;; page's namespace
   :block/namespace {:db/valueType :db.type/ref}

   ;; for pages
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many}

   ;; todo keywords, e.g. "TODO", "DOING", "DONE"
   :block/marker {}

   ;; "A", "B", "C"
   :block/priority {}

   ;; map, key -> set of refs in property value or full text if none are found
   :block/properties {}
   ;; vector
   :block/properties-order {}
   ;; map, key -> original property value's content
   :block/properties-text-values {}

   ;; first block that's not a heading or unordered list
   :block/pre-block? {}

   ;; scheduled day
   :block/scheduled {}

   ;; deadline day
   :block/deadline {}

   ;; whether blocks is a repeated block (usually a task)
   :block/repeated? {}

   :block/created-at {:db/index true}
   :block/updated-at {:db/index true}

   ;; page additional attributes
   ;; page's name, lowercase
   :block/name {:db/unique :db.unique/identity}

   ;; page's original name
   :block/title {:db/index true}

   ;; page's journal day
   :block/journal-day {:db/index true}

   ;; macros in block
   :block/macros {:db/valueType :db.type/ref
                  :db/cardinality :db.cardinality/many}

   ;; block's file
   :block/file {:db/valueType :db.type/ref}

   ;; latest tx that affected the block
   :block/tx-id {}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   :file/content {}
   :file/created-at {}
   :file/last-modified-at {}
   :file/size {}})

(def schema-for-db-based-graph
  (merge
   (dissoc schema
           :block/namespace :block/properties-text-values :block/pre-block? :recent/pages :block/file
           :block/properties :block/properties-order :block/repeated? :block/deadline :block/scheduled :block/priority
           :block/marker :block/macros
           :block/type :block/format)
   {:block/name {:db/index true}        ; remove db/unique for :block/name
    ;; closed value
    :block/closed-value-property {:db/valueType :db.type/ref
                                  :db/cardinality :db.cardinality/many}}))

(def retract-attributes
  #{:block/refs
    :block/tags
    :block/alias
    :block/marker
    :block/priority
    :block/scheduled
    :block/deadline
    :block/repeated?
    :block/pre-block?
    :block/properties
    :block/properties-order
    :block/properties-text-values
    :block/macros
    :block/invalid-properties
    :block/warning})

;; If only block/title changes
(def db-version-retract-attributes
  #{:block/refs
    :block/warning})

;; DB graph helpers
;; ================
(def ref-type-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.type/ref (:db/valueType attr-body-map))
                  attr-name)))
        schema-for-db-based-graph))

(def card-many-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.cardinality/many (:db/cardinality attr-body-map))
                  attr-name)))
        schema-for-db-based-graph))

(def card-many-ref-type-attributes
  (set/intersection card-many-attributes ref-type-attributes))

(def card-one-ref-type-attributes
  (set/difference ref-type-attributes card-many-attributes))

(def db-non-ref-attributes
  (->> schema-for-db-based-graph
       (keep (fn [[k v]]
               (when (not (:db/valueType v))
                 k)))
       set))
