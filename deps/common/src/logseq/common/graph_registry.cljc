(ns logseq.common.graph-registry
  "Graph registry normalization and lookup helpers."
  (:require [clojure.string :as string]))

(def ^:private db-version-prefix
  "logseq_db_")

(defn- present-string?
  [s]
  (and (string? s) (not (string/blank? s))))

(defn normalize-entry
  [entry]
  (let [rtc-graph-id (:rtc-graph-id entry)
        local-graph-id (:local-graph-id entry)
        graph-id (or (when (present-string? rtc-graph-id) rtc-graph-id)
                     (when (present-string? local-graph-id) local-graph-id)
                     (when (present-string? (:graph-id entry)) (:graph-id entry)))]
    (when-not graph-id
      (throw (ex-info "Missing graph identity"
                      {:entry entry})))
    (assoc entry :graph-id graph-id)))

(defn ^:api upsert-entry
  [registry entry]
  (let [entry' (normalize-entry entry)]
    (->> (or registry [])
         (remove #(or (= (:graph-id entry') (:graph-id %))
                      (and (present-string? (:repo entry'))
                           (= (:repo entry') (:repo %)))
                      (and (present-string? (:local-graph-id entry'))
                           (= (:local-graph-id entry') (:local-graph-id %)))
                      (and (present-string? (:rtc-graph-id entry'))
                           (= (:rtc-graph-id entry') (:rtc-graph-id %)))))
         (cons entry')
         vec)))

(defn- normalize-comparable
  [s]
  (some-> s str string/lower-case))

(defn- canonical-repo
  [s]
  (when (seq s)
    (let [s (str s)
          stripped (loop [name' s]
                     (if (string/starts-with? name' db-version-prefix)
                       (recur (subs name' (count db-version-prefix)))
                       name'))]
      (str db-version-prefix stripped))))

(defn- identifier-match?
  [entry graph-identifier]
  (let [identifier (normalize-comparable graph-identifier)
        repo (normalize-comparable (:repo entry))
        graph-name (normalize-comparable (:graph-name entry))
        graph-id (normalize-comparable (:graph-id entry))
        canonical-repo-name (normalize-comparable (canonical-repo graph-identifier))]
    (or (= identifier repo)
        (= identifier graph-name)
        (= identifier graph-id)
        (= canonical-repo-name repo))))

(defn ^:api resolve-target
  [registry {:keys [graph-id graph-identifier]}]
  (cond
    (present-string? graph-id)
    (some #(when (= graph-id (:graph-id %)) %) registry)

    (present-string? graph-identifier)
    (some #(when (identifier-match? % graph-identifier) %) registry)

    :else
    nil))
