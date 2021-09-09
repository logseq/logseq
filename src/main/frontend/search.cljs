(ns frontend.search
  (:require [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.config :as config]
            [frontend.db :as db]
            [frontend.regex :as regex]
            [frontend.search.browser :as search-browser]
            [frontend.search.db :as search-db :refer [indices]]
            [frontend.search.node :as search-node]
            [frontend.search.protocol :as protocol]
            [frontend.state :as state]
            [frontend.util :as util]
            [goog.object :as gobj]
            [promesa.core :as p]))

(defn get-engine
  [repo]
  (if (util/electron?)
    (search-node/->Node repo)
    (search-browser/->Browser repo)))

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
        :default (if (= (first q) (first s))
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
  (let [query (string/lower-case query)]
    (->> (take limit
               (sort-by :score (comp - compare)
                        (filter #(< 0 (:score %))
                                (for [item data]
                                  (let [s (str (if extract-fn (extract-fn item) item))]
                                    {:data item
                                     :score (score query (.toLowerCase s))})))))
         (map :data))))

(defn block-search
  [repo q option]
  (when-let [engine (get-engine repo)]
    (let [q (string/lower-case q)
          q (if (util/electron?) q (escape-str q))]
      (when-not (string/blank? q)
        (protocol/query engine q option)))))

(defn transact-blocks!
  [repo data]
  (when-let [engine (get-engine repo)]
    (protocol/transact-blocks! engine data)))

(defn exact-matched?
  [q match]
  (when (and (string? q) (string? match))
    (boolean
     (reduce
      (fn [coll char]
        (let [coll' (drop-while #(not= char %) coll)]
          (if (seq coll')
            (rest coll')
            (reduced false))))
      (seq (string/lower-case match))
      (seq (string/lower-case q))))))

(defn page-search
  ([q]
   (page-search q 3))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (let [q (string/lower-case q)
           q (clean-str q)]
       (when-not (string/blank? q)
         (let [indice (or (get-in @indices [repo :pages])
                          (search-db/make-pages-indice!))
               result (->> (.search indice q (clj->js {:limit limit}))
                           (bean/->clj))]
           ;; TODO: add indexes for highlights
           (->> (map
                  (fn [{:keys [item]}]
                    (:name item))
                 result)
                (remove nil?)
                (distinct)
                (filter (fn [name]
                          (exact-matched? q name))))))))))

(defn file-search
  ([q]
   (file-search q 3))
  ([q limit]
   (let [q (clean-str q)]
     (when-not (string/blank? q)
       (let [mldoc-exts (set (map name config/mldoc-support-formats))
             files (->> (db/get-files (state/get-current-repo))
                        (map first)
                        (remove (fn [file]
                                  (mldoc-exts (util/get-file-ext file)))))]
         (when (seq files)
           (fuzzy-search files q :limit limit)))))))

(defn template-search
  ([q]
   (template-search q 10))
  ([q limit]
   (let [q (clean-str q)]
     (let [templates (db/get-all-templates)]
       (when (seq templates)
         (let [result (fuzzy-search (keys templates) q :limit limit)]
           (vec (select-keys templates result))))))))

(defn sync-search-indice!
  [datoms]
  (when (seq datoms)
    (when-let [repo (state/get-current-repo)]
      (let [datoms (group-by :a datoms)
            pages (:block/name datoms)
            blocks (:block/content datoms)]
        (when (seq pages)
          (let [pages-result (db/pull-many '[:db/id :block/name :block/original-name] (set (map :e pages)))
                pages-to-add-set (->> (filter :added pages)
                                      (map :e)
                                      (set))
                pages-to-add (->> (filter (fn [page]
                                            (contains? pages-to-add-set (:db/id page))) pages-result)
                                  (map (fn [p] {:name (or (:block/original-name p)
                                                          (:block/name p))})))
                pages-to-remove-set (->> (remove :added pages)
                                         (map :v))]
            (swap! search-db/indices update-in [repo :pages]
                   (fn [indice]
                     (when indice
                       (doseq [page-name pages-to-remove-set]
                         (.remove indice
                                  (fn [page]
                                    (= page-name (gobj/get page "name")))))
                       (when (seq pages-to-add)
                         (doseq [page pages-to-add]
                           (.add indice (bean/->js page)))))
                     indice))))
        (when (seq blocks)
          (let [blocks-result (->> (db/pull-many '[:db/id :block/uuid :block/format :block/content :block/page] (set (map :e blocks)))
                                   (map (fn [b] (assoc b :block/page (get-in b [:block/page :db/id])))))
                blocks-to-add-set (->> (filter :added blocks)
                                       (map :e)
                                       (set))
                blocks-to-add (->> (filter (fn [block]
                                             (contains? blocks-to-add-set (:db/id block)))
                                           blocks-result)
                                   (map search-db/block->index))
                blocks-to-remove-set (->> (remove :added blocks)
                                          (map :e)
                                          (set))]
            (transact-blocks! repo
                              {:blocks-to-remove-set blocks-to-remove-set
                               :blocks-to-add blocks-to-add})))))))

(defn rebuild-indices!
  ([]
   (rebuild-indices! (state/get-current-repo)))
  ([repo]
   (when repo
     (when-let [engine (get-engine repo)]
       (let [pages (search-db/make-pages-indice!)]
        (p/let [blocks (protocol/rebuild-blocks-indice! engine)]
          (let [result {:pages pages
                        :blocks blocks}]
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
