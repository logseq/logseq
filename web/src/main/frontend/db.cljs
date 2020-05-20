(ns frontend.db
  (:require [datascript.core :as d]
            [posh.rum :as posh]
            [frontend.util :as util]
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
            [promesa.core :as p]))

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
  (str "logseq-db/" (get-repo-path repo)))

(defn clear-store!
  []
  (p/let [_ (.clear localforage)
          dbs (js/window.indexedDB.databases)]
    (doseq [db dbs]
      (js/window.indexedDB.deleteDatabase (gobj/get db "name")))))

(defn remove-db!
  [repo]
  (.removeItem localforage-instance (datascript-db repo)))

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

(defn remove-conn!
  [repo]
  (swap! conns dissoc (datascript-db repo)))

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
   ;; last error, better we should record all the errors
   :git/error {}

   ;; file
   :file/path       {:db/unique :db.unique/identity}
   :file/content    {}
   ;; TODO: calculate memory/disk usage
   ;; :file/size       {}

   :page/name       {:db/unique      :db.unique/identity}
   :page/file       {:db/valueType   :db.type/ref}
   :page/directives {}
   :page/alias      {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/tags       {:db/valueType   :db.type/ref
                     :db/cardinality :db.cardinality/many}
   :page/created-at {}
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
                  :db/cardinality :db.cardinality/many}
   :heading/meta {}
   :heading/properties {}

   :heading/created-at {}
   :heading/last-modified-at {}
   :heading/parent {:db/valueType   :db.type/ref}

   ;; tag
   :tag/name       {:db/unique :db.unique/identity}})

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn string->db [s]
  (dt/read-transit-str s))

;; persisting DB between page reloads
(defn persist [repo db]
  (.setItem localforage-instance
            (datascript-db repo)
            (db->string db)))

(defn reset-conn! [conn db]
  (reset! conn db))

(defn transact!
  ([tx-data]
   (transact! (state/get-current-repo) tx-data))
  ([repo-url tx-data]
   (let [tx-data (remove nil? tx-data)]
     (when (seq tx-data)
       (when-let [conn (get-conn repo-url false)]
         (posh/transact! conn (vec tx-data)))))))

