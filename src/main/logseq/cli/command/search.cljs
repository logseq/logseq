(ns logseq.cli.command.search
  "Search-related CLI commands."
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private search-spec
  {:type {:desc "Search types (page, block, tag, property, all)"}
   :tag {:desc "Restrict to a specific tag"}
   :case-sensitive {:desc "Case sensitive search"
                    :coerce :boolean}
   :sort {:desc "Sort field (updated-at, created-at)"}
   :order {:desc "Sort order (asc, desc)"}})

(def entries
  [(core/command-entry ["search"] :search "Search graph" search-spec)])

(def ^:private search-types
  #{"page" "block" "tag" "property" "all"})

(def ^:private uuid-ref-pattern #"\[\[([0-9a-fA-F-]{36})\]\]")
(def ^:private uuid-ref-max-depth 10)

(defn invalid-options?
  [opts]
  (let [type (:type opts)
        order (:order opts)
        sort-field (:sort opts)]
    (cond
      (and (seq type) (not (contains? search-types type)))
      (str "invalid type: " type)

      (and (seq sort-field) (not (#{"updated-at" "created-at"} sort-field)))
      (str "invalid sort field: " sort-field)

      (and (seq order) (not (#{"asc" "desc"} order)))
      (str "invalid order: " order)

      :else
      nil)))

(defn build-action
  [options args repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for search"}}
    (let [text (some-> (first args) string/trim)]
      (if (seq text)
        {:ok? true
         :action {:type :search
                  :repo repo
                  :text text
                  :search-type (or (:type options) "all")
                  :tag (:tag options)
                  :case-sensitive (:case-sensitive options)
                  :sort (:sort options)
                  :order (:order options)}}
        {:ok? false
         :error {:code :missing-search-text
                 :message "search text is required"}}))))

(defn- query-pages
  [cfg repo text case-sensitive?]
  (let [query (if case-sensitive?
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e :block/name ?name]
                  [?e :block/title ?title]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?title ?q)]]
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e :block/name ?name]
                  [?e :block/title ?title]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?name ?q)]])
        q* (if case-sensitive? text (string/lower-case text))]
    (transport/invoke cfg :thread-api/q false [repo [query q*]])))

(defn- query-blocks
  [cfg repo text case-sensitive? tag]
  (let [q* (if case-sensitive? text (string/lower-case text))
        tag-name (some-> tag string/lower-case)
        query (cond
                (and case-sensitive? (seq tag-name))
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q ?tag-name
                  :where
                  [?e :block/title ?title]
                  [?e :block/page ?page]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?title ?q)]
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]]

                case-sensitive?
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e :block/title ?title]
                  [?e :block/page ?page]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?title ?q)]]

                (seq tag-name)
                '[:find ?e ?title ?uuid ?updated ?created
                  :in $ ?tag-name
                  :where
                  [?e :block/title ?title]
                  [?e :block/page ?page]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]]

                :else
                '[:find ?e ?title ?uuid ?updated ?created
                  :where
                  [?e :block/title ?title]
                  [?e :block/page ?page]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]])
        query-args (cond
                     (and case-sensitive? (seq tag-name))
                     [repo [query q* tag-name]]

                     case-sensitive?
                     [repo [query q*]]

                     (seq tag-name)
                     [repo [query tag-name]]

                     :else
                     [repo [query]])
        matches-text? (fn [title]
                        (when (string? title)
                          (if case-sensitive?
                            (string/includes? title q*)
                            (string/includes? (string/lower-case title) q*))))]
    (-> (p/let [rows (transport/invoke cfg :thread-api/q false query-args)]
          (->> (or rows [])
               (filter (fn [[_ title _ _ _]]
                         (matches-text? title)))
               (mapv (fn [[id title uuid updated created]]
                       {:type "block"
                        :db/id id
                        :content title
                        :uuid (str uuid)
                        :updated-at updated
                        :created-at created}))))
        (p/catch (fn [_]
                   [])))))

(defn- replace-uuid-refs-once
  [value uuid->label]
  (if (and (string? value) (seq uuid->label))
    (string/replace value uuid-ref-pattern
                    (fn [[_ id]]
                      (if-let [label (get uuid->label (string/lower-case id))]
                        (str "[[" label "]]")
                        (str "[[" id "]]"))))
    value))

(defn- replace-uuid-refs
  [value uuid->label]
  (loop [current value
         remaining uuid-ref-max-depth]
    (if (or (not (string? current)) (zero? remaining) (empty? uuid->label))
      current
      (let [next (replace-uuid-refs-once current uuid->label)]
        (if (= next current)
          current
          (recur next (dec remaining)))))))

(defn- extract-uuid-refs
  [value]
  (->> (re-seq uuid-ref-pattern (or value ""))
       (map second)
       (filter common-util/uuid-string?)
       (map string/lower-case)
       distinct))

