(ns logseq.cli.command.upsert
  "Upsert-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.task-status :as task-status-command]
            [logseq.cli.command.update :as update-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.graph :as common-graph]
            [logseq.common.util :as common-util]
            [logseq.db.frontend.property.type :as db-property-type]
            [promesa.core :as p]))

(def ^:private upsert-block-spec
  {:id {:desc "Source block db/id (forces update mode) [update only]"
        :coerce :long}
   :uuid {:desc "Source block UUID (forces update mode) [update only]"
          :validate {:pred (comp parse-uuid str)
                     :ex-msg (constantly "Option uuid must be a valid UUID string")}}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"
                 :validate {:pred (comp parse-uuid str)
                            :ex-msg (constantly "Option target-uuid must be a valid UUID string")}}
   :target-page {:desc "Target page name"
                 :complete :pages}
   :pos {:desc "Position. Default: create=last-child, update=first-child"
         :validate #{"first-child" "last-child" "sibling"}}
   :content {:alias :c
             :desc "Block content (create inserts; update rewrites source block content)"}
   :blocks {:desc "EDN vector of blocks [create only]"}
   :blocks-file {:desc "EDN file of blocks [create only]"
                 :coerce common-graph/expand-home
                 :complete :file}
   :update-tags {:desc "Tags to add/update (EDN vector)"}
   :update-properties {:desc "Properties to add/update (EDN map)"}
   :remove-tags {:desc "Tags to remove (EDN vector) [update only]"}
   :remove-properties {:desc "Properties to remove (EDN vector) [update only]"}})

(def ^:private upsert-page-spec
  {:id {:desc "Target page db/id (forces update mode) [update only]"
        :coerce :long}
   :page {:desc "Page name"
          :complete :pages}
   :update-tags {:desc "Tags to add/update (EDN vector)"}
   :update-properties {:desc "Properties to add/update (EDN map)"}
   :remove-tags {:desc "Tags to remove (EDN vector) [update only]"}
   :remove-properties {:desc "Properties to remove (EDN vector) [update only]"}})

