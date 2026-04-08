(ns logseq.cli.command.search
  "Search-related CLI commands."
  (:require [clojure.string :as string]
            [logseq.cli.command.core :as core]
            [logseq.cli.server :as cli-server]
            [logseq.cli.transport :as transport]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(def ^:private search-spec
  {:content {:alias :c
             :desc "Search content text"}})

(def entries
  [(core/command-entry ["search" "block"] :search-block "Search blocks by title" search-spec
                       {:examples ["logseq search block --content \"task\" --graph my-graph"]})
   (core/command-entry ["search" "page"] :search-page "Search pages by name" search-spec
                       {:examples ["logseq search page --content \"home\" --graph my-graph"]})
   (core/command-entry ["search" "property"] :search-property "Search properties by title" search-spec
                       {:examples ["logseq search property --content \"owner\" --graph my-graph"]})
   (core/command-entry ["search" "tag"] :search-tag "Search tags by title" search-spec
                       {:examples ["logseq search tag --content \"quote\" --graph my-graph"]})])

(defn build-action
  [command opts repo]
  (let [query (some-> (:content opts) str string/trim)]
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
  ;; The recursive `{:block/parent ...}` pull lets `ldb/recycled?` walk up to
  ;; the containing page so blocks on a recycled page are filtered too — a
  ;; recycled page has `:logseq.property/deleted-at` set on itself, which the
  ;; parent walk lands on.
  '[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/deleted-at
                     {:block/parent ...}]) ...]
    :in $ ?query
    :where
    [?e :block/title ?title]
    [(clojure.string/lower-case ?title) ?title-lower]
    [(clojure.string/lower-case ?query) ?query-lower]
    [(clojure.string/includes? ?title-lower ?query-lower)]])

(def ^:private search-page-query
  '[:find [(pull ?e [:db/id :db/ident :block/title :logseq.property/deleted-at]) ...]
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
                                       [(:repo action) [query (:query action)]])
              ;; Hide recycled entries so search doesn't surface entries that
              ;; `remove page` / `remove block` already soft-deleted. Tag and
              ;; property pages are hard-retracted in `outliner-page/delete!`,
              ;; so the recycle filter only applies to page and block search.
              filtered (cond->> (or result [])
                         (#{:search-page :search-block} (:type action))
                         (remove ldb/recycled?))]
        {:status :ok
         :data {:items (normalize-items filtered)}})))

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
