(ns frontend.db
  (:require [datascript.core :as d]
            [frontend.util :as util]
            [medley.core :as medley]
            [datascript.transit :as dt]
            [frontend.format.org-mode :as org]
            [frontend.format.org.block :as block]
            [clojure.string :as string]
            [frontend.utf8 :as utf8]))

(def datascript-db "logseq/DB")
(def schema
  {:db/ident        {:db/unique :db.unique/identity}
   ;; repo
   :repo/url        {:db/unique :db.unique/identity}
   :repo/cloning?   {}
   :repo/cloned?    {}
   :repo/current    {:db/valueType   :db.type/ref}

   ;; file
   :file/path       {:db/unique :db.unique/identity}
   :file/repo       {:db/valueType   :db.type/ref}
   :file/raw        {}
   :file/html       {}
   ;; TODO: calculate memory/disk usage
   ;; :file/size       {}

   ;; heading
   :heading/uuid   {:db/unique      :db.unique/identity}
   :heading/repo   {:db/valueType   :db.type/ref}
   :heading/file   {:db/valueType   :db.type/ref}
   :heading/anchor {}
   :heading/marker {}
   :heading/priority {}
   :heading/level {}
   :heading/tags {:db/valueType   :db.type/ref
                  :db/cardinality :db.cardinality/many
                  :db/isComponent true}

   ;; tag
   :tag/name       {:db/unique :db.unique/identity}

   ;; task
   :task/scheduled {:db/index       true}
   :task/deadline  {:db/index       true}
   })

(defonce conn
  (d/create-conn schema))

;; transit serialization

(defn db->string [db]
  (dt/write-transit-str db))

(defn string->db [s]
  (dt/read-transit-str s))

;; persisting DB between page reloads
(defn persist [db]
  (js/localStorage.setItem datascript-db (db->string db)))

(defn reset-conn! [db]
  (reset! conn db))

;; (new TextEncoder().encode('foo')).length
(defn db-size
  []
  (when-let [store (js/localStorage.getItem datascript-db)]
    (let [bytes (.-length (.encode (js/TextEncoder.) store))]
      (/ bytes 1000))))

(defn restore! []
  (when-let [stored (js/localStorage.getItem datascript-db)]
    (let [stored-db (string->db stored)]
      (when (= (:schema stored-db) schema) ;; check for code update
        (reset-conn! stored-db)))))

;; TODO: added_at, started_at, schedule, deadline
(def qualified-map
  {:file :heading/file
   :anchor :heading/anchor
   :title :heading/title
   :marker :heading/marker
   :priority :heading/priority
   :level :heading/level
   :timestamps :heading/timestamps
   :children :heading/children
   :tags :heading/tags
   :meta :heading/meta
   })

;; (def schema
;;   [{:db/ident       {:db/unique :db.unique/identity}}

;;    ;; {:db/ident       :heading/title
;;    ;;  :db/valueType   :db.type/string
;;    ;;  :db/cardinality :db.cardinality/one}

;;    ;; {:db/ident       :heading/parent-title
;;    ;;  :db/valueType   :db.type/string
;;    ;;  :db/cardinality :db.cardinality/one}

;;    ;; TODO: timestamps, meta
;;    ;; scheduled, deadline
;;    ])

(defn ->tags
  [tags]
  (map (fn [tag]
         {:db/id tag
          :tag/name tag})
    tags))

(defn extract-timestamps
  [{:keys [meta] :as heading}]
  (let [{:keys [pos timestamps]} meta]
    ))

(defn- safe-headings
  [headings]
  (mapv (fn [heading]
          (let [heading (-> (util/remove-nils heading)
                            (assoc :heading/uuid (d/squuid)))
                heading (assoc heading :tags
                               (->tags (:tags heading)))]
            (medley/map-keys
             (fn [k] (get qualified-map k k))
             heading)))
        headings))

;; queries

(defn- distinct-result
  [query-result]
  (-> query-result
      seq
      flatten
      distinct))

(def seq-flatten (comp flatten seq))

(defn get-all-tags
  []
  (distinct-result
   (d/q '[:find ?tags
          :where
          [?h :heading/tags ?tags]]
     @conn)))

(defn get-repo-headings
  [repo-url]
  (-> (d/q '[:find ?heading
             :in $ ?repo-url
             :where
             [?repo :repo/url ?repo-url]
             [?heading :heading/repo ?repo]]
        @conn repo-url)
      seq-flatten))

