(ns logseq.cli.command.upsert
  "Upsert-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.update :as update-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private upsert-block-spec
  {:id {:desc "Source block db/id (forces update mode)"
        :coerce :long}
   :uuid {:desc "Source block UUID (forces update mode)"}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"}
   :target-page {:desc "Target page name"
                 :complete :pages}
   :pos {:desc "Position. Default: create=last-child, update=first-child"
         :validate #{"first-child" "last-child" "sibling"}}
   :content {:desc "Block content (create inserts; update rewrites source block content)"}
   :blocks {:desc "EDN vector of blocks for create mode"}
   :blocks-file {:desc "EDN file of blocks for create mode"
                 :complete :file}
   :status {:desc "Task status (create/update)"
            :validate #{"todo" "doing" "done" "now" "later" "wait" "waiting"
                        "backlog" "canceled" "cancelled" "in-review" "in-progress"}}
   :update-tags {:desc "Tags to add/update (EDN vector)"}
   :update-properties {:desc "Properties to add/update (EDN map)"}
   :remove-tags {:desc "Tags to remove (EDN vector)"}
   :remove-properties {:desc "Properties to remove (EDN vector)"}})

(def ^:private upsert-page-spec
  {:id {:desc "Target page db/id (forces update mode)"
        :coerce :long}
   :page {:desc "Page name"
          :complete :pages}
   :update-tags {:desc "Tags to add/update (EDN vector)"}
   :update-properties {:desc "Properties to add/update (EDN map)"}
   :remove-tags {:desc "Tags to remove (EDN vector)"}
   :remove-properties {:desc "Properties to remove (EDN vector)"}})

(def ^:private upsert-tag-spec
  {:id {:desc "Target tag db/id (forces update mode)"
        :coerce :long}
   :name {:desc "Tag name"}})

(def ^:private upsert-property-spec
  {:id {:desc "Target property db/id (forces update mode)"
        :coerce :long}
   :name {:desc "Property name"}
   :type {:desc "Property type"
          :validate #{"default" "number" "date" "datetime" "checkbox" "url" "node" "json" "string"}}
   :cardinality {:desc "Property cardinality"
                 :validate #{"one" "many"}}
   :hide {:desc "Hide property"
          :coerce :boolean}
   :public {:desc "Set property public visibility"
            :coerce :boolean}})

(def entries
  [(core/command-entry ["upsert" "block"] :upsert-block "Upsert block" upsert-block-spec
                       {:examples ["logseq upsert block --graph my-graph --target-page Home --content \"New block\""
                                   "logseq upsert block --graph my-graph --id 123 --content \"Updated content\""]})
   (core/command-entry ["upsert" "page"] :upsert-page "Upsert page" upsert-page-spec
                       {:examples ["logseq upsert page --graph my-graph --page Home --update-tags '[\"project\"]'"]})
   (core/command-entry ["upsert" "tag"] :upsert-tag "Upsert tag" upsert-tag-spec
                       {:examples ["logseq upsert tag --graph my-graph --name project"]})
   (core/command-entry ["upsert" "property"] :upsert-property "Upsert property" upsert-property-spec
                       {:examples ["logseq upsert property --graph my-graph --name status --type default --cardinality one"]})])

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
    :upsert-block
    (let [opts (cond-> opts
                 (seq (:target-page opts))
                 (assoc :target-page-name (:target-page opts)))
          update-mode? (or (some? (:id opts))
                           (seq (some-> (:uuid opts) string/trim)))]
      (if update-mode?
        (update-command/invalid-options? opts)
        (add-command/invalid-options? opts)))

    :upsert-property
    (let [name (normalize-property-name (:name opts))
          selectors (filter some? [(:id opts) name])]
      (when (> (count selectors) 1)
        "only one of --id or --name is allowed"))

    :upsert-page
    (let [page (some-> (:page opts) string/trim)
          selectors (filter some? [(:id opts) page])]
      (when (> (count selectors) 1)
        "only one of --id or --page is allowed"))

    :upsert-tag
    (let [name-provided? (contains? opts :name)
          name (normalize-tag-name (:name opts))]
      (cond
        (and name-provided? (not (seq name)))
        "tag name must not be blank"

        :else
        nil))

    nil))

