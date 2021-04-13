(ns frontend.modules.datascript-report.core
  (:require [lambdaisland.glogi :as log]
            [datascript.core :as d]
            [datascript.db :as db]))

(def keys-of-deleted-entity 1)

(defn get-entity-from-db-after-or-before
  [db-before db-after db-id]
  (let [r (d/pull db-after '[*] db-id)]
    (if (= keys-of-deleted-entity (count r))
      (let [r (d/pull db-before '[*] db-id)]
        (if (= keys-of-deleted-entity (count r))
          (log/error :outliner-pipeline/cannot-find-entity {:entity r})
          r))
      r)))

(defn get-blocks-and-pages
  [{:keys [db-before db-after tx-data] :as _tx-report}]
  (let [properties (filter (fn [datom]
                             (= :block/properties (:a datom))) tx-data)
        updated-db-ids (-> (mapv first tx-data) (set))
        result (reduce
                (fn [acc x]
                  (let [block-entity
                        (get-entity-from-db-after-or-before db-before db-after x)
                        page-entity
                        (when-let [page-id (-> block-entity :block/page :db/id)]
                          (get-entity-from-db-after-or-before db-before db-after page-id))]
                    (cond-> acc
                      (some? block-entity)
                      (update :blocks conj block-entity)

                      (some? page-entity)
                      (update :pages conj page-entity))))
                {:blocks #{}
                 :pages #{}}
                updated-db-ids)]
    (assoc result :properties properties)))

(defn get-blocks
  [{:keys [db-before db-after tx-data] :as _tx-report}]
  (let [updated-db-ids (-> (mapv first tx-data) (set))]
    (reduce
      (fn [acc x]
        (let [block-entity
              (get-entity-from-db-after-or-before db-before db-after x)]
          (cond-> acc
            (some? block-entity)
            (conj block-entity))))
      []
      updated-db-ids)))
