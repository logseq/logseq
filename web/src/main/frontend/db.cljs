(ns frontend.db
  (:require [datascript.core :as d]
            [frontend.util :as util]
            [frontend.date :as date]
            [medley.core :as medley]
            [datascript.transit :as dt]
            [frontend.format :as format]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.block :as block]
            [frontend.state :as state]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.utf8 :as utf8]
            [cljs-bean.core :as bean]
            [frontend.config :as config]
            [rum.core :as rum]
            [goog.object :as gobj]
            ["localforage" :as localforage]
            [promesa.core :as p]
            [cljs.reader :as reader]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]
            [clojure.walk :as walk]
            [frontend.util :as util :refer-macros [profile]]
            [frontend.extensions.sci :as sci]
            [goog.array :as garray]
            [frontend.db-schema :as db-schema]))

(defonce brain "🧠")
(defonce brain-text "logseq-second-brain")

;; offline db
(def store-name "dbs")
(.config localforage
         (bean/->js
          {:name "logseq-datascript"
           :version 1.0
           :storeName store-name}))

(defonce localforage-instance (.createInstance localforage store-name))

;; (defn clear-store!
;;   []
;;   (p/let [_ (.clear localforage)
;;           dbs (js/window.indexedDB.databases)]
;;     (doseq [db dbs]
;;       (js/window.indexedDB.deleteDatabase (gobj/get db "name")))))

(defn get-repo-path
  [url]
  (if (string/starts-with? url "http")
    (->> (take-last 2 (string/split url #"/"))
         (string/join "/"))
    url))

(defn datascript-db
  [repo]
  (when repo
    (str "logseq-db/" (get-repo-path repo))))

(defn datascript-files-db
  [repo]
  (when repo
    (str "logseq-files-db/" (get-repo-path repo))))

(defn remove-db!
  [repo]
  (.removeItem localforage-instance (datascript-db repo)))

(defn remove-files-db!
  [repo]
  (.removeItem localforage-instance (datascript-files-db repo)))

(def react util/react)

(defn get-repo-name
  [url]
  (last (string/split url #"/")))

(defonce conns
  (atom {}))

(defn get-conn
  ([]
   (get-conn (state/get-current-repo) true))
  ([repo-or-deref?]
   (if (boolean? repo-or-deref?)
     (get-conn (state/get-current-repo) repo-or-deref?)
     (get-conn repo-or-deref? true)))
  ([repo deref?]
   (let [repo (if repo repo (state/get-current-repo))]
     (when-let [conn (get @conns (datascript-db repo))]
       (if deref?
         @conn
         conn)))))

(defn get-files-conn
  [repo]
  (get @conns (datascript-files-db repo)))

(defn remove-conn!
  [repo]
  (swap! conns dissoc (datascript-db repo))
  (swap! conns dissoc (datascript-files-db repo))
  )

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn db->json [db]
  (js/JSON.stringify
   (into-array
    (for [d (d/datoms db :eavt)]
      #js [(:e d) (name (:a d)) (:v d)]))))

(defn string->db [s]
  (dt/read-transit-str s))

;; persisting DB between page reloads
(defn persist [repo db files-db?]
  (.setItem localforage-instance
            (if files-db?
              (datascript-files-db repo)
              (datascript-db repo))
            (db->string db)))

(defn reset-conn! [conn db]
  (reset! conn db))

;; Query atom of map of Key ([repo q inputs]) -> atom
(defonce query-state (atom {}))

(defn clear-query-state!
  []
  (reset! query-state {}))

(defn add-q!
  [k query inputs result-atom transform-fn query-fn]
  (swap! query-state assoc k {:query query
                              :inputs inputs
                              :result result-atom
                              :query-fn query-fn
                              :transform-fn transform-fn})
  result-atom)

(defn remove-q!
  [k]
  (swap! query-state dissoc k))

;; TODO: rename :custom to :query/custom
(defn remove-custom-query!
  [repo query]
  (remove-q! [repo :custom query]))

(defn set-new-result!
  [k new-result]
  (when-let [result-atom (get-in @query-state [k :result])]
    (reset! result-atom new-result)))

(defn entity
  ([id-or-lookup-ref]
   (entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (when-let [db (get-conn repo)]
     (d/entity db id-or-lookup-ref))))

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
        (entity (if tag?
                  [:page/name page-name]
                  [:tag/name page-name]))))))

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

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [conn (get-conn repo)]
     (try
       (d/pull conn
               selector
               eid)
       (catch js/Error e
         nil)))))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [conn (get-conn repo)]
     (d/pull-many conn selector eids))))

(defn get-handler-keys
  [{:keys [key data]}]
  (cond
    (coll? key)
    [key]

    :else
    (case key
      :heading/change
      (when (seq data)
        (let [headings data
              pre-heading? (:heading/pre-heading? (first headings))
              current-priority (get-current-priority)
              current-marker (get-current-marker)
              current-page-id (:page/id (get-current-page))
              {:heading/keys [page]} (first headings)
              handler-keys (->>
                            (util/concat-without-nil
                             (mapcat
                              (fn [heading]
                                (when-let [page-id (:db/id (:heading/page heading))]
                                  [[:headings (:heading/uuid heading)]
                                   [:page/headings page-id]
                                   [:page/ref-pages page-id]]))
                              headings)

                             (when pre-heading?
                               [[:contents]])

                             ;; affected priority
                             (when current-priority
                               [[:priority/headings current-priority]])

                             (when current-marker
                               [[:marker/headings current-marker]])

                             (when current-page-id
                               [[:page/ref-pages current-page-id]
                                [:page/refed-headings current-page-id]
                                [:page/mentioned-pages current-page-id]])

                             ;; refed-pages
                             (apply concat
                               (for [{:heading/keys [ref-pages]} headings]
                                 (map (fn [page]
                                        (when-let [page (entity [:page/name (:page/name page)])]
                                          [:page/refed-headings (:db/id page)]))
                                   ref-pages))))
                            (distinct))
              refed-pages (map
                            (fn [[k page-id]]
                              (if (= k :page/refed-headings)
                                [:page/ref-pages page-id]))
                            handler-keys)
              custom-queries (some->>
                              (filter (fn [v]
                                        (and (= (first v) (state/get-current-repo))
                                             (= (second v) :custom)))
                                      (keys @query-state))
                              (map (fn [v]
                                     (vec (drop 1 v)))))
              heading-blocks (some->>
                              (filter (fn [v]
                                        (and (= (first v) (state/get-current-repo))
                                             (= (second v) :heading/block)))
                                      (keys @query-state))
                              (map (fn [v]
                                     (vec (drop 1 v)))))]
          (->>
           (util/concat-without-nil
            handler-keys
            refed-pages
            custom-queries
            heading-blocks)
           distinct)))
      [[key]])))

