(ns logseq.cli.command.remove
  "Remove-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private remove-block-spec
  {:block {:desc "Block UUID"}})

(def ^:private remove-page-spec
  {:page {:desc "Page name"}})

(def entries
  [(core/command-entry ["remove" "block"] :remove-block "Remove block" remove-block-spec)
   (core/command-entry ["remove" "page"] :remove-page "Remove page" remove-page-spec)])

(defn- perform-remove
  [config {:keys [repo block page]}]
  (cond
    (seq block)
    (if-not (common-util/uuid-string? block)
      (p/rejected (ex-info "block must be a uuid" {:code :invalid-block}))
      (p/let [entity (transport/invoke config :thread-api/pull false
                                       [repo [:db/id :block/uuid] [:block/uuid (uuid block)]])]
        (if-let [id (:db/id entity)]
          (transport/invoke config :thread-api/apply-outliner-ops false
                            [repo [[:delete-blocks [[id] {}]]] {}])
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

(defn build-remove-block-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for remove"}}
    (let [block (some-> (:block options) string/trim)]
      (if (seq block)
        {:ok? true
         :action {:type :remove-block
                  :repo repo
                  :block block}}
        {:ok? false
         :error {:code :missing-target
                 :message "block is required"}}))))

(defn build-remove-page-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for remove"}}
    (let [page (some-> (:page options) string/trim)]
      (if (seq page)
        {:ok? true
         :action {:type :remove-page
                  :repo repo
                  :page page}}
        {:ok? false
         :error {:code :missing-target
                 :message "page is required"}}))))

(defn execute-remove
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              result (perform-remove cfg action)]
        {:status :ok
         :data {:result result}})))
