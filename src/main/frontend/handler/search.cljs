(ns frontend.handler.search
  (:require [goog.object :as gobj]
            [frontend.state :as state]
            [frontend.db :as db]
            [goog.dom :as gdom]
            [frontend.search :as search]
            [frontend.search.db :as search-db]
            [frontend.handler.notification :as notification-handler]
            [promesa.core :as p]
            [clojure.string :as string]))

(defn search
  ([repo q]
   (search repo q {:limit 20}))
  ([repo q {:keys [page-db-id limit more?]
            :or {page-db-id nil
                 limit 20}
            :as opts}]
   (let [page-db-id (if (string? page-db-id)
                      (:db/id (db/entity repo [:block/name (string/lower-case page-db-id)]))
                      page-db-id)]
     (p/let [blocks (search/block-search repo q opts)]
      (let [blocks (if page-db-id
                     (filter (fn [block] (= (get-in block [:block/page :db/id]) page-db-id)) blocks)
                     blocks)
            result (merge
                    {:blocks blocks
                     :has-more? (= limit (count blocks))}
                    (when-not page-db-id
                      {:pages (search/page-search q)
                       :files (search/file-search q)}))
            search-key (if more? :search/more-result :search/result)]
        (swap! state/state assoc search-key result))))))

(defn clear-search!
  []
  (swap! state/state assoc
         :search/result nil
         :search/q ""
         :search/mode :global)
  (when-let [input (gdom/getElement "search-field")]
    (gobj/set input "value" "")))

(defn rebuild-indices!
  []
  (println "Starting to rebuild search indices!")
  (p/let [_ (search/rebuild-indices!)]
    (notification-handler/show!
     "Search indices rebuilt successfully!"
     :success)))
