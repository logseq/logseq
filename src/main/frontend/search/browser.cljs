(ns frontend.search.browser
  "Browser implementation of search protocol"
  (:require [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private search-blocks-cache-ttl-ms 2000)
(defonce ^:private *search-blocks-cache (atom {}))

(defn- search-blocks-cache-key
  [repo q option]
  [repo q option])

(defn- fresh-search-blocks-cache-entry
  [cache-key]
  (when-let [{:keys [ts] :as entry} (get @*search-blocks-cache cache-key)]
    (when (< (- (js/Date.now) ts) search-blocks-cache-ttl-ms)
      entry)))

(defn- <search-blocks
  [repo q option]
  (let [cache-key (search-blocks-cache-key repo q option)]
    (if-let [{:keys [value promise]} (fresh-search-blocks-cache-entry cache-key)]
      (or promise (p/resolved value))
      (let [promise (-> (state/<invoke-db-worker :thread-api/search-blocks repo q option)
                        (p/then (fn [value]
                                  (swap! *search-blocks-cache assoc cache-key
                                         {:value value
                                          :ts (js/Date.now)})
                                  value))
                        (p/catch (fn [error]
                                   (swap! *search-blocks-cache dissoc cache-key)
                                   (throw error))))]
        (swap! *search-blocks-cache assoc cache-key {:promise promise
                                                     :ts (js/Date.now)})
        promise))))

(defn- clear-search-blocks-cache!
  []
  (reset! *search-blocks-cache {}))

(defrecord Browser [repo]
  protocol/Engine
  (query [_this q option]
    (<search-blocks (state/get-current-repo) q option))
  (rebuild-pages-indice! [_this]
    (clear-search-blocks-cache!)
    (state/<invoke-db-worker :thread-api/search-build-pages-indice repo))
  (rebuild-blocks-indice! [_this]
    (clear-search-blocks-cache!)
    (state/<invoke-db-worker :thread-api/search-build-blocks-indice-in-worker (state/get-current-repo) true))
  (transact-blocks! [_this {:keys [blocks-to-remove-set
                                   blocks-to-add]}]
    (clear-search-blocks-cache!)
    (let [repo (state/get-current-repo)]
      (p/let [_ (when (seq blocks-to-remove-set)
                  (state/<invoke-db-worker :thread-api/search-delete-blocks repo blocks-to-remove-set))]
        (when (seq blocks-to-add)
          (state/<invoke-db-worker :thread-api/search-upsert-blocks repo blocks-to-add)))))
  (truncate-blocks! [_this]
    (clear-search-blocks-cache!)
    (state/<invoke-db-worker :thread-api/search-truncate-tables (state/get-current-repo)))
  (remove-db! [_this]
    ;; Already removed in OPFS
    (p/resolved nil)))
