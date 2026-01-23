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
   :name {:desc "Query name from cli.edn custom-queries or built-ins"}
   :inputs {:desc "EDN vector of query inputs"}})

(def ^:private query-list-spec
  {})

(def entries
  [(core/command-entry ["query"] :query "Run a Datascript query" query-spec)
   (core/command-entry ["query" "list"] :query-list "List available queries" query-list-spec)])

(def ^:private built-in-query-specs
  {"block-search"
   {:doc "Find blocks by title substring (case-insensitive)."
    :inputs ["search-title"]
    :query '[:find [?e ...]
             :in $ ?search-title
             :where
             [?e :block/title ?title]
             [(clojure.string/lower-case ?title) ?title-lower-case]
             [(clojure.string/lower-case ?search-title) ?search-title-lower-case]
             [(clojure.string/includes? ?title-lower-case ?search-title-lower-case)]]}

   "task-search"
   {:doc "Find tasks by status, optional title substring, optional recent-days."
    :inputs [{:name "search-status"}
             {:name "?search-title" :default ""}
             {:name "?recent-days" :default 0}
             {:name "?now-ms" :default :now-ms}]
    :query '[:find [?e ...]
             :in $ ?search-status ?search-title ?recent-days ?now-ms
             :where
             [?e :block/title ?title]
             [?e :logseq.property/status ?status]
             [?status :db/ident ?status-ident]
             [(= ?status-ident ?search-status)]
             [(clojure.string/lower-case ?title) ?title-lower-case]
             [(str ?search-title) ?search-title-string]
             [(clojure.string/lower-case ?search-title-string) ?search-title-lower-case]
             [(clojure.string/includes? ?title-lower-case ?search-title-lower-case)]
             [(get-else $ ?e :block/updated-at 0) ?updated-at]
             (or-join [?recent-days ?updated-at ?now-ms ?days-ago]
                      (and [(nil? ?recent-days)]
                           [(identity 0) ?days-ago])
                      (and [(<= ?recent-days 0)]
                           [(identity 0) ?days-ago])
                      (and [(* ?recent-days 86400000) ?recent-days-ms]
                           [(- ?now-ms ?recent-days-ms) ?days-ago]
                           [(>= ?updated-at ?days-ago)]))]}})

(defn- parse-edn
  [label value]
  (let [parsed (common-util/safe-read-string {:log-error? false} value)]
    (if (nil? parsed)
      {:ok? false
       :error {:code :invalid-options
               :message (str "invalid " label " edn")}}
      {:ok? true :value parsed})))

(defn- normalize-query-name
  [name]
  (when (some? name)
    (let [raw (if (keyword? name) (name name) (str name))
          text (string/trim raw)]
      (when (seq text) text))))

(defn- normalize-query-entry
  [name source spec]
  (let [spec (cond
               (vector? spec) {:query spec}
               (map? spec) spec
               :else nil)
        query (:query spec)
        name (normalize-query-name name)]
    (when (and name query)
      (cond-> (assoc spec :name name :source source)
        (nil? (:inputs spec)) (assoc :inputs [])))))

(defn- hide-internal-inputs
  [entry]
  (let [inputs (vec (remove (fn [input]
                              (let [name (cond
                                           (string? (:name input)) (:name input)
                                           (keyword? (:name input)) (name (:name input))
                                           :else nil)]
                                (= "?now-ms" name)))
                            (or (:inputs entry) [])))]
    (assoc entry :inputs inputs)))

(defn list-queries
  [config]
  (let [built-ins (mapv (fn [[name spec]]
                          (normalize-query-entry name :built-in spec))
                        built-in-query-specs)
        custom-queries (or (:custom-queries config) {})
        customs (mapv (fn [[name spec]]
                        (normalize-query-entry name :custom spec))
                      custom-queries)
        merged (reduce (fn [acc entry]
                         (if entry
                           (assoc acc (:name entry) entry)
                           acc))
                       {}
                       (concat built-ins customs))]
    (->> (vals merged)
         (sort-by :name)
         vec)))

