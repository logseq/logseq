(ns frontend.db.restore
  "Fns for DB restore(from text or sqlite)"
  (:require [cljs-bean.core :as bean]
            [clojure.edn :as edn]
            [clojure.string :as string]
            [datascript.core :as d]
            [electron.ipc :as ipc]
            [frontend.config :as config]
            [frontend.db.conn :as db-conn]
            [frontend.db.migrate :as db-migrate]
            [frontend.db.persist :as db-persist]
            [frontend.db.react :as react]
            [frontend.db.utils :as db-utils]
            [frontend.state :as state]
            [goog.object :as gobj]
            [logseq.db.default :as default-db]
            [logseq.db.schema :as db-schema]
            [promesa.core :as p]))


(defn- old-schema?
  "Requires migration if the schema version is older than db-schema/version"
  [db]
  (let [v (db-migrate/get-schema-version db)
        ;; backward compatibility
        v (if (integer? v) v 0)]
    (cond
      (= db-schema/version v)
      false

      (< db-schema/version v)
      (do
        (js/console.error "DB schema version is newer than the app, please update the app. " ":db-version" v)
        false)

      :else
      true)))


(defn- restore-graph-from-text!
  "Swap db string into the current db status
   stored: the text to restore from"
  [repo stored]
  (p/let [db-name (db-conn/datascript-db repo)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! db-conn/conns assoc db-name db-conn)
          _ (when stored
              (let [stored-db (try (db-utils/string->db stored)
                                   (catch :default _e
                                     (js/console.warn "Invalid graph cache")
                                     (d/empty-db db-schema/schema)))
                    attached-db (d/db-with stored-db
                                           default-db/built-in-pages) ;; TODO bug overriding uuids?
                    db (if (old-schema? attached-db)
                         (db-migrate/migrate attached-db)
                         attached-db)]
                (db-conn/reset-conn! db-conn db)))]
    (d/transact! db-conn [{:schema/version db-schema/version}])))


(defn- uuid-str->uuid-in-av-vec
  [[a v]]
  (cond
    (and (= :block/uuid a) (string? v))
    [a (uuid v)]

    (and (coll? v) (= 2 (count v))
         (= :block/uuid (first v))
         (string? (second v)))
    [a [:block/uuid (uuid (second v))]]

    :else
    [a v]))

(defn- add-tempid-to-av-colls
  [start-tempid av-colls]
  (map-indexed (fn [idx av-coll]
                 (map (partial cons (dec (- start-tempid idx))) av-coll))
               av-colls))

(defn- restore-other-data-from-sqlite!
  [repo data]
  (let [per-length 2000
        conn (db-conn/get-db repo false)]
    (p/loop [data data]
      (cond
        (not= repo (state/get-current-repo)) ; switched to another graph
        nil

        (empty? data)
        nil

        (not (state/input-idle? repo))  ; wait until input is idle
        (p/do! (p/delay 5000)
               (p/recur (data)))

        :else
        (let [part (->> (take per-length data)
                        (map (fn [block]
                               (map uuid-str->uuid-in-av-vec
                                    (edn/read-string (gobj/get block "datoms")))))
                        (map-indexed (fn [idx av-coll]
                                       (->> av-coll
                                            (map (partial cons (dec (- idx))))
                                            (sort-by #(if (= :block/uuid (second %)) 0 1)))))
                        (apply concat)
                        (map (fn [eav] (cons :db/add eav))))]
          (d/transact! conn part {:skip-persist? true})
          (p/let [_ (p/delay 200)]
            (p/recur (drop per-length data))))))))

(defn- restore-graph-from-sqlite!
  "Load initial data from SQLite"
  [repo]
  (p/let [db-name (db-conn/datascript-db repo)
          db-conn (d/create-conn db-schema/schema)
          _ (swap! db-conn/conns assoc db-name db-conn)
          data (ipc/ipc :get-initial-data repo)
          {:keys [all-pages all-blocks journal-blocks]} (bean/->clj data)
          pages (map (fn [page]
                       (->> page
                            :datoms
                            edn/read-string
                            (map uuid-str->uuid-in-av-vec)))
                     all-pages)
          all-blocks' (map (fn [b]
                             [[:block/uuid (uuid (:uuid b))]
                              [:block/page [:block/uuid (uuid (:page_uuid b))]]])
                           all-blocks)
          journal-blocks' (map (fn [b]
                                 (->> b
                                      :datoms
                                      edn/read-string
                                      (map uuid-str->uuid-in-av-vec)))
                               journal-blocks)
          pages-eav-colls (add-tempid-to-av-colls 0 pages)
          pages-eav-coll (->> pages-eav-colls
                              (apply concat)
                              (sort-by (fn [eav] (if (= :block/uuid (second eav)) 0 1))))
          blocks-eav-colls (->> (concat all-blocks' journal-blocks')
                                (add-tempid-to-av-colls (- (count pages-eav-colls)))
                                (apply concat))
          tx-data (map (partial cons :db/add) (concat pages-eav-coll blocks-eav-colls))]
    (d/transact! db-conn tx-data)

    ;; TODO: Store schema in sqlite
    ;; (db-migrate/migrate attached-db)

    (d/transact! db-conn [(react/kv :db/type "db")
                          {:schema/version db-schema/version}]
                 {:skip-persist? true})
    (println :restore-graph-from-sqlite! :done)

    (js/setTimeout
     (fn []
       (p/let [other-data (ipc/ipc :get-other-data repo (map :uuid journal-blocks))]
         (restore-other-data-from-sqlite! repo other-data)))
     1000)))

(defn restore-graph!
  "Restore db from serialized db cache"
  [repo]
  (if (string/starts-with? repo config/db-version-prefix)
    (restore-graph-from-sqlite! repo)
    (p/let [db-name (db-conn/datascript-db repo)
           stored (db-persist/get-serialized-graph db-name)]
     (restore-graph-from-text! repo stored))))