(defn delete-headings
  [repo-url]
  (let [headings (get-repo-headings repo-url)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))

(defn get-repo-files
  [repo-url]
  (->> (d/q '[:find ?path
              :in $ ?repo-url
              :where
              [?repo :repo/url ?repo-url]
              [?file :file/repo ?repo]
              [?file :file/path ?path]]
         @conn repo-url)
       (map first)
       distinct))

(defn delete-files
  [repo-url]
  (let [files (get-repo-files repo-url)]
    (mapv (fn [path] [:db.fn/retractEntity [:file/path path]]) files)))

(defn get-file-headings
  [repo-url path]
  (-> (d/q '[:find ?heading
             :in $ ?repo-url ?path
             :where
             [?repo :repo/url ?repo-url]
             [?file :file/path ?path]
             [?heading :heading/file ?file]
             [?heading :heading/repo ?repo]]
        @conn repo-url path)
      seq-flatten))

(defn delete-file-headings!
  [repo-url path]
  (let [headings (get-file-headings repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) headings)))

(defn reset-contents-and-headings!
  [repo-url contents headings]
  (let [delete-files (delete-files repo-url)
        delete-headings (delete-headings repo-url)
        headings (safe-headings headings)
        file-contents (map (fn [[file content]]
                             {:file/repo [:repo/url repo-url]
                              :file/path file
                              :file/content content})
                        contents)
        all-data (concat delete-files delete-headings file-contents headings)]
    (d/transact! conn all-data)))

(defn get-all-headings
  []
  (seq-flatten
   (d/q '[:find (pull ?h [*])
          :where
          [?h :heading/title]]
     @conn)))

(defn search-headings-by-title
  [title])

(defn get-headings-by-tag
  [tag]
  (let [pred (fn [db tags]
               (some #(= tag %) tags))]
    (d/q '[:find (flatten (pull ?h [*]))
           :in $ ?pred
           :where
           [?h :heading/tags ?tags]
           [(?pred $ ?tags)]]
      @conn pred)))

(defn transact!
  [tx-data]
  (d/transact! conn tx-data))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

(defn set-key-value
  [key value]
  (transact! [(kv key value)]))

(defn get-key-value
  [key]
  (some-> (d/entity (d/db conn) key)
          key))

(defn set-current-repo!
  [repo]
  (set-key-value :repo/current [:repo/url repo]))

(defn mark-repo-as-cloned
  [repo-url]
  (d/transact! conn
    [{:repo/url repo-url
      :repo/cloned? true}
     (kv :repo/current [:repo/url repo-url])]))

(defn get-current-repo
  []
  (:repo/url (get-key-value :repo/current)))

(defn get-repos
  []
  (->> (d/q '[:find ?url
              :where [_ :repo/url ?url]]
         @conn)
       (map first)
       distinct))

(defn get-files
  []
  (->> (d/q '[:find ?path
              :where
              [_     :repo/current ?repo]
              [?file :file/repo ?repo]
              [?file :file/path ?path]]
         @conn)
       (map first)
       distinct))

;; file
(defn transact-files!
  [repo-url files]
  (d/transact! conn
    (for [file files]
      {:file/repo [:repo/url repo-url]
       :file/path file})))

(defn set-file-content!
  [repo-url file content]
  (d/transact! conn
    [{:file/repo [:repo/url repo-url]
      :file/path file
      :file/content content}]))

(defn extract-headings
  [repo-url file content]
  (if (string/blank? content)
    []
    (let [headings (org/->clj content)
          headings (block/extract-headings headings)]
      (map (fn [heading]
             (assoc heading
                    :heading/repo [:repo/url repo-url]
                    :heading/file [:file/path file]))
        headings))))

(defn get-all-files-content
  [repo-url]
  (d/q '[:find ?path ?content
         :in $ ?repo-url
         :where
         [?repo :repo/url ?repo-url]
         [?file :file/repo ?repo]
         [?file :file/content ?content]
         [?file :file/path ?path]]
    @conn repo-url))

(defn extract-all-headings
  [repo-url contents]
  (vec
   (mapcat
    (fn [[file content] contents]
      (extract-headings repo-url file content))
    contents)))

(defn reset-file!
  [repo-url file content]
  (let [file-content [{:file/repo [:repo/url repo-url]
                       :file/path file
                       :file/content content}]
        delete-headings (delete-file-headings! repo-url file)
        headings (extract-headings repo-url file content)
        headings (safe-headings headings)]
    (d/transact! conn (concat file-content delete-headings headings))))

