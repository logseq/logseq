(ns logseq.cli.command.debug
  "Debug-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private debug-pull-spec
  {:id {:desc "Entity db/id"
        :coerce :long}
   :uuid {:desc "Entity UUID"
          :validate {:pred (comp parse-uuid str)
                     :ex-msg (constantly "Option uuid must be a valid UUID string")}}
   :ident {:desc "Entity db/ident as strict EDN keyword"}})

(def entries
  [(core/command-entry ["debug" "pull"]
                       :debug-pull
                       "Pull raw entity by id, uuid, or ident"
                       debug-pull-spec
                       {:examples ["logseq debug pull --graph my-graph --id 123"
                                   "logseq debug pull --graph my-graph --uuid 11111111-1111-1111-1111-111111111111"
                                   "logseq debug pull --graph my-graph --ident :logseq.class/Tag"]})])

(defn- parse-ident-option
  [value]
  (let [text (some-> value str string/trim)
        parsed (when (seq text)
                 (common-util/safe-read-string {:log-error? false} text))]
    (if (keyword? parsed)
      {:ok? true :value parsed}
      {:ok? false
       :error {:code :invalid-options
               :message "ident must be a strict EDN keyword (e.g. :logseq.class/Tag)"}})))

(defn invalid-options?
  [opts]
  (let [selectors (filter some? [(:id opts)
                                 (some-> (:uuid opts) string/trim seq)
                                 (some-> (:ident opts) str string/trim seq)])
        ident-text (some-> (:ident opts) str string/trim)
        ident-result (when (seq ident-text)
                       (parse-ident-option ident-text))]
    (cond
      (empty? selectors)
      "exactly one of --id, --uuid, or --ident is required"

      (> (count selectors) 1)
      "only one of --id, --uuid, or --ident is allowed"

      (and ident-result (not (:ok? ident-result)))
      (get-in ident-result [:error :message])

      :else
      nil)))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for debug pull"}}
    (let [uuid-text (some-> (:uuid options) string/trim)
          ident-text (some-> (:ident options) str string/trim)
          ident-result (when (seq ident-text)
                         (parse-ident-option ident-text))]
      (cond
        (and ident-result (not (:ok? ident-result)))
        ident-result

        :else
        {:ok? true
         :action {:type :debug-pull
                  :repo repo
                  :graph (core/repo->graph repo)
                  :lookup (cond
                            (some? (:id options)) (:id options)
                            (seq uuid-text) [:block/uuid (uuid uuid-text)]
                            (seq ident-text) [:db/ident (:value ident-result)]
                            :else nil)
                  :selector '[*]}}))))

(defn execute-debug-pull
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              entity (transport/invoke cfg :thread-api/pull
                                       [(:repo action) (:selector action) (:lookup action)])]
        (if (some? entity)
          {:status :ok
           :data {:entity entity
                  :lookup (:lookup action)
                  :selector (:selector action)}}
          {:status :error
           :error {:code :entity-not-found
                   :message "entity not found"}}))))