(defn q
  [repo k {:keys [use-cache? files-db? transform-fn query-fn]
           :or {use-cache? true
                files-db? false
                transform-fn identity}} query & inputs]
  (let [kv? (and (vector? k) (= :kv (first k)))
        k (vec (cons repo k))]
    (when-let [conn (if files-db?
                      (deref (get-files-conn repo))
                      (get-conn repo))]
      (let [result-atom (:result (get @query-state k))]
        (if (and use-cache? result-atom)
          result-atom
          (let [result (cond
                         query-fn
                         (query-fn conn)

                         kv?
                         (d/entity conn (last k))

                         (seq inputs)
                         (apply d/q query conn inputs)

                         :else
                         (d/q query conn))
                result (transform-fn result)
                result-atom (or result-atom (atom nil))]
            ;; Don't notify watches now
            (set! (.-state result-atom) result)
            (add-q! k query inputs result-atom transform-fn query-fn)))))))

(defn seq-flatten [col]
  (flatten (seq col)))

(defn- distinct-result
  [query-result]
  (-> query-result
      seq-flatten
      distinct))

(defn- date->int
  [date]
  (util/parse-int
   (string/replace (date/ymd date) "/" "")))

(defn- resolve-input
  [input]
  (cond
    (= :today input)
    (date->int (t/today))
    (= :yesterday input)
    (date->int (t/yesterday))
    (= :tomorrow input)
    (date->int (t/plus (t/today) (t/days 1)))
    (and (keyword? input)
         (re-find #"^\d+d(-before)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (date->int (t/minus (t/today) (t/days days))))
    (and (keyword? input)
         (re-find #"^\d+d(-after)?$" (name input)))
    (let [input (name input)
          days (util/parse-int (subs input 0 (dec (count input))))]
      (date->int (t/plus (t/today) (t/days days))))

    :else
    input))

(defn- sort-by-pos
  [headings]
  (sort-by
   #(get-in % [:heading/meta :pos])
   headings))

(defn- sort-headings
  [headings]
  (let [pages-ids (map (comp :db/id :heading/page) headings)
        pages (pull-many '[:db/id :page/last-modified-at :page/name :page/original-name] pages-ids)
        pages-map (reduce (fn [acc p] (assoc acc (:db/id p) p)) {} pages)
        headings (map
                   (fn [heading]
                     (assoc heading :heading/page
                            (get pages-map (:db/id (:heading/page heading)))))
                   headings)]
    (sort-by-pos headings)))

(defn group-by-page
  [headings]
  (some->> headings
           (group-by :heading/page)
           (sort-by (fn [[p headings]] (:page/last-modified-at p)) >)))

(defn- with-repo
  [repo headings]
  (map (fn [heading]
         (assoc heading :heading/repo repo))
    headings))

(defn custom-query
  ([query]
   (custom-query query {}))
  ([query query-opts]
   (when-let [query (cond
                      (and (string? query)
                           (not (string/blank? query)))
                      (reader/read-string query)

                      (map? query)
                      query

                      :else
                      nil)]
     (try
       (let [{:keys [query inputs result-transform]} query
             inputs (map resolve-input inputs)
             repo (state/get-current-repo)
             k [:custom query]]
         (apply q repo k query-opts query inputs))
       (catch js/Error e
         (println "Query parsing failed: ")
         (js/console.dir e))))))

(defn custom-query-result-transform
  [query-result remove-headings q]
  (let [repo (state/get-current-repo)
        result (seq-flatten query-result)
        heading? (:heading/uuid (first result))]
    (if heading?
      (let [result (if (seq remove-headings)
                     (let [remove-headings (set remove-headings)]
                       (remove (fn [h]
                                 (contains? remove-headings (:heading/uuid h)))
                               result))
                     result)
            result (some->> result
                            (with-repo repo)
                            (sort-headings))]
        (if-let [result-transform (:result-transform q)]
          (if-let [f (sci/eval-string (pr-str result-transform))]
            (sci/call-fn f result)
            result)
          (group-by-page result)))
      result)))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (let [tx-data (->> (util/remove-nils tx-data)
                      (remove nil?))]
     (when (seq tx-data)
       (when-let [conn (get-conn repo-url false)]
         (d/transact! conn (vec tx-data)))))))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [db (get-conn repo-url)]
     (some-> (d/entity db key)
             key))))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when (get-conn repo-url)
     (-> (q repo-url [:kv key] {} key key)
         react
         key))))

(defn transact-react!
  [repo-url tx-data {:keys [key data files-db?] :as handler-opts
                     :or {files-db? false}}]
  (let [repo-url (or repo-url (state/get-current-repo))
        tx-data (->> (util/remove-nils tx-data)
                     (remove nil?))
        get-conn (fn [] (if files-db?
                          (get-files-conn repo-url)
                          (get-conn repo-url false)))]
    (when (and (seq tx-data) (get-conn))
      (let [tx-result (profile "Transact!" (d/transact! (get-conn) (vec tx-data)))
            db (:db-after tx-result)
            handler-keys (get-handler-keys handler-opts)]
        (doseq [handler-key handler-keys]
          (let [handler-key (vec (cons repo-url handler-key))]
            (when-let [cache (get @query-state handler-key)]
              (let [{:keys [query inputs transform-fn query-fn]} cache]
                (when (or query query-fn)
                  (let [new-result (->
                                    (cond
                                      query-fn
                                      (profile
                                       "Query:"
                                       (doall (query-fn db)))

                                      (keyword? query)
                                      (get-key-value repo-url query)

                                      (seq inputs)
                                      (apply d/q query db inputs)

                                      :else
                                      (d/q query db))
                                    transform-fn)]
                    (set-new-result! handler-key new-result)))))))))))

(defn pull-heading
  [id]
  (let [repo (state/get-current-repo)]
    (when (get-conn repo)
      (->
       (q repo [:headings id] {}
         '[:find (pull ?heading [*])
           :in $ ?id
           :where
           [?heading :heading/uuid ?id]]
         id)
       react
       ffirst))))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

;; queries

(defn get-all-tags
  []
  (let [repo (state/get-current-repo)]
    (when (get-conn repo)
      (some->>
       (q repo [:tags] {}
         '[:find ?name ?h ?p
           :where
           [?t :tag/name ?name]
           (or
            [?h :heading/tags ?t]
            [?p :page/tags ?t])])
       react
       (seq)
       ;; (map first)
       ;; frequencies
       ;; (util/sort-by-value :desc)
       ))))

(defn- remove-journal-files
  [files]
  (remove
   (fn [file]
     (string/starts-with? file "journals/"))
   files))

(defn get-pages
  [repo]
  (->> (q repo [:pages] {:use-cache? false}
         '[:find ?page-name
           :where
           [?page :page/original-name ?page-name]])
       (react)
       (map first)))

