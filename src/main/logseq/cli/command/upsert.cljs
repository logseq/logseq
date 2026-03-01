(ns logseq.cli.command.upsert
  "Upsert-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private upsert-tag-spec
  {:name {:desc "Tag name"}})

(def ^:private upsert-property-spec
  {:name {:desc "Property name"}
   :type {:desc "Property type (default, number, date, datetime, checkbox, url, node, json, string)"}
   :cardinality {:desc "Property cardinality (one, many)"}
   :hide {:desc "Hide property"
          :coerce :boolean}
   :public {:desc "Set property public visibility"
            :coerce :boolean}})

(def entries
  [(core/command-entry ["upsert" "tag"] :upsert-tag "Upsert tag" upsert-tag-spec)
   (core/command-entry ["upsert" "property"] :upsert-property "Upsert property" upsert-property-spec)])

(def ^:private property-types
  #{"default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"})

(def ^:private property-cardinalities
  #{"one" "many"})

(defn- normalize-tag-name
  [value]
  (let [text (some-> value string/trim (string/replace #"^#+" ""))]
    (when (seq text)
      text)))

(defn- normalize-property-name
  [value]
  (let [text (some-> value string/trim)]
    (when (seq text)
      text)))

(defn- normalize-property-type
  [value]
  (some-> value string/trim string/lower-case))

(defn- normalize-property-cardinality
  [value]
  (let [v (some-> value string/trim string/lower-case)]
    (case v
      "db.cardinality/one" "one"
      "db.cardinality/many" "many"
      v)))

(defn invalid-options?
  [command opts]
  (case command
    :upsert-property
    (let [type' (normalize-property-type (:type opts))
          cardinality' (normalize-property-cardinality (:cardinality opts))]
      (cond
        (and (seq (:type opts)) (not (contains? property-types type')))
        (str "invalid type: " (:type opts))

        (and (seq (:cardinality opts)) (not (contains? property-cardinalities cardinality')))
        (str "invalid cardinality: " (:cardinality opts))

        :else
        nil))

    nil))

(defn build-tag-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [name (normalize-tag-name (:name options))]
      (if (seq name)
        {:ok? true
         :action {:type :upsert-tag
                  :repo repo
                  :graph (core/repo->graph repo)
                  :name name}}
        {:ok? false
         :error {:code :missing-tag-name
                 :message "tag name is required"}}))))

(defn- cardinality->db
  [value]
  (when-let [v (normalize-property-cardinality value)]
    (case v
      "many" :db.cardinality/many
      "one" :db.cardinality/one
      nil)))

(defn- property-schema
  [options]
  (cond-> {}
    (seq (:type options))
    (assoc :logseq.property/type (keyword (normalize-property-type (:type options))))

    (seq (:cardinality options))
    (assoc :db/cardinality (cardinality->db (:cardinality options)))

    (contains? options :hide)
    (assoc :logseq.property/hide? (boolean (:hide options)))

    (contains? options :public)
    (assoc :logseq.property/public? (boolean (:public options)))))

(defn build-property-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [name (normalize-property-name (:name options))
          invalid-message (invalid-options? :upsert-property options)]
      (cond
        (not (seq name))
        {:ok? false
         :error {:code :missing-property-name
                 :message "property name is required"}}

        (seq invalid-message)
        {:ok? false
         :error {:code :invalid-options
                 :message invalid-message}}

        :else
        {:ok? true
         :action {:type :upsert-property
                  :repo repo
                  :graph (core/repo->graph repo)
                  :name name
                  :schema (property-schema options)}}))))

(defn- pull-page-by-name
  [config repo page-name selector]
  (transport/invoke config :thread-api/pull false
                    [repo selector [:block/name (common-util/page-name-sanity-lc page-name)]]))

(defn- tag-entity?
  [entity]
  (some #(= :logseq.class/Tag (:db/ident %))
        (:block/tags entity)))

(defn execute-upsert-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              existing (pull-page-by-name cfg (:repo action) (:name action)
                                          [:db/id :block/name :block/title
                                           {:block/tags [:db/ident]}])
              existing-id (:db/id existing)]
        (cond
          (and existing-id (not (tag-entity? existing)))
          {:status :error
           :error {:code :tag-name-conflict
                   :message "tag already exists as a page and is not a tag"}}

          :else
          (p/let [_ (when-not existing-id
                      (transport/invoke cfg :thread-api/apply-outliner-ops false
                                        [(:repo action)
                                         [[:create-page [(:name action) {:class? true}]]]
                                         {}]))
                  page (or (when existing-id existing)
                           (pull-page-by-name cfg (:repo action) (:name action)
                                              [:db/id :block/name :block/title
                                               {:block/tags [:db/ident]}]))
                  page-id (:db/id page)]
            (cond
              (not page-id)
              {:status :error
               :error {:code :tag-not-found
                       :message "tag not found after upsert"}}

              (not (tag-entity? page))
              {:status :error
               :error {:code :tag-create-not-tag
                       :message "created entity is not tagged as :logseq.class/Tag"}}

              :else
              {:status :ok
               :data {:result [page-id]}}))))))

(def ^:private property-selector
  [:db/id :db/ident :block/name :block/title :logseq.property/type])

(defn- property-entity?
  [entity]
  (some? (:logseq.property/type entity)))

(defn execute-upsert-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              existing (pull-page-by-name cfg (:repo action) (:name action) property-selector)
              existing-id (:db/id existing)]
        (cond
          (and existing-id (not (property-entity? existing)))
          {:status :error
           :error {:code :property-name-conflict
                   :message "property already exists as a page and is not a property"}}

          :else
          (p/let [property-ident (when (property-entity? existing)
                                   (:db/ident existing))
                  property-opts (cond-> {}
                                  (nil? property-ident)
                                  (assoc :property-name (:name action)))
                  _ (transport/invoke cfg :thread-api/apply-outliner-ops false
                                      [(:repo action)
                                       [[:upsert-property [property-ident
                                                           (:schema action)
                                                           property-opts]]]
                                       {}])
                  property (pull-page-by-name cfg (:repo action) (:name action) property-selector)
                  property-id (:db/id property)]
            (if property-id
              {:status :ok
               :data {:result [property-id]}}
              {:status :error
               :error {:code :property-not-found
                       :message "property not found after upsert"}}))))))
