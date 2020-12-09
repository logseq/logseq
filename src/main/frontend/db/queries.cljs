(ns frontend.db.queries
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [frontend.db-schema :as db-schema]
            [clojure.string :as string]
            [frontend.format.mldoc :as mldoc]
            [frontend.config :as config]
            [frontend.util :as util]
            [frontend.util :as util :refer-macros [profile]]
            [lambdaisland.glogi :as log]
            [frontend.db.react-queries :as react-queries]
            [frontend.date :as date]
            [clojure.core.async :as async]
            [promesa.core :as p]
            [frontend.db.utils :as db-utils]
            [clojure.walk :as walk]
            [clojure.set :as set]
            [frontend.idb :as idb]
            [cljs.reader :as reader]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [frontend.format.block :as block]
            [medley.core :as medley]
            [frontend.extensions.sci :as sci]))

(defn- get-public-pages
  [db]
  (-> (d/q
        '[:find ?p
          :where
          [?p :page/properties ?d]
          [(get ?d :public) ?pub]
          [(= "true" ?pub)]]
        db)
      (db-utils/seq-flatten)))

(defn get-pages
  [repo]
  (->> (d/q
         '[:find ?page-name
           :where
           [?page :page/original-name ?page-name]]
         (declares/get-conn repo))
    (map first)))

(defn get-page-alias
  [repo page-name]
  (when-let [conn (and repo (declares/get-conn repo))]
    (some->> (d/q '[:find ?alias
                    :in $ ?page-name
                    :where
                    [?page :page/name ?page-name]
                    [?page :page/alias ?alias]]
               conn
               page-name)
             db-utils/seq-flatten
             distinct)))

(defn get-alias-page
  [repo alias]
  (when-let [conn (and repo (declares/get-conn repo))]
    (some->> (d/q '[:find ?page
                    :in $ ?alias
                    :where
                    [?page :page/alias ?alias]]
               conn
               alias)
             db-utils/seq-flatten
             distinct)))

(defn page-alias-set
  [repo-url page]
  (when-let [page-id (:db/id (db-utils/entity [:page/name page]))]
    (let [aliases (get-page-alias repo-url page)
          aliases (if (seq aliases)
                    (set
                      (concat
                        (mapcat #(get-alias-page repo-url %) aliases)
                        aliases))
                    aliases)]
      (set (conj aliases page-id)))))

(defn get-block-refs-count
  [repo]
  (->> (d/q
         '[:find ?id2 ?id1
           :where
           [?id1 :block/ref-blocks ?id2]]
         (declares/get-conn repo))
    (map first)
    (frequencies)))

(defn- with-block-refs-count
  [repo blocks]
  (let [refs (get-block-refs-count repo)]
    (map (fn [block]
           (assoc block :block/block-refs-count
                        (get refs (:db/id block))))
      blocks)))

(defn page-blocks-transform
  [repo-url result]
  (let [result (db-utils/seq-flatten result)
        sorted (db-utils/sort-by-pos result)]
    (->> (db-utils/with-repo repo-url sorted)
      (with-block-refs-count repo-url))))

(defn get-page-blocks-no-cache
  ([page]
   (get-page-blocks-no-cache (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks-no-cache repo-url page nil))
  ([repo-url page {:keys [pull-keys]
                   :or {pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (:db/id (db-utils/entity repo-url [:page/name page]))
                   (:db/id (db-utils/entity repo-url [:page/original-name page])))
         db (declares/get-conn repo-url)]
     (when page-id
       (let [datoms (d/datoms db :avet :block/page page-id)
             block-eids (mapv :e datoms)]
         (some->> (db-utils/pull-many repo-url pull-keys block-eids)
                  (page-blocks-transform repo-url)))))))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                     (remove nil?))]
       (when (seq tx-data)
         (when-let [conn (declares/get-conn repo-url false)]
           (d/transact! conn (vec tx-data))))))))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @react-queries/query-state [k :result])]
    (reset! result-atom new-result)))


(defn remove-key
  [repo-url key]
  (transact! repo-url [[:db.fn/retractEntity [:db/ident key]]])
  (set-new-result! [repo-url :kv key] nil))


(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (declares/get-conn repo-url)]
     (some-> (d/entity db key)
       key))))

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
        (db-utils/entity (if tag?
                           [:tag/name page-name]
                           [:page/name page-name]))))))

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
                                 [[:contents]])

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
                                          (when-let [page (db-utils/entity [:page/name (:page/name page)])]
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
                                 (keys @react-queries/query-state))
                               (map (fn [v]
                                      (vec (drop 1 v)))))
              block-blocks (some->>
                             (filter (fn [v]
                                       (and (= (first v) (state/get-current-repo))
                                            (= (second v) :block/block)))
                               (keys @react-queries/query-state))
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
                              (declares/get-files-conn repo-url)
                              (declares/get-conn repo-url false)))]
        (when (and (seq tx-data) (get-conn))
          (let [tx-result (profile "Transact!" (d/transact! (get-conn) (vec tx-data)))
                db (:db-after tx-result)
                handler-keys (get-handler-keys handler-opts)]
            (doseq [handler-key handler-keys]
              (let [handler-key (vec (cons repo-url handler-key))]
                (when-let [cache (get @react-queries/query-state handler-key)]
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
                                           (get-key-value repo-url query)

                                           (seq inputs)
                                           (apply d/q query db inputs)

                                           :else
                                           (d/q query db))
                                         transform-fn)]
                        (set-new-result! handler-key new-result))))))))))
      (catch js/Error e
        ;; FIXME: check error type and notice user
        (log/error :db/transact! e)))))

(defn set-key-value
  [repo-url key value]
  (if value
    (transact-react! repo-url [(db-utils/kv key value)]
      {:key [:kv key]})
    (remove-key repo-url key)))


(defn get-block-parent
  [repo block-id]
  (when-let [conn (declares/get-conn repo)]
    (d/entity conn [:block/children [:block/uuid block-id]])))

(defn block-and-children-transform
  [result repo-url block-uuid level]
  (some->> result
           db-utils/seq-flatten
           (db-utils/sort-by-pos)
           (take-while (fn [h]
                         (or
                           (= (:block/uuid h)
                             block-uuid)
                           (> (:block/level h) level))))
           (db-utils/with-repo repo-url)
           (with-block-refs-count repo-url)))


