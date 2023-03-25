(ns logseq.publish-spa.db
  (:require [datascript.core :as d]
            [logseq.db.schema :as db-schema]
            [clojure.string :as string]))

;; Copied from pdf-utils
(defn get-area-block-asset-url
  [block page]
  (when-some [props (and block page (:block/properties block))]
    (when-some [uuid (:block/uuid block)]
      (when-some [stamp (:hl-stamp props)]
        (let [group-key      (string/replace-first (:block/original-name page) #"^hls__" "")
              hl-page        (:hl-page props)
              encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" group-key))
              group-key      (if encoded-chars? (js/encodeURI group-key) group-key)]
          (str "./" "assets" "/" group-key "/" (str hl-page "_" uuid "_" stamp ".png")))))))

(defn clean-asset-path-prefix
  [path]
  (when (string? path)
    (string/replace-first path #"^[.\/\\]*(assets)[\/\\]+" "")))

(defn seq-flatten [col]
  (flatten (seq col)))

(defn pull
  [eid db]
  (d/pull db '[*] eid))

(defn get-public-pages
  [db]
  (-> (d/q
       '[:find ?p
         :where
         [?p :block/name]
         [?p :block/properties ?properties]
         [(get ?properties :public) ?pub]
         [(= true ?pub)]]
       db)
      (seq-flatten)))

(defn get-public-false-pages
  [db]
  (-> (d/q
       '[:find ?p
         :where
         [?p :block/name]
         [?p :block/properties ?properties]
         [(get ?properties :public) ?pub]
         [(= false ?pub)]]
       db)
      (seq-flatten)))

(defn get-public-false-block-ids
  [db]
  (-> (d/q
       '[:find ?b
         :where
         [?p :block/name]
         [?p :block/properties ?properties]
         [(get ?properties :public) ?pub]
         [(= false ?pub)]
         [?b :block/page ?p]]
       db)
      (seq-flatten)))

(defn get-assets
  [db datoms]
  (let [get-page-by-eid
        (memoize #(some->
                   (pull % db)
                   :block/page
                   :db/id
                   (pull db)))]
    (flatten
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
      datoms))))

(defn clean-export!
  [db]
  (let [remove? #(contains? #{"me" "recent" "file"} %)
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
  [db]
  (let [public-pages (get-public-pages db)]
    (when (seq public-pages)
      (let [public-pages (set public-pages)
            exported-namespace? #(contains? #{"block" "me" "recent"} %)
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
                                              ;; TODO: Confirm entity isn't integer
                                              (contains? public-pages (:db/id (:block/page (d/entity db (:e datom))))))))))))
            datoms (d/datoms filtered-db :eavt)
            assets (get-assets db datoms)]
        [@(d/conn-from-datoms datoms db-schema/schema) assets]))))
