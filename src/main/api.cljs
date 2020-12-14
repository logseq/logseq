(ns ^:no-doc api
  (:require [frontend.state :as state]
            [datascript.core :as d]
            [cljs.reader]
            [frontend.db.declares :as declares]
            [frontend.handler.block :as block-handler]))

(defn ^:export query
  [query & inputs]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (declares/get-conn repo)]
      (let [query (cljs.reader/read-string query)
            result (apply d/q query conn inputs)]
        (clj->js result)))))

(def ^:export custom_query block-handler/custom-query)
