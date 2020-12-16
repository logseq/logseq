(ns frontend.db.react
  "Transact the tx with some specified relationship so that the components will
  be refreshed when subscribed data changed.
  It'll be great if we can find an automatically resolving and performant
  solution.
  "
  (:require [frontend.db.conn :as conn]
            [frontend.db.utils :as db-utils]
            [frontend.db.model :as model]
            [frontend.state :as state]
            [frontend.date :as date]
            [frontend.util :as util :refer-macros [profile] :refer [react]]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.format :as format]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [frontend.utf8 :as utf8]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]))

;; TODO: Extract several parts to handlers

(defn get-current-page
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])
        tag? (= route-name :tag)
        page (case route-name
               :page
               (get-in match [:path-params :name])

               :file
               (get-in match [:path-params :path])

               :tag
               (get-in match [:path-params :name])

               (date/journal-name))]
    (when page
      (let [page-name (util/url-decode (string/lower-case page))]
        (model/entity (if tag?
                        [:tag/name page-name]
                        [:page/name page-name]))))))

(defn get-current-priority
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (contains? #{"a" "b" "c"} (string/lower-case page-name))
             (string/upper-case page-name))))))

(defn get-current-marker
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (util/marker? page-name)
             (string/upper-case page-name))))))

(defn get-handler-keys
  [{:keys [key data]}]
  (cond
    (coll? key)
    [key]

    :else
    (case key
      (:block/change :block/insert)
      (when-let [blocks (seq data)]
        (let [pre-block? (:block/pre-block? (first blocks))
              current-priority (get-current-priority)
              current-marker (get-current-marker)
              current-page-id (:db/id (get-current-page))
              {:block/keys [page]} (first blocks)
              handler-keys (->>
                            (util/concat-without-nil
                             (mapcat
                              (fn [block]
                                (when-let [page-id (:db/id (:block/page block))]
                                  [[:blocks (:block/uuid block)]
                                   [:page/blocks page-id]
                                   [:page/ref-pages page-id]]))
                              blocks)

                             (when pre-block?
                               [[:contents]
                                [:page/published]])

                             ;; affected priority
                             (when current-priority
                               [[:priority/blocks current-priority]])

                             (when current-marker
                               [[:marker/blocks current-marker]])

                             (when current-page-id
                               [[:page/ref-pages current-page-id]
                                [:page/refed-blocks current-page-id]
                                [:page/mentioned-pages current-page-id]])

                             ;; refed-pages
                             (apply concat
                                    (for [{:block/keys [ref-pages]} blocks]
                                      (map (fn [page]
                                             (when-let [page (model/entity [:page/name (:page/name page)])]
                                               [:page/refed-blocks (:db/id page)]))
                                           ref-pages)))

                             ;; refed-blocks
                             (apply concat
                                    (for [{:block/keys [ref-blocks]} blocks]
                                      (map (fn [ref-block]
                                             [:block/refed-blocks (last ref-block)])
                                           ref-blocks))))
                            (distinct))
              refed-pages (map
                           (fn [[k page-id]]
                             (if (= k :page/refed-blocks)
                               [:page/ref-pages page-id]))
                           handler-keys)
              custom-queries (some->>
                              (filter (fn [v]
                                        (and (= (first v) (state/get-current-repo))
                                             (= (second v) :custom)))
                                      (keys @model/query-state))
                              (map (fn [v]
                                     (vec (drop 1 v)))))
              block-blocks (some->>
                            (filter (fn [v]
                                      (and (= (first v) (state/get-current-repo))
                                           (= (second v) :block/block)))
                                    (keys @model/query-state))
                            (map (fn [v]
                                   (vec (drop 1 v)))))]
          (->>
           (util/concat-without-nil
            handler-keys
            refed-pages
            custom-queries
            block-blocks)
           distinct)))
      [[key]])))

(defn transact-react!
  [repo-url tx-data {:keys [key data files-db?] :as handler-opts
                     :or {files-db? false}}]
  (when-not config/publishing?
    (try
      (let [repo-url (or repo-url (state/get-current-repo))
            tx-data (->> (util/remove-nils tx-data)
                         (remove nil?))
            get-conn (fn [] (if files-db?
                              (conn/get-files-conn repo-url)
                              (conn/get-conn repo-url false)))]
        (when (and (seq tx-data) (get-conn))
          (let [tx-result (profile "Transact!" (d/transact! (get-conn) (vec tx-data)))
                db (:db-after tx-result)
                handler-keys (get-handler-keys handler-opts)]
            (doseq [handler-key handler-keys]
              (let [handler-key (vec (cons repo-url handler-key))]
                (when-let [cache (get @model/query-state handler-key)]
                  (let [{:keys [query inputs transform-fn query-fn inputs-fn]} cache]
                    (when (or query query-fn)
                      (let [new-result (->
                                        (cond
                                          query-fn
                                          (profile
                                           "Query:"
                                           (doall (query-fn db)))

                                          inputs-fn
                                          (let [inputs (inputs-fn)]
                                            (apply d/q query db inputs))

                                          (keyword? query)
                                          (model/get-key-value repo-url query)

                                          (seq inputs)
                                          (apply d/q query db inputs)

                                          :else
                                          (d/q query db))
                                        transform-fn)]
                        (model/set-new-result! handler-key new-result))))))))))
      (catch js/Error e
        ;; FIXME: check error type and notice user
        (log/error :db/transact! e)))))

(defn set-key-value
  [repo-url key value]
  (if value
    (transact-react! repo-url [(model/kv key value)]
                     {:key [:kv key]})
    (model/remove-key! repo-url key)))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (let [tx-data {:file/path path
                   :file/content content
                   :file/last-modified-at (util/time-ms)}
          tx-data (if (config/local-db? repo)
                    (dissoc tx-data :file/last-modified-at)
                    tx-data)]
      (transact-react!
       repo
       [tx-data]
       {:key [:file/content path]
        :files-db? true}))))
