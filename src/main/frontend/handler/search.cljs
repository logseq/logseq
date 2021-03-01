(ns frontend.handler.search
  (:require [goog.object :as gobj]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.handler.notification :as notification-handler]
            [promesa.core :as p]))

(defn search
  [q]
  (swap! state/state assoc :search/result
         {:pages (search/page-search q)
          :files (search/file-search q)
          :blocks (search/block-search q 10)}))

(defn clear-search!
  []
  (swap! state/state assoc
         :search/result nil
         :search/q "")
  (when-let [input (gdom/getElement "search-field")]
    (gobj/set input "value" "")))

(defn rebuild-indices!
  []
  (println "Starting to rebuild search indices!")
  (search/rebuild-indices!)
  (notification-handler/show!
   "Search indices rebuilt successfully!"
   :success))
