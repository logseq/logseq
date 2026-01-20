(ns logseq.cli.command.move
  "Move-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private move-spec
  {:id {:desc "Source block db/id"
        :coerce :long}
   :uuid {:desc "Source block UUID"}
   :target-id {:desc "Target block db/id"
               :coerce :long}
   :target-uuid {:desc "Target block UUID"}
   :target-page-name {:desc "Target page name"}
   :pos {:desc "Position (first-child, last-child, sibling)"}})

(def entries
  [(core/command-entry ["move"] :move-block "Move block" move-spec)])

(def ^:private move-positions
  #{"first-child" "last-child" "sibling"})

(defn invalid-options?
  [opts]
  (let [pos (some-> (:pos opts) string/trim string/lower-case)
        source-selectors (filter some? [(:id opts) (some-> (:uuid opts) string/trim)])
        target-selectors (filter some? [(:target-id opts)
                                        (:target-uuid opts)
                                        (some-> (:target-page-name opts) string/trim)])]
    (cond
      (and (seq pos) (not (contains? move-positions pos)))
      (str "invalid pos: " (:pos opts))

      (> (count source-selectors) 1)
      "only one of --id or --uuid is allowed"

      (> (count target-selectors) 1)
      "only one of --target-id, --target-uuid, or --target-page-name is allowed"

      (and (= pos "sibling") (seq (some-> (:target-page-name opts) string/trim)))
      "--pos sibling is only valid for block targets"

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
    (if-not (common-util/uuid-string? uuid)
      (p/rejected (ex-info "source must be a uuid" {:code :invalid-source}))
      (p/let [entity (fetch-entity-by-uuid config repo uuid)]
        (if (:db/id entity)
          (ensure-non-page entity "source must be a non-page block" :invalid-source)
          (throw (ex-info "source block not found" {:code :source-not-found})))))

    :else
    (p/rejected (ex-info "source is required" {:code :missing-source}))))

(defn- resolve-target
  [config repo {:keys [target-id target-uuid target-page-name]}]
  (cond
    (some? target-id)
    (p/let [entity (transport/invoke config :thread-api/pull false
                                     [repo block-selector target-id])]
      (if (:db/id entity)
        (ensure-non-page entity "target must be a block" :invalid-target)
        (throw (ex-info "target block not found" {:code :target-not-found}))))

    (seq target-uuid)
    (if-not (common-util/uuid-string? target-uuid)
      (p/rejected (ex-info "target must be a uuid" {:code :invalid-target}))
      (p/let [entity (fetch-entity-by-uuid config repo target-uuid)]
        (if (:db/id entity)
          (ensure-non-page entity "target must be a block" :invalid-target)
          (throw (ex-info "target block not found" {:code :target-not-found})))))

    (seq target-page-name)
    (p/let [entity (transport/invoke config :thread-api/pull false
                                     [repo [:db/id :block/uuid :block/name :block/title]
                                      [:block/name target-page-name]])]
      (if (:db/id entity)
        entity
        (throw (ex-info "page not found" {:code :page-not-found}))))

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
             :message "repo is required for move"}}
    (let [id (:id options)
          uuid (some-> (:uuid options) string/trim)
          target-id (:target-id options)
          target-uuid (some-> (:target-uuid options) string/trim)
          page-name (some-> (:target-page-name options) string/trim)
          pos (some-> (:pos options) string/trim string/lower-case)
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

        (not (or (some? target-id) (seq target-uuid) (seq page-name)))
        {:ok? false
         :error {:code :missing-target
                 :message "target is required"}}

        :else
        {:ok? true
         :action {:type :move-block
                  :repo repo
                  :graph (core/repo->graph repo)
                  :id id
                  :uuid uuid
                  :target-id target-id
                  :target-uuid target-uuid
                  :target-page-name page-name
                  :pos (or pos "first-child")
                  :source source-label
                  :target target-label}}))))

(defn execute-move
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              source (resolve-source cfg (:repo action) action)
              target (resolve-target cfg (:repo action) action)
              opts (pos->opts (:pos action))
              ops [[:move-blocks [[(:db/id source)] (:db/id target) opts]]]
              result (transport/invoke cfg :thread-api/apply-outliner-ops false
                                       [(:repo action) ops {}])]
        {:status :ok
         :data {:result result}})))
