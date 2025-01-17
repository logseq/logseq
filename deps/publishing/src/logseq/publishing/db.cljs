(ns logseq.publishing.db
  "Provides db fns and associated util fns for publishing"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.db.frontend.entity-plus :as entity-plus]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.rules :as rules]))

(defn ^:api get-area-block-asset-url
  "Returns asset url for an area block used by pdf assets. This lives in this ns
  because it is used by this dep and needs to be independent from the frontend app"
  [db block page]
  (let [db-based? (entity-plus/db-based-graph? db)]
    (when-some [uuid' (:block/uuid block)]
      (if db-based?
        (when-let [image (:logseq.property.pdf/hl-image block)]
          (str "./assets/" (:block/uuid image) ".png"))
        (let [props (and block page (:block/properties block))
              prop-lookup-fn #(get %1 (keyword (name %2)))]
          (when-some [stamp (:hl-stamp props)]
            (let [group-key      (string/replace-first (:block/title page) #"^hls__" "")
                  hl-page        (prop-lookup-fn props :logseq.property.pdf/hl-page)
                  encoded-chars? (boolean (re-find #"(?i)%[0-9a-f]{2}" group-key))
                  group-key      (if encoded-chars? (js/encodeURI group-key) group-key)]
              (str "./assets/" group-key "/" (str hl-page "_" uuid' "_" stamp ".png")))))))))

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

(defn- get-db-public-pages
  "Returns public pages and anything they are directly related to: their tags,
  their properties and any property values that are pages.  Anything on the
  related pages are _not_ included e.g. properties on tag or property pages"
  [db]
  (let [pages (->> (d/q
                    '[:find ?p
                      :in $ %
                      :where (property ?p :logseq.property/publishing-public? true) [?p :block/name]]
                    db
                    (rules/extract-rules rules/db-query-dsl-rules [:property]))
                   (map first)
                   set)
        page-ents (map #(d/entity db %) pages)
        tag-pages* (mapcat #(map :db/id (:block/tags %)) page-ents)
        tag-pages (concat tag-pages*
                          ;; built-in property needs to be public to display tags
                          (when (seq tag-pages*)
                            (some-> (d/entity db :block/tags) :db/id vector)))
        property-pages (mapcat (fn [ent]
                                 (->> (keys (:block/properties ent))
                                      (map #(:db/id (d/entity db %)))))
                               page-ents)]
    (concat pages tag-pages property-pages)))

(defn- get-db-public-false-pages
  [db]
  (->> (d/q
        '[:find ?p
          :in $ %
          :where (property ?p :logseq.property/publishing-public? false) [?p :block/name]]
        db
        (rules/extract-rules rules/db-query-dsl-rules [:property]))
       (map first)
       set))

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

(defn- hl-type-area-fn
  [db]
  (if (entity-plus/db-based-graph? db)
    (fn [datom]
      (and (= :logseq.property.pdf/hl-type (:a datom))
           (= (keyword (:v datom)) :area)))
    (fn [datom]
      (and
       (= :block/properties (:a datom))
       (= (keyword (get (:v datom) :hl-type)) :area)))))

(defn- get-file-assets
  [db datoms]
  (let [pull (fn [eid db]
               (d/pull db '[*] eid))
        get-page-by-eid
        (memoize #(some->
                   (pull % db)
                   :block/page
                   :db/id
                   (pull db)))
        hl-type-area? (hl-type-area-fn db)]
    (->>
     (keep
      (fn [datom]
        (cond-> []
          (= :block/title (:a datom))
          (concat (let [matched (re-seq #"\([./]*/assets/([^)]+)\)" (:v datom))]
                    (when (seq matched)
                      (for [[_ path] matched]
                        (when (and (string? path)
                                   (not (string/ends-with? path ".js")))
                          path)))))
          ;; area image assets
          (hl-type-area? datom)
          (#(let [path (some-> (pull (:e datom) db)
                               (get-area-block-asset-url
                                db
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

(defn- get-db-assets
  [db]
  (->> (d/q '[:find [(pull ?b [:block/uuid :logseq.property.asset/type]) ...]
              :where [?b :block/tags :logseq.class/Asset]]
            db)
       (map #(str (:block/uuid %) "." (:logseq.property.asset/type %)))))

(defn clean-export!
  "Prepares a database assuming all pages are public unless a page has a 'public:: false'"
  [db {:keys [db-graph?]}]
  (let [remove? #(contains? #{"recent" "file"} %)
        non-public-datom-ids (if db-graph?
                               (get-db-public-false-pages db)
                               (set (concat (get-public-false-pages db) (get-public-false-block-ids db))))
        filtered-db (d/filter db
                              (fn [_db datom]
                                (let [ns' (namespace (:a datom))]
                                  (and (not (remove? ns'))
                                       (not (contains? #{:block/file} (:a datom)))
                                       (not (contains? non-public-datom-ids (:e datom)))))))
        datoms (d/datoms filtered-db :eavt)
        assets (if db-graph? (get-db-assets filtered-db) (get-file-assets db datoms))]
    ;; (prn :public-counts :datoms (count datoms) :assets (count assets))
    [@(d/conn-from-datoms datoms (:schema db)) assets]))

(defn- file-filter-only-public
  [public-pages db datom]
  (let [ns' (namespace (:a datom))]
    (and
     (not (contains? #{:block/file} (:a datom)))
     (not= ns' "file")
     (or
      (not (contains? #{"block" "recent"} ns'))
      (and (= ns' "block")
           (or
            (contains? public-pages (:e datom))
            (contains? public-pages (:db/id (:block/page (d/entity db (:e datom)))))))))))

(defn- db-filter-only-public
  [public-ents _db datom]
  (contains? public-ents (:e datom)))

(defn- get-properties-on-nodes
  [db nodes]
  (->> (d/q '[:find ?p
              :in $ [?node ...]
              :where
              [?p :db/ident ?a]
              [?node ?a ?v]
              [(missing? $ ?a :logseq.property/built-in?)]]
            db
            nodes)
       (map first)
       set))

(defn- get-property-values-on-nodes
  [db nodes]
  (->> (d/q '[:find ?pv
              :in $ [?node ...]
              :where
              [?p :db/ident ?a]
              [?p :db/valueType :db.type/ref]
              [?node ?a ?pv]
              [(missing? $ ?p :logseq.property/built-in?)]]
            db
            nodes)
       (map first)
       set))

(defn- get-db-public-ents
  [db public-pages]
  (let [page-blocks (->> (d/datoms db :avet :block/page)
                         (keep #(when (contains? public-pages (:v %)) (:e %)))
                         set)
        public-nodes (into public-pages page-blocks)
        eavt-datoms (d/datoms db :eavt)
        tags (->> eavt-datoms
                  (keep #(when (and (contains? public-nodes (:e %)) (= :block/tags (:a %)))
                           (:v %)))
                  set)
        properties (get-properties-on-nodes db public-nodes)
        ;; This makes nodes from other pages visible on a current public page.
        ;; BUT clicking on a node will not display the node's page
        property-values (get-property-values-on-nodes db public-nodes)
        internal-ents (set/union
                       (->> eavt-datoms
                            (keep #(when (and (= :db/ident (:a %)) (db-malli-schema/internal-ident? (:v %)))
                                     (:e %)))
                            set)
                       (->> (d/datoms db :avet :logseq.property/built-in? true)
                            (map :e)
                            set))
        ents (set/union internal-ents public-pages page-blocks properties property-values tags)]
    #_(prn :public :pages (count public-pages) :page-blocks (count page-blocks)
           :properties (count properties) :property-values (count property-values)
           :tags (count tags) :internal (count internal-ents))
    (when-let [invalid-ents (seq (remove integer? ents))]
      (throw (ex-info (str "The following ents are invalid: " (pr-str (vec invalid-ents))) {})))
    ents))

(defn filter-only-public-pages-and-blocks
  "Prepares a database assuming all pages are private unless a page has a 'public:: true'"
  [db {:keys [db-graph?]}]
  {:post [(some? %) (sequential? %)]}
  (let [public-pages* (seq (if db-graph? (get-db-public-pages db) (get-public-pages db)))
        public-pages (set/union (set public-pages*)
                                (get-aliases-for-page-ids db public-pages*))
        filter-fn (if db-graph?
                    (partial db-filter-only-public (get-db-public-ents db public-pages))
                    (partial file-filter-only-public public-pages))
        filtered-db (d/filter db filter-fn)
        datoms (d/datoms filtered-db :eavt)
        assets (if db-graph? (get-db-assets filtered-db) (get-file-assets db datoms))]
    ;; (prn :private-counts :internal (count internal-ents) :datoms (count datoms) :assets (count assets))
    [@(d/conn-from-datoms datoms (:schema db)) assets]))
