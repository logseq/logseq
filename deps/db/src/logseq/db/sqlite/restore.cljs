(ns logseq.db.sqlite.restore
  "Fns to restore a sqlite database to a datascript one"
  (:require [cognitect.transit :as transit]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [datascript.core :as d]
            [goog.object :as gobj]
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

(defn restore-other-data
  "Given an existing datascript connection and additional sqlite data, returns a
  new datascript db with the two combined"
  [conn data uuid->db-id-map & [{:keys [init-db-fn] :or {init-db-fn d/init-db}}]]
  (let [datoms (transient (set (d/datoms @conn :eavt)))]
    (doseq [block data]
      (let [uuid (gobj/get block "uuid")
            eid (get uuid->db-id-map uuid)
            _ (when (nil? eid)
                (prn "Error: block without eid ")
                (js/console.dir block))
            _ (assert eid (str "Can't find eid " eid ", block: " block))
            avs (->> (gobj/get block "datoms")
                     (transit/read t-reader))]
        (doseq [[a v] avs]
          (when (not (#{:block/uuid :page_uuid} a))
            (let [datom (eav->datom uuid->db-id-map [eid a v])]
              (conj! datoms datom))))))

    (let [all-datoms (persistent! datoms)
          new-db (init-db-fn all-datoms db-schema/schema-for-db-based-graph)]
      new-db)))

(defn- datoms-str->eav-vec
  "Given a block's `datoms` transit string and an associated entity id, returns
  a vector of eav triples"
  [datoms-str eid]
  (->> datoms-str
       (transit/read t-reader)
       ;; Remove :page_uuid as it's a transient attribute used during restore but not in the UI
       (remove #(= :page_uuid (first %)))
       (mapv (partial apply vector eid))))

(defn- restore-initial-data*
  "Builds up most datom vectors including all that are assigned new db ids"
  [assign-id-to-uuid-fn all-pages all-blocks init-data]
  (let [pages-eav-coll (doall (mapcat (fn [page]
                                        (let [eid (assign-id-to-uuid-fn (:uuid page))]
                                          (datoms-str->eav-vec (:datoms page) eid)))
                                      all-pages))
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
                                [[eid :block/uuid (:uuid b)]
                                 [eid :block/unknown? true]]
                                (datoms-str->eav-vec (:datoms b) eid))))
                          init-data))]
    {:pages-eav-coll pages-eav-coll
     :all-blocks' all-blocks'
     :init-data' init-data'}))

(defn restore-initial-data
  "Given initial sqlite data, returns a datascript connection and other data
  needed for subsequent restoration"
  [data & [{:keys [conn-from-datoms-fn] :or {conn-from-datoms-fn d/conn-from-datoms}}]]
  (let [{:keys [all-pages all-blocks journal-blocks init-data]} (bean/->clj data)
        uuid->db-id-tmap (transient (hash-map))
        *next-db-id (atom 100001)
        assign-id-to-uuid-fn (fn [uuid-str]
                               (or
                                (get uuid->db-id-tmap uuid-str)
                                (let [id @*next-db-id]
                                  (conj! uuid->db-id-tmap [uuid-str id])
                                  (swap! *next-db-id inc)
                                  id)))
        {:keys [pages-eav-coll all-blocks' init-data']}
        (restore-initial-data* assign-id-to-uuid-fn all-pages all-blocks init-data)
        uuid->db-id-map (persistent! uuid->db-id-tmap)
        journal-blocks' (mapv
                         (fn [b]
                           (let [eid (get uuid->db-id-map (:uuid b))]
                             (datoms-str->eav-vec (:datoms b) eid)))
                         journal-blocks)
        blocks-eav-colls (->> (concat all-blocks' journal-blocks' init-data')
                              (apply concat))
        all-eav-coll (doall (concat pages-eav-coll blocks-eav-colls))
        datoms (map (partial eav->datom uuid->db-id-map)
                    all-eav-coll)
        db-conn (conn-from-datoms-fn datoms db-schema/schema-for-db-based-graph)]
    {:conn db-conn
     :uuid->db-id-map uuid->db-id-map
     :journal-blocks journal-blocks
     :datoms-count (count datoms)}))
