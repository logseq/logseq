(ns frontend.modules.outliner.pipeline
  (:require [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [frontend.modules.outliner.file :as file]))


(defn updated-block-hook
  [block])

(defn updated-page-hook
  [page]
  (file/sync-to-file page))

(def keys-of-deleted-entity 1)

(defn get-entity-from-after-or-before
  [db-before db-after db-id]
  (let [r (d/pull db-after '[*] db-id)]
    (if (= keys-of-deleted-entity (count r))
      (let [r (d/pull db-before '[*] db-id)]
        (if (= keys-of-deleted-entity (count r))
          (log/error :outliner-pipeline/cannot-find-entity {:entity r})
          r))
      r)))

(defn get-updated-blocks-and-pages
  [db-before db-after updated-db-ids]
  (reduce
    (fn [acc x]
      (let [block-entity
            (get-entity-from-after-or-before db-before db-after x)
            page-entity
            (when-let [page-id (-> block-entity :block/page :db/id)]
              (get-entity-from-after-or-before db-before db-after page-id))]
        (cond-> acc
          (some? block-entity)
          (update :blocks conj block-entity)

          (some? page-entity)
          (update :pages conj page-entity))))
    {:blocks #{}
     :pages #{}}
    updated-db-ids))

(defn after-transact-pipelines
  [{:keys [db-before db-after tx-data tempids tx-meta] :as tx-report}]
  (let [updated-db-ids (-> (mapv first tx-data) (set))
        {:keys [blocks pages]}
         (get-updated-blocks-and-pages db-before db-after updated-db-ids)]
    (doseq [p (seq pages)] (updated-page-hook p))
    (doseq [b (seq blocks)] (updated-block-hook b))))