(defn get-sync-metadata
  [repo]
  (if-let [conn (get-conn repo)]
    (let [pages (->>
                 (d/q
                   '[:find (pull ?page [:page/name :page/created-at
                                        :page/last-modified-at :page/contributors])
                     :where [?page :page/name]]
                   conn)
                 (seq-flatten)
                 (sort-by :page/last-modified-at)
                 (reverse))
          files (->>
                 (d/q
                   '[:find (pull ?file [:file/path :file/created-at
                                        :file/last-modified-at])
                     :where [?file :file/path]]
                   conn)
                 (seq-flatten)
                 (sort-by :file/last-modified-at)
                 (reverse))]
      (concat pages files))
    {:tx-data []}))

(defn get-pages-with-modified-at
  [repo]
  (let [now-long (tc/to-long (t/now))]
    (->> (q repo [:pages] {:use-cache? false}
           '[:find ?page-name ?modified-at
             :where
             [?page :page/original-name ?page-name]
             [(get-else $ ?page :page/journal? false) ?journal]
             [(get-else $ ?page :page/last-modified-at 0) ?modified-at]
             ;; (or
             ;;  ;; journal pages, can't be empty
             ;;  (and [(true? ?journal)]
             ;;       [?h :heading/page ?page]
             ;;       [?h :heading/level ?level]
             ;;       [(> ?level 1)])
             ;;  ;; non-journals, might be empty pages
             ;;  (and [(false? ?journal)]
             ;;       [?h :heading/page]
             ;;       [?h :heading/level ?level]))
             ])
         (react)
         (seq)
         (sort-by (fn [[page modified-at]]
                    [modified-at page]))
         (reverse)
         (remove (fn [[page modified-at]]
                   (or (util/file-page? page)
                       (and modified-at
                            (> modified-at now-long))))))))

(defn get-page-alias
  [repo page-name]
  (when-let [conn (and repo (get-conn repo))]
    (some->> (d/q '[:find ?alias
                    :in $ ?page-name
                    :where
                    [?page :page/name ?page-name]
                    [?page :page/alias ?alias]
                    [?page :page/journal? false]]
               conn
               page-name)
             seq-flatten
             distinct)))

(defn get-page-alias-names
  [repo page-name]
  (let [alias-ids (get-page-alias repo page-name)]
    (when (seq alias-ids)
      (->> (d/pull-many (get-conn repo)
                        '[:page/name]
                        alias-ids)
           (map :page/name)
           distinct))))

(defn get-files
  [repo]
  (when-let [conn (get-conn repo)]
    (->> (q repo [:files] {:use-cache? false}
           '[:find ?path ?modified-at
             :where
             [?file :file/path ?path]
             [(get-else $ ?file :file/last-modified-at 0) ?modified-at]])
         (react)
         (seq)
         (sort-by last)
         (reverse))))

(defn get-files-headings
  [repo-url paths]
  (let [paths (set paths)
        pred (fn [db e]
               (contains? paths e))]
    (-> (d/q '[:find ?heading
               :in $ ?pred
               :where
               [?file :file/path ?path]
               [(?pred $ ?path)]
               [?heading :heading/file ?file]]
          (get-conn repo-url) pred)
        seq-flatten)))

(defn delete-headings
  [repo-url files]
  (when (seq files)
    (let [headings (get-files-headings repo-url files)]
      (mapv (fn [eid] [:db.fn/retractEntity eid]) headings))))

(defn delete-files
  [files]
  (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files))

(defn get-file-headings
  [repo-url path]
  (-> (d/q '[:find ?heading
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?heading :heading/file ?file]]
        (get-conn repo-url) path)
      seq-flatten))

(defn get-file-after-headings
  [repo-url file-id end-pos]
  (when end-pos
    (let [pred (fn [db meta]
                 (>= (:pos meta) end-pos))]
      (-> (d/q '[:find (pull ?heading [*])
                 :in $ ?file-id ?pred
                 :where
                 [?heading :heading/file ?file-id]
                 [?heading :heading/meta ?meta]
                 [(?pred $ ?meta)]]
            (get-conn repo-url) file-id pred)
          seq-flatten
          sort-by-pos))))

(defn get-file-after-headings-meta
  ([repo-url file-id end-pos]
   (get-file-after-headings-meta repo-url file-id end-pos false))
  ([repo-url file-id end-pos content-level?]
   (let [db (get-conn repo-url)
         headings (d/datoms db :avet :heading/file file-id)
         eids (mapv :e headings)
         ks (if content-level?
              '[:heading/uuid :heading/meta :heading/content :heading/level]
              '[:heading/uuid :heading/meta])
         headings (d/pull-many db ks eids)]
     (->> (filter (fn [{:heading/keys [meta]}]
                    (>= (:pos meta) end-pos)) headings)
          sort-by-pos))))

(defn delete-file-headings!
  [repo-url path]
  (let [headings (get-file-headings repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))

(defn set-file-content!
  [repo path content]
  (when (and repo path)
    (transact-react!
     repo
     [{:file/path path
       :file/content content}]
     {:key [:file/content path]
      :files-db? true})))

(defn get-file
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (->
      (q repo [:file/content path]
        {:files-db? true
         :use-cache? true}
        '[:find ?content
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?file :file/content ?content]
          ]
        path)
      react
      ffirst))))

(defn reset-contents-and-headings!
  [repo-url contents headings-pages delete-files delete-headings]
  (let [files (doall
               (map (fn [[file content]]
                      (set-file-content! repo-url file content)
                      {:file/path file})
                 contents))
        all-data (-> (concat delete-files delete-headings files headings-pages)
                     (util/remove-nils))]
    (transact! repo-url all-data)))

(defn get-heading-by-uuid
  [uuid]
  (entity [:heading/uuid uuid]))

(defn remove-key
  [repo-url key]
  (transact! repo-url [[:db.fn/retractEntity [:db/ident key]]])
  (set-new-result! [repo-url :kv key] nil))

(defn set-key-value
  [repo-url key value]
  (if value
    (transact-react! repo-url [(kv key value)]
                     {:key [:kv key]})
    (remove-key repo-url key)))

(defn get-page-format
  [page-name]
  (when-let [file (:page/file (entity [:page/name page-name]))]
    (when-let [path (:file/path (entity (:db/id file)))]
      (format/get-format path))))

(defn page-alias-set
  [repo-url page]
  (when-let [page-id (:db/id (entity [:page/name page]))]
    (let [aliases (get-page-alias repo-url page)]
      (set (conj aliases page-id)))))

(defn page-headings-transform
  [repo-url result]
  (let [result (seq-flatten result)
        sorted (sort-by-pos result)]
    (with-repo repo-url sorted)))

(defn get-marker-headings
  [repo-url marker]
  (let [marker (string/upper-case marker)]
    (some->>
     (q repo-url [:marker/headings marker]
       {:use-cache? true}
       '[:find (pull ?h [*])
         :in $ ?marker
         :where
         [?h :heading/marker ?m]
         [(= ?marker ?m)]]
       marker)
     react
     seq-flatten
     sort-by-pos
     (with-repo repo-url)
     (sort-headings)
     (group-by-page))))

