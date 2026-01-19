(ns logseq.cli.command.list
  "List-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private list-common-spec
  {:expand {:desc "Include expanded metadata"
            :coerce :boolean}
   :limit {:desc "Limit results"
           :coerce :long}
   :offset {:desc "Offset results"
            :coerce :long}
   :sort {:desc "Sort field"}
   :order {:desc "Sort order (asc, desc)"}})

(def ^:private list-page-spec
  (merge list-common-spec
         {:include-journal {:desc "Include journal pages"
                            :coerce :boolean}
          :journal-only {:desc "Only journal pages"
                         :coerce :boolean}
          :include-hidden {:desc "Include hidden pages"
                           :coerce :boolean}
          :updated-after {:desc "Filter by updated-at (ISO8601)"}
          :created-after {:desc "Filter by created-at (ISO8601)"}
          :fields {:desc "Select output fields (comma separated)"}}))

(def ^:private list-tag-spec
  (merge list-common-spec
         {:include-built-in {:desc "Include built-in tags"
                             :coerce :boolean}
          :with-properties {:desc "Include tag properties"
                            :coerce :boolean}
          :with-extends {:desc "Include tag extends"
                         :coerce :boolean}
          :fields {:desc "Select output fields (comma separated)"}}))

(def ^:private list-property-spec
  (merge list-common-spec
         {:include-built-in {:desc "Include built-in properties"
                             :coerce :boolean}
          :with-classes {:desc "Include property classes"
                         :coerce :boolean}
          :with-type {:desc "Include property type"
                      :coerce :boolean}
          :fields {:desc "Select output fields (comma separated)"}}))

(def entries
  [(core/command-entry ["list" "page"] :list-page "List pages" list-page-spec)
   (core/command-entry ["list" "tag"] :list-tag "List tags" list-tag-spec)
   (core/command-entry ["list" "property"] :list-property "List properties" list-property-spec)])

(def ^:private list-sort-fields
  {:list-page #{"title" "created-at" "updated-at"}
   :list-tag #{"name" "title"}
   :list-property #{"name" "title"}})

(defn invalid-options?
  [command opts]
  (let [{:keys [order include-journal journal-only]} opts
        sort-field (:sort opts)
        allowed (get list-sort-fields command)]
    (cond
      (and include-journal journal-only)
      "include-journal and journal-only are mutually exclusive"

      (and (seq sort-field) (not (contains? allowed sort-field)))
      (str "invalid sort field: " sort-field)

      (and (seq order) (not (#{"asc" "desc"} order)))
      (str "invalid order: " order)

      :else nil)))

(defn build-action
  [command options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for list"}}
    {:ok? true
     :action {:type command
              :repo repo
              :options options}}))

(def ^:private list-page-field-map
  {"title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at})

(def ^:private list-tag-field-map
  {"name" :block/title
   "title" :block/title
   "uuid" :block/uuid
   "properties" :logseq.property.class/properties
   "extends" :logseq.property.class/extends
   "description" :logseq.property/description})

(def ^:private list-property-field-map
  {"name" :block/title
   "title" :block/title
   "uuid" :block/uuid
   "classes" :logseq.property/classes
   "type" :logseq.property/type
   "description" :logseq.property/description})

(defn- parse-field-list
  [fields]
  (when (seq fields)
    (->> (string/split fields #",")
         (map string/trim)
         (remove string/blank?)
         vec)))

(defn- apply-fields
  [items fields field-map]
  (if (seq fields)
    (let [keys (->> fields
                    (map #(get field-map %))
                    (remove nil?)
                    vec)]
      (if (seq keys)
        (mapv #(select-keys % keys) items)
        items))
    items))

(defn- apply-sort
  [items sort-field order field-map]
  (if (seq sort-field)
    (let [sort-key (get field-map sort-field)
          sorted (if sort-key
                   (sort-by #(get % sort-key) items)
                   items)
          sorted (if (= "desc" order) (reverse sorted) sorted)]
      (vec sorted))
    (vec items)))

(defn- apply-offset-limit
  [items offset limit]
  (cond-> items
    (some? offset) (->> (drop offset) vec)
    (some? limit) (->> (take limit) vec)))

(defn- prepare-tag-item
  [item {:keys [expand with-properties with-extends]}]
  (if expand
    (cond-> item
      (not with-properties) (dissoc :logseq.property.class/properties)
      (not with-extends) (dissoc :logseq.property.class/extends))
    item))

(defn- prepare-property-item
  [item {:keys [expand with-classes with-type]}]
  (if expand
    (cond-> item
      (not with-classes) (dissoc :logseq.property/classes)
      (not with-type) (dissoc :logseq.property/type))
    item))

(defn execute-list-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg :thread-api/api-list-pages false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items (:sort options) order list-page-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-page-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg :thread-api/api-list-tags false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-tag-item % options) items)
              sorted (apply-sort prepared (:sort options) order list-tag-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-tag-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg :thread-api/api-list-properties false
                                      [(:repo action) options])
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-property-item % options) items)
              sorted (apply-sort prepared (:sort options) order list-property-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (if (:expand options)
                      (apply-fields limited fields list-property-field-map)
                      limited)]
        {:status :ok
         :data {:items final}})))
