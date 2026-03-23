(ns logseq.cli.command.update
  "Update-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.add :as add-command]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private update-positions
  #{"first-child" "last-child" "sibling"})

(defn invalid-options?
  [opts]
  (let [pos (some-> (:pos opts) string/trim string/lower-case)
        source-selectors (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])
        target-selectors (filter some? [(:target-id opts)
                                        (:target-uuid opts)
                                        (some-> (:target-page opts) string/trim)])
        has-update-tags? (seq (some-> (:update-tags opts) string/trim))
        has-update-properties? (seq (some-> (:update-properties opts) string/trim))
        has-remove-tags? (seq (some-> (:remove-tags opts) string/trim))
        has-remove-properties? (seq (some-> (:remove-properties opts) string/trim))
        has-status? (seq (some-> (:status opts) string/trim))
        has-content? (contains? opts :content)
        has-updates? (or has-update-tags?
                         has-update-properties?
                         has-remove-tags?
                         has-remove-properties?
                         has-status?
                         has-content?)]
    (cond
      (and (seq pos) (not (contains? update-positions pos)))
      (str "invalid pos: " (:pos opts))

      (> (count source-selectors) 1)
      "only one of --id or --uuid is allowed"

      (> (count target-selectors) 1)
      "only one of --target-id, --target-uuid, or --target-page is allowed"

      (and (= pos "sibling") (seq (some-> (:target-page opts) string/trim)))
      "--pos sibling is only valid for block targets"

      (and (seq pos) (empty? target-selectors))
      "--pos is only for adding which requires a target option"

      (and (empty? target-selectors) (not has-updates?))
      "target or update/remove options are required"

      :else
      nil)))

(def ^:private block-selector
  [:db/id :block/uuid :block/name :block/title])

(defn- fetch-entity-by-uuid
  [config repo uuid-str]
  (p/let [entity (transport/invoke config :thread-api/pull false
                                   [repo block-selector [:block/uuid (uuid uuid-str)]])]
    (if (:db/id entity)
      entity
      (transport/invoke config :thread-api/pull false
                        [repo block-selector [:block/uuid uuid-str]]))))

(defn- ensure-non-page
  [entity message code]
  (if (:block/name entity)
    (throw (ex-info message {:code code}))
    entity))

(defn- resolve-source
  [config repo {:keys [id uuid]}]
  (cond
    (some? id)
    (p/let [entity (transport/invoke config :thread-api/pull false
                                     [repo block-selector id])]
      (if (:db/id entity)
        (ensure-non-page entity "source must be a non-page block" :invalid-source)
        (throw (ex-info "source block not found" {:code :source-not-found}))))

    (seq uuid)
    (p/let [entity (fetch-entity-by-uuid config repo uuid)]
      (if (:db/id entity)
        (ensure-non-page entity "source must be a non-page block" :invalid-source)
        (throw (ex-info "source block not found" {:code :source-not-found}))))

    :else
    (p/rejected (ex-info "source is required" {:code :missing-source}))))

(defn- resolve-target
  [config repo {:keys [target-id target-uuid target-page]}]
  (cond
    (some? target-id)
    (p/let [entity (transport/invoke config :thread-api/pull false
                                     [repo block-selector target-id])]
      (if (:db/id entity)
        (ensure-non-page entity "target must be a block" :invalid-target)
        (throw (ex-info "target block not found" {:code :target-not-found}))))

    (seq target-uuid)
    (p/let [entity (fetch-entity-by-uuid config repo target-uuid)]
      (if (:db/id entity)
        (ensure-non-page entity "target must be a block" :invalid-target)
        (throw (ex-info "target block not found" {:code :target-not-found}))))

    (seq target-page)
    (let [page-name (common-util/page-name-sanity-lc target-page)]
      (p/let [entity (transport/invoke config :thread-api/pull false
                                       [repo [:db/id :block/uuid :block/name :block/title]
                                        [:block/name page-name]])]
        (if (:db/id entity)
          entity
          (throw (ex-info "page not found" {:code :page-not-found})))))

    :else
    (p/rejected (ex-info "target is required" {:code :missing-target}))))

