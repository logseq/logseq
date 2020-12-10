(ns ^:no-doc api
  (:require [frontend.db :as db]
            [frontend.state :as state]
            [datascript.core :as d]
            [cljs.reader]))

(defn ^:export query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (db/get-conn repo)]
      (let [query (cljs.reader/read-string query)
            result (apply d/q query conn inputs)]
        (clj->js result)))))

(def ^:export custom_query db/custom-query)