(defn- collect-uuid-refs
  [results]
  (->> results
       (mapcat (fn [item] (keep item [:title :content])))
       (remove string/blank?)
       (mapcat extract-uuid-refs)
       distinct
       vec))

(defn- fetch-uuid-labels
  [config repo uuid-strings]
  (if (seq uuid-strings)
    (p/let [blocks (p/all (map (fn [uuid-str]
                                 (transport/invoke config :thread-api/pull false
                                                   [repo [:block/uuid :block/title :block/name]
                                                    [:block/uuid (uuid uuid-str)]]))
                               uuid-strings))]
      (->> blocks
           (remove nil?)
           (map (fn [block]
                  (let [uuid-str (some-> (:block/uuid block) str)]
                    [(string/lower-case uuid-str)
                     (or (:block/title block) (:block/name block) uuid-str)])))
           (into {})))
    (p/resolved {})))

(defn- fetch-uuid-labels-recursive
  [config repo uuid-strings]
  (p/loop [pending (set (map string/lower-case uuid-strings))
           seen #{}
           labels {}
           remaining uuid-ref-max-depth]
    (if (or (empty? pending) (zero? remaining))
      labels
      (p/let [fetched (fetch-uuid-labels config repo pending)
              next-labels (merge labels fetched)
              next-seen (into seen (keys fetched))
              nested-refs (->> (vals fetched)
                               (mapcat extract-uuid-refs)
                               (remove next-seen)
                               set)
              next-pending (set/difference nested-refs next-seen)]
        (p/recur next-pending next-seen next-labels (dec remaining))))))

(defn- resolve-uuid-refs-in-results
  [results uuid->label]
  (mapv (fn [item]
          (cond-> item
            (:title item) (update :title replace-uuid-refs uuid->label)
            (:content item) (update :content replace-uuid-refs uuid->label)))
        (or results [])))

(defn- normalize-search-types
  [type]
  (let [type (or type "all")]
    (case type
      "page" [:page]
      "block" [:block]
      "tag" [:tag]
      "property" [:property]
      [:page :block :tag :property])))

(defn- search-sort-key
  [item sort-field]
  (case sort-field
    "updated-at" (:updated-at item)
    "created-at" (:created-at item)
    nil))

(defn execute-search
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              types (normalize-search-types (:search-type action))
              case-sensitive? (boolean (:case-sensitive action))
              text (:text action)
              tag (:tag action)
              page-results (when (some #{:page} types)
                             (p/let [rows (query-pages cfg (:repo action) text case-sensitive?)]
                               (mapv (fn [[id title uuid updated created]]
                                       {:type "page"
                                        :db/id id
                                        :title title
                                        :uuid (str uuid)
                                        :updated-at updated
                                        :created-at created})
                                     rows)))
              block-results (when (some #{:block} types)
                              (query-blocks cfg (:repo action) text case-sensitive? tag))
              tag-results (when (some #{:tag} types)
                            (p/let [items (transport/invoke cfg :thread-api/api-list-tags false
                                                            [(:repo action) {:expand true :include-built-in true}])
                                    q* (if case-sensitive? text (string/lower-case text))]
                              (->> items
                                   (filter (fn [item]
                                             (let [title (:block/title item)]
                                               (if case-sensitive?
                                                 (string/includes? title q*)
                                                 (string/includes? (string/lower-case title) q*)))))
                                   (mapv (fn [item]
                                           {:type "tag"
                                            :db/id (:db/id item)
                                            :title (:block/title item)
                                            :uuid (:block/uuid item)})))))
              property-results (when (some #{:property} types)
                                 (p/let [items (transport/invoke cfg :thread-api/api-list-properties false
                                                                 [(:repo action) {:expand true :include-built-in true}])
                                         q* (if case-sensitive? text (string/lower-case text))]
                                   (->> items
                                        (filter (fn [item]
                                                  (let [title (:block/title item)]
                                                    (if case-sensitive?
                                                      (string/includes? title q*)
                                                      (string/includes? (string/lower-case title) q*)))))
                                        (mapv (fn [item]
                                                {:type "property"
                                                 :db/id (:db/id item)
                                                 :title (:block/title item)
                                                 :uuid (:block/uuid item)})))))
              results (->> (concat (or page-results [])
                                   (or block-results [])
                                   (or tag-results [])
                                   (or property-results []))
                           (distinct)
                           vec)
              sorted (if-let [sort-field (:sort action)]
                       (let [order (or (:order action) "desc")]
                         (->> results
                              (sort-by #(search-sort-key % sort-field))
                              (cond-> (= order "desc") reverse)
                              vec))
                       results)
              uuid-refs (collect-uuid-refs sorted)
              uuid->label (fetch-uuid-labels-recursive cfg (:repo action) uuid-refs)
              resolved (resolve-uuid-refs-in-results sorted uuid->label)]
        {:status :ok
         :data {:results resolved}})))