(defn get-block-and-children-no-cache
  [repo block-uuid]
  (let [block (db-utils/entity repo [:block/uuid block-uuid])
        page (:db/id (:block/page block))
        pos (:start-pos (:block/meta block))
        level (:block/level block)
        pred (fn [data meta]
               (>= (:start-pos meta) pos))]
    (-> (d/q
          '[:find (pull ?block [*])
            :in $ ?page ?pred
            :where
            [?block :block/page ?page]
            [?block :block/meta ?meta]
            [(?pred $ ?meta)]]
          (declares/get-conn repo)
          page
          pred)
        (block-and-children-transform repo block-uuid level))))

(defn get-page-referenced-pages
  [repo page]
  (when (declares/get-conn repo)
    (let [pages (page-alias-set repo page)
          page-id (:db/id (db-utils/entity [:page/name page]))
          ref-pages (->> (react-queries/q repo [:page/ref-pages page-id] {:use-cache? false}
                           '[:find ?ref-page-name
                             :in $ ?pages
                             :where
                             [?block :block/page ?p]
                             [(contains? ?pages ?p)]
                             [?block :block/ref-pages ?ref-page]
                             [?ref-page :page/name ?ref-page-name]]
                           pages)
                      react-queries/react
                      db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

(defn get-pages-that-mentioned-page
  [repo page]
  (when (declares/get-conn repo)
    (let [page-id (:db/id (db-utils/entity [:page/name page]))
          pages (page-alias-set repo page)
          mentioned-pages (->> (react-queries/q repo [:page/mentioned-pages page-id] {:use-cache? false}
                                 '[:find ?mentioned-page-name
                                   :in $ ?pages ?page-name
                                   :where
                                   [?block :block/ref-pages ?p]
                                   [(contains? ?pages ?p)]
                                   [?block :block/page ?mentioned-page]
                                   [?mentioned-page :page/name ?mentioned-page-name]]
                                 pages
                                 page)
                            react-queries/react
                            db-utils/seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) mentioned-pages))))

(defn get-pages-relation
  [repo with-journal?]
  (when-let [conn (declares/get-conn repo)]
    (let [q (if with-journal?
              '[:find ?page ?ref-page-name
                :where
                [?p :page/name ?page]
                [?block :block/page ?p]
                [?block :block/ref-pages ?ref-page]
                [?ref-page :page/name ?ref-page-name]]
              '[:find ?page ?ref-page-name
                :where
                [?p :page/journal? false]
                [?p :page/name ?page]
                [?block :block/page ?p]
                [?block :block/ref-pages ?ref-page]
                [?ref-page :page/name ?ref-page-name]])]
      (->>
        (d/q q conn)
        (map (fn [[page ref-page-name]]
               [page ref-page-name]))))))

(defn get-all-tagged-pages
  [repo]
  (d/q '[:find ?page-name ?tag
         :where
         [?page :page/tags ?e]
         [?e :tag/name ?tag]
         [_ :page/name ?tag]
         [?page :page/name ?page-name]]
    (declares/get-conn repo)))

(defn get-page-format
  [page-name]
  (when-let [file (:page/file (db-utils/entity [:page/name page-name]))]
    (when-let [path (:file/path (db-utils/entity (:db/id file)))]
      (format/get-format path))))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (transact-react!
      repo
      [{:file/path path
        :file/content content
        :file/last-modified-at (util/time-ms)}]
      {:key [:file/content path]
       :files-db? true})))

