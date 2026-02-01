(ns logseq.db.frontend.schema
  "Schema related fns"
  (:require [clojure.set :as set]
            [clojure.string :as string]))

(def schema-version? (every-pred map? :major))

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

(def version (parse-schema-version "65.22"))

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

(def ^:large-vars/data-var schema
  "Schema for DB graphs"
  {:db/ident        {:db/unique :db.unique/identity}
   :kv/value       {}

   :block/uuid {:db/unique :db.unique/identity}
   :block/parent {:db/valueType :db.type/ref
                  :db/index true}
   :block/order {:db/index true}
   :block/collapsed? {}

   ;; belongs to which page
   :block/page {:db/valueType :db.type/ref
                :db/index true}
   ;; reference blocks
   :block/refs {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}
   :block/tags {:db/valueType :db.type/ref
                :db/cardinality :db.cardinality/many}

   ;; which block this block links to, used for tag, embeds
   :block/link {:db/valueType :db.type/ref
                :db/index true}

   ;; for pages
   :block/alias {:db/valueType :db.type/ref
                 :db/cardinality :db.cardinality/many
                 :db/index true}

   :block/created-at {:db/index true}
   :block/updated-at {:db/index true}

   ;; page additional attributes
   ;; page's name, lowercase
   :block/name {:db/index true} ; remove db/unique for :block/name

   ;; page's original name
   :block/title {:db/index true}

   ;; page's journal day
   :block/journal-day {:db/index true}

   ;; latest tx that affected the block
   :block/tx-id {}
   :block/closed-value-property {:db/valueType :db.type/ref
                                 :db/cardinality :db.cardinality/many}

   ;; file
   :file/path {:db/unique :db.unique/identity}
   :file/content {}
   :file/created-at {}
   :file/last-modified-at {}
   :file/size {}})

;; If only block/title changes
(def retract-attributes
  "Retract attributes for DB graphs"
  #{:block/warning})

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
