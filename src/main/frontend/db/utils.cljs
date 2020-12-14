(ns frontend.db.utils
  "Some utils are required by other ns in frontend.db packages."
  (:require [datascript.core :as d]
            [frontend.state :as state]
            [frontend.db.declares :as declares]
            [clojure.string :as string]
            [datascript.transit :as dt]
            [frontend.util :as util]
            [frontend.date :as date]))

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

(defn sort-by-pos
  [blocks]
  (sort-by
    #(get-in % [:block/meta :start-pos])
    blocks))

(defn sort-blocks
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

(defn get-tx-id [tx-report]
  (get-in tx-report [:tempids :db/current-tx]))

(defn get-max-tx-id
  [db]
  (:max-tx db))

(defn date->int
  [date]
  (util/parse-int
    (string/replace (date/ymd date) "/" "")))

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
