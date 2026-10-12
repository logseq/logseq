(ns frontend.handler.paste-properties
  "Reads the `key:: value` lines that the text export writes for block
  properties back into properties when that text is pasted. A key names an
  existing property (by title); a value is converted to the property's type.
  A line whose key or value cannot be resolved stays in the block's text."
  (:require [clojure.string :as string]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private property-line-pattern #"^([^:\s][^:]*?)::(?:\s+(.*?))?\s*$")

(defn split-property-lines
  "Splits the trailing `key:: value` lines off a block title, the form the text
  export writes properties in. The first line always stays title.
  Returns [title-lines property-lines], each a vector of lines."
  [title]
  (let [lines (string/split-lines (or title ""))
        n (->> (reverse (rest lines))
               (take-while #(re-matches property-line-pattern (string/trim %)))
               count)]
    [(vec (drop-last n lines)) (vec (take-last n lines))]))

(defn parse-property-line
  [line]
  (when-let [[_ k v] (re-matches property-line-pattern (string/trim line))]
    [k (or v "")]))

(def ^:private settable-built-in-properties
  #{:logseq.property/status :logseq.property/priority})

(defn- settable-property?
  [{:db/keys [ident]}]
  (or (= "user.property" (namespace ident))
      (contains? settable-built-in-properties ident)))

(defn- <q
  [repo query & inputs]
  (state/<invoke-db-worker :thread-api/q repo (into [query] inputs)))

(defn- <property-by-title
  [repo title]
  (p/let [properties (<q repo
                         '[:find [(pull ?p [:db/id :db/ident :logseq.property/type :db/cardinality]) ...]
                           :in $ ?name
                           :where
                           [?p :block/name ?name]
                           [?c :db/ident :logseq.class/Property]
                           [?p :block/tags ?c]]
                         (string/lower-case (string/trim title)))]
    (first (filter settable-property? properties))))

(defn- <closed-values
  [repo property-id]
  (<q repo
      '[:find [(pull ?v [:db/id :block/title :logseq.property/value]) ...]
        :in $ ?p
        :where [?v :block/closed-value-property ?p]]
      property-id))

(defn- strip-page-ref
  [s]
  (let [s (string/trim s)]
    (or (second (re-matches #"^\[\[(.*)\]\]$" s)) s)))

(defn- <page-id
  [repo title]
  (p/let [page (state/<invoke-db-worker :thread-api/pull repo [:db/id]
                                        [:block/name (string/lower-case (strip-page-ref title))])]
    (:db/id page)))

(defn- <value
  "Converts one exported value to what the outliner sets for the property, or nil."
  [repo {:keys [logseq.property/type]} closed-values s]
  (let [s (string/trim s)]
    (cond
      (seq closed-values)
      (some (fn [{:keys [db/id block/title logseq.property/value]}]
              (when (= (string/lower-case s) (string/lower-case (str (or title value))))
                id))
            closed-values)

      (string/blank? s)
      nil

      (= type :number)
      (let [n (js/Number s)] (when-not (js/isNaN n) n))

      (= type :checkbox)
      (case s "true" true "false" false nil)

      (contains? #{:default :url} type)
      s

      (contains? #{:date :node :page} type)
      (<page-id repo s))))

(defn- <tag-ids
  "Ids of the existing tags named in a `tags::` value (`a, #b, [[c d]]`), or
  nil when one of them is not an existing tag."
  [repo v]
  (let [names (->> (string/split v #",")
                   (map #(-> % string/trim (string/replace #"^#" "") strip-page-ref string/lower-case))
                   (remove string/blank?))]
    (when (seq names)
      (p/let [ids (p/all (map (fn [n]
                                (<q repo
                                    '[:find ?t . :in $ ?name
                                      :where
                                      [?t :block/name ?name]
                                      [?c :db/ident :logseq.class/Tag]
                                      [?t :block/tags ?c]]
                                    n))
                              names))]
        (when (every? some? ids) (vec ids))))))

(defn- <user-property-assignment
  [repo k v]
  (p/let [property (<property-by-title repo k)]
    (when property
      (p/let [closed-values (<closed-values repo (:db/id property))
              many? (= :db.cardinality/many (:db/cardinality property))
              parts (if many? (string/split v #",\s*") [v])
              values (p/all (map #(<value repo property closed-values %) parts))]
        (when (and (seq values) (every? some? values))
          [(:db/ident property) (if many? (vec values) (first values))])))))

(defn- <property-assignment
  "[property-ident value] for one exported `key:: value` line, or nil. A
  `tags::` line names existing tags."
  [repo line]
  (when-let [[k v] (parse-property-line line)]
    (if (= "tags" (string/lower-case (string/trim k)))
      (p/let [ids (<tag-ids repo v)]
        (when ids [:block/tags ids]))
      (<user-property-assignment repo k v))))

(defn <read-properties
  "For a pasted block (title as parsed): the block with its resolved property
  lines removed from the title, and its property assignments
  [[property-ident value] ...]."
  [repo block]
  (let [[title-lines property-lines] (split-property-lines (:block/title block))]
    (if (empty? property-lines)
      (p/resolved [block []])
      (p/let [assignments (p/all (map #(<property-assignment repo %) property-lines))]
        (let [kept (keep (fn [[line assignment]] (when-not assignment line))
                         (map vector property-lines assignments))]
          [(assoc block :block/title (string/join "\n" (concat title-lines kept)))
           (vec (remove nil? assignments))])))))
