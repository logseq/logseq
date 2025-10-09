(ns logseq.api.db
  "DB APIs"
  (:require [cljs-bean.core :as bean]
            [cljs.reader]
            [frontend.db :as db]
            [frontend.db.async :as db-async]
            [frontend.db.query-custom :as query-custom]
            [frontend.db.query-dsl :as query-dsl]
            [frontend.db.query-react :as query-react]
            [frontend.modules.layout.core]
            [frontend.state :as state]
            [logseq.sdk.core]
            [logseq.sdk.experiments]
            [logseq.sdk.git]
            [logseq.sdk.utils :as sdk-utils]
            [promesa.core :as p]))

(defn q
  [query-string]
  (when-let [repo (state/get-current-repo)]
    (p/let [result (query-dsl/query repo query-string
                                    {:disable-reactive? true
                                     :return-promise? true})]
      (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result))))))

(defn datascript_query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (db/get-db repo)]
      (p/let [query           (cljs.reader/read-string query)
              resolved-inputs (map #(cond
                                      (string? %)
                                      (some->> % (cljs.reader/read-string) (query-react/resolve-input db))

                                      (fn? %)
                                      (fn [& args]
                                        (.apply % nil (clj->js (mapv bean/->js args))))

                                      :else %)
                                   inputs)
              result          (apply db-async/<q repo {:transact-db? false}
                                     (cons query resolved-inputs))]
        (bean/->js (sdk-utils/normalize-keyword-for-json result false))))))

(defn custom_query
  [query-string]
  (p/let [result (let [query (cljs.reader/read-string query-string)]
                   (query-custom/custom-query {:query query
                                               :disable-reactive? true
                                               :return-promise? true}))]
    (bean/->js (sdk-utils/normalize-keyword-for-json (flatten result)))))
