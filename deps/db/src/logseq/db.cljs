(ns logseq.db
  "Main namespace for public db fns"
  (:require [logseq.db.frontend.default :as default-db]
            [logseq.db.frontend.schema :as db-schema]
            [datascript.core :as d]
            [cljs-time.core :as t]
            [cljs-time.coerce :as tc]))

(defn create-default-pages!
  "Creates default pages if one of the default pages does not exist. This
   fn is idempotent"
  [db-conn {:keys [db-graph?]}]
  (when-not (d/entity @db-conn [:block/name "card"])
    (let [time (tc/to-long (t/now))
          built-in-pages (map
                          (fn [m]
                            (cond-> (-> m
                                        (assoc :block/created-at time)
                                        (assoc :block/updated-at time))
                              db-graph?
                              (assoc :block/format :markdown)))
                          default-db/built-in-pages)]
      (d/transact! db-conn built-in-pages))))

(defn start-conn
  "Create datascript conn with schema and default data"
  [& {:keys [create-default-pages? schema]
      :or {create-default-pages? true
           schema db-schema/schema}}]
  (let [db-conn (d/create-conn schema)]
    (when create-default-pages?
      (create-default-pages! db-conn {}))
    db-conn))