(def ^:private upsert-task-spec
  {:id {:desc "Target node db/id (forces update mode) [update only]"
        :coerce :long}
   :uuid {:desc "Target node UUID (forces update mode) [update only]"
          :validate {:pred (comp parse-uuid str)
                     :ex-msg (constantly "Option uuid must be a valid UUID string")}}
   :page {:desc "Task page name"
          :complete :pages}
   :content {:alias :c
             :desc "Task block content (create mode)"}
   :target-id {:desc "Target block db/id [create only]"
               :coerce :long}
   :target-uuid {:desc "Target block UUID [create only]"
                 :validate {:pred (comp parse-uuid str)
                            :ex-msg (constantly "Option target-uuid must be a valid UUID string")}}
   :target-page {:desc "Target page name [create only]"
                 :complete :pages}
   :pos {:desc "Position. Default: last-child"
         :validate #{"first-child" "last-child" "sibling"}}
   :status {:desc "Set task status"}
   :priority {:desc "Set task priority"}
   :scheduled {:desc "Set task scheduled datetime"}
   :deadline {:desc "Set task deadline datetime"}
   :no-status {:desc "Clear task status"
               :coerce :boolean}
   :no-priority {:desc "Clear task priority"
                 :coerce :boolean}
   :no-scheduled {:desc "Clear task scheduled datetime"
                  :coerce :boolean}
   :no-deadline {:desc "Clear task deadline datetime"
                 :coerce :boolean}})

(def ^:private upsert-tag-spec
  {:id {:desc "Target tag db/id (forces update mode)"
        :coerce :long}
   :name {:desc "Tag name"
          :complete :tags}})

(def ^:private upsert-property-spec
  {:id {:desc "Target property db/id (forces update mode)"
        :coerce :long}
   :name {:desc "Property name"
          :complete :properties}
   :type {:desc "Property type"
          :validate (into (set (map name db-property-type/user-built-in-property-types))
                          (set (map name db-property-type/user-allowed-internal-property-types)))}
   :cardinality {:desc "Property cardinality"
                 :validate #{"one" "many"}}
   :hide {:desc "Hide property"
          :coerce :boolean}
   :public {:desc "Set property public visibility"
            :coerce :boolean}})

(def entries
  [(core/command-entry ["upsert" "block"] :upsert-block "Upsert block" upsert-block-spec
                       {:examples ["logseq upsert block --graph my-graph --target-page Home --content \"New block\""
                                   "logseq upsert block --graph my-graph --id 123 --content \"Updated content\""
                                   "logseq upsert block --graph my-graph --id 123 --target-page Home"
                                   "logseq upsert block --graph my-graph --target-page Meeting Notes --content \"AI summary of the discussion\" --update-tags '[\"AI-GENERATED\"]'"
                                   "logseq upsert block --graph my-graph --blocks '[{:block/title \"A\"} {:block/title \"B\"}]'"]})
   (core/command-entry ["upsert" "page"] :upsert-page "Upsert page" upsert-page-spec
                       {:examples ["logseq upsert page --graph my-graph --page Home --update-tags '[\"project\"]'"
                                   "logseq upsert page --graph my-graph --id 999 --update-properties '{:logseq.property/description \"Example\"}'"]})
   (core/command-entry ["upsert" "task"] :upsert-task "Upsert task" upsert-task-spec
                       {:examples ["logseq upsert task --graph my-graph --content \"Ship release\" --target-page Home --status todo --priority high --scheduled \"2026-02-10T08:00:00.000Z\" --deadline \"2026-02-12T18:00:00.000Z\""
                                   "logseq upsert task --graph my-graph --page Weekly Plan --status doing"
                                   "logseq upsert task --graph my-graph --id 123 --no-status --no-priority"]})
   (core/command-entry ["upsert" "tag"] :upsert-tag "Upsert tag" upsert-tag-spec
                       {:examples ["logseq upsert tag --graph my-graph --name project"
                                   "logseq upsert tag --graph my-graph --id 200 --name Project Renamed"]})
   (core/command-entry ["upsert" "property"] :upsert-property "Upsert property" upsert-property-spec
                       {:examples ["logseq upsert property --graph my-graph --name status --type default --cardinality one"
                                   "logseq upsert property --graph my-graph --id 321 --hide true"]})])

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

(def ^:private available-priority-values
  ["low" "medium" "high" "urgent"])

(def ^:private priority-aliases
  {"low" :logseq.property/priority.low
   "medium" :logseq.property/priority.medium
   "high" :logseq.property/priority.high
   "urgent" :logseq.property/priority.urgent})

(defn- normalize-priority
  [value]
  (let [text (some-> value string/trim string/lower-case)]
    (when (seq text)
      (get priority-aliases text))))

(defn- invalid-priority-message
  [priority-input]
  (str "Invalid value for option :priority: " priority-input
       ". Available values: "
       (string/join ", " available-priority-values)))

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

    :upsert-task
    (let [id (:id opts)
          uuid (some-> (:uuid opts) string/trim)
          page (some-> (:page opts) string/trim)
          content (some-> (:content opts) string/trim)
          status-text (some-> (:status opts) string/trim)
          priority-text (some-> (:priority opts) string/trim)
          scheduled-text (some-> (:scheduled opts) string/trim)
          deadline-text (some-> (:deadline opts) string/trim)
          selectors (filter some? [id uuid page])
          target-selectors (filter some? [(:target-id opts)
                                          (:target-uuid opts)
                                          (some-> (:target-page opts) string/trim)])
          pos (some-> (:pos opts) string/trim string/lower-case)
          selector-mode? (or (some? id) (seq uuid) (seq page))
          set-clear-conflict (cond
                               (and (seq status-text) (:no-status opts))
                               "--status and --no-status are mutually exclusive"

                               (and (seq priority-text) (:no-priority opts))
                               "--priority and --no-priority are mutually exclusive"

                               (and (seq scheduled-text) (:no-scheduled opts))
                               "--scheduled and --no-scheduled are mutually exclusive"

                               (and (seq deadline-text) (:no-deadline opts))
                               "--deadline and --no-deadline are mutually exclusive"

                               :else
                               nil)]
      (cond
        (> (count selectors) 1)
        "only one of --id, --uuid, or --page is allowed"

        (and (seq page) (seq content))
        "--content and --page are mutually exclusive"

        (and (or (some? id) (seq uuid)) (seq content))
        "--content is only valid when creating a block task"

        (> (count target-selectors) 1)
        "only one of --target-id, --target-uuid, or --target-page is allowed"

        (and selector-mode? (or (seq target-selectors) (seq pos)))
        "--target-* and --pos are only valid when creating a block task with --content"

        (and (seq pos) (empty? target-selectors))
        "--pos is only valid when a target option is provided"

        (and (= pos "sibling") (seq (some-> (:target-page opts) string/trim)))
        "--pos sibling is only valid for block targets"

        (seq set-clear-conflict)
        set-clear-conflict

        (and (seq priority-text) (not (normalize-priority priority-text)))
        (invalid-priority-message priority-text)

        :else
        nil))

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
                                      {:allow-non-built-in? true})]
        (cond
          (not (:ok? create-result))
          create-result

          (not (:ok? update-tags-result))
          update-tags-result

          (not (:ok? update-properties-result))
          update-properties-result

          :else
          (-> create-result
              (update :action
                      (fn [action]
                        (-> action
                            (assoc :type :upsert-block
                                   :mode :create
                                   :update-tags (:value update-tags-result)
                                   :update-properties (:value update-properties-result)))))))))))