(defn- find-query
  [config name]
  (some #(when (= name (:name %)) %) (list-queries config)))

(defn- optional-input?
  [input]
  (let [name (cond
               (string? input) input
               (keyword? input) (name input)
               (map? input) (some-> (:name input) str)
               :else nil)]
    (and (string? name) (string/starts-with? name "?"))))

(defn- input-default
  [input]
  (when (map? input)
    (if (contains? input :default)
      (let [value (:default input)]
        (if (= :now-ms value)
          (js/Date.now)
          value))
      nil)))

(defn- normalize-named-inputs
  [entry inputs]
  (let [spec-inputs (or (:inputs entry) [])
        required-count (count (remove optional-input? spec-inputs))
        inputs (or inputs [])]
    (if (< (count inputs) required-count)
      {:ok? false
       :error {:code :invalid-options
               :message "inputs missing required values"}}
      {:ok? true
       :value (if (< (count inputs) (count spec-inputs))
                (let [missing (subvec (vec spec-inputs) (count inputs))]
                  (into (vec inputs) (map input-default missing)))
                inputs)})))

(defn- normalize-task-search-inputs
  [entry inputs]
  (if (and entry (= "task-search" (:name entry)) (seq inputs))
    (let [status (first inputs)
          normalized (cond
                       (keyword? status) status
                       (string? status) (let [text (string/trim status)]
                                          (if (seq text)
                                            (keyword "logseq.property"
                                                     (str "status." (string/lower-case text)))
                                            status))
                       :else status)]
      (assoc (vec inputs) 0 normalized))
    inputs))

(defn build-action
  [options repo config]
  (if-not (seq repo)
    {:ok? false
     :error {:code :missing-repo
             :message "repo is required for query"}}
    (let [query-text (some-> (:query options) string/trim)
          query-name (normalize-query-name (:name options))]
      (cond
        (and (seq query-text) (seq query-name))
        {:ok? false
         :error {:code :invalid-options
                 :message "use either --query or --name, not both"}}

        (and (not (seq query-text)) (not (seq query-name)))
        {:ok? false
         :error {:code :missing-query
                 :message "query is required"}}

        :else
        (let [query-result (if (seq query-text)
                             (parse-edn "query" query-text)
                             (if-let [entry (find-query config query-name)]
                               {:ok? true :value (:query entry) :entry entry}
                               {:ok? false
                                :error {:code :unknown-query
                                        :message (str "unknown query: " query-name)}}))]
          (if-not (:ok? query-result)
            query-result
            (let [inputs-text (some-> (:inputs options) string/trim)
                  inputs-result (when (seq inputs-text)
                                  (parse-edn "inputs" inputs-text))
                  named-inputs (when-let [entry (:entry query-result)]
                                 (normalize-named-inputs entry (or (:value inputs-result) [])))]
              (cond
                (and inputs-result (not (:ok? inputs-result)))
                inputs-result

                (and named-inputs (not (:ok? named-inputs)))
                named-inputs

                (and inputs-result (not (vector? (:value inputs-result))))
                {:ok? false
                 :error {:code :invalid-options
                         :message "inputs must be a vector"}}

                :else
                (let [inputs (normalize-task-search-inputs
                              (:entry query-result)
                              (or (:value named-inputs)
                                  (:value inputs-result)
                                  []))]
                  {:ok? true
                   :action {:type :query
                            :repo repo
                            :graph (core/repo->graph repo)
                            :query (:value query-result)
                            :inputs inputs}})))))))))

(defn build-list-action
  [_options _repo]
  {:ok? true
   :action {:type :query-list}})

(defn execute-query
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              args (into [(:query action)] (:inputs action))
              results (transport/invoke cfg :thread-api/q false [(:repo action) args])]
        {:status :ok
         :data {:result results}})))

(defn execute-query-list
  [_action config]
  (p/resolved {:status :ok
               :data {:queries (mapv hide-internal-inputs (list-queries config))}}))
