(ns frontend.worker.rtc.migrate
  "migrate server data according to schema-version and client's migration-updates"
  (:require [logseq.db.frontend.schema :as db-schema]
            [frontend.worker.db.migrate :as db-migrate]
            [datascript.core :as d]))

(defn- server-client-schema-verion->migrations
  [server-schema-version client-schema-version]
  (when (neg? (db-schema/compare-schema-version server-schema-version client-schema-version))
    (let [sorted-schema-version->updates
          (->> (map (fn [[schema-version updates]]
                      [((juxt :major :minor) (db-schema/parse-schema-version schema-version))
                       updates])
                    db-migrate/schema-version->updates)
               (sort-by first))]
      (->> sorted-schema-version->updates
           (drop-while (fn [[schema-version _updates]]
                         (not (neg? (db-schema/compare-schema-version server-schema-version schema-version)))))
           (take-while (fn [[schema-version _updates]]
                         (not (neg? (db-schema/compare-schema-version client-schema-version schema-version)))))))))


(defn- migration-update->client-ops
  "TODO: support :classes in migration-updates"
  [db migrate-update]
  (let [new-property-entites (keep (fn [k] (d/entity db k)) (:properties migrate-update))]

    )
  )
