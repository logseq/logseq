(ns frontend.search
  (:require [frontend.db :as db]
            [frontend.search.db :as search-db :refer [indices]]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.util :as util :refer-macros [profile]]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [clojure.set :as set]
            [frontend.regex :as regex]
            [frontend.text :as text]
            [cljs-bean.core :as bean]
            [goog.object :as gobj]
            ["fuzzysort" :as fuzzy]
            ["flexsearch" :as flexsearch]
            [medley.core :as medley]
            [promesa.core :as p]
            ["/frontend/utils" :as utils]))

(def fuzzy-go (gobj/get fuzzy "go"))
(defonce prepare (gobj/get fuzzy "prepare"))
(defonce highlight (gobj/get fuzzy "highlight"))

(defn go
  [q indice-type indice opts]
  (case indice-type
    :page
    (fuzzy-go q indice opts)

    :block
    (.search indice q opts)))

(defn block->index
  [{:block/keys [uuid content format] :as block}]
  (when-let [result (->> (text/remove-level-spaces content format)
                         (text/remove-properties!))]
    {:id (:db/id block)
     :uuid (str uuid)
     :content result}))

(defn make-blocks-indice!
  []
  (when-let [repo (state/get-current-repo)]
    (let [blocks (->> (db/get-all-block-contents)
                      (map block->index)
                      (remove nil?)
                      (bean/->js))
          indice (flexsearch.
                  (clj->js
                   {:encode "icase"
                    ;; TODO: forward with multi-languages support
                    ;; :tokenize "forward"
                    :tokenize utils/searchTokenize
                    :doc {:id "id"
                          :field ["uuid" "content"]}
                    :async true}))]
      (p/let [result (.add indice blocks)]
        (swap! indices assoc-in [repo :blocks] indice))
      indice)))

(defn make-pages-indice!
  []
  (when-let [repo (state/get-current-repo)]
    (let [pages (->> (db/get-pages (state/get-current-repo))
                     (remove string/blank?)
                     (map (fn [p] {:name p}))
                     (bean/->js))]
      (swap! indices assoc-in [repo :pages] pages)
      pages)))

;; TODO: persist indices to indexeddb, it'll be better if the future db
;; can has the direct fuzzy search support.
(defn rebuild-indices!
  ([]
   (rebuild-indices! (state/get-current-repo)))
  ([repo]
   (when repo
     (let [result {:pages (make-pages-indice!)
                   :blocks (make-blocks-indice!)}]
       (swap! indices assoc repo result)
       result))))

(defn reset-indice!
  [repo]
  (swap! indices assoc repo {:pages #js []
                             :blocks #js []}))

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
                                  (let [s (if extract-fn (extract-fn item) item)]
                                    {:data item
                                     :score (score query (.toLowerCase s))})))))
         (map :data))))

(defn block-search
  ([q]
   (block-search q 10))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (when-not (string/blank? q)
       (let [q (string/lower-case q)
             q (escape-str q)]
         (when-not (string/blank? q)
           (let [indice (or (get-in @indices [repo :blocks])
                            (make-blocks-indice!))]
             (p/let [result (go q :block indice (clj->js {:limit limit}))
                     result (bean/->clj result)]
               (->>
                (map
                 (fn [{:keys [content uuid] :as block}]
                   {:block/uuid uuid
                    :block/content content
                    :block/page (:block/page (db/entity [:block/uuid (medley/uuid (str uuid))]))})
                 result)
                (remove nil?))))))))))

(defn page-search
  ([q]
   (page-search q 3))
  ([q limit]
   (when-let [repo (state/get-current-repo)]
     (let [q (string/lower-case q)
           q (clean-str q)]
       (when-not (string/blank? q)
         (let [indice (or (get-in @indices [repo :pages])
                          (make-pages-indice!))
               result (->> (go q :page indice (clj->js {:limit limit
                                                        :key "name"
                                                        :allowTypo false
                                                        :threshold -10000}))
                           (bean/->clj))]
           ;; TODO: add indexes for highlights
           (->> (map
                 (fn [{:keys [obj]}]
                   (:name obj))
                 result)
                (remove nil?))))))))

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
            pages (:page/name datoms)
            blocks (:block/content datoms)]
        (when (seq pages)
          (let [pages-result (db/pull-many '[:db/id :page/name :page/original-name] (set (map :e pages)))
                pages-to-add-set (->> (filter :added pages)
                                      (map :e)
                                      (set))
                pages-to-add (->> (filter (fn [page]
                                            (contains? pages-to-add-set (:db/id page))) pages-result)
                                  (map (fn [p] {:name (or (:page/original-name p)
                                                          (:page/name p))}))
                                  (set))
                pages-to-remove-set (->> (remove :added pages)
                                         (map :v)
                                         (set))]
            (swap! search-db/indices update-in [repo :pages]
                   (fn [pages]
                     (let [pages (or pages (array))
                           pages (.filter pages (fn [page]
                                                  (when-let [page-name (gobj/get page "name")]
                                                    (not (contains? pages-to-remove-set
                                                                    (string/lower-case page-name))))))]
                       (.concat pages (bean/->js pages-to-add)))))))
        (when (seq blocks)
          (let [blocks-result (db/pull-many '[:db/id :block/uuid :block/format :block/content] (set (map :e blocks)))
                blocks-to-add-set (->> (filter :added blocks)
                                       (map :e)
                                       (set))
                blocks-to-add (->> (filter (fn [block]
                                             (contains? blocks-to-add-set (:db/id block)))
                                           blocks-result)
                                   (map block->index)
                                   (set))
                blocks-to-remove-set (->> (remove :added blocks)
                                          (map :e)
                                          (set))]
            (swap! search-db/indices update-in [repo :blocks]
                   (fn [indice]
                     (when indice
                       (doseq [block-id blocks-to-remove-set]
                         (.remove indice #js {:id block-id}))
                       (when (seq blocks-to-add)
                         (.add indice (bean/->js blocks-to-add))))
                     indice))))))))
