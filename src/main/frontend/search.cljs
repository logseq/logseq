(ns frontend.search
  "Provides search functionality for a number of features including Cmd-K
  search. Most of these fns depend on the search protocol"
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [logseq.graph-parser.config :as gp-config]
            [frontend.db :as db]
            [frontend.db.model :as db-model]
            [frontend.regex :as regex]
            [frontend.search.agency :as search-agency]
            [frontend.search.db :as search-db :refer [indices]]
            [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [frontend.util.property :as property]
            [goog.object :as gobj]
            [promesa.core :as p]
            [clojure.set :as set]
            [frontend.modules.datascript-report.core :as db-report]))

(defn get-engine
  [repo]
  (search-agency/->Agency repo))

;; Copied from https://gist.github.com/vaughnd/5099299
(defn str-len-distance
  ;; normalized multiplier 0-1
  ;; measures length distance between strings.
  ;; 1 = same length
  [s1 s2]
  (let [c1 (count s1)
        c2 (count s2)
        maxed (max c1 c2)
        mined (min c1 c2)]
    (double (- 1
               (/ (- maxed mined)
                  maxed)))))

(def MAX-STRING-LENGTH 1000.0)

(defn clean-str
  [s]
  (string/replace (string/lower-case s) #"[\[ \\/_\]\(\)]+" ""))

(def escape-str regex/escape)

(defn char-array
  [s]
  (bean/->js (seq s)))

(defn score
  [oquery ostr]
  (let [query (clean-str oquery)
        str (clean-str ostr)]
    (loop [q (seq (char-array query))
           s (seq (char-array str))
           mult 1
           idx MAX-STRING-LENGTH
           score 0]
      (cond
        ;; add str-len-distance to score, so strings with matches in same position get sorted by length
        ;; boost score if we have an exact match including punctuation
        (empty? q) (+ score
                      (str-len-distance query str)
                      (if (<= 0 (.indexOf ostr oquery)) MAX-STRING-LENGTH 0))
        (empty? s) 0
        :else (if (= (first q) (first s))
                   (recur (rest q)
                          (rest s)
                          (inc mult) ;; increase the multiplier as more query chars are matched
                          (dec idx) ;; decrease idx so score gets lowered the further into the string we match
                          (+ mult score)) ;; score for this match is current multiplier * idx
                   (recur q
                          (rest s)
                          1 ;; when there is no match, reset multiplier to one
                          (dec idx)
                          score))))))

(defn fuzzy-search
  [data query & {:keys [limit extract-fn]
                 :or {limit 20}}]
  (let [query (util/search-normalize query (state/enable-search-remove-accents?))]
    (->> (take limit
               (sort-by :score (comp - compare)
                        (filter #(< 0 (:score %))
                                (for [item data]
                                  (let [s (str (if extract-fn (extract-fn item) item))]
                                    {:data item
                                     :score (score query (util/search-normalize s (state/enable-search-remove-accents?)))})))))
         (map :data))))

(defn block-search
  [repo q option]
  (when-let [engine (get-engine repo)]
    (let [q (util/search-normalize q (state/enable-search-remove-accents?))
          q (if (util/electron?) q (escape-str q))]
      (when-not (string/blank? q)
        (protocol/query engine q option)))))

(defn page-content-search
  [repo q option]
  (when-let [engine (get-engine repo)]
    (let [q (util/search-normalize q (state/enable-search-remove-accents?))
          q (if (util/electron?) q (escape-str q))]
      (when-not (string/blank? q)
        (protocol/query-page engine q option)))))

(defn- transact-blocks!
  [repo data]
  (when-let [engine (get-engine repo)]
    (protocol/transact-blocks! engine data)))

(defn- transact-pages!
  "Transact pages to search engine
   :pages-to-remove-set the set of pages to remove (not include those to update)
   :pages-to-add        the page entities to add"
  [repo data]
  (when-let [engine (get-engine repo)]
    (protocol/transact-pages! engine data)))

(defn exact-matched?
  "Check if two strings points toward same search result"
  [q match]
  (when (and (string? q) (string? match))
    (boolean
     (reduce
      (fn [coll char]
        (let [coll' (drop-while #(not= char %) coll)]
          (if (seq coll')
            (rest coll')
            (reduced false))))
      (seq (util/search-normalize match (state/enable-search-remove-accents?)))
      (seq (util/search-normalize q (state/enable-search-remove-accents?)))))))

(defn page-search
  "Return a list of page names that match the query"
  ([q]
   (page-search q 10))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (let [q (util/search-normalize q (state/enable-search-remove-accents?))
           q (clean-str q)]
       (when-not (string/blank? q)
         (let [indice (or (get-in @indices [repo :pages])
                          (search-db/make-pages-title-indice!))
               result (->> (.search indice q (clj->js {:limit limit}))
                           (bean/->clj))]
           ;; TODO: add indexes for highlights
           (->> (map
                  (fn [{:keys [item]}]
                    (:original-name item))
                 result)
                (remove nil?)
                (map string/trim)
                (distinct)
                (filter (fn [original-name]
                          (exact-matched? q original-name))))))))))

(defn file-search
  ([q]
   (file-search q 3))
  ([q limit]
   (let [q (clean-str q)]
     (when-not (string/blank? q)
       (let [mldoc-exts (set (map name gp-config/mldoc-support-formats))
             files (->> (db/get-files (state/get-current-repo))
                        (map first)
                        (remove (fn [file]
                                  (mldoc-exts (util/get-file-ext file)))))]
         (when (seq files)
           (fuzzy-search files q :limit limit)))))))

(defn template-search
  ([q]
   (template-search q 100))
  ([q limit]
   (when q
     (let [q (clean-str q)
           templates (db/get-all-templates)]
       (when (seq templates)
         (let [result (fuzzy-search (keys templates) q :limit limit)]
           (vec (select-keys templates result))))))))

(defn property-search
  ([q]
   (property-search q 100))
  ([q limit]
   (when q
     (let [q (clean-str q)
           properties (->> (db-model/get-all-properties)
                           (remove (property/hidden-properties))
                           ;; Complete full keyword except the ':'
                           (map #(subs (str %) 1)))]
       (when (seq properties)
         (if (string/blank? q)
           properties
           (let [result (fuzzy-search properties q :limit limit)]
             (vec result))))))))

(defn property-value-search
  ([property q]
   (property-value-search property q 100))
  ([property q limit]
   (when q
     (let [q (clean-str q)
           result (db-model/get-property-values (keyword property))]
       (when (seq result)
         (if (string/blank? q)
           result
           (let [result (fuzzy-search result q :limit limit)]
             (vec result))))))))

(defn- get-pages-from-datoms-impl
  [pages]
  (let [pages-result (db/pull-many '[:db/id :block/name :block/original-name] (set (map :e pages)))
        pages-to-add-set (->> (filter :added pages)
                              (map :e)
                              (set))
        pages-to-add (->> (filter (fn [page]
                                    (contains? pages-to-add-set (:db/id page))) pages-result)
                          (map (fn [p] (or (:block/original-name p)
                                           (:block/name p))))
                          (remove string/blank?)
                          (map search-db/original-page-name->index))
        pages-to-remove-set (->> (remove :added pages)
                                 (map :v))
        pages-to-remove-id-set (->> (remove :added pages)
                                    (map :e)
                                    set)]
    {:pages-to-add        pages-to-add
     :pages-to-remove-set pages-to-remove-set
     :pages-to-add-id-set pages-to-add-set
     :pages-to-remove-id-set pages-to-remove-id-set}))

(defn- get-blocks-from-datoms-impl
  [blocks]
  (when (seq blocks)
    (let [blocks-result (->> (db/pull-many '[:db/id :block/uuid :block/format :block/content :block/page] (set (map :e blocks)))
                             (map (fn [b] (assoc b :block/page (get-in b [:block/page :db/id])))))
          blocks-to-add-set (->> (filter :added blocks)
                                 (map :e)
                                 (set))
          blocks-to-add (->> (filter (fn [block]
                                       (contains? blocks-to-add-set (:db/id block)))
                                     blocks-result)
                             (map search-db/block->index)
                             (remove nil?))
          blocks-to-remove-set (->> (remove :added blocks)
                                    (map :e)
                                    (set))]
      {:blocks-to-remove-set blocks-to-remove-set
       :blocks-to-add        blocks-to-add})))

(defn- get-direct-blocks-and-pages
  [tx-report]
  (let [data (:tx-data tx-report)
        datoms (filter
                (fn [datom]
                  (contains? #{:block/name :block/content} (:a datom)))
                data)]
    (when (seq datoms)
      (let [datoms (group-by :a datoms)
            blocks (:block/content datoms)
            pages (:block/name datoms)]
        (merge (get-blocks-from-datoms-impl blocks)
               (get-pages-from-datoms-impl pages))))))

(defn- get-indirect-pages
  "Return the set of pages that will have content updated"
  [tx-report]
  (let [data   (:tx-data tx-report)
        datoms (filter
                (fn [datom]
                  (and (:added datom)
                       (contains? #{:file/content} (:a datom))))
                data)]
    (when (seq datoms)
      (->> datoms
           (mapv (fn [datom]
                   (let [tar-db  (:db-after tx-report)]
                     ;; Reverse query the corresponding page id of the modified `:file/content`)
                     (when-let [page-id (->> (:e datom)
                                             (db-report/safe-pull tar-db '[:block/_file])
                                             (:block/_file)
                                             (first)
                                             (:db/id))]
                       ;; Fetch page entity according to what page->index requested
                       (db-report/safe-pull tar-db '[:db/id :block/uuid
                                                     :block/original-name
                                                     {:block/file [:file/content]}]
                                            page-id)))))
           (remove nil?)))))

;; TODO merge with logic in `invoke-hooks` when feature and test is sufficient
(defn sync-search-indice!
  [repo tx-report]
  (let [{:keys [pages-to-add pages-to-remove-set pages-to-remove-id-set
                blocks-to-add blocks-to-remove-set]} (get-direct-blocks-and-pages tx-report) ;; directly modified block & pages
        updated-pages (get-indirect-pages tx-report)]
    ;; update page title indice
    (when (or (seq pages-to-add) (seq pages-to-remove-set))
      (swap! search-db/indices update-in [repo :pages]
             (fn [indice]
               (when indice
                 (doseq [page-name pages-to-remove-set]
                   (.remove indice
                            (fn [page]
                              (= (util/safe-page-name-sanity-lc page-name)
                                 (util/safe-page-name-sanity-lc (gobj/get page "original-name"))))))
                 (when (seq pages-to-add)
                   (doseq [page pages-to-add]
                     (.add indice (bean/->js page)))))
               indice)))

    ;; update block indice
    (when (or (seq blocks-to-add) (seq blocks-to-remove-set))
      (transact-blocks! repo
                        {:blocks-to-remove-set blocks-to-remove-set
                         :blocks-to-add        blocks-to-add}))

    ;; update page indice
    (when (or (seq pages-to-remove-id-set) (seq updated-pages)) ;; when move op happens, no :block/content provided
      (let [indice-pages   (map search-db/page->index updated-pages)
            invalid-set    (->> (map (fn [updated indiced] ;; get id of pages without valid page index
                                       (if indiced nil (:db/id updated)))
                                     updated-pages indice-pages)
                                (remove nil?)
                                set)
            pages-to-add   (->> indice-pages
                                (remove nil?)
                                set)
            pages-to-remove-set (set/union pages-to-remove-id-set invalid-set)]
        (transact-pages! repo {:pages-to-remove-set pages-to-remove-set
                               :pages-to-add        pages-to-add})))))

(defn rebuild-indices!
  ([]
   (rebuild-indices! (state/get-current-repo)))
  ([repo]
   (when repo
     (when-let [engine (get-engine repo)]
       (let [page-titles (search-db/make-pages-title-indice!)]
         (p/let [blocks (protocol/rebuild-blocks-indice! engine)]
           (let [result {:pages         page-titles ;; TODO: rename key to :page-titles
                         :blocks        blocks}]
             (swap! indices assoc repo result)
             indices)))))))

(defn reset-indice!
  [repo]
  (when-let [engine (get-engine repo)]
    (protocol/truncate-blocks! engine))
  (swap! indices assoc-in [repo :pages] nil))

(defn remove-db!
  [repo]
  (when-let [engine (get-engine repo)]
    (protocol/remove-db! engine)))
