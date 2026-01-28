(ns frontend.worker.undo-redo
  "Undo redo validate"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [lambdaisland.glogi :as log]
            [logseq.db :as ldb]))

(defn- parent-cycle?
  [ent]
  (let [start (:block/uuid ent)]
    (loop [current ent
           seen #{start}
           steps 0]
      (cond
        (>= steps 200) true
        (nil? (:block/parent current)) false
        :else (let [next-ent (:block/parent current)
                    next-uuid (:block/uuid next-ent)]
                (if (contains? seen next-uuid)
                  true
                  (recur next-ent (conj seen next-uuid) (inc steps))))))))

(defn- db-issues
  [db]
  (let [ents (->> (d/q '[:find [?e ...]
                         :where
                         [?e :block/uuid]]
                       db)
                  (map (fn [e] (d/entity db e))))
        uuid-required-ids (->> (concat
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/title]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/page]]
                                     db)
                                (d/q '[:find [?e ...]
                                       :where
                                       [?e :block/parent]]
                                     db))
                               distinct)]
    (concat
     (for [e uuid-required-ids
           :let [ent (d/entity db e)]
           :when (nil? (:block/uuid ent))]
       {:type :missing-uuid :e e})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) (nil? parent))]
       {:type :missing-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and (not (ldb/page? ent)) parent (nil? (:block/uuid parent)))]
       {:type :missing-parent-ref :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) (nil? page))]
       {:type :missing-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 page (:block/page ent)]
           :when (and (not (ldb/page? ent)) page (not (ldb/page? page)))]
       {:type :page-not-page :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)
                 page (:block/page ent)
                 expected-page (when parent
                                 (if (ldb/page? parent) parent (:block/page parent)))]
           :when (and (not (ldb/page? ent))
                      parent
                      page
                      expected-page
                      (not= (:block/uuid expected-page) (:block/uuid page)))]
       {:type :page-mismatch :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)
                 parent (:block/parent ent)]
           :when (and parent (= uuid (:block/uuid parent)))]
       {:type :self-parent :uuid uuid})
     (for [ent ents
           :let [uuid (:block/uuid ent)]
           :when (and (not (ldb/page? ent))
                      (parent-cycle? ent))]
       {:type :cycle :uuid uuid}))))

(defn valid-undo-redo-tx?
  [conn tx-data]
  (let [temp-conn (d/conn-from-db @conn)]
    (try
      (let [baseline-issues (set (db-issues @temp-conn))]
        (d/transact! temp-conn tx-data {:temp-conn? true})
        (let [after-issues (set (db-issues @temp-conn))
              new-issues (seq (set/difference after-issues baseline-issues))]
          (when (seq new-issues)
            (log/warn ::undo-redo-invalid {:issues (take 5 new-issues)}))
          (empty? new-issues)))
      (catch :default e
        (log/error ::undo-redo-validate-failed e)
        false)
      (finally
        (reset! temp-conn nil)))))