(defn get-file-blocks
  [repo-url path]
  (-> (d/q '[:find ?block
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?block :block/file ?file]]
        (declares/get-conn repo-url) path)
      db-utils/seq-flatten))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn extract-pages-and-blocks
  [repo-url format ast properties file content utf8-content journal? pages-fn]
  (try
    (let [now (tc/to-long (t/now))
          blocks (block/extract-blocks ast (utf8/length utf8-content) utf8-content)
          pages (pages-fn blocks ast)
          ref-pages (atom #{})
          ref-tags (atom #{})
          blocks (doall
                   (mapcat
                     (fn [[page blocks]]
                       (if page
                         (map (fn [block]
                                (let [block-ref-pages (seq (:block/ref-pages block))]
                                  (when block-ref-pages
                                    (swap! ref-pages set/union (set block-ref-pages)))
                                  (-> block
                                      (dissoc :ref-pages)
                                      (assoc :block/content (db-utils/get-block-content utf8-content block)
                                             :block/file [:file/path file]
                                             :block/format format
                                             :block/page [:page/name (string/lower-case page)]
                                             :block/ref-pages (mapv
                                                                (fn [page]
                                                                  (block/page-with-journal page))
                                                                block-ref-pages)))))
                           blocks)))
                     (remove nil? pages)))
          pages (doall
                  (map
                    (fn [page]
                      (let [page-file? (= page (string/lower-case file))
                            other-alias (and (:alias properties)
                                             (seq (remove #(= page %)
                                                    (:alias properties))))
                            other-alias (distinct
                                          (remove nil? other-alias))
                            journal-date-long (if journal?
                                                (date/journal-title->long (string/capitalize page)))
                            page-list (when-let [list-content (:list properties)]
                                        (db-utils/extract-page-list list-content))]
                        (cond->
                          (util/remove-nils
                            {:page/name (string/lower-case page)
                             :page/original-name page
                             :page/file [:file/path file]
                             :page/journal? journal?
                             :page/journal-day (if journal?
                                                 (date/journal-title->int (string/capitalize page))
                                                 0)
                             :page/created-at journal-date-long
                             :page/last-modified-at journal-date-long})
                          (seq properties)
                          (assoc :page/properties properties)

                          other-alias
                          (assoc :page/alias
                                 (map
                                   (fn [alias]
                                     (let [alias (string/lower-case alias)
                                           aliases (->>
                                                     (distinct
                                                       (conj
                                                         (remove #{alias} other-alias)
                                                         page))
                                                     (remove nil?))
                                           aliases (if (seq aliases)
                                                     (map
                                                       (fn [alias]
                                                         {:page/name alias})
                                                       aliases))]
                                       (if (seq aliases)
                                         {:page/name alias
                                          :page/alias aliases}
                                         {:page/name alias})))
                                   other-alias))

                          (or (:tags properties) (:roam_tags properties))
                          (assoc :page/tags (let [tags (:tags properties)
                                                  roam-tags (:roam_tags properties)
                                                  tags (if (string? tags)
                                                         (string/split tags #",")
                                                         tags)
                                                  tags (->> (concat tags roam-tags)
                                                         (remove nil?)
                                                         (distinct))
                                                  tags (util/->tags tags)]
                                              (swap! ref-tags set/union (set (map :tag/name tags)))
                                              tags)))))
                    (->> (map first pages)
                      (remove nil?))))
          pages (concat
                  pages
                  (map
                    (fn [page]
                      {:page/original-name page
                       :page/name page})
                    @ref-tags)
                  (map
                    (fn [page]
                      {:page/original-name page
                       :page/name (string/lower-case page)})
                    @ref-pages))
          block-ids (mapv (fn [block]
                            {:block/uuid (:block/uuid block)})
                      (remove nil? blocks))]
      [(remove nil? pages)
       block-ids
       (remove nil? blocks)])
    (catch js/Error e
      (js/console.log e))))

(defn extract-blocks-pages
  [repo-url file content utf8-content]
  (if (string/blank? content)
    []
    (let [journal? (util/starts-with? file "journals/")
          format (format/get-format file)
          ast (mldoc/->edn content
                (mldoc/default-config format))
          first-block (first ast)
          properties (let [properties (and (seq first-block)
                                           (= "Properties" (ffirst first-block))
                                           (last (first first-block)))]
                       (if (and properties (seq properties))
                         properties))]
      (extract-pages-and-blocks
        repo-url
        format ast properties
        file content utf8-content journal?
        (fn [blocks ast]
          [[(db-utils/get-page-name file ast) blocks]])))))

(defn transact-files-db!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (when-not config/publishing?
     (let [tx-data (->> (util/remove-nils tx-data)
                     (remove nil?)
                     (map #(dissoc % :file/handle :file/type)))]
       (when (seq tx-data)
         (when-let [conn (declares/get-files-conn repo-url)]
           (d/transact! conn (vec tx-data))))))))

(defn get-file-pages
  [repo-url path]
  (-> (d/q '[:find ?page
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?page :page/file ?file]]
        (declares/get-conn repo-url) path)
      (db-utils/seq-flatten)))

(defn delete-file-pages!
  [repo-url path]
  (let [pages (get-file-pages repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) pages)))

(defn delete-file-tx
  [repo-url file-path]
  (->>
    (concat
      (delete-file-blocks! repo-url file-path)
      (delete-file-pages! repo-url file-path)
      [[:db.fn/retractEntity [:file/path file-path]]])
    (remove nil?)))

(defn get-files-blocks
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [_db e]
               (contains? paths e))]
    (-> (d/q '[:find ?block
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?block :block/file ?file]]
          (declares/get-conn repo-url) pred)
        (db-utils/seq-flatten))))

