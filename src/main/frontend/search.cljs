(ns frontend.search
  "Provides search functionality for a number of features including Cmd-K
  search. Most of these fns depend on the search protocol"
  (:require [clojure.string :as string]
            [frontend.search.agency :as search-agency]
            [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]
            [frontend.search.browser :as search-browser]
            [frontend.search.fuzzy :as fuzzy]
            [logseq.common.config :as common-config]
            [frontend.db.async :as db-async]
            [frontend.config :as config]
            [frontend.handler.file-based.property.util :as property-util]
            [cljs-bean.core :as bean]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.db.utils :as db-utils]
            [logseq.db :as ldb]))

(def fuzzy-search fuzzy/fuzzy-search)

(defn get-engine
  [repo]
  (search-agency/->Agency repo))

(defn block-search
  [repo q option]
  (when-let [engine (get-engine repo)]
    (let [q (util/search-normalize q (state/enable-search-remove-accents?))]
      (when-not (string/blank? q)
        (protocol/query engine q option)))))

(defn page-search
  ([q]
   (page-search q 100))
  ([q limit]
   (when-let [^js sqlite @search-browser/*sqlite]
     (p/let [result (.page-search sqlite (state/get-current-repo) q limit)]
       (bean/->clj result)))))

(defn file-search
  ([q]
   (file-search q 3))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (let [q (fuzzy/clean-str q)]
      (when-not (string/blank? q)
        (p/let [mldoc-exts (set (map name common-config/mldoc-support-formats))
                result (db-async/<get-files repo)
                files (->> result
                           (map first)
                           (remove (fn [file]
                                     (mldoc-exts (util/get-file-ext file)))))]
          (when (seq files)
            (fuzzy/fuzzy-search files q :limit limit))))))))

(defn template-search
  ([q]
   (template-search q 100))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (when q
       (p/let [q (fuzzy/clean-str q)
               templates (db-async/<get-all-templates repo)]
         (when (seq templates)
           (let [result (fuzzy/fuzzy-search (keys templates) q {:limit limit})]
             (vec (select-keys templates result)))))))))

(defn get-all-properties
  []
  (when-let [repo (state/get-current-repo)]
    (let [hidden-props (if (config/db-based-graph? repo)
                         ;; no-op since already removed
                         (constantly false)
                         (set (map name (property-util/hidden-properties))))]
      (p/let [properties (db-async/<get-all-properties)]
        (remove hidden-props properties)))))

(defn property-search
  ([q]
   (property-search q 100))
  ([q limit]
   (when q
     (p/let [q (fuzzy/clean-str q)
             properties (get-all-properties)]
       (when (seq properties)
         (if (string/blank? q)
           properties
           (let [result (fuzzy/fuzzy-search properties q :limit limit)]
             (vec result))))))))

;; file-based graph only
(defn property-value-search
  ([property q]
   (property-value-search property q 100))
  ([property q limit]
   (when-let [repo (state/get-current-repo)]
     (when q
      (p/let [q (fuzzy/clean-str q)
              result (db-async/<get-property-values repo (keyword property))]
        (when (seq result)
          (if (string/blank? q)
            result
            (let [result (fuzzy/fuzzy-search result q :limit limit)]
              (vec result)))))))))

(defn rebuild-indices!
  ([]
   (rebuild-indices! (state/get-current-repo)))
  ([repo]
   (when repo
     (when-let [engine (get-engine repo)]
       (p/do!
        (protocol/rebuild-pages-indice! engine)
        (protocol/rebuild-blocks-indice! engine))))))

(defn reset-indice!
  [repo]
  (when-let [engine (get-engine repo)]
    (protocol/truncate-blocks! engine)))

(defn remove-db!
  [repo]
  (when-let [engine (get-engine repo)]
    (protocol/remove-db! engine)))

(defn transact-blocks!
  [repo data]
  (when-let [engine (get-engine repo)]
    (protocol/transact-blocks! engine data)))

(defn get-page-unlinked-refs
  "Get matched result from search first, and then filter by worker db"
  [page]
  (when-let [repo (state/get-current-repo)]
    (p/let [page-name (util/safe-page-name-sanity-lc page)
            page (db/entity [:block/name page-name])
            alias-names (conj (set (map util/safe-page-name-sanity-lc
                                        (db/get-page-alias-names repo page-name))) page-name)
            q (string/join " " alias-names)
            result (block-search repo q {:limit 100})
            eids (map (fn [b] [:block/uuid (:block/uuid b)]) result)
            result (when (seq eids)
                     (.get-page-unlinked-refs ^Object @state/*db-worker repo (:db/id page) (ldb/write-transit-str eids)))
            result' (when result (ldb/read-transit-str result))]
      (when result' (db/transact! repo result'))
      (some->> result'
               db-model/sort-by-left-recursive
               db-utils/group-by-page))))