;; Position mapping for move-blocks opts.
(defn- pos->opts
  [pos]
  (case pos
    "last-child" {:sibling? false :bottom? true}
    "sibling" {:sibling? true}
    {:sibling? false}))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for update"}}
    (let [id (:id options)
          uuid (some-> (:uuid options) string/trim)
          target-id (:target-id options)
          target-uuid (some-> (:target-uuid options) string/trim)
          page-name (some-> (:target-page options) string/trim)
          pos (some-> (:pos options) string/trim string/lower-case)
          status-provided? (contains? options :status)
          status-text (some-> (:status options) string/trim)
          status (when (seq status-text)
                   (add-command/normalize-status status-text))
          content-provided? (contains? options :content)
          content (:content options)
          update-tags-result (add-command/parse-tags-option (:update-tags options))
          update-properties-result (add-command/parse-properties-option
                                    (:update-properties options)
                                    {:allow-non-built-in? true})
          remove-tags-result (add-command/parse-tags-vector-option (:remove-tags options))
          remove-properties-result (add-command/parse-properties-vector-option
                                    (:remove-properties options)
                                    {:allow-non-built-in? true})
          update-tags (:value update-tags-result)
          update-properties (:value update-properties-result)
          update-properties (merge (cond-> {}
                                     status
                                     (assoc :logseq.property/status status))
                                   (or update-properties {}))
          remove-tags (:value remove-tags-result)
          remove-properties (:value remove-properties-result)
          has-target? (or (some? target-id) (seq target-uuid) (seq page-name))
          has-updates? (or (seq update-tags)
                           (seq update-properties)
                           (seq remove-tags)
                           (seq remove-properties)
                           status-provided?
                           content-provided?)
          source-label (cond
                         (seq uuid) uuid
                         (some? id) (str id)
                         :else nil)
          target-label (cond
                         (seq page-name) (str "page:" page-name)
                         (seq target-uuid) target-uuid
                         (some? target-id) (str target-id)
                         :else nil)]
      (cond
        (not (or (some? id) (seq uuid)))
        {:ok? false
         :error {:code :missing-source
                 :message "source block is required"}}

        (and status-provided? (not status))
        {:ok? false
         :error {:code :invalid-options
                 :message (str "invalid status: " (:status options))}}

        (not (:ok? update-tags-result))
        update-tags-result

        (not (:ok? update-properties-result))
        update-properties-result

        (not (:ok? remove-tags-result))
        remove-tags-result

        (not (:ok? remove-properties-result))
        remove-properties-result

        (and (not has-target?) (not has-updates?))
        {:ok? false
         :error {:code :invalid-options
                 :message "target or update/remove options are required"}}

        :else
        {:ok? true
         :action (cond-> {:type :update-block
                          :repo repo
                          :graph (core/repo->graph repo)
                          :id id
                          :uuid uuid
                          :target-id target-id
                          :target-uuid target-uuid
                          :target-page page-name
                          :pos (when has-target? (or pos "first-child"))
                          :update-tags update-tags
                          :update-properties update-properties
                          :remove-tags remove-tags
                          :remove-properties remove-properties
                          :source source-label
                          :target target-label}
                   content-provided? (assoc :content content))}))))

(defn execute-update
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              source (resolve-source cfg (:repo action) action)
              target (when (or (:target-id action)
                               (:target-uuid action)
                               (seq (:target-page action)))
                       (resolve-target cfg (:repo action) action))
              opts (when target (pos->opts (:pos action)))
              update-tags (add-command/resolve-tags cfg (:repo action) (:update-tags action))
              remove-tags (add-command/resolve-tags cfg (:repo action) (:remove-tags action))
              update-properties (add-command/resolve-properties
                                 cfg (:repo action) (:update-properties action)
                                 {:allow-non-built-in? true})
              remove-properties (add-command/resolve-property-identifiers
                                 cfg (:repo action) (:remove-properties action)
                                 {:allow-non-built-in? true})
              block-id (:db/id source)
              block-ids [block-id]
              content-provided? (contains? action :content)
              content (:content action)
              update-tag-ids (when (seq update-tags)
                               (->> update-tags (map :db/id) (remove nil?) vec))
              remove-tag-ids (when (seq remove-tags)
                               (->> remove-tags (map :db/id) (remove nil?) vec))
              ops (cond-> []
                    content-provided?
                    (conj [:save-block [{:db/id block-id :block/title content} {}]])
                    target
                    (conj [:move-blocks [[(:db/id source)] (:db/id target) opts]]))
              ops (cond-> ops
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
                               update-properties)))
              result (if (seq ops)
                       (transport/invoke cfg :thread-api/apply-outliner-ops false
                                         [(:repo action) ops {}])
                       (p/resolved nil))]
        {:status :ok
         :data {:result result}})))
