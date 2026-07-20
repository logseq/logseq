(ns logseq.api.db
  "DB APIs"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [frontend.db.async :as db-async]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (p/let [result (query-dsl/query repo query-string)]
      (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result))))))

(defn datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (p/let [current-page-title (when-let [name-or-uuid (state/get-current-page)]
                                 (p/let [page (db-async/<get-block repo name-or-uuid {:children? false})]
                                   (:block/title page)))
            today-title (db-async/<get-today-journal-title repo)
            query (cljs.reader/read-string query)
            fn-inputs (into {} (keep-indexed
                                (fn [idx input]
                                  (when (fn? input)
                                    [idx (fn [& args]
                                           (.apply input nil (clj->js (mapv bean/->js args))))]))
                                inputs))
            serializable-inputs (mapv #(if (fn? %) nil %) inputs)
            resolved-inputs (db-async/<resolve-query-inputs repo
                                                           serializable-inputs
                                                           {:current-page-title current-page-title
                                                            :today-title today-title})
            resolved-inputs (map-indexed (fn [idx input]
                                           (or (get fn-inputs idx) input))
                                         resolved-inputs)
            result (apply db-async/<q repo {:transact-db? false}
                          (cons query resolved-inputs))]
      (bean/->js (sdk-utils/normalize-keyword-for-json result false)))))

(defn custom_query
  [query-string]
  (p/let [result (let [query (cljs.reader/read-string query-string)]
                   (query-custom/custom-query {:query query}))]
    (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result)))))

(defn set_file_content
  [path content]
  (let [built-in-paths #{"logseq/custom.js"
                         "logseq/custom.css"
                         "logseq/publish.js"
                         "logseq/publish.css"}]
    (cond
      (not (string? content))
      (throw (ex-info "content should be a string"
                      {:content content}))
      (not (contains? built-in-paths path))
      (throw (ex-info "Invalid path"
                      {:supported-paths built-in-paths}))
      :else
      (p/do!
       (state/<invoke-db-worker :thread-api/transact
                                (state/get-current-repo)
                                [{:file/path path
                                  :file/content content}]
                                nil
                                nil)
       true))))

(defn get_file_content
  [path]
  (when-let [repo (state/get-current-repo)]
    (db-async/<get-file-content repo path)))
