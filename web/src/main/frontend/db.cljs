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
            [clojure.walk :as walk]
            [frontend.util :as util :refer-macros [profile]]
            [goog.array :as garray]))

;; offline db
(def store-name "dbs")
(.config localforage
         (bean/->js
          {:name "logseq-datascript"
           :version 1.0
           :storeName store-name}))

(defonce localforage-instance (.createInstance localforage store-name))

(defn get-repo-path
  [url]
  (->> (take-last 2 (string/split url #"/"))
       (string/join "/")))

(defn datascript-db
  [repo]
  (when repo
    (str "logseq-db/" (get-repo-path repo))))

(defn datascript-files-db
  [repo]
  (when repo
    (str "logseq-files-db/" (get-repo-path repo))))

(defn clear-store!
  []
  (p/let [_ (.clear localforage)
          dbs (js/window.indexedDB.databases)]
    (doseq [db dbs]
      (js/window.indexedDB.deleteDatabase (gobj/get db "name")))))

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

(def files-db-schema
  {:file/path {:db/unique :db.unique/identity}
   :file/content {}})

;; A page can corresponds to multiple files (same title),
;; a month journal file can have multiple pages,
;; also, each heading can be treated as a page if we support
;; "zoom edit".
(def schema
  {:db/ident        {:db/unique :db.unique/identity}

   ;; user
   :me/name  {}
   :me/email {}
   :me/avatar {}

   ;; repo
   :repo/url        {:db/unique :db.unique/identity}
   :repo/cloned?    {}
   :git/latest-commit {}
   :git/status {}
   :git/last-pulled-at {}
   ;; last error, better we should record all the errors
   :git/error {}

   ;; file
   :file/path       {:db/unique :db.unique/identity}
   :file/last-modified-at {}
   ;; TODO: calculate memory/disk usage
   ;; :file/size       {}

   :page/id         {:db/unique      :db.unique/identity}
   :page/name       {:db/unique      :db.unique/identity}
   :page/file       {:db/valueType   :db.type/ref}
   :page/directives {}
   :page/alias      {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/tags       {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/last-modified-at {}
   :page/journal?   {}
   :page/journal-day {}

   ;; heading
   :heading/uuid   {:db/unique      :db.unique/identity}
   :heading/file   {:db/valueType   :db.type/ref}
   :heading/format {}
   ;; belongs to which page
   :heading/page   {:db/valueType   :db.type/ref}
   ;; referenced pages
   :heading/ref-pages {:db/valueType   :db.type/ref
                       :db/cardinality :db.cardinality/many}
   ;; referenced headings
   :heading/ref-headings {:db/valueType   :db.type/ref
                          :db/cardinality :db.cardinality/many}
   :heading/content {}
   :heading/anchor {}
   :heading/marker {}
   :heading/priority {}
   :heading/level {}
   :heading/tags {:db/valueType   :db.type/ref
                  :db/cardinality :db.cardinality/many
                  :db/isComponent true}
   :heading/all-tags {:db/valueType   :db.type/ref
                      :db/cardinality :db.cardinality/many
                      :db/isComponent true}
   :heading/meta {}
   :heading/properties {}

   :heading/created-at {}
   :heading/last-modified-at {}
   :heading/body {}
   ;; :heading/children {:db/valueType   :db.type/ref
   ;;                    :db/cardinality :db.cardinality/many}

   ;; tag
   :tag/name       {:db/unique :db.unique/identity}})

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

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
  [k query inputs result-atom transform-fn]
  (swap! query-state assoc k {:query query
                              :inputs inputs
                              :result result-atom
                              :transform-fn transform-fn})
  result-atom)

;; TODO: rename :custom to :query/custom
(defn remove-custom-query!
  [repo query-string]
  (swap! query-state dissoc [repo :custom query-string]))

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

(defn get-current-page-id
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
        (:db/id (entity (if tag?
                          [:page/name page-name]
                          [:tag/name page-name])))))))

(defn get-current-tag
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :tag)
      (get-in match [:path-params :name]))))

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
              current-tag (get-current-tag)
              current-page-id (get-current-page-id)
              {:heading/keys [page]} (first headings)
              handler-keys (->>
                            (util/concat-without-nil
                             (mapcat
                              (fn [heading]
                                (let [page-id (:db/id (:heading/page heading))]
                                  [[:headings (:heading/uuid heading)]
                                   [:page/headings page-id]
                                   [:page/ref-pages page-id]]))
                              headings)

                             ;; affected tag
                             (when current-tag
                               [[:tag/ref-headings current-tag]])

                             (when current-page-id
                               [[:page/ref-pages current-page-id]
                                [:page/refed-headings current-page-id]
                                [:page/mentioned-pages current-page-id]])

                             ;; refed-pages
                             (apply concat
                               (for [{:heading/keys [ref-pages]} headings]
                                 (map (fn [page]
                                        [:page/refed-headings (:db/id page)])
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
              ]
          (->>
           (util/concat-without-nil
            handler-keys
            refed-pages
            custom-queries)
           distinct)))
      [[key]])))

