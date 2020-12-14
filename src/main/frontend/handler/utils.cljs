(ns frontend.handler.utils
  (:require [frontend.db.queries :as db-queries]
            [frontend.db.react-queries :as react-queries]
            [frontend.db.utils :as db-utils]
            [frontend.format :as format]
            [frontend.utf8 :as utf8]
            [cljs-time.coerce :as tc]
            [cljs-time.core :as t]
            [clojure.string :as string]
            [frontend.util :as util]
            [frontend.format.mldoc :as mldoc]
            [frontend.format.block :as block]
            [frontend.date :as date]
            [frontend.config :as config]
            [clojure.set :as set]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [datascript.core :as d]
            [frontend.util :as util :refer-macros [profile]]
            [lambdaisland.glogi :as log]
            [medley.core :as medley]
            [cljs.reader :as reader]
            [frontend.idb :as idb]
            [promesa.core :as p]))

(defn- remove-key
  [repo-url key]
  (db-queries/retract-by-key repo-url key)
  (react-queries/set-new-result! [repo-url :kv key] nil))

(defn with-block-refs-count
  [repo blocks]
  (let [refs (db-queries/get-block-refs-count repo)]
    (map (fn [block]
           (assoc block :block/block-refs-count
                        (get refs (:db/id block))))
      blocks)))

(defn delete-file-blocks!
  [repo-url path]
  (let [blocks (db-queries/get-file-blocks repo-url path)]
    (mapv (fn [eid] [:db.fn/retractEntity eid]) blocks)))

(defn extract-page-list
  [content]
  (when-not (string/blank? content)
    (->> (re-seq #"\[\[([^\]]+)]]" content)
         (map last)
         (remove nil?)
         (map string/lower-case)
         (distinct))))

(defn get-block-content
  [utf8-content block]
  (let [meta (:block/meta block)]
    (if-let [end-pos (:end-pos meta)]
      (utf8/substring utf8-content
        (:start-pos meta)
        end-pos)
      (utf8/substring utf8-content
        (:start-pos meta)))))

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
                                      (assoc :block/content (get-block-content utf8-content block)
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

(defn get-page-name
  [file ast]
  ;; headline
  (let [ast (map first ast)]
    (if (util/starts-with? file "pages/contents.")
      "Contents"
      (let [first-block (last (first (filter block/heading-block? ast)))
            property-name (when (and (= "Properties" (ffirst ast))
                                  (not (string/blank? (:title (last (first ast))))))
                            (:title (last (first ast))))
            first-block-name (and first-block
                               ;; FIXME:
                               (str (last (first (:title first-block)))))
            file-name (when-let [file-name (last (string/split file #"/"))]
                        (when-let [file-name (first (util/split-last "." file-name))]
                          (-> file-name
                              (string/replace "-" " ")
                              (string/replace "_" " ")
                              (util/capitalize-all))))]
        (or property-name
            (if (= (state/page-name-order) "file")
              (or file-name first-block-name)
              (or first-block-name file-name)))))))

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
          [[(get-page-name file ast) blocks]])))))

(defn- get-current-priority
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (contains? #{"a" "b" "c"} (string/lower-case page-name))
          (string/upper-case page-name))))))

(defn- get-current-marker
  []
  (let [match (:route-match @state/state)
        route-name (get-in match [:data :name])]
    (when (= route-name :page)
      (when-let [page-name (get-in match [:path-params :name])]
        (and (util/marker? page-name)
          (string/upper-case page-name))))))


(defn- get-handler-keys
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
              current-page-id (:db/id (db-queries/get-current-page))
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
                                           (db-queries/get-key-value repo-url query)

                                           (seq inputs)
                                           (apply d/q query db inputs)

                                           :else
                                           (d/q query db))
                                         transform-fn)]
                        (react-queries/set-new-result! handler-key new-result))))))))))
      (catch js/Error e
        ;; FIXME: check error type and notice user
        (log/error :db/transact! e)))))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})

(defn set-key-value
  [repo-url key value]
  (if value
    (transact-react! repo-url [(kv key value)]
      {:key [:kv key]})
    (remove-key repo-url key)))

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
      (db-queries/transact! repo-url tx))))

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
         page-id (or (db-queries/get-page-id-by-name repo-url page)
                     (db-queries/get-page-id-by-original-name repo-url page))
         db (declares/get-conn repo-url)]
     (when page-id
       (let [datoms (d/datoms db :avet :block/page page-id)
             block-eids (mapv :e datoms)]
         (some->> (db-utils/pull-many repo-url pull-keys block-eids)
                  (page-blocks-transform repo-url)))))))