;; (defn get-page-headings-old
;;   [repo-url page]
;;   (let [page (string/lower-case page)
;;         page-id (:db/id (entity repo-url [:page/name page]))]
;;     (some->
;;      (q repo-url [:page/headings page-id]
;;        {:use-cache? false
;;         :transform-fn #(page-headings-transform repo-url %)}
;;        '[:find (pull ?heading [*])
;;          :in $ ?page-id
;;          :where
;;          [?heading :heading/page ?page-id]]
;;        page-id)
;;      react)))

(defn get-page-directives
  [page]
  (when-let [page (entity [:page/name page])]
    (:page/directives page)))

(defn add-directives!
  [page-format directives-content directives]
  (let [directives (medley/map-keys name directives)
        lines (string/split-lines directives-content)
        directive-keys (keys directives)
        prefix-f (case page-format
                   :org (fn [k]
                          (str "#+" (string/upper-case k) ": "))
                   :markdown (fn [k]
                               (str (string/lower-case k) ": "))
                   identity)
        exists? (atom #{})
        lines (doall
               (mapv (fn [line]
                       (let [result (filter #(and (string/starts-with? line (prefix-f %))
                                                  %)
                                            directive-keys)]
                         (if (seq result)
                           (let [k (first result)]
                             (swap! exists? conj k)
                             (str (prefix-f k) (get directives k)))
                           line))) lines))
        lines (concat
               lines
               (let [not-exists (remove
                                 (fn [[k _]]
                                   (contains? @exists? k))
                                 directives)]
                 (when (seq not-exists)
                   (mapv
                    (fn [[k v]] (str (prefix-f k) v))
                    not-exists))))]
    (string/join "\n" lines)))

(defn get-page-headings
  ([page]
   (get-page-headings (state/get-current-repo) page))
  ([repo-url page]
   (let [page (string/lower-case page)
         page-id (:db/id (entity repo-url [:page/name page]))
         db (get-conn repo-url)]
     (when page-id
       (some->
        (q repo-url [:page/headings page-id]
          {:use-cache? true
           :transform-fn #(page-headings-transform repo-url %)
           :query-fn (fn [db]
                       (let [datoms (d/datoms db :avet :heading/page page-id)
                             heading-eids (mapv :e datoms)]
                         (d/pull-many db '[*] heading-eids)))}
          nil)
        react)))))

(defn get-page-directives-content
  [page]
  (let [headings (get-page-headings page)]
    (and (:heading/pre-heading? (first headings))
         (:heading/content (first headings)))))

(defn heading-and-children-transform
  [result repo-url heading-uuid level]
  (some->> result
           seq-flatten
           sort-by-pos
           (take-while (fn [h]
                         (or
                          (= (:heading/uuid h)
                             heading-uuid)
                          (> (:heading/level h) level))))
           (with-repo repo-url)))

(defn get-heading-children
  [repo heading-uuid]
  (when-let [conn (get-conn repo)]
    (let [eid (:db/id (entity repo [:heading/uuid heading-uuid]))
          ids (->> (d/q
                     '[:find ?e1
                       :in $ ?e2 %
                       :where (parent ?e2 ?e1)]
                     conn
                     eid
                     ;; recursive rules
                     '[[(parent ?e2 ?e1)
                        [?e2 :heading/children ?e1]]
                       [(parent ?e2 ?e1)
                        [?t :heading/children ?e1]
                        [?t :heading/uuid ?tid]
                        (parent ?e2 ?tid)]])
                   (seq-flatten))]
      (when (seq ids)
        (d/pull-many conn '[*]
                     (map (fn [id] [:heading/uuid id]) ids))))))

(defn get-heading-and-children
  [repo heading-uuid]
  (let [heading (entity repo [:heading/uuid heading-uuid])
        page (:db/id (:heading/page heading))
        pos (:pos (:heading/meta heading))
        level (:heading/level heading)
        pred (fn [data meta]
               (>= (:pos meta) pos))]
    (some-> (q repo [:heading/block heading-uuid]
              {:use-cache? true
               :transform-fn #(heading-and-children-transform % repo heading-uuid level)}
              '[:find (pull ?heading [*])
                :in $ ?page ?pred
                :where
                [?heading :heading/page ?page]
                [?heading :heading/meta ?meta]
                [(?pred $ ?meta)]]
              page
              pred)
            react)))

(defn get-file-page
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (get-conn repo)]
      (some->
       (d/q
         '[:find ?page-name
           :in $ ?path
           :where
           [?file :file/path ?path]
           [?page :page/file ?file]
           [?page :page/original-name ?page-name]]
         conn file-path)
       seq-flatten
       first))))

(defn get-page-file
  [page-name]
  (some-> (entity [:page/name page-name])
          :page/file))

(defn get-file-page-id
  [file-path]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (get-conn repo)]
      (some->
       (d/q
         '[:find ?page
           :in $ ?path
           :where
           [?file :file/path ?path]
           [?page :page/file ?file]]
         conn file-path)
       seq-flatten
       first))))

(defn get-page
  [page-name]
  (if (util/uuid-string? page-name)
    (entity [:heading/uuid (uuid page-name)])
    (entity [:page/name page-name])))

(defn get-page-name
  [file ast]
  ;; headline
  (let [file-page-name (get-file-page file)
        first-heading (last (first (filter block/heading-block? ast)))
        directive-name (when (and (= "Directives" (ffirst ast))
                                  (not (string/blank? (:title (last (first ast))))))
                         (:title (last (first ast))))
        first-heading-name (and first-heading
                                ;; FIXME:
                                (str (last (first (:title first-heading)))))]
    (or
     directive-name
     file-page-name
     first-heading-name
     file)))

(defn get-heading-content
  [utf8-content heading]
  (let [meta (:heading/meta heading)]
    (if-let [end-pos (:end-pos meta)]
      (utf8/substring utf8-content
                      (:pos meta)
                      end-pos)
      (utf8/substring utf8-content
                      (:pos meta)))))

