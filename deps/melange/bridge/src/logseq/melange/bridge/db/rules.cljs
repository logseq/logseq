(ns logseq.melange.bridge.db.rules
  "CLJS Datalog representation bridge for typed Melange rule catalogs."
  (:require ["@logseq/melange-js-api/db" :as db-api]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private rules-api (.-Rules db-api))

(defn- decode-form
  [form]
  (let [kind (.-kind form)
        text (.-text form)
        children #(map decode-form (seq (.-children form)))]
    (case kind
      "symbol" (symbol text)
      "keyword" (keyword text)
      "string" text
      "true" true
      "false" false
      "list" (apply list (children))
      "vector" (vec (children))
      (throw (ex-info "Unknown typed Datalog form" {:kind kind})))))

(defn- decode-entries
  [entries]
  (into {}
        (map (fn [entry]
               [(keyword (aget entry 0))
                (decode-form (aget entry 1))])
             (seq entries))))

(def rules
  (decode-entries (.-entries rules-api)))

(def db-query-dsl-rules
  (decode-entries (.-dbQueryDslEntries rules-api)))

(def rules-dependencies
  (into {}
        (map (fn [entry]
               [(keyword (aget entry 0))
                (set (map keyword (seq (aget entry 1))))])
             (seq (.-dependencyEntries rules-api)))))

(defn- get-full-deps
  [dependencies rules-deps]
  (let [dependency-entries
        (to-array
         (map (fn [[rule-name rule-dependencies]]
                #js [(name rule-name)
                     (to-array (map name rule-dependencies))])
              rules-deps))]
    (set
     (map keyword
          (seq (.fullDependencies rules-api
                                  (to-array (map name dependencies))
                                  dependency-entries))))))

(defn extract-rules
  "Return a vector of Datalog rules selected from `rules-map`.

  `rule-names` selects catalog keys. When `:deps` is supplied, transitive rule
  dependencies are included before the selected rule bodies are flattened."
  ([rules-map]
   (extract-rules rules-map (keys rules-map)))
  ([rules-map rule-names & {:keys [deps]}]
   ((.-extractWith rules-api)
    (runtime/runtime-adapter)
    rules-map
    rule-names
    deps)))