(defn update-mode?
  [opts]
  (or (some? (:id opts))
      (seq (some-> (:uuid opts) string/trim))))

(defn build-block-action
  [options args repo]
  (let [update-mode* (update-mode? options)]
    (if update-mode*
      (let [options (cond-> options
                      (seq (:target-page options))
                      (assoc :target-page (:target-page options)))]
        (-> (update-command/build-action options repo)
            (update :action
                    (fn [action]
                      (when action
                        (assoc action :type :upsert-block :mode :update))))))
      (let [options (cond-> options
                      (seq (:target-page options))
                      (assoc :target-page-name (:target-page options))
                      true
                      (dissoc :target-page))
            create-result (add-command/build-add-block-action options args repo)
            update-tags-result (add-command/parse-tags-option (:update-tags options))
            update-properties-result (add-command/parse-properties-option
                                      (:update-properties options)
                                      {:allow-non-built-in? true})
            remove-tags-result (add-command/parse-tags-vector-option (:remove-tags options))
            remove-properties-result (add-command/parse-properties-vector-option
                                      (:remove-properties options)
                                      {:allow-non-built-in? true})]
        (cond
          (not (:ok? create-result))
          create-result

          (not (:ok? update-tags-result))
          update-tags-result

          (not (:ok? update-properties-result))
          update-properties-result

          (not (:ok? remove-tags-result))
          remove-tags-result

          (not (:ok? remove-properties-result))
          remove-properties-result

          :else
          (-> create-result
              (update :action
                      (fn [action]
                        (-> action
                            (assoc :type :upsert-block
                                   :mode :create
                                   :update-tags (:value update-tags-result)
                                   :update-properties (:value update-properties-result)
                                   :remove-tags (:value remove-tags-result)
                                   :remove-properties (:value remove-properties-result)))))))))))

(defn build-page-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [id (:id options)
          page (some-> (:page options) string/trim)
          update-tags-result (add-command/parse-tags-option (:update-tags options))
          update-properties-result (add-command/parse-properties-option (:update-properties options))
          remove-tags-result (add-command/parse-tags-vector-option (:remove-tags options))
          remove-properties-result (add-command/parse-properties-vector-option (:remove-properties options))
          invalid-message (invalid-options? :upsert-page options)]
      (cond
        (seq invalid-message)
        {:ok? false
         :error {:code :invalid-options
                 :message invalid-message}}

        (and (not (some? id)) (not (seq page)))
        {:ok? false
         :error {:code :missing-page-name
                 :message "page name is required"}}

        (not (:ok? update-tags-result))
        update-tags-result

        (not (:ok? update-properties-result))
        update-properties-result

        (not (:ok? remove-tags-result))
        remove-tags-result

        (not (:ok? remove-properties-result))
        remove-properties-result

        :else
        {:ok? true
         :action (cond-> {:type :upsert-page
                          :repo repo
                          :graph (core/repo->graph repo)
                          :mode (if (some? id) :update :create)
                          :update-tags (:value update-tags-result)
                          :update-properties (:value update-properties-result)
                          :remove-tags (:value remove-tags-result)
                          :remove-properties (:value remove-properties-result)}
                   (some? id) (assoc :id id)
                   (seq page) (assoc :page page))}))))

