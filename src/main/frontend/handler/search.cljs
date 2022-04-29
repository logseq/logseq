(ns frontend.handler.search
  (:require [clojure.string :as string]
            [frontend.db :as db]
            [frontend.handler.notification :as notification-handler]
            [frontend.search :as search]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [frontend.text :as text]
            [frontend.util.drawer :as drawer]
            [frontend.util.property :as property]))

(defn add-search-to-recent!
  [repo q]
  (when-not (string/blank? q)
    (let [items (or (db/get-key-value repo :recent/search)
                    '())
          new-items (take 10 (distinct (cons q items)))]
      (db/set-key-value repo :recent/search new-items))))

(defn sanity-search-content
  "Convert a block to the display contents for searching"
  [format content]
  (->> (text/remove-level-spaces content format)
       (drawer/remove-logbook)
       (property/remove-built-in-properties format)))

(defn search
  ([q]
   (search (state/get-current-repo) q))
  ([repo q]
   (search repo q {:limit 20}))
  ([repo q {:keys [page-db-id limit more?]
            :or {page-db-id nil
                 limit 20}
            :as opts}]
   (when-not (string/blank? q)
     (let [page-db-id (if (string? page-db-id)
                        (:db/id (db/entity repo [:block/name (util/page-name-sanity-lc page-db-id)]))
                        page-db-id)
           opts (if page-db-id (assoc opts :page (str page-db-id)) opts)]
       (p/let [blocks (search/block-search repo q opts)]
         (let [result (merge
                       {:blocks blocks
                        :has-more? (= limit (count blocks))}
                       (when-not page-db-id
                         {:pages (search/page-search q)
                          :files (search/file-search q)}))
               search-key (if more? :search/more-result :search/result)]
           (swap! state/state assoc search-key result)))))))

(defn clear-search!
  ([]
   (clear-search! true))
  ([clear-search-mode?]
   (let [m {:search/result nil
            :search/q ""}]
     (swap! state/state merge m))
   (when (and clear-search-mode? (not= (state/get-search-mode) :graph))
     (state/set-search-mode! :global))))

(defn rebuild-indices!
  ([]
   (rebuild-indices! false))
  ([notice?]
   (println "Starting to rebuild search indices!")
   (p/let [_ (search/rebuild-indices!)]
     (when notice?
       (notification-handler/show!
        "Search indices rebuilt successfully!"
        :success)))))

(defn rebuild-indices-when-stale!
  ([]
   (rebuild-indices-when-stale! (state/get-current-repo)))
  ([repo]
   (p/let [cache-stale? (search/cache-stale? repo)]
     (when cache-stale?
       (js/console.log "cache stale: " repo)
       (p/let [_ (search/rebuild-indices! repo)]
         (notification-handler/show!
          "Stale search cache detected. Search indices rebuilt successfully!"
          :success))))))