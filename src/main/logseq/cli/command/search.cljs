(ns logseq.cli.command.search
  "Search-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private search-spec
  {:text {:desc "Search text"}
   :type {:desc "Search types (page, block, tag, property, all)"}
   :tag {:desc "Restrict to a specific tag"}
   :limit {:desc "Limit results"
           :coerce :long}
   :case-sensitive {:desc "Case sensitive search"
                    :coerce :boolean}
   :include-content {:desc "Search block content"
                     :coerce :boolean}
   :sort {:desc "Sort field (updated-at, created-at)"}
   :order {:desc "Sort order (asc, desc)"}})

(def entries
  [(core/command-entry ["search"] :search "Search graph" search-spec)])

(def ^:private search-types
  #{"page" "block" "tag" "property" "all"})

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
    (let [text (or (:text options) (string/join " " args))]
      (if (seq text)
        {:ok? true
         :action {:type :search
                  :repo repo
                  :text text
                  :search-type (:type options)
                  :tag (:tag options)
                  :limit (:limit options)
                  :case-sensitive (:case-sensitive options)
                  :include-content (:include-content options)
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
                  [(clojure.string/includes? (clojure.string/lower-case ?title) ?q)]])
        q* (if case-sensitive? text (string/lower-case text))]
    (transport/invoke cfg :thread-api/q false [repo [query q*]])))

#_{:clj-kondo/ignore [:aliased-namespace-symbol]}
(defn- query-blocks
  [cfg repo text case-sensitive? tag include-content?]
  (let [has-tag? (seq tag)
        content-attr (if include-content? :block/content :block/title)
        query (cond
                (and case-sensitive? has-tag?)
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q ?tag-name
                  :where
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?value ?q)]]

                case-sensitive?
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? ?value ?q)]]

                has-tag?
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q ?tag-name
                  :where
                  [?tag :block/name ?tag-name]
                  [?e :block/tags ?tag]
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? (clojure.string/lower-case ?value) ?q)]]

                :else
                `[:find ?e ?value ?uuid ?updated ?created
                  :in $ ?q
                  :where
                  [?e ~content-attr ?value]
                  [(missing? $ ?e :block/name)]
                  [?e :block/uuid ?uuid]
                  [(get-else $ ?e :block/updated-at 0) ?updated]
                  [(get-else $ ?e :block/created-at 0) ?created]
                  [(clojure.string/includes? (clojure.string/lower-case ?value) ?q)]])
        q* (if case-sensitive? text (string/lower-case text))
        tag-name (some-> tag string/lower-case)]
    (if has-tag?
      (transport/invoke cfg :thread-api/q false [repo [query q* tag-name]])
      (transport/invoke cfg :thread-api/q false [repo [query q*]]))))

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
              include-content? (boolean (:include-content action))
              block-results (when (some #{:block} types)
                              (p/let [rows (query-blocks cfg (:repo action) text case-sensitive? tag include-content?)]
                                (mapv (fn [[id content uuid updated created]]
                                        {:type "block"
                                         :db/id id
                                         :content content
                                         :uuid (str uuid)
                                         :updated-at updated
                                         :created-at created})
                                      rows)))
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
              limited (if (some? (:limit action)) (vec (take (:limit action) sorted)) sorted)]
        {:status :ok
         :data {:results limited}})))