(defn d-pull
  ([eid]
   (d-pull '[*] eid))
  ([selector eid]
   (when-let [conn (get-conn)]
     (d/pull conn
             selector
             eid))))

(defn d-pull-many
  ([eids]
   (d-pull-many '[*] eids))
  ([selector eids]
   (when-let [conn (get-conn)]
     (d/pull-many conn selector eids))))

(defn pull
  ([eid]
   (pull '[*] eid))
  ([selector eid]
   (when-let [conn (get-conn (state/get-current-repo) false)]
     (posh/pull conn
                selector
                eid))))

(defn pull-many
  [selector eids]
  (when-let [conn (get-conn (state/get-current-repo) false)]
    (posh/pull-many conn
                    selector
                    eids)))

(defn entity
  [id-or-lookup-ref]
  (when-let [conn (get-conn (state/get-current-repo) false)]
    (d/entity (d/db conn) id-or-lookup-ref)))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

;; queries

(defn- distinct-result
  [query-result]
  (-> query-result
      seq
      flatten
      distinct))

(def seq-flatten (comp flatten seq))

(defn get-all-tags
  [repo]
  (distinct-result
   (d/q '[:find ?tags
          :where
          [?h :heading/tags ?tags]]
     (get-conn repo))))

(defn- remove-journal-files
  [files]
  (remove
   (fn [file]
     (string/starts-with? file "journals/"))
   files))

(defn get-pages
  [repo]
  (->> (posh/q '[:find ?page-name
                 :where
                 [?page :page/name ?page-name]]
         (get-conn repo false))
       (react)
       (map first)
       distinct))

(defn get-page-alias
  [repo page-name]
  (when repo
    (some->> (posh/q '[:find ?alias-name
                       :in $ ?page-name
                       :where
                       [?page :page/name ?page-name]
                       [?page :page/alias ?alias]
                       [?alias :page/name ?alias-name]]
               (get-conn repo false)
               page-name)
             (react)
             seq-flatten
             distinct
             remove-journal-files)))

(defn get-files
  [repo]
  (->> (posh/q '[:find ?file-path
                 :where
                 [?file :file/path ?file-path]]
         (get-conn repo false))
       (react)
       (map first)
       (distinct)
       (sort)))

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

(defn sort-by-pos
  [headings]
  (sort-by (fn [heading]
             (get-in heading [:heading/meta :pos]))
           headings))

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

(defn reset-contents-and-headings!
  [repo-url contents headings-pages delete-files delete-headings]
  (let [file-contents (map (fn [[file content]]
                             (when content
                               {:file/path file
                                :file/content content}))
                        contents)
        all-data (-> (concat delete-files delete-headings file-contents headings-pages)
                     (util/remove-nils))]
    (transact! repo-url all-data)))

(defn get-headings-by-tag
  [repo tag]
  (let [pred (fn [db tags]
               (some #(= tag %) tags))]
    (d/q '[:find (flatten (pull ?h [*]))
           :in $ ?pred
           :where
           [?h :heading/tags ?tags]
           [(?pred $ ?tags)]]
      (get-conn repo) pred)))

(defn get-heading-by-uuid
  [uuid]
  (entity [:heading/uuid uuid]))

(defn sub-heading
  [uuid]
  (util/react (pull [:heading/uuid uuid])))

(defn remove-key
  [repo-url key]
  (transact! repo-url [[:db.fn/retractEntity [:db/ident key]]]))

(defn set-key-value
  ([key value]
   (set-key-value (state/get-current-repo) key))
  ([repo-url key value]
   (if value
     (transact! repo-url [(kv key value)])
     (remove-key repo-url key))))

(defn get-key-value
  ([key]
   (get-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [conn (get-conn repo-url false)]
     (when-let [db (d/db conn)]
       (some-> (d/entity db key)
               key)))))

(defn sub-key-value
  ([key]
   (sub-key-value (state/get-current-repo) key))
  ([repo-url key]
   (when-let [conn (get-conn repo-url false)]
     (-> (posh/pull conn '[*] [:db/ident key])
         (react)
         (get key)))))

(defn get-file-by-concat-headings
  ([file]
   (get-file-by-concat-headings
    (state/get-current-repo)
    file))
  ([repo-url file]
   (->> (posh/q '[:find ?heading
                  ;; (pull ?heading [*])
                  :in $ ?file
                  :where
                  [?p :file/path ?file]
                  [?heading :heading/file ?p]]
          (get-conn repo-url false) file)
        react
        seq-flatten
        (pull-many '[*])
        react
        sort-by-pos)))

(defn get-page-format
  [page-name]
  (when-let [file (:page/file (entity [:page/name page-name]))]
    (when-let [path (:file/path (entity (:db/id file)))]
      (format/get-format path))))

(defn page-pred
  [repo page]
  (let [alias (get-page-alias repo page)
        pages (set (conj alias page))]
    (fn [db page-name]
      (contains? pages page-name))))

(defn get-page-headings
  ([page]
   (get-page-headings (state/get-current-repo)
                      page))
  ([repo-url page]
   (let [pred (page-pred repo-url page)]
     (->> (posh/q '[:find ?heading
                    ;; (pull ?heading [*])
                    :in $ ?pred
                    :where
                    [?p :page/name ?page]
                    [?heading :heading/page ?p]
                    [(?pred $ ?page)]]
            (get-conn repo-url false) pred)
          react
          seq-flatten
          (pull-many '[*])
          react
          sort-by-pos))))

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
       (not (js/isNaN (js/Date.parse title)))))

(defn get-heading-content
  [utf8-content heading]
  (let [meta (:meta heading)]
    (if-let [end-pos (:end-pos meta)]
      (utf8/substring utf8-content
                      (:pos meta)
                      end-pos)
      (utf8/substring utf8-content
                      (:pos meta)))))

;; file

(defn journal-page-name->int
  [page-name]
  (let [[m d y] (-> (last (string/split page-name #", "))
                    (string/split #"/"))]
    (util/parse-int (str y m d))))

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
                               (let [heading-ref-pages (seq (:ref-pages heading))]
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
          headings (block/safe-headings headings)
          pages (map
                  (fn [page]
                    (let [page-file? (= page (string/lower-case file))
                          other-alias (and (:alias directives)
                                           (seq (remove #(= page %)
                                                        (:alias directives))))
                          other-alias (distinct
                                       (if page-file?
                                         other-alias
                                         (conj other-alias (string/lower-case file))))]
                      (cond->
                          {:page/name page
                           :page/file [:file/path file]
                           :page/journal? journal?
                           :page/journal-day (if journal?
                                               (journal-page-name->int page)
                                               0)}
                        (seq directives)
                        (assoc :page/directives directives)

                        other-alias
                        (assoc :page/alias
                               (map
                                 (fn [alias]
                                   (let [alias (string/lower-case alias)]
                                     {:page/name alias
                                      :page/alias (map
                                                    (fn [alias]
                                                      {:page/name alias})
                                                    (conj
                                                     (remove #{alias} other-alias)
                                                     page))}))
                                 other-alias))

                        (:tags directives)
                        (assoc :page/tags
                               (map
                                 (fn [tag]
                                   {:tag/name (string/lower-case tag)})
                                 (:tags directives)))))
                    )
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
      (prn "Parsing error: " e))))

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
               (let [[{:keys [level title] :as heading} & tl] headings]
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

(defn get-all-files-content
  [repo-url]
  (d/q '[:find ?path ?content
         :where
         [?file :file/content ?content]
         [?file :file/path ?path]]
    (get-conn repo-url)))

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
  (let [format (format/get-format file)
        utf8-content (utf8/encode content)
        file-content [{:file/path file
                       :file/content content}]
        tx (if (contains? config/hiccup-support-formats format)
             (let [delete-headings (delete-file-headings! repo-url file)
                   headings-pages (extract-headings-pages file content utf8-content)]
               (concat file-content delete-headings headings-pages))
             file-content)]
    (transact! repo-url tx)))

(defn get-file-content
  ([path]
   (get-file-content (state/get-current-repo) path))
  ([repo-url path]
   (->> (d/q '[:find ?content
               :in $ ?path
               :where
               [?file :file/path ?path]
               [?file :file/content ?content]]
          (get-conn repo-url) path)
        (map first)
        first)))

(defn get-file
  [path]
  (->
   (d/q '[:find ?content
          :in $ ?path
          :where
          [?file :file/path ?path]
          [?file :file/content ?content]]
     (get-conn)
     path)
   ffirst))

(defn sub-file
  [path]
  (->
   (posh/q '[:find ?content
             :in $ ?path
             :where
             [?file :file/path ?path]
             [?file :file/content ?content]]
     (get-conn false)
     path)
   (react)
   ffirst))

;; marker should be one of: TODO, DOING, IN-PROGRESS
;; time duration
;; TODO: posh doesn't support or query
(defn get-agenda
  ([repo]
   (get-agenda (state/get-current-repo) :week))
  ([repo time]
   ;; TODO:
   (when-let [conn (get-conn repo false)]
     (let [duration (case time
                      :today []
                      :week  []
                      :month [])
           pred (fn [db marker]
                  (contains? #{"TODO" "DOING" "IN-PROGRESS"} marker))]
       (->>
        (posh/q '[:find ?h
                  :in $ ?pred
                  :where
                  [?h :heading/marker ?marker]
                  [(?pred $ ?marker)]]
          conn
          pred)
        react
        seq-flatten
        (pull-many '[*])
        react)))))

(defn get-current-journal-path
  []
  (let [{:keys [year month]} (util/get-date)]
    (util/journals-path year month (state/get-preferred-format))))

(defn get-journal
  ([]
   (get-journal (util/journal-name)))
  ([page-name]
   [page-name (get-page-headings page-name)]))

(defn- date->int
  [date]
  (util/parse-int
   (string/replace (util/ymd date) "/" "")))

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
   (when-let [conn (get-conn repo-url false)]
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           before-day (date->int date)
           today (date->int (js/Date.))
           pages (->>
                  (posh/q '[:find ?page-name ?journal-day
                            :in $ ?before-day ?today
                            :where
                            [?page :page/name ?page-name]
                            [?page :page/journal? true]
                            [?page :page/journal-day ?journal-day]
                            [(<= ?before-day ?journal-day ?today)]]
                    conn
                    before-day
                    today)
                  (react)
                  (sort-by last)
                  (reverse)
                  (map first))]
       (mapv
        (fn [page]
          [page
           (get-page-headings repo-url page)
           (get-page-format page)])
        pages)))))

(defn me-tx
  [db {:keys [name email avatar repos]}]
  (util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))

(defn with-dummy-heading
  [headings format]
  (when (seq headings)
    (let [last-heading (last headings)
          end-pos (get-in last-heading [:heading/meta :end-pos])
          dummy (merge last-heading
                       (let [uuid (d/squuid)]
                         {:heading/uuid uuid
                          :heading/title ""
                          :heading/content (config/default-empty-heading format)
                          :heading/level 2
                          :heading/priority nil
                          :heading/anchor (str uuid)
                          :heading/meta {:pos end-pos
                                         :end-pos nil}
                          :heading/children nil
                          :heading/dummy? true
                          :heading/marker nil
                          :heading/lock? false}))]
      (vec (concat headings [dummy])))))

;; get pages that this page referenced
(defn get-page-referenced-pages
  [repo page]
  (when repo
    (let [pred (page-pred repo page)
          ref-pages (->> (posh/q '[:find ?ref-page-name
                                   :in $ ?pred
                                   :where
                                   [?p :page/name ?page]
                                   [?heading :heading/page ?p]
                                   [?heading :heading/ref-pages ?ref-page]
                                   [?ref-page :page/name ?ref-page-name]
                                   [(?pred $ ?page)]]
                           (get-conn repo false)
                           pred)
                         react
                         seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) ref-pages))))

;; get pages who mentioned this page
(defn get-pages-that-mentioned-page
  [repo page]
  (when repo
    (let [pred (page-pred repo page)
          mentioned-pages (->> (posh/q '[:find ?mentioned-page-name
                                         :in $ ?pred ?page-name
                                         :where
                                         [?heading :heading/ref-pages ?p]
                                         [?p :page/name ?page]
                                         [(?pred $ ?page)]
                                         [?heading :heading/page ?mentioned-page]
                                         [?mentioned-page :page/name ?mentioned-page-name]
                                         ]
                                 (get-conn repo false)
                                 pred
                                 page)
                               react
                               seq-flatten)]
      (mapv (fn [page] [page (get-page-alias repo page)]) mentioned-pages))))

