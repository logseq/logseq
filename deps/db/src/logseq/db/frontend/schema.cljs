(ns logseq.db.frontend.schema
  "Schema related fns for DB and file graphs"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.db.file-based.schema :as file-schema]))

(def schema-version? (every-pred map? :major))

(def major-schema-version-string-schema
  [:and :string
   [:fn
    {:error/message "should be a major schema-version"}
    (fn [s] (some? (parse-long s)))]])

(defn parse-schema-version
  "Return schema-version({:major <num> :minor <num>}).
  supported input: 10, \"10.1\", [10 1]"
  [string-or-compatible-number]
  (cond
    (schema-version? string-or-compatible-number) string-or-compatible-number
    (and (sequential? string-or-compatible-number)
         (first string-or-compatible-number))
    {:major (first string-or-compatible-number)
     :minor (second string-or-compatible-number)}

    (int? string-or-compatible-number) {:major string-or-compatible-number :minor nil}
    (string? string-or-compatible-number)
    (let [[major minor] (map parse-long (string/split string-or-compatible-number #"\."))]
      (assert (some? major))
      {:major major :minor minor})
    :else
    (throw (ex-info (str "Bad schema version: " string-or-compatible-number) {:data string-or-compatible-number}))))

(defn compare-schema-version
  [x y]
  (apply compare
         (map (juxt :major :minor)
              [(parse-schema-version x) (parse-schema-version y)])))

(def version (parse-schema-version "65.7"))

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

(def schema
  "Schema for DB graphs. :block/tags are classes in this schema"
  (merge
   (apply dissoc file-schema/schema file-schema/file-only-attributes)
   {:block/name {:db/index true}        ; remove db/unique for :block/name
    ;; closed value
    :block/closed-value-property {:db/valueType :db.type/ref
                                  :db/cardinality :db.cardinality/many}}))

;; If only block/title changes
(def retract-attributes
  "Retract attributes for DB graphs"
  #{:block/refs
    :block/warning})

;; DB graph helpers
;; ================
(def ref-type-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.type/ref (:db/valueType attr-body-map))
                  attr-name)))
        schema))

(def card-many-attributes
  (into #{}
        (keep (fn [[attr-name attr-body-map]]
                (when (= :db.cardinality/many (:db/cardinality attr-body-map))
                  attr-name)))
        schema))

(def card-many-ref-type-attributes
  (set/intersection card-many-attributes ref-type-attributes))

(def card-one-ref-type-attributes
  (set/difference ref-type-attributes card-many-attributes))

(def db-non-ref-attributes
  (->> schema
       (keep (fn [[k v]]
               (when (not (:db/valueType v))
                 k)))
       set))
