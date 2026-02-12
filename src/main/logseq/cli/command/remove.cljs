(ns logseq.cli.command.remove
  "Remove-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.command.id :as id-command]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private remove-spec
  {:id {:desc "Block db/id or EDN vector of ids"}
   :uuid {:desc "Block UUID"}
   :page {:desc "Page name"}})

(def entries
  [(core/command-entry ["remove"] :remove "Remove blocks or pages" remove-spec)])

(defn invalid-options?
  [opts]
  (let [id-result (id-command/parse-id-option (:id opts))]
    (cond
      (and (some? (:id opts)) (not (:ok? id-result)))
      (:message id-result)

      :else
      nil)))

(def ^:private block-id-selector
  [:db/id :block/uuid])

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

(defn- perform-remove
  [config {:keys [repo ids multi-id? uuid page]}]
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

    (seq page)
    (p/let [entity (transport/invoke config :thread-api/pull false
                                     [repo [:db/id :block/uuid] [:block/name page]])]
      (if-let [page-uuid (:block/uuid entity)]
        (transport/invoke config :thread-api/apply-outliner-ops false
                          [repo [[:delete-page [page-uuid]]] {}])
        (throw (ex-info "page not found" {:code :page-not-found}))))

    :else
    (p/rejected (ex-info "block or page required" {:code :missing-target}))))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for remove"}}
    (let [id-result (id-command/parse-id-option (:id options))
          ids (:value id-result)
          multi-id? (:multi? id-result)
          uuid (some-> (:uuid options) string/trim)
          page (some-> (:page options) string/trim)
          selectors (filter some? [(:id options) uuid page])]
      (cond
        (empty? selectors)
        {:ok? false
         :error {:code :missing-target
                 :message "block or page is required"}}

        (> (count selectors) 1)
        {:ok? false
         :error {:code :invalid-options
                 :message "only one of --id, --uuid, or --page is allowed"}}

        (and (some? (:id options)) (not (:ok? id-result)))
        {:ok? false
         :error {:code :invalid-options
                 :message (:message id-result)}}

        :else
        {:ok? true
         :action {:type :remove
                  :repo repo
                  :id (when (and (seq ids) (not multi-id?)) (first ids))
                  :ids ids
                  :multi-id? multi-id?
                  :uuid uuid
                  :page page}}))))

(defn execute-remove
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              result (perform-remove cfg action)]
        {:status :ok
         :data (cond-> {:result result}
                 (map? result) (merge (dissoc result :result)))})))
