(ns logseq.common.graph-registry
  (:require [clojure.string :as string]
            [logseq.common.config :as common-config]))

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

(defn upsert-entry
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

(defn- identifier-match?
  [entry graph-identifier]
  (let [identifier (normalize-comparable graph-identifier)
        repo (normalize-comparable (:repo entry))
        graph-name (normalize-comparable (:graph-name entry))
        graph-id (normalize-comparable (:graph-id entry))
        canonical-repo (normalize-comparable
                        (common-config/canonicalize-db-version-repo graph-identifier))]
    (or (= identifier repo)
        (= identifier graph-name)
        (= identifier graph-id)
        (= canonical-repo repo))))

(defn resolve-target
  [registry {:keys [graph-id graph-identifier]}]
  (cond
    (present-string? graph-id)
    (some #(when (= graph-id (:graph-id %)) %) registry)

    (present-string? graph-identifier)
    (some #(when (identifier-match? % graph-identifier) %) registry)

    :else
    nil))