(defn q
  [repo k {:keys [use-cache? files-db? transform-fn]
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
            (add-q! k query inputs result-atom transform-fn))) ))))

(defn- distinct-result
  [query-result]
  (-> query-result
      seq
      flatten
      distinct))

(def seq-flatten (comp flatten seq))

(defn- date->int
  [date]
  (util/parse-int
   (string/replace (date/ymd date) "/" "")))

(defn resolve-input
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

(defn sort-by-pos
  [headings]
  (sort-by (comp :pos :heading/meta)
           headings))

(defn group-by-page
  [headings]
  (some->> headings
           (sort-by-pos)
           (group-by :heading/page)))

(defn- with-repo
  [repo headings]
  (map (fn [heading]
         (assoc heading :heading/repo repo))
    headings))

(defn custom-query
  [query-string]
  (try
    (let [query (reader/read-string query-string)
          [query inputs] (if (vector? (first query))
                           [`~(first query) (rest query)]
                           [`~query nil])
          inputs (map resolve-input inputs)
          repo (state/get-current-repo)
          k [:custom query-string]]
      (apply q repo k {} query inputs))
    (catch js/Error e
      (println "Query parsing failed: ")
      (js/console.dir e))))

(defn custom-query-result-transform
  [query-result remove-headings]
  (let [repo (state/get-current-repo)
        result (seq-flatten query-result)
        heading? (:heading/uuid (first result))]
    (if heading?
      (let [result (if (seq remove-headings)
                     (let [remove-headings (set remove-headings)]
                       (remove (fn [h]
                                 (contains? remove-headings (:heading/uuid h)))
                               result))
                     result)]
        (some->> result
                 (with-repo repo)
                 (group-by-page)))
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
    (when (seq tx-data)
      (d/transact! (get-conn) (vec tx-data))
      (let [handler-keys (get-handler-keys handler-opts)]
        (doseq [handler-key handler-keys]
          (let [handler-key (vec (cons repo-url handler-key))]
            (when-let [cache (get @query-state handler-key)]
              (let [{:keys [query inputs transform-fn]} cache]
                (when (and query inputs)
                  (let [new-result (->
                                    (if (keyword? query)
                                      (get-key-value repo-url query)
                                      (apply d/q query (d/db (get-conn)) inputs))
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
         '[:find ?name ?h
           :where
           [?t :tag/name ?name]
           [?h :heading/all-tags ?t]])
       react
       (seq)
       (map first)
       frequencies
       (util/sort-by-value :desc)))))

(defn- remove-journal-files
  [files]
  (remove
   (fn [file]
     (string/starts-with? file "journals/"))
   files))

(defn get-pages
  [repo]
  (->> (q repo [:pages] {}
         '[:find ?page-name
           :where
           [?page :page/name ?page-name]])
       (react)
       (map first)))

(defn get-pages-with-modified-at
  [repo]
  (->> (q repo [:pages] {}
         '[:find ?page-name ?modified-at
           :where
           [?page :page/name ?page-name]
           [?page :page/journal? ?journal]
           [(get-else $ ?page :page/last-modified-at 0) ?modified-at]
           (or
            ;; journal pages, can't be empty
            (and [(true? ?journal)]
                 [?h :heading/page ?page]
                 [?h :heading/level ?level]
                 [(> ?level 1)])
            ;; non-journals, might be empty pages
            (and [(false? ?journal)]
                 [?h :heading/page]
                 [?h :heading/level ?level]))])
       (react)
       (seq)
       (sort-by last)
       (reverse)
       (remove (fn [[page modified-at]]
                 (util/file-page? page)))))

(defn get-page-alias
  [repo page-name]
  (when-let [conn (and repo (get-conn repo))]
    (some->> (d/q '[:find ?alias-name
                    :in $ ?page-name
                    :where
                    [?page :page/name ?page-name]
                    [?page :page/alias ?alias]
                    [?alias :page/name ?alias-name]]
               conn
               page-name)
             seq-flatten
             distinct
             remove-journal-files)))

(defn get-files
  [repo]
  (->> (q repo [:files] {}
         '[:find ?path ?modified-at
           :where
           [?file :file/path ?path]
           [(get-else $ ?file :file/last-modified-at 0) ?modified-at]])
       (react)
       (seq)
       (sort-by last)
       (reverse)))

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

(defn get-file-no-sub
  ([path]
   (get-file (state/get-current-repo) path))
  ([repo path]
   (when (and repo path)
     (->
      (d/q
        '[:find ?content
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?file :file/content ?content]
          ]
        (d/db (get-files-conn repo))
        path)
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

(defn get-tag-referenced-headings
  [tag]
  (when-let [repo (state/get-current-repo)]
    (when (get-conn repo)
      (let [tag-id (:db/id (entity [:tag/name tag]))]
        (->> (q repo [:tag/ref-headings tag] {}
               '[:find (pull ?h [*])
                 :in $ ?tag-id
                 :where
                 [?h :heading/all-tags ?tag-id]]
               tag-id)
             react
             seq-flatten
             group-by-page)))))

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
  (let [aliases (get-page-alias repo-url page)]
    (set (conj aliases page))))

(defn page-headings-transform
  [repo-url result]
  (let [result (seq-flatten result)
        sorted (sort-by-pos result)]
    (with-repo repo-url sorted)))

(defn get-page-headings
  [repo-url page]
  (let [page-id (:db/id (entity repo-url [:page/name page]))]
    (some->
     (q repo-url [:page/headings page-id]
       {:use-cache? true
        :transform-fn #(page-headings-transform repo-url %)}
       '[:find (pull ?heading [*])
         :in $ ?page-id
         :where
         [?heading :heading/page ?page-id]]
       page-id)
     react)))

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

(defn get-heading-and-children
  [repo heading-uuid]
  (let [heading (entity repo [:heading/uuid heading-uuid])
        page (:db/id (:heading/page heading))
        pos (:pos (:heading/meta heading))
        level (:heading/level heading)
        pred (fn [data meta]
               (>= (:pos meta) pos))]
    (some-> (q repo [:page/headings page]
              {:use-cache? false
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

(defn get-page-name
  [file ast]
  ;; headline
  (let [first-heading (first (filter block/heading-block? ast))
        other-name (cond
                     (and (= "Directives" (ffirst ast))
                          (not (string/blank? (:title (last (first ast))))))
                     (:title (last (first ast)))

                     first-heading
                     ;; FIXME:
                     (str (last (first (:title (second first-heading)))))

                     :else
                     nil)]
    (string/lower-case (or other-name file))))

(defn valid-journal-title?
  [title]
  (and title
       (or
        (date/valid? (string/capitalize title))
        (not (js/isNaN (js/Date.parse title))))))

(defn get-heading-content
  [utf8-content heading]
  (let [meta (:heading/meta heading)]
    (if-let [end-pos (:end-pos meta)]
      (utf8/substring utf8-content
                      (:pos meta)
                      end-pos)
      (utf8/substring utf8-content
                      (:pos meta)))))

;; file

(defn extract-pages-and-headings
  [format ast directives file content utf8-content journal? pages-fn]
  (println "Parsing file: " file)
  (try
    (let [headings (block/extract-headings ast (utf8/length utf8-content))
          pages (pages-fn headings ast)
          ref-pages (atom #{})
          headings (mapcat
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
                                                                  {:page/name (string/lower-case page)})
                                                                heading-ref-pages)))))
                          headings)))
                    pages)
          pages (map
                  (fn [page]
                    (let [page-file? (= page (string/lower-case file))
                          other-alias (and (:alias directives)
                                           (seq (remove #(= page %)
                                                        (:alias directives))))
                          other-alias (distinct
                                       (->> (if page-file?
                                              other-alias
                                              (conj other-alias (string/lower-case file)))
                                            (remove nil?)))]
                      (cond->
                          {:page/name page
                           :page/file [:file/path file]
                           :page/journal? journal?
                           :page/journal-day (if journal?
                                               (date/journal-title->int (string/capitalize page))
                                               0)}
                        (seq directives)
                        (assoc :page/directives directives)

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

                        (:tags directives)
                        (assoc :page/tags
                               (map
                                 (fn [tag]
                                   {:tag/name (string/lower-case tag)})
                                 (:tags directives))))))
                  (map first pages))
          pages (concat
                 pages
                 (map
                   (fn [page]
                     {:page/name (string/lower-case page)})
                   @ref-pages))]
      (vec
       (->> (concat
             pages
             headings)
            (remove nil?))))
    (catch js/Error e
      (prn "Parsing error: " e)
      (js/console.dir e))))

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
                            (valid-journal-title? title)))
                   (let [page-name (let [title (last (first title))]
                                     (and title (string/lower-case title)))
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
      (when content
        (let [utf8-content (utf8/encode content)]
          (extract-headings-pages file content utf8-content))))
    contents)))