(defn build-tag-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [id (:id options)
          name (normalize-tag-name (:name options))
          invalid-message (invalid-options? :upsert-tag options)]
      (cond
        (seq invalid-message)
        {:ok? false
         :error {:code :invalid-options
                 :message invalid-message}}

        (some? id)
        {:ok? true
         :action (cond-> {:type :upsert-tag
                          :mode :update
                          :id id
                          :repo repo
                          :graph (core/repo->graph repo)}
                   (seq name) (assoc :name name))}

        (seq name)
        {:ok? true
         :action {:type :upsert-tag
                  :mode :create
                  :repo repo
                  :graph (core/repo->graph repo)
                  :name name}}

        :else
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
    (let [id (:id options)
          name (normalize-property-name (:name options))
          invalid-message (invalid-options? :upsert-property options)]
      (cond
        (and (not (some? id)) (not (seq name)))
        {:ok? false
         :error {:code :missing-property-name
                 :message "property name is required"}}

        (seq invalid-message)
        {:ok? false
         :error {:code :invalid-options
                 :message invalid-message}}

        :else
        {:ok? true
         :action (cond-> {:type :upsert-property
                          :mode (if (some? id) :update :create)
                          :repo repo
                          :graph (core/repo->graph repo)
                          :schema (property-schema options)}
                   (some? id) (assoc :id id)
                   (seq name) (assoc :name name))}))))

(defn- pull-page-by-name
  [config repo page-name selector]
  (transport/invoke config :thread-api/pull false
                    [repo selector [:block/name (common-util/page-name-sanity-lc page-name)]]))

(defn- ensure-property-identifiers-exist!
  [config repo property-idents]
  (if (seq property-idents)
    (p/all
     (map (fn [property-ident]
            (p/let [entity (transport/invoke config :thread-api/pull false
                                             [repo [:db/id] [:db/ident property-ident]])]
              (when-not (:db/id entity)
                (throw (ex-info "property not found"
                                {:code :property-not-found
                                 :property property-ident})))))
          (distinct property-idents)))
    (p/resolved nil)))

(defn- ensure-page-entity!
  [config repo page-name]
  (p/let [existing (pull-page-by-name config repo page-name [:db/id :block/uuid])]
    (if (:db/id existing)
      existing
      (p/let [_ (transport/invoke config :thread-api/apply-outliner-ops false
                                  [repo [[:create-page [page-name {}]]] {}])
              created (pull-page-by-name config repo page-name [:db/id :block/uuid])]
        (if (:db/id created)
          created
          (throw (ex-info "page not found after upsert"
                          {:code :page-not-found
                           :page page-name})))))))

(def ^:private upsert-id-not-found-code
  :upsert-id-not-found)

(def ^:private upsert-id-type-mismatch-code
  :upsert-id-type-mismatch)

(def ^:private page-selector
  [:db/id :block/uuid :block/name :block/title])

(def ^:private tag-selector
  [:db/id :block/uuid :block/name :block/title
   {:block/tags [:db/ident]}])

(def ^:private property-selector
  [:db/id :db/ident :block/uuid :block/name :block/title :logseq.property/type])

(defn- page-entity?
  [entity]
  (seq (:block/name entity)))

(defn- tag-entity?
  [entity]
  (some #(= :logseq.class/Tag (:db/ident %))
        (:block/tags entity)))

(defn- property-entity?
  [entity]
  (some? (:logseq.property/type entity)))

(defn- pull-entity-by-id
  [config repo selector id]
  (transport/invoke config :thread-api/pull false
                    [repo selector id]))

(defn- throw-upsert-id-not-found!
  [entity-type id]
  (throw (ex-info (str entity-type " not found for id")
                  {:code upsert-id-not-found-code
                   :entity-type entity-type
                   :id id})))

(defn- throw-upsert-id-type-mismatch!
  [entity-type id]
  (throw (ex-info (str "id does not reference expected " entity-type)
                  {:code upsert-id-type-mismatch-code
                   :entity-type entity-type
                   :id id})))

(defn- ensure-page-by-id!
  [config repo id]
  (p/let [entity (pull-entity-by-id config repo page-selector id)]
    (cond
      (not (:db/id entity))
      (throw-upsert-id-not-found! "page" id)

      (not (page-entity? entity))
      (throw-upsert-id-type-mismatch! "page" id)

      :else
      entity)))