(defn get-page-blocks
  ([page]
   (get-page-blocks (state/get-current-repo) page nil))
  ([repo-url page]
   (get-page-blocks repo-url page nil))
  ([repo-url page {:keys [use-cache? pull-keys]
                   :or {use-cache? true
                        pull-keys '[*]}}]
   (let [page (string/lower-case page)
         page-id (or (db-queries/get-page-id-by-name repo-url page)
                     (db-queries/get-page-id-by-original-name repo-url page))
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

;; cache this

(defn get-latest-journals
  ([n]
   (get-latest-journals (state/get-current-repo) n))
  ([repo-url n]
   (when (declares/get-conn repo-url)
     (let [date (js/Date.)
           _ (.setDate date (- (.getDate date) (dec n)))
           today (db-utils/date->int (js/Date.))
           pages (->> (react-queries/get-journals-before-ts repo-url today)
                      (sort-by last)
                      (reverse)
                      (map first)
                      (take n))]
       (mapv
         (fn [page]
           [page
            (db-queries/get-page-format page)])
         pages)))))

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

(defn get-repo-name
  [url]
  (last (string/split url #"/")))

(defonce persistent-jobs (atom {}))

(defn clear-repo-persistent-job!
  [repo]
  (when-let [old-job (get @persistent-jobs repo)]
    (js/clearTimeout old-job)))

;; persisting DBs between page reloads

(defn persist! [repo]
  (let [file-key (declares/datascript-files-db repo)
        non-file-key (declares/datascript-db repo)
        file-db (d/db (declares/get-files-conn repo))
        non-file-db (d/db (declares/get-conn repo false))]
    (p/let [_ (idb/set-item! file-key (db-utils/db->string file-db))
            _ (idb/set-item! non-file-key (db-utils/db->string non-file-db))]
      (state/set-last-persist-transact-id! repo true (db-utils/get-max-tx-id file-db))
      (state/set-last-persist-transact-id! repo false (db-utils/get-max-tx-id non-file-db)))))

(defn- persist-if-idle!
  [repo]
  (clear-repo-persistent-job! repo)
  (let [job (js/setTimeout
              (fn []
                (if (and (state/input-idle? repo)
                      (state/db-idle? repo))
                  (do
                    (persist! repo)
                    ;; (state/set-db-persisted! repo true)
                    )
                  (let [job (get persistent-jobs repo)]
                    (persist-if-idle! repo))))
              3000)]
    (swap! persistent-jobs assoc repo job)))

;; only save when user's idle

(defn- repo-listen-to-tx!
  [repo conn files-db?]
  (d/listen! conn :persistence
    (fn [tx-report]
      (let [tx-id (db-utils/get-tx-id tx-report)]
        (state/set-last-transact-time! repo (util/time-ms))
        ;; (state/persist-transaction! repo files-db? tx-id (:tx-data tx-report))
        (persist-if-idle! repo)))))

(defn listen-and-persist!
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (repo-listen-to-tx! repo conn true))
  (when-let [conn (declares/get-conn repo false)]
    (repo-listen-to-tx! repo conn false)))

(defn- get-connections
  [page edges]
  (count (filter (fn [{:keys [source target]}]
                   (or (= source page)
                       (= target page)))
           edges)))

(defn build-nodes
  [dark? current-page edges nodes]
  (mapv (fn [p]
          (let [current-page? (= p current-page)
                color (case [dark? current-page?]
                        [false false] "#222222"
                        [false true]  "#045591"
                        [true false]  "#8abbbb"
                        [true true]   "#ffffff")] ; FIXME: Put it into CSS
            {:id p
             :name p
             :val (get-connections p edges)
             :autoColorBy "group"
             :group (js/Math.ceil (* (js/Math.random) 12))
             :color color}))
    (set (flatten nodes))))

(defn build-edges
  [edges]
  (map (fn [[from to]]
         {:source from
          :target to})
    edges))

(defn get-block-page-end-pos
  [repo page-name]
  (or
    (let [page-name (string/lower-case page-name)]
      (when-let [page-id (db-queries/get-page-id-by-name page-name)]
        (when-let [db (declares/get-conn repo)]
          (let [block-eids (->> (db-queries/get-all-blocks-by-page-id db page-id)
                                (mapv :e))]
            (when (seq block-eids)
              (let [blocks (db-utils/pull-many repo '[:block/meta] block-eids)]
                (-> (last (db-utils/sort-by-pos blocks))
                    (get-in [:block/meta :end-pos]))))))))
    ;; TODO: need more thoughts
    0))