;; TODO: compare headings
(defn reset-file!
  [repo-url file content]
  (set-file-content! repo-url file content)
  (let [format (format/get-format file)
        utf8-content (utf8/encode content)
        file-content [{:file/path file}]
        tx (if (contains? config/hiccup-support-formats format)
             (let [delete-headings (delete-file-headings! repo-url file)
                   headings-pages (extract-headings-pages file content utf8-content)]
               (concat file-content delete-headings headings-pages))
             file-content)]
    (transact! repo-url tx)))

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
       (or (and (not journal?) (seq headings))
           (and journal? (> (count headings) 1)))
       (if journal?
         (rest headings)
         headings)

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
                                            :end-pos nil}
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
                             [?p :page/name ?page]
                             [?heading :heading/page ?p]
                             [?heading :heading/ref-pages ?ref-page]
                             [?ref-page :page/name ?ref-page-name]
                             [(contains? ?pages ?page)]]
                           pages)
                         react
                         seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

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
                                   [?p :page/name ?page]
                                   [(contains? ?pages ?page)]
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
                 [?ref-page :page/name ?page]
                 [?heading :heading/ref-pages ?ref-page]
                 [(contains? ?pages ?page)]]
               pages)
             react
             seq-flatten
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
  (let [config (some->> content
                        (reader/read-string))]
    (state/set-config! repo-url config)
    config))