(defn extract-page-list
  [content]
  (when-not (string/blank? content)
    (->> (re-seq #"\[\[([^\]]+)]]" content)
         (map last)
         (remove nil?)
         (map string/lower-case)
         (distinct))))

(defn extract-pages-and-headings
  [format ast directives file content utf8-content journal? pages-fn]
  (try
    (let [now (tc/to-long (t/now))
          headings (block/extract-headings ast (utf8/length utf8-content) utf8-content)
          pages (pages-fn headings ast)
          ref-pages (atom #{})
          headings (doall
                    (mapcat
                     (fn [[page headings]]
                       (if page
                         (map (fn [heading]
                                (let [heading-ref-pages (seq (:heading/ref-pages heading))]
                                  (when heading-ref-pages
                                    (swap! ref-pages set/union (set heading-ref-pages)))
                                  (-> heading
                                      (dissoc :ref-pages)
                                      (assoc :heading/content (get-heading-content utf8-content heading)
                                             :heading/file [:file/path file]
                                             :heading/format format
                                             :heading/page [:page/name (string/lower-case page)]
                                             :heading/ref-pages (mapv
                                                                 (fn [page]
                                                                   (block/page-with-journal page))
                                                                 heading-ref-pages)))))
                           headings)))
                     (remove nil? pages)))
          pages (map
                  (fn [page]
                    (let [page-file? (= page (string/lower-case file))
                          other-alias (and (:alias directives)
                                           (seq (remove #(= page %)
                                                        (:alias directives))))
                          other-alias (distinct
                                       (remove nil? other-alias))
                          journal-date-long (if journal?
                                              (date/journal-title->long (string/capitalize page)))
                          page-list (when-let [list-content (:list directives)]
                                      (extract-page-list list-content))]
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
                        (seq directives)
                        (assoc :page/directives directives)

                        (seq page-list)
                        (assoc :page/list page-list)

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

                        (or (:tags directives) (:roam_tags directives))
                        (assoc :page/tags (let [tags (:tags directives)
                                                roam-tags (:roam_tags directives)
                                                tags (if (string? tags)
                                                       (string/split tags #",")
                                                       tags)
                                                tags (->> (concat tags roam-tags)
                                                          (remove nil?)
                                                          (distinct))]
                                            (util/->tags tags))))))
                  (->> (map first pages)
                       (remove nil?)))
          pages (concat
                 pages
                 (map
                   (fn [page]
                     {:page/original-name page
                      :page/name (string/lower-case page)})
                   @ref-pages))]
      (vec
       (->> (concat
             pages
             headings)
            (remove nil?))))
    (catch js/Error e
      (js/console.log e))))

(defn parse-directives
  [content format]
  (let [ast (mldoc/->edn content
                         (mldoc/default-config format))
        directives (let [directives (and (seq ast)
                                         (= "Directives" (ffirst ast))
                                         (last (first ast)))]
                     (if (and directives (seq directives))
                       directives))]
    (into {} directives)))

;; check journal formats and report errors
(defn extract-headings-pages
  [file content utf8-content]
  (if (string/blank? content)
    []
    (let [journal? (string/starts-with? file "journals/")
          format (format/get-format file)
          ast (mldoc/->edn content
                           (mldoc/default-config format))
          directives (let [directives (and (seq ast)
                                           (= "Directives" (ffirst ast))
                                           (last (first ast)))]
                       (if (and directives (seq directives))
                         directives))]
      (if journal?
        (extract-pages-and-headings
         format ast directives
         file content utf8-content true
         (fn [headings _ast]
           (loop [pages {}
                  last-page-name nil
                  headings headings]
             (if (seq headings)
               (let [[{:heading/keys [level title] :as heading} & tl] headings]
                 (if (and (= level 1)
                          (when-let [title (last (first title))]
                            (date/valid-journal-title? title)))
                   (let [page-name (last (first title))
                         new-pages (assoc pages page-name [heading])]
                     (recur new-pages page-name tl))
                   (let [new-pages (update pages last-page-name (fn [headings]
                                                                  (vec (conj headings heading))))]
                     (recur new-pages last-page-name tl))))
               pages))))
        (extract-pages-and-headings
         format ast directives
         file content utf8-content false
         (fn [headings ast]
           [[(get-page-name file ast) headings]]))))))

(defn extract-all-headings-pages
  [contents]
  (vec
   (mapcat
    (fn [[file content] contents]
      (prn "Parsing : " file)
      (when content
        (let [utf8-content (utf8/encode content)]
          (extract-headings-pages file content utf8-content))))
    contents)))

;; TODO: compare headings
(defn reset-file!
  [repo-url file content]
  (let [new? (nil? (entity [:file/path file]))]
    (set-file-content! repo-url file content)
    (let [format (format/get-format file)
          utf8-content (utf8/encode content)
          file-content [{:file/path file}]
          tx (if (contains? config/hiccup-support-formats format)
               (let [delete-headings (delete-file-headings! repo-url file)
                     headings-pages (extract-headings-pages file content utf8-content)]
                 (concat file-content delete-headings headings-pages))
               file-content)
          tx (concat tx [(let [t (tc/to-long (t/now))]
                           (cond->
                             {:file/path file
                              :file/last-modified-at t}
                             new?
                             (assoc :file/created-at t)))])]
      (transact! repo-url tx))))

(defn get-current-journal-path
  []
  (let [{:keys [year month]} (date/get-date)]
    (date/journals-path year month (state/get-preferred-format))))

(defn get-journal
  ([]
   (get-journal (date/journal-name)))
  ([page-name]
   [page-name (get-page-headings (state/get-current-repo) page-name)]))

(defn get-journals-length
  []
  (let [today (date->int (js/Date.))]
    (d/q '[:find (count ?page) .
           :in $ ?today
           :where
           [?page :page/journal? true]
           [?page :page/journal-day ?journal-day]
           [(<= ?journal-day ?today)]]
      (get-conn (state/get-current-repo))
      today)))

;; cache this
(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (get-conn repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           before-day (date->int date)
           today (date->int (js/Date.))
           pages (->>
                  (q repo-url [:journals] {:use-cache? false}
                    '[:find ?page-name ?journal-day
                      :in $ ?before-day ?today
                      :where
                      [?page :page/name ?page-name]
                      [?page :page/journal? true]
                      [?page :page/journal-day ?journal-day]
                      [(<= ?before-day ?journal-day ?today)]]
                    before-day
                    today)
                  (react)
                  (sort-by last)
                  (reverse)
                  (map first))]
       (mapv
        (fn [page]
          [page
           (get-page-format page)])
        pages)))))

(defn me-tx
  [db {:keys [name email avatar repos]}]
  (util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))