(defn- ensure-tag-by-id!
  [config repo id]
  (p/let [entity (pull-entity-by-id config repo tag-selector id)]
    (cond
      (not (:db/id entity))
      (throw-upsert-id-not-found! "tag" id)

      (not (tag-entity? entity))
      (throw-upsert-id-type-mismatch! "tag" id)

      :else
      entity)))

(def ^:private tag-rename-conflict-code
  :tag-rename-conflict)

(defn- normalized-tag-lookup-name
  [value]
  (some-> value normalize-tag-name common-util/page-name-sanity-lc))

(defn- rename-target-same-as-current?
  [entity target-name]
  (= (:block/name entity)
     (normalized-tag-lookup-name target-name)))

(defn- rename-target-conflict
  [entity target]
  (let [target-id (:db/id target)
        current-id (:db/id entity)]
    (cond
      (or (nil? target-id)
          (= target-id current-id))
      nil

      (not (tag-entity? target))
      {:code :tag-name-conflict
       :message "tag already exists as a page and is not a tag"}

      :else
      {:code tag-rename-conflict-code
       :message "rename target already exists as a tag"})))

(defn- ensure-property-by-id!
  [config repo id]
  (p/let [entity (pull-entity-by-id config repo property-selector id)]
    (cond
      (not (:db/id entity))
      (throw-upsert-id-not-found! "property" id)

      (not (property-entity? entity))
      (throw-upsert-id-type-mismatch! "property" id)

      :else
      entity)))

(defn- append-tag-and-property-ops
  [ops block-ids {:keys [update-tag-ids remove-tag-ids update-properties remove-properties]}]
  (cond-> ops
    (seq remove-tag-ids)
    (into (map (fn [tag-id]
                 [:batch-delete-property-value [block-ids :block/tags tag-id]])
               remove-tag-ids))

    (seq remove-properties)
    (into (map (fn [property-id]
                 [:batch-remove-property [block-ids property-id]])
               remove-properties))

    (seq update-tag-ids)
    (into (map (fn [tag-id]
                 [:batch-set-property [block-ids :block/tags tag-id {}]])
               update-tag-ids))

    (seq update-properties)
    (into (map (fn [[k v]]
                 [:batch-set-property [block-ids k v {}]])
               update-properties))))

(defn- execute-extra-upsert-block-ops!
  [action config block-ids]
  (if (seq block-ids)
    (p/let [cfg (cli-server/ensure-server! config (:repo action))
            update-tags (add-command/resolve-tags cfg (:repo action) (:update-tags action))
            remove-tags (add-command/resolve-tags cfg (:repo action) (:remove-tags action))
            update-properties (add-command/resolve-properties
                               cfg (:repo action) (:update-properties action)
                               {:allow-non-built-in? true})
            remove-properties (add-command/resolve-property-identifiers
                               cfg (:repo action) (:remove-properties action)
                               {:allow-non-built-in? true})
            update-property-idents (keys (or update-properties {}))
            _ (ensure-property-identifiers-exist! cfg (:repo action) update-property-idents)
            _ (ensure-property-identifiers-exist! cfg (:repo action) remove-properties)
            ops (append-tag-and-property-ops []
                                             block-ids
                                             {:update-tag-ids (->> update-tags (map :db/id) (remove nil?) distinct vec)
                                              :remove-tag-ids (->> remove-tags (map :db/id) (remove nil?) distinct vec)
                                              :update-properties update-properties
                                              :remove-properties remove-properties})]
      (when (seq ops)
        (transport/invoke cfg :thread-api/apply-outliner-ops false
                          [(:repo action) ops {}])))
    (p/resolved nil)))

(defn execute-upsert-block
  [action config]
  (-> (if (= :update (:mode action))
        (update-command/execute-update (assoc action :type :update-block) config)
        (p/let [result (add-command/execute-add-block (assoc action :type :add-block) config)
                created-ids (vec (or (get-in result [:data :result]) []))
                _ (execute-extra-upsert-block-ops! action config created-ids)]
          {:status :ok
           :data {:result created-ids}}))
      (p/catch (fn [e]
                 {:status :error
                  :error {:code (or (get-in (ex-data e) [:code]) :exception)
                          :message (or (ex-message e) (str e))}}))))

