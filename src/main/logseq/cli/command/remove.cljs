(ns logseq.cli.command.remove
  "Remove-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.id :as id-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private remove-block-spec
  {:id {:desc "Block db/id or EDN vector of ids"}
   :uuid {:desc "Block UUID"}})

(def ^:private remove-page-spec
  {:name {:desc "Page name"
          :complete :pages}})

(def ^:private remove-entity-spec
  {:id {:desc "Entity db/id"
        :coerce :long}
   :name {:desc "Entity name"}})

(def entries
  [(core/command-entry ["remove" "block"] :remove-block "Remove blocks" remove-block-spec
                       {:examples ["logseq remove block --graph my-graph --id 123"
                                   "logseq remove block --graph my-graph --uuid 7f0f4bb3-2e48-4b46-ae0f-18f52ef0f8be"]})
   (core/command-entry ["remove" "page"] :remove-page "Remove page" remove-page-spec
                       {:examples ["logseq remove page --graph my-graph --name Home"]})
   (core/command-entry ["remove" "tag"] :remove-tag "Remove tag" remove-entity-spec
                       {:examples ["logseq remove tag --graph my-graph --name project"]})
   (core/command-entry ["remove" "property"] :remove-property "Remove property" remove-entity-spec
                       {:examples ["logseq remove property --graph my-graph --name status"]})])

(defn invalid-options?
  [command opts]
  (case command
    :remove-block
    (let [id-result (id-command/parse-id-option (:id opts))
          selectors (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])]
      (cond
        (and (some? (:id opts)) (not (:ok? id-result)))
        (:message id-result)

        (> (count selectors) 1)
        "only one of --id or --uuid is allowed"

        :else
        nil))

    (:remove-tag :remove-property)
    (let [name (some-> (:name opts) string/trim)
          selectors (filter some? [(:id opts) name])]
      (cond
        (> (count selectors) 1)
        "only one of --id or --name is allowed"

        (and (contains? opts :name) (string/blank? (or (:name opts) "")))
        "name must be non-empty"

        :else
        nil))

    nil))

(def ^:private block-id-selector
  [:db/id :block/uuid])

(def ^:private page-id-selector
  [:db/id :block/uuid :block/name :block/title])

(def ^:private entity-selector
  [:db/id :db/ident :block/uuid :block/name :block/title
   :logseq.property/type :logseq.property/public? :logseq.property/built-in?
   {:block/tags [:db/id :db/ident :block/title :block/name]}])

(defn- fetch-block-by-id
  [config repo id]
  (transport/invoke config :thread-api/pull false
                    [repo block-id-selector id]))

(defn- fetch-block-by-uuid
  [config repo uuid-str]
  (p/let [entity (transport/invoke config :thread-api/pull false
                                   [repo block-id-selector [:block/uuid (uuid uuid-str)]])]
    (if (:db/id entity)
      entity
      (transport/invoke config :thread-api/pull false
                        [repo block-id-selector [:block/uuid uuid-str]]))))

(defn- delete-block-ids
  [config repo ids]
  (transport/invoke config :thread-api/apply-outliner-ops false
                    [repo [[:delete-blocks [ids {}]]] {}]))

(defn- delete-page-by-uuid
  [config repo page-uuid]
  (transport/invoke config :thread-api/apply-outliner-ops false
                    [repo [[:delete-page [page-uuid]]] {}]))

(defn- remove-block-id
  [config repo id]
  (p/let [entity (fetch-block-by-id config repo id)]
    (if (:db/id entity)
      (delete-block-ids config repo [id])
      (throw (ex-info "block not found" {:code :block-not-found})))))

(defn- remove-block-ids-best-effort
  [config repo ids]
  (p/let [entities (p/all (map (fn [id]
                                 (fetch-block-by-id config repo id))
                               ids))
          id-entities (map vector ids entities)
          existing-ids (vec (keep (fn [[id entity]]
                                    (when (:db/id entity) id))
                                  id-entities))
          missing-ids (vec (keep (fn [[id entity]]
                                   (when-not (:db/id entity) id))
                                 id-entities))
          result (if (seq existing-ids)
                   (delete-block-ids config repo existing-ids)
                   nil)]
    {:deleted-ids existing-ids
     :missing-ids missing-ids
     :result result}))