;; TODO: sorted by last-modified-at
(defn get-page-referenced-headings
  [page]
  (when-let [current-repo (state/get-current-repo)]
    (let [pred (page-pred current-repo page)]
      (->> (posh/q '[:find ?heading
                     ;; (pull ?heading [*])
                     :in $ ?pred
                     :where
                     [?ref-page :page/name ?page]
                     [?heading :heading/ref-pages ?ref-page]
                     [(?pred $ ?page)]]
             (get-conn current-repo false)
             pred)
           react
           seq-flatten
           (pull-many '[*])
           react))))

(defn get-heading-referenced-headings
  [heading-uuid]
  (when-let [current-repo (state/get-current-repo)]
    (->> (posh/q '[:find ?ref-heading
                   :in $ ?page-name
                   :where
                   [?heading :heading/uuid ?heading-uuid]
                   [?heading :heading/ref-headings ?ref-heading]]
           (get-conn current-repo false)
           heading-uuid)
         react
         seq-flatten
         (pull-many '[*])
         react)))

(defn get-all-headings
  []
  (-> (d/q '[:find (pull ?h [:heading/uuid
                             :heading/content
                             {:heading/page [:page/name]}])
             :where
             [?h :heading/uuid]]
        (get-conn))
      seq-flatten))

;; TODO: Does the result preserves the order of the arguments?
(defn get-headings-contents
  [heading-uuids]
  (let [conn (get-conn (state/get-current-repo) false)]
    (d/pull-many (d/db conn) '[:heading/content]
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
                        (js/JSON.parse)
                        (bean/->clj))]
    (state/set-config! repo-url config)
    config))