(defn- resolve-input
  [input]
  (cond
    (= :today input)
    (db-utils/date->int (t/today))
    (= :yesterday input)
    (db-utils/date->int (t/yesterday))
    (= :tomorrow input)
    (db-utils/date->int (t/plus (t/today) (t/days 1)))
    (= :current-page input)
    (string/lower-case (state/get-current-page))
    (and (keyword? input)
         (re-find #"^\d+d(-before)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (db-utils/date->int (t/minus (t/today) (t/days days))))
    (and (keyword? input)
         (re-find #"^\d+d(-after)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (db-utils/date->int (t/plus (t/today) (t/days days))))

    :else
    input))

(defn custom-query-aux
  [{:keys [query inputs result-transform] :as query'} query-opts]
  (try
    (let [inputs (map resolve-input inputs)
          repo (state/get-current-repo)
          k [:custom query']]
      (apply react-queries/q repo k query-opts query inputs))
    (catch js/Error e
      (println "Custom query failed: ")
      (js/console.dir e))))


;;; refactor here

(defn custom-query
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (when-let [query' (cond
                       (and (string? query)
                            (not (string/blank? query)))
                       (reader/read-string query)

                       (map? query)
                       query

                       :else
                       nil)]
     (custom-query-aux query' query-opts))))

(defn custom-query-result-transform
  [query-result remove-blocks q]
  (let [repo (state/get-current-repo)
        result (db-utils/seq-flatten query-result)
        block? (:block/uuid (first result))]
    (if block?
      (let [result (if (seq remove-blocks)
                     (let [remove-blocks (set remove-blocks)]
                       (remove (fn [h]
                                 (contains? remove-blocks (:block/uuid h)))
                         result))
                     result)
            result (some->> result
                            (db-utils/with-repo repo)
                            (with-block-refs-count repo)
                            (db-utils/sort-blocks))]
        (if-let [result-transform (:result-transform q)]
          (if-let [f (sci/eval-string (pr-str result-transform))]
            (sci/call-fn f result)
            result)
          (db-utils/group-by-page result)))
      result)))

(defn get-tag-pages
  [repo tag-name]
  (d/q '[:find ?original-name ?name
         :in $ ?tag
         :where
         [?e :tag/name ?tag]
         [?page :page/tags ?e]
         [?page :page/original-name ?original-name]
         [?page :page/name ?name]]
    (declares/get-conn repo)
    tag-name))

(defn get-pages-with-modified-at
  [repo]
  (let [now-long (tc/to-long (t/now))]
    (->> (d/q
           '[:find ?page-name ?modified-at
             :where
             [?page :page/original-name ?page-name]
             [(get-else $ ?page :page/last-modified-at 0) ?modified-at]]
           (declares/get-conn repo))
      (seq)
      (sort-by (fn [[page modified-at]]
                 [modified-at page]))
      (reverse)
      (remove (fn [[page modified-at]]
                (or (util/file-page? page)
                  (and modified-at
                       (> modified-at now-long))))))))

(defn get-page-alias-names
  [repo page-name]
  (let [alias-ids (get-page-alias repo page-name)]
    (when (seq alias-ids)
      (->> (db-utils/pull-many repo '[:page/name] alias-ids)
        (map :page/name)
        distinct))))

(defn get-files
  [repo]
  (when-let [conn (declares/get-conn repo)]
    (->> (d/q
           '[:find ?path ?modified-at
             :where
             [?file :file/path ?path]
             [(get-else $ ?file :file/last-modified-at 0) ?modified-at]]
           conn)
      (seq)
      (sort-by last)
      (reverse))))

(defn delete-blocks
  [repo-url files]
  (when (seq files)
    (let [blocks (get-files-blocks repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn get-file-after-blocks
  [repo-url file-id end-pos]
  (when end-pos
    (let [pred (fn [db meta]
                 (>= (:start-pos meta) end-pos))]
      (-> (d/q '[:find (pull ?block [*])
                 :in $ ?file-id ?pred
                 :where
                 [?block :block/file ?file-id]
                 [?block :block/meta ?meta]
                 [(?pred $ ?meta)]]
            (declares/get-conn repo-url) file-id pred)
          (db-utils/seq-flatten)
          (db-utils/sort-by-pos)))))

(defn get-file-after-blocks-meta
  ([repo-url file-id end-pos]
   (get-file-after-blocks-meta repo-url file-id end-pos false))
  ([repo-url file-id end-pos content-level?]
   (let [db (declares/get-conn repo-url)
         blocks (d/datoms db :avet :block/file file-id)
         eids (mapv :e blocks)
         ks (if content-level?
              '[:block/uuid :block/meta :block/content :block/level]
              '[:block/uuid :block/meta])
         blocks (db-utils/pull-many repo-url ks eids)]
     (->> (filter (fn [{:block/keys [meta]}]
                    (>= (:start-pos meta) end-pos)) blocks)
       (db-utils/sort-by-pos)))))

(defn delete-file!
  [repo-url file-path]
  (transact! repo-url (delete-file-tx repo-url file-path)))

(defn get-file-contents
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (->>
      (d/q
        '[:find ?path ?content
          :where
          [?file :file/path ?path]
          [?file :file/content ?content]]
        @conn)
      (into {}))))

(defn get-files-full
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (->>
      (d/q
        '[:find (pull ?file [*])
          :where
          [?file :file/path]]
        @conn)
      (flatten))))

(defn get-file-no-sub
  ([path]
   (get-file-no-sub (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (when-let [conn (declares/get-files-conn repo)]
       (->
         (d/q
           '[:find ?content
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?file :file/content ?content]]
           @conn
           path)
         ffirst)))))

(defn reset-contents-and-blocks!
  [repo-url files blocks-pages delete-files delete-blocks]
  (transact-files-db! repo-url files)
  (let [files (map #(select-keys % [:file/path]) files)
        all-data (-> (concat delete-files delete-blocks files blocks-pages)
                     (util/remove-nils))]
    (transact! repo-url all-data)))

(defn get-marker-blocks
  [repo-url marker]
  (let [marker (string/upper-case marker)]
    (some->>
      (react-queries/q repo-url [:marker/blocks marker]
        {:use-cache? true}
        '[:find (pull ?h [*])
          :in $ ?marker
          :where
          [?h :block/marker ?m]
          [(= ?marker ?m)]]
        marker)
      (react-queries/react)
      (db-utils/seq-flatten)
      (db-utils/sort-by-pos)
      (db-utils/with-repo repo-url)
      (with-block-refs-count repo-url)
      (db-utils/sort-blocks)
      (db-utils/group-by-page))))

(defn get-page-properties
  [page]
  (when-let [page (db-utils/entity [:page/name page])]
    (:page/properties page)))

(defn add-properties!
  [page-format properties-content properties]
  (let [properties (medley/map-keys name properties)
        lines (string/split-lines properties-content)
        front-matter-format? (contains? #{:markdown} page-format)
        lines (if front-matter-format?
                (remove (fn [line]
                          (contains? #{"---" ""} (string/trim line))) lines)
                lines)
        property-keys (keys properties)
        prefix-f (case page-format
                   :org (fn [k]
                          (str "#+" (string/upper-case k) ": "))
                   :markdown (fn [k]
                               (str (string/lower-case k) ": "))
                   identity)
        exists? (atom #{})
        lines (doall
                (mapv (fn [line]
                        (let [result (filter #(and % (util/starts-with? line (prefix-f %)))
                                       property-keys)]
                          (if (seq result)
                            (let [k (first result)]
                              (swap! exists? conj k)
                              (str (prefix-f k) (get properties k)))
                            line))) lines))
        lines (concat
                lines
                (let [not-exists (remove
                                   (fn [[k _]]
                                     (contains? @exists? k))
                                   properties)]
                  (when (seq not-exists)
                    (mapv
                      (fn [[k v]] (str (prefix-f k) v))
                      not-exists))))]
    (util/format
      (config/properties-wrapper-pattern page-format)
      (string/join "\n" lines))))

(defn get-page-blocks
  ([page]
   (get-page-blocks (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks repo-url page nil))
  ([repo-url page {:keys [use-cache? pull-keys]
                   :or {use-cache? true
                        pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (:db/id (db-utils/entity repo-url [:page/name page]))
                   (:db/id (db-utils/entity repo-url [:page/original-name page])))
         db (declares/get-conn repo-url)]
     (when page-id
       (some->
         (react-queries/q repo-url [:page/blocks page-id]
           {:use-cache? use-cache?
            :transform-fn #(page-blocks-transform repo-url %)
            :query-fn (fn [db]
                        (let [datoms (d/datoms db :avet :block/page page-id)
                              block-eids (mapv :e datoms)]
                          (db-utils/pull-many repo-url pull-keys block-eids)))}
           nil)
         react-queries/react)))))

(defn get-page-blocks-count
  [repo page-id]
  (when-let [db (declares/get-conn repo)]
    (count (d/datoms db :avet :block/page page-id))))

(defn get-page-properties-content
  [page]
  (when-let [content (let [blocks (get-page-blocks page)]
                       (and (:block/pre-block? (first blocks))
                            (:block/content (first blocks))))]
    (let [format (get-page-format page)]
      (case format
        :org
        (->> (string/split-lines content)
          (take-while (fn [line]
                        (or (string/blank? line)
                          (string/starts-with? line "#+"))))
          (string/join "\n"))

        :markdown
        (str (subs content 0 (string/last-index-of content "---\n\n"))
          "---\n\n")

        content))))

(defn get-block-children-ids
  [repo block-uuid]
  (when-let [conn (declares/get-conn repo)]
    (let [eid (:db/id (db-utils/entity repo [:block/uuid block-uuid]))]
      (->> (d/q
             '[:find ?e1
               :in $ ?e2 %
               :where (parent ?e2 ?e1)]
             conn
             eid
             ;; recursive rules
             '[[(parent ?e2 ?e1)
                [?e2 :block/children ?e1]]
               [(parent ?e2 ?e1)
                [?t :block/children ?e1]
                (parent ?e2 ?t)]])
        (apply concat)))))

(defn get-block-immediate-children
  [repo block-uuid]
  (when-let [conn (declares/get-conn repo)]
    (let [ids (->> (:block/children (db-utils/entity repo [:block/uuid block-uuid]))
                (map :db/id))]
      (when (seq ids)
        (db-utils/pull-many repo '[*] ids)))))

(defn get-block-and-children
  ([repo block-uuid]
   (get-block-and-children repo block-uuid true))
  ([repo block-uuid use-cache?]
   (let [block (db-utils/entity repo [:block/uuid block-uuid])
         page (:db/id (:block/page block))
         pos (:start-pos (:block/meta block))
         level (:block/level block)
         pred (fn []
                (let [block (db-utils/entity repo [:block/uuid block-uuid])
                      pos (:start-pos (:block/meta block))]
                  (fn [data meta]
                    (>= (:start-pos meta) pos))))]
     (some-> (react-queries/q repo [:block/block block-uuid]
               {:use-cache? use-cache?
                :transform-fn #(block-and-children-transform % repo block-uuid level)
                :inputs-fn (fn []
                             [page (pred)])}
               '[:find (pull ?block [*])
                 :in $ ?page ?pred
                 :where
                 [?block :block/page ?page]
                 [?block :block/meta ?meta]
                 [(?pred $ ?meta)]])
       react-queries/react))))

(defn get-file-page
  ([file-path]
   (get-file-page file-path true))
  ([file-path original-name?]
   (when-let [repo (state/get-current-repo)]
     (when-let [conn (declares/get-conn repo)]
       (some->
         (d/q
           (if original-name?
             '[:find ?page-name
               :in $ ?path
               :where
               [?file :file/path ?path]
               [?page :page/file ?file]
               [?page :page/original-name ?page-name]]
             '[:find ?page-name
               :in $ ?path
               :where
               [?file :file/path ?path]
               [?page :page/file ?file]
               [?page :page/name ?page-name]])
           conn file-path)
         db-utils/seq-flatten
         first)))))

(defn delete-pages-by-files
  [files]
  (let [pages (->> (mapv get-file-page files)
                (remove nil?))]
    (when (seq pages)
      (mapv (fn [page] [:db.fn/retractEntity [:page/name page]])
        (map string/lower-case pages)))))

(defn get-page-file
  [page-name]
  (some-> (db-utils/entity [:page/name page-name])
    :page/file))

(defn get-block-file
  [block-id]
  (let [page-id (some-> (db-utils/entity [:block/uuid block-id])
                  :block/page
                  :db/id)]
    (:page/file (db-utils/entity page-id))))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (declares/get-conn repo)]
      (some->
        (d/q
          '[:find ?page
            :in $ ?path
            :where
            [?file :file/path ?path]
            [?page :page/file ?file]]
          conn file-path)
        db-utils/seq-flatten
        first))))

(defn extract-all-blocks-pages
  [repo-url files]
  (when (seq files)
    (let [result (->> files
                   (map
                     (fn [{:file/keys [path content]} contents]
                       (println "Parsing : " path)
                       (when content
                         (let [utf8-content (utf8/encode content)]
                           (extract-blocks-pages repo-url path content utf8-content)))))
                   (remove empty?))]
      (when (seq result)
        (let [[pages block-ids blocks] (apply map concat result)
              block-ids-set (set block-ids)
              blocks (map (fn [b]
                            (-> b
                                (update :block/ref-blocks #(set/intersection (set %) block-ids-set))
                                (update :block/embed-blocks #(set/intersection (set %) block-ids-set)))) blocks)]
          (apply concat [pages block-ids blocks]))))))

;; TODO: compare blocks
(defn reset-file!
  [repo-url file content]
  (let [new? (nil? (db-utils/entity [:file/path file]))]
    (set-file-content! repo-url file content)
    (let [format (format/get-format file)
          utf8-content (utf8/encode content)
          file-content [{:file/path file}]
          tx (if (contains? config/mldoc-support-formats format)
               (let [delete-blocks (delete-file-blocks! repo-url file)
                     [pages block-ids blocks] (extract-blocks-pages repo-url file content utf8-content)]
                 (concat file-content delete-blocks pages block-ids blocks))
               file-content)
          tx (concat tx [(let [t (tc/to-long (t/now))]
                           (cond->
                             {:file/path file
                              :file/last-modified-at t}
                             new?
                             (assoc :file/created-at t)))])]
      (transact! repo-url tx))))


(defn get-journals-length
  []
  (let [today (db-utils/date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :page/journal? true]
           [?page :page/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
      (declares/get-conn (state/get-current-repo))
      today)))

;; cache this
(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (declares/get-conn repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           today (db-utils/date->int (js/Date.))
           pages (->>
                   (react-queries/q repo-url [:journals] {:use-cache? false}
                     '[:find ?page-name ?journal-day
                       :in $ ?today
                       :where
                       [?page :page/name ?page-name]
                       [?page :page/journal? true]
                       [?page :page/journal-day ?journal-day]
                       [(<= ?journal-day ?today)]]
                     today)
                   (react-queries/react)
                   (sort-by last)
                   (reverse)
                   (map first)
                   (take n))]
       (mapv
         (fn [page]
           [page
            (get-page-format page)])
         pages)))))

(defn with-dummy-block
  ([blocks format]
   (with-dummy-block blocks format {} {}))
  ([blocks format default-option {:keys [journal? page-name]
                                  :or {journal? false}}]
   (let [format (or format (state/get-preferred-format) :markdown)
         blocks (if (and journal?
                         (seq blocks)
                         (when-let [title (second (first (:block/title (first blocks))))]
                           (date/valid-journal-title? title)))
                  (rest blocks)
                  blocks)
         blocks (vec blocks)]
     (cond
       (and (seq blocks)
            (or (and (> (count blocks) 1)
                     (:block/pre-block? (first blocks)))
              (and (>= (count blocks) 1)
                   (not (:block/pre-block? (first blocks))))))
       blocks

       :else
       (let [last-block (last blocks)
             end-pos (get-in last-block [:block/meta :end-pos] 0)
             dummy (merge last-block
                     (let [uuid (d/squuid)]
                       {:block/uuid uuid
                        :block/title ""
                        :block/content (config/default-empty-block format)
                        :block/format format
                        :block/level 2
                        :block/priority nil
                        :block/anchor (str uuid)
                        :block/meta {:start-pos end-pos
                                     :end-pos end-pos}
                        :block/body nil
                        :block/dummy? true
                        :block/marker nil
                        :block/pre-block? false})
                     default-option)]
         (conj blocks dummy))))))

(defn get-page-referenced-blocks
  [page]
  (when-let [repo (state/get-current-repo)]
    (when (declares/get-conn repo)
      (let [page-id (:db/id (db-utils/entity [:page/name page]))
            pages (page-alias-set repo page)]
        (->> (react-queries/q repo [:page/refed-blocks page-id] {}
               '[:find (pull ?block [*])
                 :in $ ?pages
                 :where
                 [?block :block/ref-pages ?ref-page]
                 [(contains? ?pages ?ref-page)]]
               pages)
          react-queries/react
          db-utils/seq-flatten
          (remove (fn [block]
                    (let [exclude-pages pages]
                      (contains? exclude-pages (:db/id (:block/page block))))))
          db-utils/sort-blocks
          db-utils/group-by-page)))))

(defn get-files-that-referenced-page
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (declares/get-conn repo)]
      (->> (d/q
             '[:find ?path
               :in $ ?page-id
               :where
               [?block :block/ref-pages ?page-id]
               [?block :block/page ?p]
               [?p :page/file ?f]
               [?f :file/path ?path]]
             db
             page-id)
        (db-utils/seq-flatten)))))

(defn get-page-unlinked-references
  [page]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (declares/get-conn repo)]
      (let [page-id (:db/id (db-utils/entity [:page/name page]))
            pages (page-alias-set repo page)
            pattern (re-pattern (str "(?i)" page))]
        (->> (d/q
               '[:find (pull ?block [*])
                 :in $ ?pattern
                 :where
                 [?block :block/content ?content]
                 [(re-find ?pattern ?content)]]
               conn
               pattern)
          db-utils/seq-flatten
          (remove (fn [block]
                    (let [ref-pages (set (map :db/id (:block/ref-pages block)))]
                      (or
                        (= (get-in block [:block/page :db/id]) page-id)
                        (seq (set/intersection
                               ref-pages
                               pages))))))
          db-utils/sort-blocks
          db-utils/group-by-page)))))

(defn get-matched-blocks
  [match-fn limit]
  (when-let [repo (state/get-current-repo)]
    (let [pred (fn [db content]
                 (match-fn content))]
      (->> (d/q
             '[:find ?block
               :in $ ?pred
               :where
               [?block :block/content ?content]
               [(?pred $ ?content)]]
             (declares/get-conn)
             pred)
        (take limit)
        db-utils/seq-flatten
        (db-utils/pull-many '[:block/uuid
                              :block/content
                              :block/properties
                              :block/format
                              {:block/page [:page/name]}])))))


