(ns frontend.worker.rtc.migrate
  "migrate server data according to schema-version and client's migration-updates"
  (:require [datascript.core :as d]
            [frontend.worker.db.migrate :as db-migrate]
            [frontend.worker.rtc.client-op :as client-op]
            [frontend.worker.rtc.gen-client-op :as gen-client-op]
            [logseq.db.frontend.schema :as db-schema]))

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
                         (not (neg? (db-schema/compare-schema-version client-schema-version schema-version)))))
           (map second)))))

(defn- migration-updates->client-ops
  "TODO: support :classes in migration-updates"
  [db client-schema-version migrate-updates]
  (let [property-ks (mapcat :properties migrate-updates)
        new-property-entites (keep (fn [k] (d/entity db k)) property-ks)
        client-ops (vec (gen-client-op/generate-rtc-ops-from-property-entities new-property-entites))
        max-t (apply max (map second client-ops))]
    (conj client-ops
          [:update-kv-value
           max-t
           {:db-ident :logseq.kv/schema-version
            :value client-schema-version}])))

(defn add-migration-client-ops!
  [repo db server-schema-version client-schema-version]
  (assert (and server-schema-version client-schema-version))
  (when-let [ops (not-empty
                  (some->> (server-client-schema-verion->migrations server-schema-version client-schema-version)
                           (migration-updates->client-ops db client-schema-version)))]
    (client-op/add-ops! repo ops)))
