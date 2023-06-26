(ns logseq.db
  "Main namespace for public db fns"
  (:require [logseq.db.default :as default-db]
            [logseq.db.schema :as db-schema]
            [datascript.core :as d]))

(defn create-default-pages!
  [db-conn]
  (when-not (d/entity @db-conn [:block/name "card"])
    (d/transact! db-conn
      (concat
       [{:block/name "card"
         :block/original-name "card"
         :block/uuid (d/squuid)}
        {:schema/version db-schema/version}]
       default-db/built-in-pages))))

(defn start-conn
  "Create datascript conn with schema and default data"
  [& {:keys [create-default-pages?]
      :or {create-default-pages? true}}]
  (let [db-conn (d/create-conn (db-schema/get-schema))]
    (when create-default-pages?
      (create-default-pages? db-conn))
    db-conn))