(defn get-file-content
  [repo-url path]
  (->> (d/q '[:find ?content
              :in $ ?repo-url ?path
              :where
              [?repo :repo/url ?repo-url]
              [?file :file/repo ?repo]
              [?file :file/path ?path]
              [?file :file/content ?content]]
         @conn repo-url path)
       (map first)
       first))

(defn get-file
  [path]
  (->
   (d/q '[:find ?content
          :in $ ?path
          :where
          [_     :repo/current ?repo]
          [?file :file/repo ?repo]
          [?file :file/path ?path]
          [?file :file/content ?content]]
     @conn
     path)
   ffirst))

;; marker should be one of: TODO, DOING, IN-PROGRESS
;; time duration
(defn get-agenda
  ([]
   (get-agenda :week))
  ([time]
   (let [duration (case time
                    :today []
                    :week  []
                    :month [])]
     (->
      (d/q '[:find (pull ?h [*])
             :where
             (or [?h :heading/marker "TODO"]
                 [?h :heading/marker "DOING"]
                 [?h :heading/marker "IN-PROGRESS"]
                 [?h :heading/marker "DONE"])]
        @conn)
      seq-flatten))))

(defn entity
  [id-or-lookup-ref]
  (d/entity (d/db conn) id-or-lookup-ref))

(defn get-current-journal
  []
  (get-file (util/current-journal-path)))

(defn valid-journal-title?
  [title]
  (and title
       (not (js/isNaN (js/Date.parse title)))))

(defn get-month-journals
  [journal-path content before-date days]
  (let [[month day year] (string/split before-date #"/")
        day' (util/zero-pad (inc (util/parse-int day)))
        before-date (string/join "/" [month day' year])
        content-arr (utf8/encode content)
        end-pos (utf8/length content-arr)
        blocks (reverse (org/->clj content))
        headings (some->>
                  blocks
                  (filter (fn [block]
                            (and
                             (block/heading-block? block)

                             (= 1 (:level (second block)))

                             (let [[_ {:keys [title meta]}] block]
                               (when-let [title (last (first title))]
                                 (and
                                  (valid-journal-title? title)
                                  (let [date (last (string/split title #", "))]
                                    (<= (compare date before-date) 0))))))))
                  (map (fn [[_ {:keys [title meta]}]]
                         {:title (last (first title))
                          :file-path journal-path
                          :start-pos (:pos meta)}))
                  (take (inc days)))
        [_ journals] (reduce (fn [[last-end-pos acc] heading]
                               (let [end-pos last-end-pos
                                     acc (conj acc (assoc heading
                                                          :uuid (cljs.core/random-uuid)
                                                          :end-pos end-pos
                                                          :content (utf8/substring content-arr
                                                                                   (:start-pos heading)
                                                                                   end-pos)))]
                                 [(:start-pos heading) acc])) [end-pos []] headings)]
    (if (> (count journals) days)
      (drop 1 journals)
      journals)))

(defn- compute-journal-path
  [before-date]
  (let [[month day year] (->> (string/split before-date #"/")
                              (mapv util/parse-int))
        [year month] (cond
                       (and (= month 1)
                            (= day 1))
                       [(dec year) 12]

                       (= day 1)
                       [year (dec month)]

                       :else
                       [year month])]
    (util/journals-path year month)))

;; before-date should be a string joined with "/", like "month/day/year"
(defn get-latest-journals
  ([]
   (get-latest-journals {}))
  ([{:keys [content before-date days]
     :or {days 3}}]
   (let [before-date (if before-date
                       before-date
                       (let [{:keys [year month day]} (util/year-month-day-padded)]
                         (string/join "/" [month day year])))

         journal-path (compute-journal-path before-date)]
     (when-let [content (or content (get-file journal-path))]
       (get-month-journals journal-path content before-date days)))))

(comment
  (d/transact! conn [{:db/id -1
                      :repo/url "https://github.com/tiensonqin/notes"
                      :repo/cloned? false}])
  (d/entity (d/db conn) [:repo/url "https://github.com/tiensonqin/notes"])
  (d/transact! conn
    (safe-headings [{:heading/repo [:repo/url "https://github.com/tiensonqin/notes"]
                     :heading/file "test.org"
                     :heading/anchor "hello"
                     :heading/marker "TODO"
                     :heading/priority "A"
                     :heading/level "10"
                     :heading/title "hello world"}])))