(defn with-dummy-heading
  ([headings format]
   (with-dummy-heading headings format {} false))
  ([headings format default-option journal?]
   (let [format (or format (state/get-preferred-format) :markdown)]
     (cond
       (and journal? (> (count headings) 1))
       (rest headings)                  ; remove journal titles

       (and (not journal?) (seq headings))
       headings

       :else
       (let [last-heading (last headings)
             end-pos (get-in last-heading [:heading/meta :end-pos] 0)
             dummy (merge last-heading
                          (let [uuid (d/squuid)]
                            {:heading/uuid uuid
                             :heading/title ""
                             :heading/content (config/default-empty-heading format)
                             :heading/format format
                             :heading/level 2
                             :heading/priority nil
                             :heading/anchor (str uuid)
                             :heading/meta {:pos end-pos
                                            :end-pos end-pos}
                             :heading/body nil
                             :heading/dummy? true
                             :heading/marker nil})
                          default-option)
             headings (vec (concat headings [dummy]))]
         (if journal?
           (rest headings)
           headings))))))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page]
  (when (get-conn repo)
    (let [pages (page-alias-set repo page)
          page-id (:db/id (entity [:page/name page]))
          ref-pages (->> (q repo [:page/ref-pages page-id] {:use-cache? false}
                           '[:find ?ref-page-name
                             :in $ ?pages
                             :where
                             [?heading :heading/page ?p]
                             [(contains? ?pages ?p)]
                             [?heading :heading/ref-pages ?ref-page]
                             [?ref-page :page/name ?ref-page-name]]
                           pages)
                         react
                         seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

;; Ignore files with empty headings for now
(defn get-empty-pages
  [repo]
  (when-let [conn (get-conn repo)]
    (->
     (d/q
       '[:find ?page
         :in $ ?with-journal ?brain-text
         :where
         [?p :page/name ?page]
         (not [?p :page/file])]
       conn)
     (seq-flatten)
     (distinct))))

(defn get-pages-relation
  [repo with-journal?]
  (when-let [conn (get-conn repo)]
    (d/q
      '[:find ?page ?ref-page-name
        :in $ ?with-journal ?brain-text
        :where
        [?p :page/name ?page]
        [?p :page/journal? ?with-journal]
        [?heading :heading/page ?p]
        [(get-else $ ?heading :heading/ref-pages 100000000) ?ref-page]
        [(get-else $ ?ref-page :page/name ?brain-text) ?ref-page-name]]
      conn
      with-journal?
      brain-text)))

;; get pages who mentioned this page
(defn get-pages-that-mentioned-page
  [repo page]
  (when (get-conn repo)
    (let [page-id (:db/id (entity [:page/name page]))
          pages (page-alias-set repo page)
          mentioned-pages (->> (q repo [:page/mentioned-pages page-id] {:use-cache? false}
                                 '[:find ?mentioned-page-name
                                   :in $ ?pages ?page-name
                                   :where
                                   [?heading :heading/ref-pages ?p]
                                   [(contains? ?pages ?p)]
                                   [?heading :heading/page ?mentioned-page]
                                   [?mentioned-page :page/name ?mentioned-page-name]]
                                 pages
                                 page)
                               react
                               seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) mentioned-pages))))

(defn get-page-referenced-headings
  [page]
  (when-let [repo (state/get-current-repo)]
    (when (get-conn repo)
      (let [page-id (:db/id (entity [:page/name page]))
            pages (page-alias-set repo page)]
        (->> (q repo [:page/refed-headings page-id] {}
               '[:find (pull ?heading [*])
                 :in $ ?pages
                 :where
                 [?heading :heading/ref-pages ?ref-page]
                 [(contains? ?pages ?ref-page)]]
               pages)
             react
             seq-flatten
             (remove (fn [heading]
                       (let [exclude-pages pages]
                         (contains? exclude-pages (:db/id (:heading/page heading))))))
             sort-headings
             group-by-page)))))

(defn get-files-that-referenced-page
  [page-id]
  (when-let [repo (state/get-current-repo)]
    (when-let [db (get-conn repo)]
      (->> (d/q
             '[:find ?path
               :in $ ?page-id
               :where
               [?heading :heading/ref-pages ?page-id]
               [?heading :heading/page ?p]
               [?p :page/file ?f]
               [?f :file/path ?path]
               ]
             db
             page-id)
           (seq-flatten)))))

(defn get-page-unlinked-references
  [page]
  (when-let [repo (state/get-current-repo)]
    (when-let [conn (get-conn repo)]
      (let [page-id (:db/id (entity [:page/name page]))
            pages (page-alias-set repo page)
            pattern (re-pattern (str "(?i)" page))]
        (->> (d/q
               '[:find (pull ?heading [*])
                 :in $ ?pattern
                 :where
                 [?heading :heading/content ?content]
                 [(re-find ?pattern ?content)]]
               conn
               pattern)
             seq-flatten
             (remove (fn [heading]
                       (let [ref-pages (set (map :db/id (:heading/ref-pages heading)))]
                         (or
                          (= (get-in heading [:heading/page :db/id]) page-id)
                          (seq (set/intersection
                                ref-pages
                                pages))))))
             sort-headings
             group-by-page)))))

(defn get-heading-referenced-headings
  [heading-uuid]
  (when-let [repo (state/get-current-repo)]
    (when (get-conn repo)
      (->> (q repo [:heading/refed-headings heading-uuid] {}
             '[:find (pull ?ref-heading [*])
               :in $ ?page-name
               :where
               [?heading :heading/uuid ?heading-uuid]
               [?heading :heading/ref-headings ?ref-heading]]
             heading-uuid)
           react
           seq-flatten
           sort-headings
           group-by-page))))

(defn get-matched-headings
  [match-fn limit]
  (when-let [repo (state/get-current-repo)]
    (let [pred (fn [db content]
                 (match-fn content))]
      (->> (q repo [:matched-headings] {:use-cache? false}
             '[:find ?heading
               :in $ ?pred
               :where
               [?heading :heading/content ?content]
               [(?pred $ ?content)]]
             pred)
           react
           (take limit)
           seq-flatten
           (pull-many '[:heading/uuid
                        :heading/content
                        {:heading/page [:page/name]}])))))

;; TODO: Does the result preserves the order of the arguments?
(defn get-headings-contents
  [repo heading-uuids]
  (let [db (get-conn repo)]
    (d/pull-many db '[:heading/content]
                 (mapv (fn [id] [:heading/uuid id]) heading-uuids))))

(defn journal-page?
  [page-name]
  (:page/journal? (entity [:page/name page-name])))

(defn mark-repo-as-cloned
  [repo-url]
  (transact!
    [{:repo/url repo-url
      :repo/cloned? true}]))

(defn cloned?
  [repo-url]
  (->
   (d/q '[:find ?cloned
          :in $ ?repo-url
          :where
          [?repo :repo/url ?repo-url]
          [?repo :repo/cloned? ?cloned]]
     (get-conn repo-url) repo-url)
   ffirst))

(defn reset-config!
  [repo-url content]
  (when-let [content (or content (get-file repo-url (str config/app-name "/" config/config-file)))]
    (let [config (try
                   (reader/read-string content)
                   (catch js/Error e
                     (println "Parsing config file failed: ")
                     (js/console.dir e)
                     {}))]
      (state/set-config! repo-url config)
      config)))

(defn start-db-conn!
  [me repo listen-handler]
  (let [files-db-name (datascript-files-db repo)
        files-db-conn (d/create-conn db-schema/files-db-schema)
        db-name (datascript-db repo)
        db-conn (d/create-conn db-schema/schema)]
    (swap! conns assoc files-db-name files-db-conn)
    (swap! conns assoc db-name db-conn)
    (listen-handler repo db-conn)
    (when me
      (d/transact! db-conn [(me-tx (d/db db-conn) me)]))))

