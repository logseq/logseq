(ns frontend.db.utils
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [clojure.string :as string]
            [datascript.transit :as dt]
            [frontend.util :as util]
            [frontend.idb :as idb]
            [frontend.date :as date]
            [frontend.utf8 :as utf8]
            [frontend.format.block :as block]
            [frontend.format.mldoc :as mldoc]))

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

(defn me-tx
  [db {:keys [name email avatar]}]
  (util/remove-nils {:me/name name
                     :me/email email
                     :me/avatar avatar}))



(defn seq-flatten [col]
  (flatten (seq col)))

(defn pull-many
  ([eids]
   (pull-many '[*] eids))
  ([selector eids]
   (pull-many (state/get-current-repo) selector eids))
  ([repo selector eids]
   (when-let [conn (declares/get-conn repo)]
     (try
       (d/pull-many conn selector eids)
       (catch js/Error e
         (js/console.error e))))))

(defn entity
  ([id-or-lookup-ref]
   (entity (state/get-current-repo) id-or-lookup-ref))
  ([repo id-or-lookup-ref]
   (when-let [db (declares/get-conn repo)]
     (d/entity db id-or-lookup-ref))))

(defn- sort-by-pos
  [blocks]
  (sort-by
    #(get-in % [:block/meta :start-pos])
    blocks))

(defn- sort-blocks
  [blocks]
  (let [pages-ids (map (comp :db/id :block/page) blocks)
        pages (pull-many '[:db/id :page/last-modified-at :page/name :page/original-name] pages-ids)
        pages-map (reduce (fn [acc p] (assoc acc (:db/id p) p)) {} pages)
        blocks (map
                 (fn [block]
                   (assoc block :block/page
                                (get pages-map (:db/id (:block/page block)))))
                 blocks)]
    (sort-by-pos blocks)))

(defn group-by-page
  [blocks]
  (some->> blocks
           (group-by :block/page)
           (sort-by (fn [[p _blocks]] (:page/last-modified-at p)) >)))

(defn build-edges
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

(defn normalize-page-name
  [{:keys [nodes links] :as g}]
  (let [all-pages (->> (set (apply concat
                              [(map :id nodes)
                               (map :source links)
                               (map :target links)]))
                    (map string/lower-case))
        names (pull-many '[:page/name :page/original-name] (mapv (fn [page] [:page/name page]) all-pages))
        names (zipmap (map :page/name names)
                (map (fn [x] (get x :page/original-name (util/capitalize-all (:page/name x)))) names))
        nodes (mapv (fn [node] (assoc node :id (get names (:id node)))) nodes)
        links (mapv (fn [{:keys [source target]}]
                      {:source (get names source)
                       :target (get names target)})
                links)]
    {:nodes nodes
     :links links}))


(defn get-tx-id [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn get-max-tx-id
  [db]
  (:max-tx db))

;; persisting DBs between page reloads

(defn persist! [repo]
  (let [file-key (declares/datascript-files-db repo)
        non-file-key (declares/datascript-db repo)
        file-db (d/db (declares/get-files-conn repo))
        non-file-db (d/db (declares/get-conn repo false))]
    (p/let [_ (idb/set-item! file-key (db->string file-db))
            _ (idb/set-item! non-file-key (db->string non-file-db))]
      (state/set-last-persist-transact-id! repo true (get-max-tx-id file-db))
      (state/set-last-persist-transact-id! repo false (get-max-tx-id non-file-db)))))

(defonce persistent-jobs (atom {}))

(defn clear-repo-persistent-job!
  [repo]
  (when-let [old-job (get @persistent-jobs repo)]
    (js/clearTimeout old-job)))

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
      (let [tx-id (get-tx-id tx-report)]
        (state/set-last-transact-time! repo (util/time-ms))
        ;; (state/persist-transaction! repo files-db? tx-id (:tx-data tx-report))
        (persist-if-idle! repo)))))

(defn listen-and-persist!
  [repo]
  (when-let [conn (declares/get-files-conn repo)]
    (repo-listen-to-tx! repo conn true))
  (when-let [conn (declares/get-conn repo false)]
    (repo-listen-to-tx! repo conn false)))

(defn date->int
  [date]
  (util/parse-int
    (string/replace (date/ymd date) "/" "")))

(defn get-block-content
  [utf8-content block]
  (let [meta (:block/meta block)]
    (if-let [end-pos (:end-pos meta)]
      (utf8/substring utf8-content
        (:start-pos meta)
        end-pos)
      (utf8/substring utf8-content
        (:start-pos meta)))))

(defn extract-page-list
  [content]
  (when-not (string/blank? content)
    (->> (re-seq #"\[\[([^\]]+)]]" content)
      (map last)
      (remove nil?)
      (map string/lower-case)
      (distinct))))

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

(defn parse-properties
  [content format]
  (let [ast (->> (mldoc/->edn content
                   (mldoc/default-config format))
              (map first))
        properties (let [properties (and (seq ast)
                                         (= "Properties" (ffirst ast))
                                         (last (first ast)))]
                     (if (and properties (seq properties))
                       properties))]
    (into {} properties)))

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

(defn get-page
  [page-name]
  (if (util/uuid-string? page-name)
    (entity [:block/uuid (uuid page-name)])
    (entity [:page/name page-name])))



(defn with-repo
  [repo blocks]
  (map (fn [block]
         (assoc block :block/repo repo))
    blocks))

(defn pull
  ([eid]
   (pull (state/get-current-repo) '[*] eid))
  ([selector eid]
   (pull (state/get-current-repo) selector eid))
  ([repo selector eid]
   (when-let [conn (declares/get-conn repo)]
     (try
       (d/pull conn
         selector
         eid)
       (catch js/Error e
         nil)))))

(defn string->db [s]
  (dt/read-transit-str s))

(defn db->json [db]
  (js/JSON.stringify
    (into-array
      (for [d (d/datoms db :eavt)]
        #js [(:e d) (name (:a d)) (:v d)]))))

(defn db->string [db]
  (dt/write-transit-str db))

(defn get-repo-name
  [url]
  (last (string/split url #"/")))

(defn kv
  [key value]
  {:db/id -1
   :db/ident key
   key value})