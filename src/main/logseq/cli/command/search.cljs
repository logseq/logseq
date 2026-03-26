(ns logseq.cli.command.search
  "Search-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [promesa.core :as p]))

(def entries
  [(core/command-entry ["search" "block"] :search-block "Search blocks by title" {}
                       {:examples ["logseq search block task --graph my-graph"]})
   (core/command-entry ["search" "page"] :search-page "Search pages by name" {}
                       {:examples ["logseq search page home --graph my-graph"]})
   (core/command-entry ["search" "property"] :search-property "Search properties by title" {}
                       {:examples ["logseq search property owner --graph my-graph"]})
   (core/command-entry ["search" "tag"] :search-tag "Search tags by title" {}
                       {:examples ["logseq search tag quote --graph my-graph"]})])

(defn- normalize-query
  [args]
  (->> (or args [])
       (map str)
       (string/join " ")
       string/trim))

;; `search` accepts a free-form positional query, so a trailing `--graph/-g`
;; can end up in command args and must be stripped here.
;; Other global flags are not stripped in this function. In particular,
;; `--profile` is intentionally handled in `logseq.cli.main` from raw argv so
;; profiling can include parse-time stages.
(defn- extract-inline-graph
  [args]
  (loop [remaining (vec (or args []))
         cleaned []
         graph nil]
    (if (empty? remaining)
      {:args cleaned
       :graph graph}
      (let [token (first remaining)
            next-token (second remaining)]
        (if (and (#{"--graph" "-g"} token)
                 (some? next-token))
          (recur (vec (drop 2 remaining)) cleaned next-token)
          (recur (vec (rest remaining)) (conj cleaned token) graph))))))

(defn build-action
  [command args repo]
  (let [{:keys [args graph]} (extract-inline-graph args)
        repo (or (core/resolve-repo graph) repo)
        query (normalize-query args)]
    (cond
      (not (seq repo))
      {:ok? false
       :error {:code :missing-repo
               :message "repo is required for search"}}

      (not (seq query))
      {:ok? false
       :error {:code :missing-query-text
               :message "query text is required"}}

      :else
      {:ok? true
       :action {:type command
                :repo repo
                :graph (core/repo->graph repo)
                :query query}})))

(def ^:private search-block-query
  '[:find [(pull ?e [:db/id :db/ident :block/title]) ...]
    :in $ ?query
    :where
    [?e :block/title ?title]
    [(clojure.string/lower-case ?title) ?title-lower]
    [(clojure.string/lower-case ?query) ?query-lower]
    [(clojure.string/includes? ?title-lower ?query-lower)]])

(def ^:private search-page-query
  '[:find [(pull ?e [:db/id :db/ident :block/title]) ...]
    :in $ ?query
    :where
    [?e :block/name ?name]
    [(clojure.string/lower-case ?name) ?name-lower]
    [(clojure.string/lower-case ?query) ?query-lower]
    [(clojure.string/includes? ?name-lower ?query-lower)]])

(def ^:private search-property-query
  '[:find [(pull ?e [:db/id :db/ident :block/title]) ...]
    :in $ ?query
    :where
    [?e :block/tags :logseq.class/Property]
    [?e :block/title ?title]
    [(clojure.string/lower-case ?title) ?title-lower]
    [(clojure.string/lower-case ?query) ?query-lower]
    [(clojure.string/includes? ?title-lower ?query-lower)]])

(def ^:private search-tag-query
  '[:find [(pull ?e [:db/id :db/ident :block/title]) ...]
    :in $ ?query
    :where
    [?e :block/tags :logseq.class/Tag]
    [?e :block/title ?title]
    [(clojure.string/lower-case ?title) ?title-lower]
    [(clojure.string/lower-case ?query) ?query-lower]
    [(clojure.string/includes? ?title-lower ?query-lower)]])

(defn- query-by-command
  [command]
  (case command
    :search-block search-block-query
    :search-page search-page-query
    :search-property search-property-query
    :search-tag search-tag-query
    nil))

(defn- sort-items
  [items]
  (->> items
       (sort-by (juxt (fn [item]
                        (some-> (:block/title item) string/lower-case))
                      :db/id))
       vec))

(defn- normalize-items
  [items]
  (->> (or items [])
       (filter map?)
       (map #(select-keys % [:db/id :db/ident :block/title]))
       sort-items))

(defn- execute-search
  [action config]
  (-> (p/let [cfg (cli-server/ensure-server! config (:repo action))
              query (query-by-command (:type action))
              result (transport/invoke cfg :thread-api/q false
                                       [(:repo action) [query (:query action)]])]
        {:status :ok
         :data {:items (normalize-items result)}})))

(defn execute-search-block
  [action config]
  (execute-search action config))

(defn execute-search-page
  [action config]
  (execute-search action config))

(defn execute-search-property
  [action config]
  (execute-search action config))

(defn execute-search-tag
  [action config]
  (execute-search action config))