(defn start-db-conn!
  [me repo listen-handler]
  (let [db-name (datascript-db repo)
        db-conn (d/create-conn schema)]
    (swap! conns assoc db-name db-conn)
    (listen-handler repo db-conn)
    (d/transact! db-conn [(me-tx (d/db db-conn) me)])
    (posh/posh! db-conn)))

(defn restore! [{:keys [repos] :as me} listen-handler render-fn]
  (-> (p/all
       (for [{:keys [id url]} repos]
         (let [repo url
               db-name (datascript-db repo)
               db-conn (d/create-conn schema)]
           (swap! conns assoc db-name db-conn)
           (p/let [stored (.getItem localforage-instance db-name)]
             (if stored
               (let [stored-db (string->db stored)
                     attached-db (d/db-with stored-db [(me-tx stored-db me)])]
                 (when (= (:schema stored-db) schema) ;; check for code update
                   (reset-conn! db-conn attached-db)))
               (d/transact! db-conn [(me-tx (d/db db-conn) me)]))
             (posh/posh! db-conn)
             (listen-handler repo db-conn)
             (let [config-content (get-file-content url config/config-file)]
               (reset-config! url config-content))))))
      (p/then render-fn)))

(defn build-page-graph
  [page]
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
                               (assoc :color "#5850ec")))))]
      {:nodes nodes
       :edges edges})))

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

  (def react deref)

  (def react rum/react)
  )
