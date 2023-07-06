(ns logseq.db.sqlite.restore
  (:require [cognitect.transit :as transit]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.schema :as db-schema]))

(def ^:private t-reader (transit/reader :json))

(defn- uuid-string?
  [s]
  (and (string? s)
       (= (count s) 36)
       (string/includes? s "-")))

(defn- eav->datom
  [uuid->db-id-map [e a v]]
  (let [v' (cond
             (and (= :block/uuid a) (string? v))
             (uuid v)

             (and (coll? v) (= :block/uuid (first v)) (string? (second v)))
             (get uuid->db-id-map (second v) v)

             :else
             v)]
    (d/datom e a v')))

(defn restore-initial-data
  "Given initial sqlite data, returns a datascript connection and other data
  needed for subsequent restoration"
  [data & [{:keys [conn-from-datoms-fn] :or {conn-from-datoms-fn d/conn-from-datoms}}]]
  (let [{:keys [all-pages all-blocks journal-blocks init-data]} (bean/->clj data)
        uuid->db-id-tmap (transient (hash-map))
        *next-db-id (atom 100001)
        assign-id-to-uuid-fn (fn [uuid-str]
                               (let [id @*next-db-id]
                                 (conj! uuid->db-id-tmap [uuid-str id])
                                 (swap! *next-db-id inc)
                                 id))
        pages (mapv (fn [page]
                      (let [eid (assign-id-to-uuid-fn (:uuid page))]
                        (->> page
                             :datoms
                             (transit/read t-reader)
                             (mapv (partial apply vector eid)))))
                    all-pages)
        all-blocks' (doall
                     (keep (fn [b]
                             (let [eid (assign-id-to-uuid-fn (:uuid b))]
                               (when (and (uuid-string? (:uuid b))
                                          (uuid-string? (:page_uuid b)))
                                 [[eid :block/uuid (:uuid b)]
                                  [eid :block/page [:block/uuid (:page_uuid b)]]])))
                           all-blocks))
        init-data' (doall
                    (keep (fn [b]
                            (let [eid (assign-id-to-uuid-fn (:uuid b))]
                              (if (and (uuid-string? (:uuid b))
                                       (not (contains?  #{3 6} (:type b)))) ; deleted blocks still refed
                                [[eid :block/uuid (:uuid b)]]
                                (->> b
                                     :datoms
                                     (transit/read t-reader)
                                     (mapv (partial apply vector eid))))))
                          init-data))
        uuid->db-id-map (persistent! uuid->db-id-tmap)
        journal-blocks' (mapv
                         (fn [b]
                           (let [eid (get uuid->db-id-map (:uuid b))]
                             (->> b
                                  :datoms
                                  (transit/read t-reader)
                                  (mapv (partial apply vector eid)))))
                         journal-blocks)
        pages-eav-coll (apply concat pages)
        blocks-eav-colls (->> (concat all-blocks' journal-blocks' init-data')
                              (apply concat))
        all-eav-coll (doall (concat pages-eav-coll blocks-eav-colls))
        datoms (map
                (partial eav->datom uuid->db-id-map)
                all-eav-coll)
        db-conn (conn-from-datoms-fn datoms db-schema/schema-for-db-based-graph)]
    {:conn db-conn
     :uuid->db-id-map uuid->db-id-map
     :journal-blocks journal-blocks
     :datoms-count (count datoms)}))