;; TODO: Does the result preserves the order of the arguments?
(defn get-blocks-contents
  [repo block-uuids]
  (let [db (declares/get-conn repo)]
    (db-utils/pull-many repo '[:block/content]
      (mapv (fn [id] [:block/uuid id]) block-uuids))))


(defn journal-page?
  [page-name]
  (:page/journal? (db-utils/entity [:page/name page-name])))

(defn mark-repo-as-cloned!
  [repo-url]
  (transact!
    [{:repo/url repo-url
      :repo/cloned? true}]))

(defn cloned?
  [repo-url]
  (when-let [conn (declares/get-conn repo-url)]
    (->
      (d/q '[:find ?cloned
             :in $ ?repo-url
             :where
             [?repo :repo/url ?repo-url]
             [?repo :repo/cloned? ?cloned]]
        conn
        repo-url)
      ffirst)))


(defn reset-config!
  [repo-url content]
  (when-let [content (or content (react-queries/get-file repo-url (str config/app-name "/" config/config-file)))]
    (let [config (try
                   (reader/read-string content)
                   (catch js/Error e
                     (println "Parsing config file failed: ")
                     (js/console.dir e)
                     {}))]
      (state/set-config! repo-url config)
      config)))

(defn clear-repo-persistent-job!
  [repo]
  (when-let [old-job (get @db-utils/persistent-jobs repo)]
    (js/clearTimeout old-job)))