(defn- perform-remove-block
  [config {:keys [repo ids multi-id? uuid]}]
  (cond
    (and (seq ids) multi-id?)
    (remove-block-ids-best-effort config repo ids)

    (seq ids)
    (remove-block-id config repo (first ids))

    (seq uuid)
    (if-not (common-util/uuid-string? uuid)
      (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
      (p/let [entity (fetch-block-by-uuid config repo uuid)]
        (if-let [id (:db/id entity)]
          (delete-block-ids config repo [id])
          (throw (ex-info "block not found" {:code :block-not-found})))))

    :else
    (p/rejected (ex-info "block is required" {:code :missing-target}))))

(defn- resolve-page-by-name
  [config repo name]
  (transport/invoke config :thread-api/pull false
                    [repo page-id-selector [:block/name (common-util/page-name-sanity-lc name)]]))

(defn- item-id
  [item]
  (or (:db/id item) (:id item)))

(defn- item-name
  [item]
  (or (:block/title item) (:title item) (:name item) (:block/name item)))

(defn- normalize-name
  [value]
  (common-util/page-name-sanity-lc (or value "")))

(defn- tag-entity?
  [entity]
  (some #(= :logseq.class/Tag (:db/ident %))
        (:block/tags entity)))

(defn- property-entity?
  [entity]
  (some? (:logseq.property/type entity)))

(defn- list-matches-by-name
  [config repo method name]
  (let [normalized (normalize-name name)]
    (p/let [items (transport/invoke config method false [repo {:include-built-in true :expand true}])
            matches (->> (or items [])
                         (filter (fn [item]
                                   (= normalized (normalize-name (item-name item)))))
                         vec)]
      matches)))

(defn- ambiguous-error
  [code label name matches]
  (let [candidates (->> matches
                        (map (fn [item]
                               {:id (item-id item)
                                :name (item-name item)}))
                        (filter :id)
                        vec)]
    {:code code
     :message (str "multiple " label "s match name: " name "; rerun with --id")
     :candidates candidates}))

(defn- resolve-target
  [config repo {:keys [id name]} {:keys [list-method not-found-code ambiguous-code label]}]
  (cond
    (some? id)
    (p/resolved {:ok? true
                 :lookup id
                 :id id})

    (seq name)
    (p/let [matches (list-matches-by-name config repo list-method name)]
      (cond
        (empty? matches)
        {:ok? false
         :error {:code not-found-code
                 :message (str label " not found")}}

        (> (count matches) 1)
        {:ok? false
         :error (ambiguous-error ambiguous-code label name matches)}

        :else
        {:ok? true
         :lookup [:block/name (normalize-name (or (item-name (first matches)) name))]
         :id (item-id (first matches))
         :name (item-name (first matches))}))

    :else
    (p/resolved {:ok? false
                 :error {:code :missing-target
                         :message (str label " name or id is required")}})))

(defn- validate-tag-target
  [entity]
  (cond
    (nil? (:db/id entity))
    {:ok? false
     :error {:code :tag-not-found
             :message "tag not found"}}

    (not (tag-entity? entity))
    {:ok? false
     :error {:code :invalid-tag-target
             :message "target is not a tag"}}

    (true? (:logseq.property/built-in? entity))
    {:ok? false
     :error {:code :tag-built-in
             :message "built-in tag cannot be removed"}}

    (false? (:logseq.property/public? entity))
    {:ok? false
     :error {:code :tag-hidden
             :message "hidden tag cannot be removed"}}

    (nil? (:block/uuid entity))
    {:ok? false
     :error {:code :tag-not-found
             :message "tag uuid not found"}}

    :else
    {:ok? true
     :entity entity}))

(defn- validate-property-target
  [entity]
  (cond
    (nil? (:db/id entity))
    {:ok? false
     :error {:code :property-not-found
             :message "property not found"}}

    (not (property-entity? entity))
    {:ok? false
     :error {:code :invalid-property-target
             :message "target is not a property"}}

    (true? (:logseq.property/built-in? entity))
    {:ok? false
     :error {:code :property-built-in
             :message "built-in property cannot be removed"}}

    (false? (:logseq.property/public? entity))
    {:ok? false
     :error {:code :property-hidden
             :message "hidden property cannot be removed"}}

    (nil? (:block/uuid entity))
    {:ok? false
     :error {:code :property-not-found
             :message "property uuid not found"}}

    :else
    {:ok? true
     :entity entity}))

(defn- perform-remove-entity
  [config action {:keys [list-method not-found-code ambiguous-code label validate-fn]}]
  (p/let [resolved (resolve-target config (:repo action) action
                                   {:list-method list-method
                                    :not-found-code not-found-code
                                    :ambiguous-code ambiguous-code
                                    :label label})]
    (if-not (:ok? resolved)
      {:status :error
       :error (:error resolved)}
      (p/let [entity (transport/invoke config :thread-api/pull false
                                       [(:repo action) entity-selector (:lookup resolved)])
              validation (validate-fn entity)]
        (if-not (:ok? validation)
          {:status :error
           :error (:error validation)}
          (p/let [result (delete-page-by-uuid config (:repo action) (:block/uuid entity))]
            {:status :ok
             :data {:result result
                    :id (:db/id entity)
                    :name (or (:name resolved) (:block/title entity) (:block/name entity))}}))))))

(defn build-action
  [command options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for remove"}}
    (case command
      :remove-block
      (let [id-result (id-command/parse-id-option (:id options))
            ids (:value id-result)
            multi-id? (:multi? id-result)
            uuid (some-> (:uuid options) string/trim)
            selectors (filter some? [(:id options) uuid])]
        (cond
          (empty? selectors)
          {:ok? false
           :error {:code :missing-target
                   :message "block is required"}}

          (> (count selectors) 1)
          {:ok? false
           :error {:code :invalid-options
                   :message "only one of --id or --uuid is allowed"}}

          (and (some? (:id options)) (not (:ok? id-result)))
          {:ok? false
           :error {:code :invalid-options
                   :message (:message id-result)}}

          :else
          {:ok? true
           :action {:type :remove-block
                    :repo repo
                    :graph (core/repo->graph repo)
                    :id (when (and (seq ids) (not multi-id?)) (first ids))
                    :ids ids
                    :multi-id? multi-id?
                    :uuid uuid}}))

      :remove-page
      (let [name (some-> (:name options) string/trim)]
        (if (seq name)
          {:ok? true
           :action {:type :remove-page
                    :repo repo
                    :graph (core/repo->graph repo)
                    :name name}}
          {:ok? false
           :error {:code :missing-page-name
                   :message "page name is required"}}))

      (:remove-tag :remove-property)
      (let [name (some-> (:name options) string/trim)
            id (:id options)
            selectors (filter some? [id name])]
        (cond
          (empty? selectors)
          {:ok? false
           :error {:code :missing-target
                   :message "name or id is required"}}

          (> (count selectors) 1)
          {:ok? false
           :error {:code :invalid-options
                   :message "only one of --id or --name is allowed"}}

          :else
          {:ok? true
           :action {:type command
                    :repo repo
                    :graph (core/repo->graph repo)
                    :id id
                    :name name}}))

      {:ok? false
       :error {:code :unknown-command
               :message (str "unknown remove command: " command)}})))

(defn execute-remove-block
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              result (perform-remove-block cfg action)]
        {:status :ok
         :data (cond-> {:result result}
                 (map? result) (merge (dissoc result :result)))})))

(defn execute-remove-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              entity (resolve-page-by-name cfg (:repo action) (:name action))]
        (if-let [page-uuid (:block/uuid entity)]
          (p/let [result (delete-page-by-uuid cfg (:repo action) page-uuid)]
            {:status :ok
             :data {:result result}})
          {:status :error
           :error {:code :page-not-found
                   :message "page not found"}}))))

(defn execute-remove-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))]
        (perform-remove-entity cfg action
                               {:list-method :thread-api/api-list-tags
                                :not-found-code :tag-not-found
                                :ambiguous-code :ambiguous-tag-name
                                :label "tag"
                                :validate-fn validate-tag-target}))))

(defn execute-remove-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))]
        (perform-remove-entity cfg action
                               {:list-method :thread-api/api-list-properties
                                :not-found-code :property-not-found
                                :ambiguous-code :ambiguous-property-name
                                :label "property"
                                :validate-fn validate-property-target}))))
