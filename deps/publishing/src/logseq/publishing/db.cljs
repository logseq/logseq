(ns logseq.publishing.db
  "Provides db fns and associated util fns for publishing"
  (:require [datascript.core :as d]
            [logseq.db.schema :as db-schema]
            [logseq.db.rules :as rules]
            [clojure.set :as set]
            [clojure.string :as string]))

(defn ^:api get-area-block-asset-url
  "Returns asset url for an area block used by pdf assets. This lives in this ns
  because it is used by this dep and needs to be independent from the frontend app"
  [block page]
  (when-some [props (and block page (:block/properties block))]
    (when-some [uuid (:block/uuid block)]
      (when-some [stamp (:hl-stamp props)]
        (let [group-key      (string/replace-first (:block/original-name page) #"^hls__" "")
              hl-page        (:hl-page props)
              encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" group-key))
              group-key      (if encoded-chars? (js/encodeURI group-key) group-key)]
          (str "./assets/" group-key "/" (str hl-page "_" uuid "_" stamp ".png")))))))

(defn- clean-asset-path-prefix
  [path]
  (when (string? path)
    (string/replace-first path #"^[.\/\\]*(assets)[\/\\]+" "")))

(defn- get-public-pages
  [db]
  (->> (d/q
        '[:find ?p
          :where
          [?p :block/name]
          [?p :block/properties ?properties]
          [(get ?properties :public) ?pub]
          [(= true ?pub)]]
        db)
       (map first)))

(defn- get-public-false-pages
  [db]
  (->> (d/q
        '[:find ?p
          :where
          [?p :block/name]
          [?p :block/properties ?properties]
          [(get ?properties :public) ?pub]
          [(= false ?pub)]]
        db)
       (map first)))

(defn- get-public-false-block-ids
  [db]
  (->> (d/q
        '[:find ?b
          :where
          [?p :block/name]
          [?p :block/properties ?properties]
          [(get ?properties :public) ?pub]
          [(= false ?pub)]
          [?b :block/page ?p]]
        db)
       (map first)))

(defn- get-assets
  [db datoms]
  (let [pull (fn [eid db]
               (d/pull db '[*] eid))
        get-page-by-eid
        (memoize #(some->
                   (pull % db)
                   :block/page
                   :db/id
                   (pull db)))]
    (->>
     (keep
      (fn [datom]
        (cond-> []

          (= :block/content (:a datom))
          (concat (let [matched (re-seq #"\([./]*/assets/([^)]+)\)" (:v datom))]
                    (when (seq matched)
                      (for [[_ path] matched]
                        (when (and (string? path)
                                   (not (string/ends-with? path ".js")))
                          path)))))
          ;; area image assets
          (= (:hl-type (:v datom)) "area")
          (#(let [path (some-> (pull (:e datom) db)
                               (get-area-block-asset-url
                                (get-page-by-eid (:e datom))))
                  path (clean-asset-path-prefix path)]
              (conj % path)))))
      datoms)
     flatten
     distinct)))

(defn- get-aliases-for-page-ids
  [db page-ids]
  (->> (d/q '[:find ?e
              :in $ ?pages %
              :where
              [?page :block/name]
              [(contains? ?pages ?page)]
              (alias ?page ?e)]
            db
            (set page-ids)
            (:alias rules/rules))
       (map first)
       set))

(defn clean-export!
  "Prepares a database assuming all pages are public unless a page has a 'public:: false'"
  [db]
  (let [remove? #(contains? #{"recent" "file"} %)
        non-public-pages (get-public-false-pages db)
        non-public-datoms (get-public-false-block-ids db)
        non-public-datom-ids (set (concat non-public-pages non-public-datoms))
        filtered-db (d/filter db
                              (fn [_db datom]
                                (let [ns (namespace (:a datom))]
                                  (and (not (remove? ns))
                                       (not (contains? #{:block/file} (:a datom)))
                                       (not (contains? non-public-datom-ids (:e datom)))))))
        datoms (d/datoms filtered-db :eavt)
        assets (get-assets db datoms)]
    [@(d/conn-from-datoms datoms db-schema/schema) assets]))

(defn filter-only-public-pages-and-blocks
  "Prepares a database assuming all pages are private unless a page has a 'public:: true'"
  [db]
  (when-let [public-pages* (seq (get-public-pages db))]
    (let [public-pages (set/union (set public-pages*)
                                  (get-aliases-for-page-ids db public-pages*))
          exported-namespace? #(contains? #{"block" "recent"} %)
          filtered-db (d/filter db
                                (fn [db datom]
                                  (let [ns (namespace (:a datom))]
                                    (and
                                     (not (contains? #{:block/file} (:a datom)))
                                     (not= ns "file")
                                     (or
                                      (not (exported-namespace? ns))
                                      (and (= ns "block")
                                           (or
                                            (contains? public-pages (:e datom))
                                            (contains? public-pages (:db/id (:block/page (d/entity db (:e datom))))))))))))
          datoms (d/datoms filtered-db :eavt)
          assets (get-assets db datoms)]
      [@(d/conn-from-datoms datoms db-schema/schema) assets])))
