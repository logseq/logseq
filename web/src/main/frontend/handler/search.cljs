(ns frontend.handler.search
  (:require [goog.object :as gobj]
            [frontend.state :as state]
            [goog.dom :as gdom]
            [frontend.search :as search]))

(defn search
  [q]
  (swap! state/state assoc :search/result
         {:pages (search/page-search q)
          :blocks (search/search q)}))

(defn clear-search!
  []
  (swap! state/state assoc
         :search/result nil
         :search/q "")
  (when-let [input (gdom/getElement "search_field")]
    (gobj/set input "value" "")))