(defn start-db-conn!
  ([me repo]
   (start-db-conn! me repo {}))
  ([me repo {:keys [db-type]}]
   (let [files-db-name (declares/datascript-files-db repo)
         files-db-conn (d/create-conn db-schema/files-db-schema)
         db-name (declares/datascript-db repo)
         db-conn (d/create-conn db-schema/schema)]
     (swap! declares/conns assoc files-db-name files-db-conn)
     (swap! declares/conns assoc db-name db-conn)
     (d/transact! db-conn [(cond-> {:schema/version db-schema/version}
                             db-type
                             (assoc :db/type db-type))])
     (when me
       (d/transact! db-conn [(db-utils/me-tx (d/db db-conn) me)]))

     (db-utils/listen-and-persist! repo))))

(defn restore!
  [{:keys [repos] :as me} restore-config-handler]
  (let [logged? (:name me)]
    (doall
      (for [{:keys [url]} repos]
        (let [repo url

              db-name (declares/datascript-files-db repo)
              db-conn (d/create-conn db-schema/files-db-schema)]
          (swap! declares/conns assoc db-name db-conn)
          (p/let [stored (-> (idb/get-item db-name)
                             (p/then (fn [result]
                                       result))
                             (p/catch (fn [error]
                                        nil)))
                  _ (when stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db)))
                  db-name (declares/datascript-db repo)
                  db-conn (d/create-conn db-schema/schema)
                  _ (d/transact! db-conn [{:schema/version db-schema/version}])
                  _ (swap! declares/conns assoc db-name db-conn)
                  stored (idb/get-item db-name)
                  _ (if stored
                      (let [stored-db (db-utils/string->db stored)
                            attached-db (d/db-with stored-db [(db-utils/me-tx stored-db me)])]
                        (declares/reset-conn! db-conn attached-db))
                      (when logged?
                        (d/transact! db-conn [(db-utils/me-tx (d/db db-conn) me)])))]
            (restore-config-handler repo)
            (db-utils/listen-and-persist! repo)))))))

