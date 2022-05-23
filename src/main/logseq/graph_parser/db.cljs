(ns logseq.graph-parser.db
  (:require [frontend.db.default :as default-db]
            [frontend.db-schema :as db-schema]
            [datascript.core :as d]))

(defn start-conn
  "Create datascript conn with schema and default data"
  []
  (let [db-conn (d/create-conn db-schema/schema)]
    (d/transact! db-conn [{:schema/version db-schema/version}
                          {:block/name "card"
                           :block/original-name "card"
                           :block/uuid (d/squuid)}])
    (d/transact! db-conn default-db/built-in-pages)
    db-conn))
