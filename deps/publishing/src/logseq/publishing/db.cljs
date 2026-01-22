(ns logseq.publishing.db
  "Provides db fns and associated util fns for publishing"
  (:require [clojure.set :as set]
            [datascript.core :as d]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.rules :as rules]))

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
                                 (->> (keys (entity-plus/lookup-kv-then-entity ent :block/properties))
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
  "Prepares a database assuming all pages are public unless a page has a publishing-public? property set to false"
  [db]
  (let [remove? #(contains? #{"file"} %)
        non-public-datom-ids (get-db-public-false-pages db)
        filtered-db (d/filter db
                              (fn [_db datom]
                                (let [ns' (namespace (:a datom))]
                                  (and (not (remove? ns'))
                                       (not (contains? non-public-datom-ids (:e datom)))
                                       (not (and (contains? non-public-datom-ids (:v datom))
                                                 (= :block/page (:a datom))))))))
        datoms (d/datoms filtered-db :eavt)
        assets (get-db-assets filtered-db)]
    ;; (prn :public-counts :datoms (count datoms) :assets (count assets))
    [@(d/conn-from-datoms datoms (:schema db)) assets]))

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
  "Prepares a database assuming all pages are private unless a page has a publishing-public? property set to true"
  [db]
  {:post [(some? %) (sequential? %)]}
  (let [public-pages* (seq (get-db-public-pages db))
        public-pages (set/union (set public-pages*)
                                (get-aliases-for-page-ids db public-pages*))
        filter-fn (partial db-filter-only-public (get-db-public-ents db public-pages))
        filtered-db (d/filter db filter-fn)
        datoms (d/datoms filtered-db :eavt)
        assets (get-db-assets filtered-db)]
    ;; (prn :private-counts :internal (count internal-ents) :datoms (count datoms) :assets (count assets))
    [@(d/conn-from-datoms datoms (:schema db)) assets]))