(defn build-global-graph
  [theme show-journal?]
  (let [dark? (= "dark" theme)
        current-page (:page/name (get-current-page))]
    (when-let [repo (state/get-current-repo)]
      (let [relation (get-pages-relation repo show-journal?)
            tagged-pages (get-all-tagged-pages repo)
            linked-pages (-> (concat
                               relation
                               tagged-pages)
                             flatten
                             set)
            all-pages (get-pages repo)
            other-pages (->> (remove linked-pages all-pages)
                          (remove nil?))
            other-pages (if show-journal? other-pages
                                          (remove date/valid-journal-title? other-pages))
            other-pages (if (seq other-pages)
                          (map string/lower-case other-pages)
                          other-pages)
            nodes (concat (seq relation)
                    (seq tagged-pages)
                    (if (seq other-pages)
                      (map (fn [page]
                             [page])
                        other-pages)
                      []))
            edges (db-utils/build-edges (remove
                                          (fn [[_ to]]
                                            (nil? to))
                                          nodes))
            nodes (db-utils/build-nodes dark? current-page edges nodes)]
        (db-utils/normalize-page-name
          {:nodes nodes
           :links edges})))))


(defn build-page-graph
  [page theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page (string/lower-case page)
            page-entity (db-utils/entity [:page/name page])
            original-page-name (:page/original-name page-entity)
            tags (->> (:page/tags page-entity)
                   (map :tag/name))
            tags (remove #(= page %) tags)
            ref-pages (get-page-referenced-pages repo page)
            mentioned-pages (get-pages-that-mentioned-page repo page)
            edges (concat
                    (map (fn [[p aliases]]
                           [page p]) ref-pages)
                    (map (fn [[p aliases]]
                           [p page]) mentioned-pages)
                    (map (fn [tag]
                           [page tag])
                      tags))
            other-pages (->> (concat (map first ref-pages)
                               (map first mentioned-pages))
                          (remove nil?)
                          (set))
            other-pages-edges (mapcat
                                (fn [page]
                                  (let [ref-pages (-> (map first (get-page-referenced-pages repo page))
                                                      (set)
                                                      (set/intersection other-pages))
                                        mentioned-pages (-> (map first (get-pages-that-mentioned-page repo page))
                                                            (set)
                                                            (set/intersection other-pages))]
                                    (concat
                                      (map (fn [p] [page p]) ref-pages)
                                      (map (fn [p] [p page]) mentioned-pages))))
                                other-pages)
            edges (->> (concat edges other-pages-edges)
                    (remove nil?)
                    (distinct)
                    (db-utils/build-edges))
            nodes (->> (concat
                         [page]
                         (map first ref-pages)
                         (map first mentioned-pages)
                         tags)
                    (remove nil?)
                    (distinct)
                    (db-utils/build-nodes dark? page edges))]
        (db-utils/normalize-page-name
          {:nodes nodes
           :links edges})))))


(defn blocks->vec-tree [col]
  (let [col (map (fn [h] (cond->
                           h
                           (not (:block/dummy? h))
                           (dissoc h :block/meta))) col)]
    (loop [col (reverse col)
           children (list)]
      (if (empty? col)
        children
        (let [[item & others] col
              cur-level (:block/level item)
              bottom-level (:block/level (first children))
              pre-block? (:block/pre-block? item)]
          (cond
            (empty? children)
            (recur others (list item))

            (<= bottom-level cur-level)
            (recur others (conj children item))

            pre-block?
            (recur others (cons item children))

            (> bottom-level cur-level)                      ; parent
            (let [[children other-children] (split-with (fn [h]
                                                          (> (:block/level h) cur-level))
                                              children)

                  children (cons
                             (assoc item :block/children children)
                             other-children)]
              (recur others children))))))))

;; recursively with children content for tree
(defn get-block-content-rec
  ([block]
   (get-block-content-rec block (fn [block] (:block/content block))))
  ([block transform-fn]
   (let [contents (atom [])
         _ (walk/prewalk
             (fn [form]
               (when (map? form)
                 (when-let [content (:block/content form)]
                   (swap! contents conj (transform-fn form))))
               form)
             block)]
     (apply util/join-newline @contents))))


(defn get-block-full-content
  ([repo block-id]
   (get-block-full-content repo block-id (fn [block] (:block/content block))))
  ([repo block-id transform-fn]
   (let [blocks (get-block-and-children-no-cache repo block-id)]
     (->> blocks
       (map transform-fn)
       (apply util/join-newline)))))

(defn get-block-end-pos-rec
  [repo block]
  (let [children (:block/children block)]
    (if (seq children)
      (get-block-end-pos-rec repo (last children))
      (if-let [end-pos (get-in block [:block/meta :end-pos])]
        end-pos
        (when-let [block (db-utils/entity repo [:block/uuid (:block/uuid block)])]
          (get-in block [:block/meta :end-pos]))))))

(defn collapse-block!
  [block]
  (let [repo (:block/repo block)]
    (transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? true}])))


