(ns logseq.cli.command.query
  "Query-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.common.util :as common-util]
            [promesa.core :as p]))

(def ^:private query-spec
  {:query {:desc "Datascript query EDN"}
   :inputs {:desc "EDN vector of query inputs"}})

(def entries
  [(core/command-entry ["query"] :query "Run a Datascript query" query-spec)])

(defn- parse-edn
  [label value]
  (let [parsed (common-util/safe-read-string {:log-error? false} value)]
    (if (nil? parsed)
      {:ok? false
       :error {:code :invalid-options
               :message (str "invalid " label " edn")}}
      {:ok? true :value parsed})))

(defn build-action
  [options repo]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for query"}}
    (let [query-text (some-> (:query options) string/trim)]
      (if-not (seq query-text)
        {:ok? false
         :error {:code :missing-query
                 :message "query is required"}}
        (let [query-result (parse-edn "query" query-text)]
          (if-not (:ok? query-result)
            query-result
            (let [inputs-text (some-> (:inputs options) string/trim)
                  inputs-result (when (seq inputs-text)
                                  (parse-edn "inputs" inputs-text))]
              (cond
                (and inputs-result (not (:ok? inputs-result)))
                inputs-result

                (and inputs-result (not (vector? (:value inputs-result))))
                {:ok? false
                 :error {:code :invalid-options
                         :message "inputs must be a vector"}}

                :else
                {:ok? true
                 :action {:type :query
                          :repo repo
                          :graph (core/repo->graph repo)
                          :query (:value query-result)
                          :inputs (or (:value inputs-result) [])}}))))))))

(defn execute-query
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              args (into [(:query action)] (:inputs action))
              results (transport/invoke cfg :thread-api/q false [(:repo action) args])]
        {:status :ok
         :data {:result results}})))