(defn build-page-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [id (:id options)
          page (some-> (:page options) string/trim)
          update-tags-result (add-command/parse-tags-option (:update-tags options))
          update-properties-result (add-command/parse-properties-option
                                    (:update-properties options)
                                    {:allow-non-built-in? true})
          remove-tags-result (add-command/parse-tags-vector-option (:remove-tags options))
          remove-properties-result (add-command/parse-properties-vector-option
                                    (:remove-properties options)
                                    {:allow-non-built-in? true})
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

(defn ^:large-vars/cleanup-todo build-task-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for upsert"}}
    (let [id (:id options)
          uuid (some-> (:uuid options) string/trim)
          page (some-> (:page options) string/trim)
          content (some-> (:content options) string/trim)
          status-provided? (contains? options :status)
          status-text (some-> (:status options) string/trim)
          status (when (seq status-text)
                   (add-command/normalize-status status-text))
          priority-provided? (contains? options :priority)
          priority-text (some-> (:priority options) string/trim)
          priority (when (seq priority-text)
                     (normalize-priority priority-text))
          scheduled-provided? (contains? options :scheduled)
          scheduled-text (some-> (:scheduled options) string/trim)
          deadline-provided? (contains? options :deadline)
          deadline-text (some-> (:deadline options) string/trim)
          clear-properties (cond-> []
                             (:no-status options) (conj :logseq.property/status)
                             (:no-priority options) (conj :logseq.property/priority)
                             (:no-scheduled options) (conj :logseq.property/scheduled)
                             (:no-deadline options) (conj :logseq.property/deadline))
          task-properties-input (cond-> {}
                                  status (assoc :logseq.property/status status)
                                  priority (assoc :logseq.property/priority priority)
                                  (seq scheduled-text) (assoc :logseq.property/scheduled scheduled-text)
                                  (seq deadline-text) (assoc :logseq.property/deadline deadline-text))
          task-properties-result (if (seq task-properties-input)
                                   (add-command/parse-properties-option (pr-str task-properties-input)
                                                                        {:allow-non-built-in? true})
                                   {:ok? true :value {}})
          mode (cond
                 (seq page) :page
                 (or (some? id) (seq uuid)) :update
                 :else :create)
          create-options (cond-> options
                           (seq (:target-page options))
                           (assoc :target-page-name (:target-page options))
                           true
                           (dissoc :target-page))
          create-result (when (= mode :create)
                          (add-command/build-add-block-action create-options [] repo))
          invalid-message (invalid-options? :upsert-task options)]
      (cond
        (seq invalid-message)
        {:ok? false
         :error {:code :invalid-options
                 :message invalid-message}}

        (and status-provided? (not (seq status-text)))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid status: " (:status options))}}

        (and priority-provided? (not priority))
        {:ok? false
         :error {:code :invalid-options
                 :message (invalid-priority-message (:priority options))}}

        (and scheduled-provided? (not (seq scheduled-text)))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid scheduled: " (:scheduled options))}}

        (and deadline-provided? (not (seq deadline-text)))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid deadline: " (:deadline options))}}

        (not (:ok? task-properties-result))
        task-properties-result

        (and (not (some? id)) (not (seq uuid)) (not (seq page)) (not (seq content)))
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}

        (and (= mode :create) (not (:ok? create-result)))
        create-result

        :else
        {:ok? true
         :action (cond-> (if (= mode :create)
                           (-> (:action create-result)
                               (assoc :type :upsert-task))
                           {:type :upsert-task
                            :repo repo
                            :graph (core/repo->graph repo)})
                   true (assoc :mode mode
                               :update-properties (:value task-properties-result)
                               :clear-properties (vec (distinct clear-properties)))
                   (some? id) (assoc :id id)
                   (seq uuid) (assoc :uuid uuid)
                   (seq page) (assoc :page page)
                   (seq status-text) (assoc :status-input status-text)
                   (and (seq content) (not= mode :page)) (assoc :content content))}))))

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