(defn restore!
  [{:keys [repos] :as me} listen-handler restore-config-handler]
  (let [logged? (:name me)]
    (doall
     (for [{:keys [url]} repos]
       (let [repo url
             db-name (datascript-files-db repo)
             db-conn (d/create-conn db-schema/files-db-schema)]
         (swap! conns assoc db-name db-conn)
         (->
          (p/let [stored (-> (.getItem localforage-instance db-name)
                             (p/then (fn [result]
                                       result))
                             (p/catch (fn [error]
                                        nil)))
                  _ (when stored
                      (let [stored-db (string->db stored)
                            attached-db (d/db-with stored-db [(me-tx stored-db me)])]
                        (when (= (:schema stored-db) db-schema/files-db-schema) ;; check for code update
                          (reset-conn! db-conn attached-db))))
                  db-name (datascript-db repo)
                  db-conn (d/create-conn db-schema/schema)
                  _ (swap! conns assoc db-name db-conn)
                  stored (.getItem localforage-instance db-name)
                  _ (if stored
                      (let [stored-db (string->db stored)
                            attached-db (d/db-with stored-db [(me-tx stored-db me)])]
                        (when (= (:schema stored-db) db-schema/schema) ;; check for code update
                          (reset-conn! db-conn attached-db)))
                      (when logged?
                        (d/transact! db-conn [(me-tx (d/db db-conn) me)])))
                  _ (restore-config-handler repo)]
            (listen-handler repo db-conn))))))))

(defn- build-edges
  [edges]
  (map (fn [[from to]]
         {:source from
          :target to})
    edges))

(defn- get-connections
  [page edges]
  (count (filter (fn [{:keys [source target]}]
                   (or (= source page)
                       (= target page)))
                 edges)))

(defn- build-nodes
  [dark? current-page edges nodes]
  (mapv (fn [p]
          (let [brain? (= brain-text p)]
            (cond->
              {:id (if brain? brain-text p)
               :name (if brain? brain p)
               :val (if brain? 0 (get-connections p edges))
               :autoColorBy "group"
               :group (js/Math.ceil (* (js/Math.random) 12))
               :color "#222222"
               }
              dark?
              (assoc :color "#8abbbb")
              (= p current-page)
              (assoc :color (if dark?
                              "#ffffff"
                              "#045591")))))
        (set (flatten nodes))))

(defn normalize-page-name
  [{:keys [nodes links] :as g}]
  (let [all-pages (->> (set (apply concat
                              [(map :id nodes)
                               (map :source links)
                               (map :target links)]))
                       (remove (fn [x] (= x brain-text)))
                       (map string/lower-case))
        names (pull-many '[:page/name :page/original-name] (mapv (fn [page] [:page/name page]) all-pages))
        names (zipmap (map :page/name names)
                      (map (fn [x] (get x :page/original-name (util/capitalize-all (:page/name x)))) names))
        names (assoc names brain-text brain)
        nodes (mapv (fn [node] (assoc node :id (get names (:id node)))) nodes)
        links (mapv (fn [{:keys [source target]}]
                      {:source (get names source)
                       :target (get names target)})
                    links)]
    {:nodes nodes
     :links links}))

(defn build-global-graph
  [theme show-journal?]
  (let [dark? (= "dark" theme)
        current-page (:page/name (get-current-page))]
    (when-let [repo (state/get-current-repo)]
      (let [relation (get-pages-relation repo show-journal?)
            empty-pages (get-empty-pages repo)
            nodes (concat (seq relation) (mapv (fn [p] [p brain-text]) empty-pages))
            edges (build-edges nodes)
            nodes (build-nodes dark? current-page edges nodes)]
        (normalize-page-name
         {:nodes nodes
          :links edges})))))

(defn build-page-graph
  [page theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page (string/lower-case page)
            original-page-name (:page/original-name (entity [:page/name page]))
            ref-pages (get-page-referenced-pages repo page)
            mentioned-pages (get-pages-that-mentioned-page repo page)
            edges (concat
                   (map (fn [[p aliases]]
                          [page p]) ref-pages)
                   (map (fn [[p aliases]]
                          [p page]) mentioned-pages))
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
                       (build-edges))
            nodes (->> (concat
                        [page]
                        (map first ref-pages)
                        (map first mentioned-pages))
                       (remove nil?)
                       (distinct)
                       (build-nodes dark? page edges))]
        (normalize-page-name
         {:nodes nodes
          :links edges})))))