(defn execute-upsert-page
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              update-by-id? (= :update (:mode action))
              page (if update-by-id?
                     (ensure-page-by-id! cfg (:repo action) (:id action))
                     (ensure-page-entity! cfg (:repo action) (:page action)))
              page-id (:db/id page)
              block-ids [page-id]
              update-tags (add-command/resolve-tags cfg (:repo action) (:update-tags action))
              remove-tags (add-command/resolve-tags cfg (:repo action) (:remove-tags action))
              update-properties (add-command/resolve-properties cfg (:repo action) (:update-properties action))
              remove-properties (add-command/resolve-property-identifiers cfg (:repo action)
                                                                          (:remove-properties action))
              _ (ensure-property-identifiers-exist! cfg (:repo action) (keys (or update-properties {})))
              _ (ensure-property-identifiers-exist! cfg (:repo action) remove-properties)
              update-tag-ids (->> (or update-tags [])
                                  (map :db/id)
                                  (remove nil?)
                                  distinct
                                  vec)
              remove-tag-ids (->> remove-tags (map :db/id) (remove nil?) distinct vec)
              ops (append-tag-and-property-ops []
                                               block-ids
                                               {:update-tag-ids update-tag-ids
                                                :remove-tag-ids remove-tag-ids
                                                :update-properties update-properties
                                                :remove-properties remove-properties})
              _ (when (seq ops)
                  (transport/invoke cfg :thread-api/apply-outliner-ops false
                                    [(:repo action) ops {}]))]
        {:status :ok
         :data {:result [page-id]}})
      (p/catch (fn [e]
                 {:status :error
                  :error {:code (or (get-in (ex-data e) [:code]) :exception)
                          :message (or (ex-message e) (str e))}}))))

(defn execute-upsert-tag
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              update-by-id? (= :update (:mode action))]
        (if update-by-id?
          (p/let [entity (ensure-tag-by-id! cfg (:repo action) (:id action))
                  target-name (:name action)
                  target (when (seq target-name)
                           (pull-page-by-name cfg (:repo action) target-name tag-selector))
                  conflict (when (and (seq target-name)
                                      (not (rename-target-same-as-current? entity target-name)))
                             (rename-target-conflict entity target))
                  _ (when (and (seq target-name)
                               (not conflict)
                               (not (rename-target-same-as-current? entity target-name)))
                      (transport/invoke cfg :thread-api/apply-outliner-ops false
                                        [(:repo action)
                                         [[:rename-page [(:block/uuid entity) target-name]]]
                                         {}]))]
            (if conflict
              {:status :error
               :error conflict}
              {:status :ok
               :data {:result [(:db/id entity)]}}))
          (p/let [existing (pull-page-by-name cfg (:repo action) (:name action)
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
      (p/catch (fn [e]
                 {:status :error
                  :error {:code (or (get-in (ex-data e) [:code]) :exception)
                          :message (or (ex-message e) (str e))}}))))

(defn execute-upsert-property
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              update-by-id? (= :update (:mode action))]
        (if update-by-id?
          (p/let [existing (ensure-property-by-id! cfg (:repo action) (:id action))
                  property-ident (:db/ident existing)
                  _ (when (seq (:schema action))
                      (transport/invoke cfg :thread-api/apply-outliner-ops false
                                        [(:repo action)
                                         [[:upsert-property [property-ident
                                                             (:schema action)
                                                             {}]]]
                                         {}]))]
            {:status :ok
             :data {:result [(:db/id existing)]}})
          (p/let [existing (pull-page-by-name cfg (:repo action) (:name action) property-selector)
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
      (p/catch (fn [e]
                 {:status :error
                  :error {:code (or (get-in (ex-data e) [:code]) :exception)
                          :message (or (ex-message e) (str e))}}))))
