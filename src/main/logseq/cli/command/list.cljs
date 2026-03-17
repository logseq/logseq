(ns logseq.cli.command.list
  "List-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def ^:private list-common-spec
  {:expand {:desc "Include expanded metadata"
            :alias :e
            :coerce :boolean}
   :include-built-in {:coerce :boolean}
   :fields {:desc "Select output fields (comma separated)"
            :alias :f}
   :limit {:desc "Limit results"
           :coerce :long}
   :offset {:desc "Offset results"
            :coerce :long}
   :sort {:desc "Sort field. Default: updated-at"
          :alias :s}
   :order {:desc "Sort order. Default: asc"
           :values ["asc" "desc"]}})

;; These should be kept in sync with visible columns e.g. format/list-columns
(def ^:private list-sort-fields
  {:list-page #{"title" "id" "ident" "created-at" "updated-at"}
   :list-tag #{"title" "id" "ident" "created-at" "updated-at"}
   :list-property #{"title" "id" "ident" "created-at" "updated-at" "type"}})

(def ^:private default-sort-field "updated-at")

(defn- effective-sort-field
  [options]
  (or (:sort options) default-sort-field))

(def ^:private list-page-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at})

(def ^:private list-page-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:values (:list-page list-sort-fields)}
    :fields {:multiple-values (keys list-page-field-map)}
    :include-built-in {:desc "Include built-in pages"}
    :include-journal {:desc "Include journal pages"
                      :coerce :boolean}
    :journal-only {:desc "Only journal pages"
                   :coerce :boolean}
    :include-hidden {:desc "Include hidden pages"
                     :coerce :boolean}
    :updated-after {:desc "Filter by updated-at (ISO8601)"}
    :created-after {:desc "Filter by created-at (ISO8601)"}}))

(def ^:private list-tag-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at
   "properties" :logseq.property.class/properties
   "extends" :logseq.property.class/extends
   "description" :logseq.property/description})

(def ^:private list-tag-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:values (:list-tag list-sort-fields)}
    :fields {:multiple-values (keys list-tag-field-map)}
    :include-built-in {:desc "Include built-in tags"}
    :with-properties {:desc "Include tag properties"
                      :coerce :boolean}
    :with-extends {:desc "Include tag extends"
                   :coerce :boolean}}))

(def ^:private list-property-field-map
  {"id" :db/id
   "ident" :db/ident
   "title" :block/title
   "uuid" :block/uuid
   "created-at" :block/created-at
   "updated-at" :block/updated-at
   "classes" :logseq.property/classes
   "type" :logseq.property/type
   "description" :logseq.property/description})

(def ^:private list-property-spec
  (merge-with
   merge
   list-common-spec
   {:sort {:values (:list-property list-sort-fields)}
    :fields {:multiple-values (keys list-property-field-map)}
    :include-built-in {:desc "Include built-in properties"}
    :with-classes {:desc "Include property classes"
                   :coerce :boolean}
    :with-type {:desc "Include property type"
                :default true
                :coerce :boolean}}))

(def entries
  [(core/command-entry ["list" "page"] :list-page "List pages" list-page-spec
                       {:examples ["logseq list page --graph my-graph"
                                   "logseq list page --graph my-graph --journal-only --limit 20"]})
   (core/command-entry ["list" "tag"] :list-tag "List tags" list-tag-spec
                       {:examples ["logseq list tag --graph my-graph --with-properties"]})
   (core/command-entry ["list" "property"] :list-property "List properties" list-property-spec
                       {:examples ["logseq list property --graph my-graph --with-type"]})])

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
                   (sort-by (fn [item]
                              [(get item sort-key) (:db/id item)])
                            items)
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
  [item {:keys [with-properties with-extends fields]}]
  (cond-> item
    (not with-properties) (dissoc :logseq.property.class/properties)
    (not with-extends) (dissoc :logseq.property.class/extends)
    (not (string/includes? (str fields) "description")) (dissoc :logseq.property/description)))

(defn- prepare-property-item
  [item {:keys [with-classes with-type fields]}]
  (cond-> item
    (not with-classes) (dissoc :logseq.property/classes)
    (not with-type) (dissoc :logseq.property/type)
    (not (string/includes? (str fields) "description")) (dissoc :logseq.property/description)))

(defn execute-list-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (:options action)
              items (transport/invoke cfg :thread-api/api-list-pages false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              sorted (apply-sort items sort-field order list-page-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-page-field-map)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (cond-> (:options action)
                        ((some-fn :with-extends :with-properties) (:options action))
                        (assoc :expand true))
              items (transport/invoke cfg :thread-api/api-list-tags false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-tag-item % options) items)
              sorted (apply-sort prepared sort-field order list-tag-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-tag-field-map)]
        {:status :ok
         :data {:items final}})))

(defn execute-list-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              options (cond-> (:options action)
                        (:with-classes (:options action)) (assoc :expand true))
              items (transport/invoke cfg :thread-api/api-list-properties false
                                      [(:repo action) options])
              sort-field (effective-sort-field options)
              order (or (:order options) "asc")
              fields (parse-field-list (:fields options))
              prepared (mapv #(prepare-property-item % options) items)
              sorted (apply-sort prepared sort-field order list-property-field-map)
              limited (apply-offset-limit sorted (:offset options) (:limit options))
              final (apply-fields limited fields list-property-field-map)]
        {:status :ok
         :data {:items final}})))
