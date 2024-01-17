(ns logseq.db.frontend.validate
  "Validate frontend db"
  (:require [datascript.core :as d]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [malli.util :as mu]
            [malli.core :as m]
            [cljs.pprint :as pprint]))

(defn validate-db!
  "Validates the entities that have changed in the given datascript tx-report.
   Validation is only for DB graphs. Returns boolean indicating if db is valid"
  [{:keys [db-after tx-data tx-meta]} validate-options]
  (let [{:keys [closed-schema?]} validate-options
        changed-ids (->> tx-data (map :e) distinct)
        ent-maps* (->> changed-ids (mapcat #(d/datoms db-after :eavt %)) db-malli-schema/datoms->entity-maps vals)
        ent-maps (vec (db-malli-schema/update-properties-in-ents ent-maps*))
        db-schema (cond-> db-malli-schema/DB
                    true
                    (db-malli-schema/update-properties-in-schema db-after)
                    closed-schema?
                    mu/closed-schema)]
    (js/console.log "changed eids:" changed-ids tx-meta)
    (if-let [errors (->> ent-maps
                         (m/explain db-schema)
                         :errors)]
      (do (js/console.error "Invalid datascript entities detected amongst changed entity ids:" changed-ids)
          (pprint/pprint {:errors errors})
          (pprint/pprint {:entity-maps ent-maps})
          false)
      true)))
