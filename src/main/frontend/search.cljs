(ns frontend.search
  (:require [frontend.db :as db]
            [frontend.config :as config]
            [frontend.state :as state]
            [frontend.util :as util]
            [cljs-bean.core :as bean]
            [clojure.string :as string]
            [frontend.regex :as regex]
            [frontend.text :as text]
            [frontend.db.queries :as db-queries]))

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

(defn search
  "Block search"
  ([q]
   (search q 20))
  ([q limit]
   (when-not (string/blank? q)
     (let [q (escape-str q)
           q-pattern (re-pattern (str "(?i)" q))]
       (when-not (string/blank? q)
         (let [blocks (db-queries/get-matched-blocks
                        (fn [content]
                          (re-find q-pattern content))
                        ;; (fn [content]
                        ;;   (> (score q (.toLowerCase content)) 0))
                        limit)]
           (map (fn [{:block/keys [content format _properties] :as block}]
                  (assoc block :block/content
                         (->> (text/remove-level-spaces content format)
                              (text/remove-properties!)))) blocks)))))))

(defn page-search
  ([q]
   (page-search q 3))
  ([q limit]
   (let [q (clean-str q)]
     (when-not (string/blank? q)
       (let [pages (db-queries/get-pages (state/get-current-repo))]
         (when (seq pages)
           (fuzzy-search pages q :limit limit)))))))

(defn file-search
  ([q]
   (file-search q 3))
  ([q limit]
   (let [q (clean-str q)]
     (when-not (string/blank? q)
       (let [mldoc-exts (set (map name config/mldoc-support-formats))
             files (->> (db-queries/get-files (state/get-current-repo))
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
     (let [templates (db-queries/get-all-templates)]
       (when (seq templates)
         (let [result (fuzzy-search (keys templates) q :limit limit)]
           (vec (select-keys templates result))))))))
