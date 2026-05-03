(ns logseq.cli.uuid-refs
  "Shared CLI helpers for rendering block refs stored as `[[uuid]]`."
  (:require [clojure.string :as string]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private uuid-ref-pattern #"\[\[([0-9a-fA-F-]{36})\]\]")
(def ^:private uuid-ref-max-depth 10)
(def ^:private uuid-lookup-selector [:db/id :block/uuid :block/title :block/name])

(defn extract-uuid-refs
  [value]
  (->> (re-seq uuid-ref-pattern (or value ""))
       (map second)
       (filter common-util/uuid-string?)
       (map string/lower-case)
       distinct))

(defn- replace-uuid-refs-once
  [value uuid->label]
  (if (and (string? value) (seq uuid->label))
    (string/replace value uuid-ref-pattern
                    (fn [[_ id]]
                      (if-let [label (get uuid->label (string/lower-case id))]
                        (str "[[" label "]]" )
                        (str "[[" id "]]"))))
    value))

(defn replace-uuid-refs
  [value uuid->label]
  (loop [current value
         remaining uuid-ref-max-depth]
    (if (or (not (string? current)) (zero? remaining) (empty? uuid->label))
      current
      (let [next (replace-uuid-refs-once current uuid->label)]
        (if (= next current)
          current
          (recur next (dec remaining)))))))

(defn collect-uuid-refs-from-strings
  [values]
  (->> values
       (filter string?)
       (mapcat extract-uuid-refs)
       distinct
       vec))

(defn collect-uuid-refs-from-items
  [items fields]
  (->> items
       (mapcat (fn [item]
                 (keep #(get item %) fields)))
       collect-uuid-refs-from-strings))

(defn normalize-item-string-fields
  [items fields uuid->label]
  (mapv (fn [item]
          (reduce (fn [item field]
                    (cond-> item
                      (string? (get item field))
                      (update field replace-uuid-refs uuid->label)))
                  item
                  fields))
        items))

(defn uuid-entity-label
  [entity]
  (let [uuid-str (some-> (:block/uuid entity) str)]
    (or (:block/title entity)
        (:block/name entity)
        uuid-str)))

(defn fetch-uuid-entities
  [config repo uuid-strings]
  (let [uuid-strings (->> uuid-strings
                          (filter common-util/uuid-string?)
                          (map string/lower-case)
                          distinct
                          vec)]
    (if (seq uuid-strings)
      (p/let [blocks (p/all (map (fn [uuid-str]
                                   (transport/invoke config :thread-api/pull false
                                                     [repo uuid-lookup-selector
                                                      [:block/uuid (uuid uuid-str)]]))
                                 uuid-strings))]
        (->> blocks
             (remove nil?)
             (map (fn [block]
                    (let [uuid-str (some-> (:block/uuid block) str string/lower-case)]
                      [uuid-str
                       {:id (:db/id block)
                        :label (uuid-entity-label block)}])))
             (into {})))
      (p/resolved {}))))

(defn fetch-uuid-labels
  [config repo uuid-strings]
  (p/let [uuid->entity (fetch-uuid-entities config repo uuid-strings)]
    (->> uuid->entity
         (keep (fn [[uuid-key {:keys [label]}]]
                 (when (seq label)
                   [uuid-key label])))
         (into {}))))