(def ^:private pull-tag-by-name add-command/pull-tag-by-name)
(def ^:private pull-property-by-name add-command/pull-property-by-name)

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
      (p/let [result (transport/invoke config :thread-api/apply-outliner-ops false
                                       [repo [[:create-page [page-name {}]]] {}])
              ;; create-page returns [title' page-uuid]; use uuid to find
              ;; the page since the stored name may differ from the input
              created (if-let [page-uuid (second result)]
                        (transport/invoke config :thread-api/pull false
                                          [repo [:db/id :block/uuid] [:block/uuid page-uuid]])
                        (pull-page-by-name config repo page-name [:db/id :block/uuid]))]
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
  (throw (ex-info (str "id must be a node tagged with #" entity-type)
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
      (throw-upsert-id-type-mismatch! "Page" id)

      :else
      entity)))

(defn- ensure-tag-by-id!
  [config repo id]
  (p/let [entity (pull-entity-by-id config repo tag-selector id)]
    (cond
      (not (:db/id entity))
      (throw-upsert-id-not-found! "tag" id)

      (not (tag-entity? entity))
      (throw-upsert-id-type-mismatch! "Tag" id)

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
      (throw-upsert-id-type-mismatch! "Property" id)

      :else
      entity)))

(def ^:private task-selector
  [:db/id :block/uuid :block/name :block/title])

(def ^:private task-tag-ident
  :logseq.class/Task)

(defn- normalize-lookup-uuid
  [value]
  (cond
    (uuid? value) value
    (and (string? value) (common-util/uuid-string? (string/trim value)))
    (uuid (string/trim value))
    :else nil))

(defn- pull-entity-by-uuid
  [config repo selector uuid-value]
  (when-let [uuid* (normalize-lookup-uuid uuid-value)]
    (transport/invoke config :thread-api/pull false
                      [repo selector [:block/uuid uuid*]])))

(defn- ensure-task-node!
  [config repo {:keys [id uuid]}]
  (p/let [entity (cond
                   (some? id)
                   (pull-entity-by-id config repo task-selector id)

                   (seq uuid)
                   (pull-entity-by-uuid config repo task-selector uuid)

                   :else
                   nil)]
    (if (:db/id entity)
      entity
      (throw (ex-info "node not found for selector"
                      {:code upsert-id-not-found-code
                       :id id
                       :uuid uuid})))))

(defn- ensure-task-tag-id!
  [config repo]
  (p/let [entity (transport/invoke config :thread-api/pull false
                                   [repo [:db/id] [:db/ident task-tag-ident]])]
    (if-let [tag-id (:db/id entity)]
      tag-id
      (throw (ex-info "task tag not found"
                      {:code :task-tag-not-found})))))

(defn- task-property-overrides
  [action]
  (cond-> {}
    (:status action) (assoc :logseq.property/status (:status action))
    (:priority action) (assoc :logseq.property/priority (:priority action))
    (:scheduled action) (assoc :logseq.property/scheduled (:scheduled action))
    (:deadline action) (assoc :logseq.property/deadline (:deadline action))))

(declare append-tag-and-property-ops)

(defn- execute-upsert-task-ops!
  [action cfg block-ids]
  (if (seq block-ids)
    (p/let [task-tag-id (ensure-task-tag-id! cfg (:repo action))
            update-properties (merge (or (:update-properties action) {})
                                     (task-property-overrides action))
            clear-properties (vec (distinct (or (:clear-properties action) [])))
            _ (ensure-property-identifiers-exist! cfg (:repo action) (keys update-properties))
            _ (ensure-property-identifiers-exist! cfg (:repo action) clear-properties)
            ops (append-tag-and-property-ops []
                                             block-ids
                                             {:update-tag-ids [task-tag-id]
                                              :update-properties update-properties
                                              :remove-properties clear-properties})]
      (when (seq ops)
        (transport/invoke cfg :thread-api/apply-outliner-ops false
                          [(:repo action) ops {}])))
    (p/resolved nil)))

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
            update-properties (add-command/resolve-properties
                               cfg (:repo action) (:update-properties action)
                               {:allow-non-built-in? true})
            update-property-idents (keys (or update-properties {}))
            _ (ensure-property-identifiers-exist! cfg (:repo action) update-property-idents)
            ops (append-tag-and-property-ops []
                                             block-ids
                                             {:update-tag-ids (->> update-tags (map :db/id) (remove nil?) distinct vec)
                                              :update-properties update-properties})]
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
              update-properties (add-command/resolve-properties cfg (:repo action) (:update-properties action)
                                                                {:allow-non-built-in? true})
              remove-properties (add-command/resolve-property-identifiers cfg (:repo action)
                                                                          (:remove-properties action)
                                                                          {:allow-non-built-in? true})
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