(defn headings->vec-tree [col]
  (let [col (map (fn [h] (cond->
                           h
                           (not (:heading/dummy? h))
                           (dissoc h :heading/meta))) col)
        parent? (fn [item children]
                  (and (seq children)
                       (every? #(< (:heading/level item) (:heading/level %)) children)))]
    (loop [col (reverse col)
           children (list)]
      (if (empty? col)
        children
        (let [[item & others] col
              cur-level (:heading/level item)
              bottom-level (:heading/level (first children))]
          (cond
            (empty? children)
            (recur others (list item))

            (<= bottom-level cur-level)
            (recur others (conj children item))

            (> bottom-level cur-level)      ; parent
            (let [[children other-children] (split-with (fn [h]
                                                          (> (:heading/level h) cur-level))
                                                        children)

                  children (cons
                            (assoc item :heading/children children)
                            other-children)]
              (recur others children))))))))

;; recursively with children content
(defn get-heading-content-rec
  ([heading]
   (get-heading-content-rec heading (fn [heading] (:heading/content heading))))
  ([heading transform-fn]
   (let [contents (atom [])
         _ (walk/prewalk
            (fn [form]
              (when (map? form)
                (when-let [content (:heading/content form)]
                  (swap! contents conj (transform-fn form))))
              form)
            heading)]
     (apply util/join-newline @contents))))

(defn get-heading-end-pos-rec
  [repo heading]
  (let [children (:heading/children heading)]
    (if (seq children)
      (get-heading-end-pos-rec repo (last children))
      (if-let [end-pos (get-in heading [:heading/meta :end-pos])]
        end-pos
        (when-let [heading (entity repo [:heading/uuid (:heading/uuid heading)])]
          (get-in heading [:heading/meta :end-pos]))))))

(defn get-heading-ids
  [heading]
  (let [ids (atom [])
        _ (walk/prewalk
           (fn [form]
             (when (map? form)
               (when-let [id (:heading/uuid form)]
                 (swap! ids conj id)))
             form)
           heading)]
    @ids))

(defn collapse-heading!
  [heading]
  (let [repo (:heading/repo heading)]
    (transact! repo
      [{:heading/uuid (:heading/uuid heading)
        :heading/collapsed? true}])))

(defn collapse-headings!
  [heading-ids]
  (let [repo (state/get-current-repo)]
    (transact! repo
      (map
        (fn [id]
          {:heading/uuid id
           :heading/collapsed? true})
        heading-ids))))

(defn expand-heading!
  [heading]
  (let [repo (:heading/repo heading)]
    (transact! repo
      [{:heading/uuid (:heading/uuid heading)
        :heading/collapsed? false}])))

(defn expand-headings!
  [heading-ids]
  (let [repo (state/get-current-repo)]
    (transact! repo
      (map
        (fn [id]
          {:heading/uuid id
           :heading/collapsed? false})
        heading-ids))))

(defn get-collapsed-headings
  []
  (d/q
    '[:find ?content
      :where
      [?h :heading/content ?content]
      [?h :heading/collapsed? true]]
    (get-conn)))

;; recursive query might be slow, need benchmarks
;; Could replace this with a recursive call, see below
(defn get-heading-parents-rec
  [repo heading-id depth]
  (when-let [conn (get-conn repo)]
    (let [ids (->> (d/q
                     '[:find ?e2
                       :in $ ?e1 %
                       :where (parent ?e2 ?e1)]
                     conn
                     heading-id
                     ;; recursive rules
                     '[[(parent ?e2 ?e1)
                        [?e2 :heading/children ?e1]]
                       [(parent ?e2 ?e1)
                        [?t :heading/children ?e1]
                        [?t :heading/uuid ?tid]
                        (parent ?e2 ?tid)]])
                   (seq-flatten))]
      (when (seq ids)
        (d/pull-many conn '[:heading/uuid :heading/title] ids)))))

(defn get-heading-parent
  [repo heading-id]
  (when-let [conn (get-conn repo)]
    (d/entity conn [:heading/children heading-id])))

;; non recursive query
(defn get-heading-parents
  [repo heading-id depth]
  (when-let [conn (get-conn repo)]
    (loop [heading-id heading-id
           parents (list)
           d 1]
      (if (> d depth)
        parents
        (if-let [parent (get-heading-parent repo heading-id)]
          (recur (:heading/uuid parent) (conj parents parent) (inc d))
          parents)))))

(defn get-heading-page
  [repo heading-id]
  (when-let [heading (entity repo [:heading/uuid heading-id])]
    (entity repo (:db/id (:heading/page heading)))))

(defn get-heading-page-end-pos
  [repo page-name]
  (or
   (when-let [page-id (:db/id (entity repo [:page/name (string/lower-case page-name)]))]
     (when-let [db (get-conn repo)]
       (let [heading-eids (->> (d/datoms db :avet :heading/page page-id)
                               (mapv :e))]
         (when (seq heading-eids)
           (let [headings (d/pull-many db '[:heading/meta] heading-eids)]
             (-> (last (sort-by-pos headings))
                 (get-in [:heading/meta :end-pos])))))))
   ;; TODO: need more thoughts
   0))

(defn recompute-heading-children
  [repo heading headings]
  (if (> (count headings) 1)
    (when-let [conn (get-conn repo)]
      (let [top-parent (:heading/uuid (get-heading-parent repo (:heading/uuid heading)))
            level (:heading/level heading)
            result (loop [result []
                          headings (reverse headings)
                          last-level 1000
                          children []]
                     (if-let [h (first headings)]
                       (let [id (:heading/uuid h)
                             level (:heading/level h)
                             [children current-heading-children]
                             (cond
                               (>= level last-level)
                               [(conj children [id level])
                                #{}]

                               (< level last-level)
                               (let [current-heading-children (set (->> (filter #(< level (second %)) children)
                                                                        (map first)))
                                     others (vec (remove #(< level (second %)) children))]
                                 [(conj others [id level])
                                  current-heading-children]))
                             h (assoc h :heading/children current-heading-children)]
                         (recur (conj result h)
                                (rest headings)
                                level
                                children))
                       (reverse result)))
            result (vec result)]
        (if top-parent
          (let [top-parent-children (filter (fn [h] (= (:heading/level h) level)) headings)
                top-parent-children-ids (map :heading/uuid top-parent-children)]
            (if (= 1 (count top-parent-children)) ; no children count changed
              result
              (let [old-top-parent-children (:heading/children (entity repo [:heading/uuid top-parent]))
                    new-children (set/union (set old-top-parent-children) (set top-parent-children-ids))]
                (conj result {:heading/uuid top-parent
                              :heading/children new-children}))))
          result)))
    headings))

(comment
  (def heading {:heading/properties-meta [], :heading/meta {:pos 885, :end-pos 894}, :heading/format :markdown, :heading/title [["Plain" "world"]], :heading/level 2, :heading/marker "nil", :heading/file {:db/id 1}, :heading/page {:db/id 10}, :db/id 195, :heading/body [], :heading/content "## world\n### cool\n### nice\n#### nested nice\n", :heading/uuid #uuid "5f07d298-16ff-4036-b625-d5885db5f7ea", :heading/properties [], :heading/anchor "world"})
  (def headings (:headings (block/parse-heading heading :markdown)))

  (recompute-heading-children (state/get-current-repo)
                              heading
                              headings))

(defn get-headings-by-priority
  [repo priority]
  (let [priority (string/capitalize priority)]
    (when (get-conn repo)
      (->> (q repo [:priority/headings priority] {}
             '[:find (pull ?h [*])
               :in $ ?priority
               :where
               [?h :heading/priority ?priority]]
             priority)
           react
           seq-flatten
           sort-headings
           group-by-page))))

(defn add-page-to-recent!
  [repo page]
  (let [pages (or (get-key-value repo :recent/pages)
                  '())
        new-pages (take 12 (distinct (cons page pages)))]
    (set-key-value repo :recent/pages new-pages)))

(defn build-content-list
  [m l]
  (map
    (fn [page]
      (if-let [page-list (get m page)]
        {:page page
         :list (build-content-list m page-list)}
        {:page page}))
    l))

(defn get-contents
  ([]
   (get-contents (state/get-current-repo)))
  ([repo]
   (when-let [conn (get-conn repo)]
     (let [lists (some->>
                  (q repo [:contents] {}
                    '[:find ?page-name ?list
                      :where
                      [?page :page/list ?list]
                      [?page :page/name ?page-name]])
                  react
                  (into {}))]
       (when (seq lists)
         (when-let [l (get lists "contents")]
           (build-content-list lists l)))))))

(comment
  (defn debug!
    []
    (let [repos (->> (get-in @state/state [:me :repos])
                     (map :url))]
      (mapv (fn [repo]
              {:repo/current (state/get-current-repo)
               :repo repo
               :git/cloned? (cloned? repo)
               :git/status (get-key-value repo :git/status)
               :git/latest-commit (get-key-value repo :git/latest-commit)
               :git/error (get-key-value repo :git/error)})
            repos)))

  (defn headings-count
    []
    (->
     (d/q '[:find (count ?h)
            :where
            [?h :heading/uuid]]
       (get-conn ))
     ffirst))
  )
