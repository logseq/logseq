(ns frontend.worker.rtc.migrate
  "migrate server data according to schema-version and client's migration-updates"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [frontend.worker.rtc.gen-client-op :as gen-client-op]))

(defn migration-results=>client-ops
  [{:keys [_from-version to-version upgrade-result-coll] :as _migration-result}]
  (let [client-ops
        (mapcat
         (fn [{:keys [tx-data db-before db-after migrate-updates]}]
           (cond
             (:fix migrate-updates)
             (let [{:keys [same-entity-datoms-coll id->same-entity-datoms]}
                   (gen-client-op/group-datoms-by-entity tx-data)
                   e->a->add?->v->t
                   (update-vals
                    id->same-entity-datoms
                    gen-client-op/entity-datoms=>a->add?->v->t)]
               (gen-client-op/generate-rtc-ops db-before db-after same-entity-datoms-coll e->a->add?->v->t))

             (empty? (set/difference (set (keys migrate-updates)) #{:properties :classes :rename-db-idents}))
             (let [property-ks (:properties migrate-updates)
                   class-ks (:classes migrate-updates)
                   rename-db-idents (:rename-db-idents migrate-updates)
                   d-entity-fn (partial d/entity db-after)
                   new-property-entities (keep d-entity-fn property-ks)
                   new-class-entities (keep d-entity-fn class-ks)]
               (concat (gen-client-op/generate-rtc-ops-from-property-entities new-property-entities)
                       (gen-client-op/generate-rtc-ops-from-class-entities new-class-entities)
                       (gen-client-op/generate-rtc-rename-db-ident-ops rename-db-idents)))))
         upgrade-result-coll)
        max-t (apply max 0 (map second client-ops))]
    (conj (vec client-ops)
          [:update-kv-value
           max-t
           {:db-ident :logseq.kv/schema-version
            :value to-version}])))