(defn- normalize-status-input
  [value]
  (when (some? value)
    (let [text (string/trim (if (string? value) value (str value)))]
      (when (seq text)
        text))))

(defn- resolve-task-status-action
  [action cfg]
  (let [status-input (or (normalize-status-input (:status-input action))
                         (normalize-status-input (:status action)))]
    (if (seq status-input)
      (p/let [available-statuses (transport/invoke cfg :thread-api/q false
                                                   [(:repo action)
                                                    [task-status-command/status-closed-values-query]])
              resolved-status (task-status-command/resolve-status-ident status-input available-statuses)]
        (if resolved-status
          {:ok? true
           :action (-> action
                       (assoc :status resolved-status)
                       (dissoc :status-input))}
          {:ok? false
           :error {:code :invalid-options
                   :message (task-status-command/invalid-status-message status-input available-statuses)}}))
      (p/resolved {:ok? true :action action}))))

(defn execute-upsert-task
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              status-check (resolve-task-status-action action cfg)]
        (if-not (:ok? status-check)
          {:status :error
           :error (:error status-check)}
          (let [action* (:action status-check)]
            (case (:mode action*)
              :create
              (p/let [result (add-command/execute-add-block (assoc action* :type :add-block) config)
                      created-ids (vec (or (get-in result [:data :result]) []))
                      _ (execute-upsert-task-ops! action* cfg created-ids)]
                {:status :ok
                 :data {:result created-ids}})

              :page
              (p/let [page (ensure-page-entity! cfg (:repo action*) (:page action*))
                      page-id (:db/id page)
                      _ (execute-upsert-task-ops! action* cfg [page-id])]
                {:status :ok
                 :data {:result [page-id]}})

              :update
              (p/let [entity (ensure-task-node! cfg (:repo action*) action*)
                      node-id (:db/id entity)
                      _ (execute-upsert-task-ops! action* cfg [node-id])]
                {:status :ok
                 :data {:result [node-id]}})

              {:status :error
               :error {:code :invalid-options
                       :message "invalid upsert task mode"}}))))
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
                           (pull-tag-by-name cfg (:repo action) target-name tag-selector))
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
          (p/let [existing (pull-tag-by-name cfg (:repo action) (:name action)
                                             [:db/id :block/name :block/title
                                              {:block/tags [:db/ident]}])
                  existing-id (:db/id existing)]
            (p/let [_ (when-not existing-id
                        (transport/invoke cfg :thread-api/apply-outliner-ops false
                                          [(:repo action)
                                           [[:create-page [(:name action) {:class? true}]]]
                                           {}]))
                    page (or (when existing-id existing)
                             (pull-tag-by-name cfg (:repo action) (:name action)
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
                 :data {:result [page-id]}})))))
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
          (p/let [existing (pull-property-by-name cfg (:repo action) (:name action) property-selector)
                  existing-id (:db/id existing)]
            (p/let [property-ident (when existing-id (:db/ident existing))
                    property-opts (cond-> {}
                                    (nil? property-ident)
                                    (assoc :property-name (:name action)))
                    _ (transport/invoke cfg :thread-api/apply-outliner-ops false
                                        [(:repo action)
                                         [[:upsert-property [property-ident
                                                             (:schema action)
                                                             property-opts]]]
                                         {}])
                    property (pull-property-by-name cfg (:repo action) (:name action) property-selector)
                    property-id (:db/id property)]
              (if property-id
                {:status :ok
                 :data {:result [property-id]}}
                {:status :error
                 :error {:code :property-not-found
                         :message "property not found after upsert"}})))))
      (p/catch (fn [e]
                 {:status :error
                  :error {:code (or (get-in (ex-data e) [:code]) :exception)
                          :message (or (ex-message e) (str e))}}))))