(defn expand-block!
  [block]
  (let [repo (:block/repo block)]
    (transact! repo
      [{:block/uuid (:block/uuid block)
        :block/collapsed? false}])))

;; non recursive query

(defn get-block-ids
  [block]
  (let [ids (atom [])
        _ (walk/prewalk
            (fn [form]
              (when (map? form)
                (when-let [id (:block/uuid form)]
                  (swap! ids conj id)))
              form)
            block)]
    @ids))

(defn get-block-parents
  [repo block-id depth]
  (when-let [conn (declares/get-conn repo)]
    (loop [block-id block-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (get-block-parent repo block-id)]
          (recur (:block/uuid parent) (conj parents parent) (inc d))
          parents)))))


(defn get-block-page
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (db-utils/entity repo (:db/id (:block/page block)))))


(defn get-block-page-end-pos
  [repo page-name]
  (or
    (when-let [page-id (:db/id (db-utils/entity repo [:page/name (string/lower-case page-name)]))]
      (when-let [db (declares/get-conn repo)]
        (let [block-eids (->> (d/datoms db :avet :block/page page-id)
                           (mapv :e))]
          (when (seq block-eids)
            (let [blocks (db-utils/pull-many repo '[:block/meta] block-eids)]
              (-> (last (db-utils/sort-by-pos blocks))
                  (get-in [:block/meta :end-pos])))))))
    ;; TODO: need more thoughts
    0))


(defn add-page-to-recent!
  [repo page]
  (let [pages (or (get-key-value repo :recent/pages)
                '())
        new-pages (take 12 (distinct (cons page pages)))]
    (set-key-value repo :recent/pages new-pages)))


(defn pre-block-with-only-title?
  [repo block-id]
  (when-let [block (db-utils/entity repo [:block/uuid block-id])]
    (let [properties (:page/properties (:block/page block))]
      (and (:title properties)
           (= 1 (count properties))
           (let [ast (mldoc/->edn (:block/content block) (mldoc/default-config (:block/format block)))]
             (or
               (empty? (rest ast))
               (every? (fn [[[typ break-lines]] _]
                         (and (= typ "Paragraph")
                              (every? #(= % ["Break_Line"]) break-lines))) (rest ast))))))))


(defn run-batch-txs!
  []
  (let [chan (state/get-db-batch-txs-chan)]
    (async/go-loop []
      (let [f (async/<! chan)]
        (f))
      (recur))
    chan))

(defn get-all-templates
  []
  (let [pred (fn [_ properties]
               (some? (get properties "template")))]
    (->> (d/q
           '[:find ?b ?p
             :in $ ?pred
             :where
             [?b :block/properties ?p]
             [(?pred $ ?p)]]
           (declares/get-conn)
           pred)
      (map (fn [[e m]]
             [(get m "template") e]))
      (into {}))))

(defn template-exists?
  [title]
  (when title
    (let [templates (keys (get-all-templates))]
      (when (seq templates)
        (let [templates (map string/lower-case templates)]
          (contains? (set templates) (string/lower-case title)))))))

(defn rebuild-page-blocks-children
  "For performance reason, we can update the :block/children value after every operation,
  but it's hard to make sure that it's correct, also it needs more time to implement it.
  We can improve it if the performance is really an issue."
  [repo page]
  (let [blocks (->>
                 (get-page-blocks-no-cache repo page {:pull-keys '[:db/id :block/uuid :block/level :block/pre-block? :block/meta]})
                 (remove :block/pre-block?)
                 (map #(select-keys % [:db/id :block/uuid :block/level]))
                 (reverse))
        original-blocks blocks]
    (loop [blocks blocks
           tx []
           children {}
           last-level 10000]
      (if (seq blocks)
        (let [[{:block/keys [uuid level] :as block} & others] blocks
              [tx children] (cond
                              (< level last-level)          ; parent
                              (let [cur-children (get children last-level)
                                    tx (if (seq cur-children)
                                         (vec
                                           (concat
                                             tx
                                             (map
                                               (fn [child]
                                                 [:db/add (:db/id block) :block/children [:block/uuid child]])
                                               cur-children)))
                                         tx)
                                    children (-> children
                                                 (dissoc last-level)
                                                 (update level conj uuid))]
                                [tx children])

                              (> level last-level)          ; child of sibling
                              (let [children (update children level conj uuid)]
                                [tx children])

                              :else                         ; sibling
                              (let [children (update children last-level conj uuid)]
                                [tx children]))]
          (recur others tx children level))
        ;; TODO: add top-level children to the "Page" block (we might remove the Page from db schema)
        (when (seq tx)
          (let [delete-tx (map (fn [block]
                                 [:db/retract (:db/id block) :block/children])
                            original-blocks)]
            (->> (concat delete-tx tx)
              (remove nil?))))))))

(defn clean-export!
  [db]
  (let [remove? #(contains? #{"me" "recent" "file"} %)
        filtered-db (d/filter db
                      (fn [db datom]
                        (let [ns (namespace (:a datom))]
                          (not (remove? ns)))))
        datoms (d/datoms filtered-db :eavt)]
    @(d/conn-from-datoms datoms db-schema/schema)))

(defn filter-only-public-pages-and-blocks
  [db]
  (let [public-pages (get-public-pages db)
        contents-id (:db/id (db-utils/entity [:page/name "contents"]))]
    (when (seq public-pages)
      (let [public-pages (set (conj public-pages contents-id))
            page-or-block? #(contains? #{"page" "block" "me" "recent" "file"} %)
            filtered-db (d/filter db
                          (fn [db datom]
                            (let [ns (namespace (:a datom))]
                              (or
                                (not (page-or-block? ns))
                                (and (= ns "page")
                                     (contains? public-pages (:e datom)))
                                (and (= ns "block")
                                     (contains? public-pages (:db/id (:block/page (d/entity db (:e datom))))))))))
            datoms (d/datoms filtered-db :eavt)]
        @(d/conn-from-datoms datoms db-schema/schema)))))

(defn get-db-type
  [repo]
  (get-key-value repo :db/type))

(defn local-native-fs?
  [repo]
  (= :local-native-fs (get-db-type repo)))