(defn start-db-conn!
  [me repo listen-handler]
  (let [files-db-name (datascript-files-db repo)
        files-db-conn (d/create-conn files-db-schema)
        db-name (datascript-db repo)
        db-conn (d/create-conn schema)]
    (swap! conns assoc files-db-name files-db-conn)
    (swap! conns assoc db-name db-conn)
    (listen-handler repo db-conn)
    (d/transact! db-conn [(me-tx (d/db db-conn) me)])))

(defn restore!
  [{:keys [repos] :as me} listen-handler restore-config-handler]
  (doall
   (for [{:keys [id url]} repos]
     (let [repo url
           db-name (datascript-files-db repo)
           db-conn (d/create-conn files-db-schema)]
       (swap! conns assoc db-name db-conn)
       (->
        (p/let [stored (-> (.getItem localforage-instance db-name)
                           (p/then (fn [result]
                                     result))
                           (p/catch (fn [error]
                                      nil)))]
          (when stored
            (let [stored-db (string->db stored)
                  attached-db (d/db-with stored-db [(me-tx stored-db me)])]
              (when (= (:schema stored-db) files-db-schema) ;; check for code update
                (reset-conn! db-conn attached-db)))))
        (p/then
         (fn []
           (let [db-name (datascript-db repo)
                 db-conn (d/create-conn schema)]
             (swap! conns assoc db-name db-conn)
             (p/let [stored (.getItem localforage-instance db-name)]
               (if stored
                 (let [stored-db (string->db stored)
                       attached-db (d/db-with stored-db [(me-tx stored-db me)])]
                   (when (= (:schema stored-db) schema) ;; check for code update
                     (reset-conn! db-conn attached-db)))
                 (d/transact! db-conn [(me-tx (d/db db-conn) me)]))
               (listen-handler repo db-conn)
               (restore-config-handler repo))))))))))

(defn build-page-graph
  [page theme]
  (let [dark? (= "dark" theme)]
    (when-let [repo (state/get-current-repo)]
      (let [page (string/lower-case page)
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
                       (map (fn [[from to]]
                              {:from from
                               :to to})))
            get-connections (fn [page]
                              (count (filter (fn [{:keys [from to]}]
                                               (or (= from page)
                                                   (= to page)))
                                             edges)))
            nodes (->> (concat
                        [page]
                        (map first ref-pages)
                        (map first mentioned-pages))
                       (remove nil?)
                       (distinct)
                       (mapv (fn [p]
                               (cond->
                                   {:id p
                                    :label (util/capitalize-all p)
                                    :value (get-connections p)}
                                 (= p page)
                                 (assoc :color
                                        {:border "#5850ec"
                                         :background "#5850ec"
                                         :highlight {:background "#4C51BF"}}
                                        :shape "dot")
                                 dark?
                                 (assoc :font {:color "#dfdfdf"})))))]
        {:nodes nodes
         :edges edges}))))

(defn headings->vec-tree [col]
  (let [parent? (fn [item children]
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
  [heading]
  (let [children (:heading/children heading)]
    (if (seq children)
      (get-heading-end-pos-rec (last children))
      (get-in heading [:heading/meta :end-pos]))))

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
           [?page :page/name ?page-name]]
         conn file-path)
       seq-flatten
       first))))

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
