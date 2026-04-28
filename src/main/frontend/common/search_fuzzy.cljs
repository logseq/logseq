(ns frontend.common.search-fuzzy
  "fuzzy search. Used by frontend and worker namespaces"
  (:require ["remove-accents" :as removeAccents]
            ["tiny-pinyin" :as tp]
            [cljs-bean.core :as bean]
            [clojure.string :as string]))

(def MAX-STRING-LENGTH 1000.0)

(defn clean-str
  [s]
  (string/lower-case (string/replace (string/lower-case s) #"[\[ \\/_\]\(\)]+" "")))

(defn char-array
  [s]
  (bean/->js (seq s)))

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

(defn search-normalize
  "Normalize string for searching (loose)"
  [s remove-accents? & {:keys [lower-case?]
                        :or {lower-case? true}}]
  (when s
    (let [s' (if lower-case? (string/lower-case s) s)
          normalize-str (.normalize s' "NFKC")]
      (if remove-accents?
        (removeAccents normalize-str)
        normalize-str))))

(defn score
  [oquery ostr]
  (let [query (-> (clean-str oquery) (search-normalize true))
        original-s (-> (clean-str ostr) (search-normalize true))]
    (loop [q (seq (char-array query))
           s (seq (char-array original-s))
           mult 1
           idx MAX-STRING-LENGTH
           score' 0]
      (cond
        ;; add str-len-distance to score, so strings with matches in same position get sorted by length
        ;; boost score if we have an exact match including punctuation
        (empty? q) (+ score'
                      (str-len-distance query original-s)
                      (cond
                        (string/starts-with? original-s query)
                        (+ MAX-STRING-LENGTH 10)

                        (<= 0 (.indexOf original-s query))
                        MAX-STRING-LENGTH

                        (<= 0 (.indexOf original-s query))
                        (- MAX-STRING-LENGTH 0.1)

                        :else
                        0)
                      (if (empty? s) 1 0))
        (empty? s) 0
        :else (if (= (first q) (first s))
                (recur (rest q)
                       (rest s)
                       (inc mult) ;; increase the multiplier as more query chars are matched
                       (dec idx) ;; decrease idx so score gets lowered the further into the string we match
                       (+ mult score')) ;; score for this match is current multiplier * idx
                (recur q
                       (rest s)
                       1 ;; when there is no match, reset multiplier to one
                       (dec idx)
                       (- score' 0.1)))))))

(defn fuzzy-search
  [data query & {:keys [limit extract-fn]
                 :or {limit 20}}]
  (->> (take limit
             (sort-by :score (comp - compare)
                      (filter #(< 0 (:score %))
                              (for [item data]
                                (let [s (str (if extract-fn (extract-fn item) item))]
                                  {:data item
                                   :score (score query s)})))))
       (map :data)))

(defn fuzzy-search-multi
  "Like fuzzy-search but scores each item against multiple extract-fns,
  taking the best score. Extract-fns that return nil or blank strings are
  skipped — no score is computed for those fields."
  [data query & {:keys [limit extract-fns]
                 :or {limit 20}}]
  (->> (take limit
             (sort-by :score (comp - compare)
                      (filter #(< 0 (:score %))
                              (for [item data]
                                (let [strings (->> extract-fns
                                                   (map (fn [f] (str (f item))))
                                                   (remove string/blank?))
                                      best-score (if (seq strings)
                                                   (apply max (map #(score query %) strings))
                                                   0)]
                                  {:data item
                                   :score best-score})))))
       (map :data)))


(defn- zh-simplified-char?
  "True for characters in the CJK Unified Ideographs blocks
  used by Simplified Chinese."
  [c]
  (let [code (.charCodeAt c 0)]
    (or (and (>= code 0x4E00) (<= code 0x9FFF))
        (and (>= code 0x3400) (<= code 0x4DBF)))))

(defn- zh-initial
  "Return the lowercase pinyin initial letter for a single Chinese character."
  [c]
  (string/lower-case (subs (tp/convertToPinyin c "" false) 0 1)))

(defn- segment->initials
  "Strip punctuation and symbols from a non-Chinese text segment, split on
  whitespace, and collect the first character of each resulting word.
  Numbers are treated as words — '12345' contributes '1'; '1 23 45'
  contributes '1', '2', '4'."
  [seg]
  (when (seq seg)
    (->> (string/replace seg #"[^a-zA-Z0-9 ]" "")
         (#(string/split % #"\s+"))
         (remove string/blank?)
         (map #(string/lower-case (subs % 0 1))))))

(defn hanzi->initials
  "Derive a compact initial-letter string from mixed Chinese/English text for
  Simplified-Chinese prefix search (pinyin-style). Processes Simplified
  Chinese only — other CJK scripts are treated as non-Chinese segments.

  Rules:
  - Each Simplified Chinese character maps to the first letter of its pinyin.
  - Non-Chinese text is stripped of punctuation, split on whitespace, and
    contributes the first character of each resulting word.
  - Numbers follow word rules: '12345' → '1'; '1 23 45' → '1', '2', '4'.

  Examples:
    '设置' → 'sz'
    '删除块' → 'sck'
    '新建页面' → 'xjym'
    '插入 block embed' → 'crbe'
    '导出为 PDF' → 'dcwp'
    '今日日志' → 'jrrz'"
  [s]
  (when (string? s)
    (loop [cs     (seq s)
           seg    []
           result []]
      (cond
        (empty? cs)
        (string/join (into result (segment->initials (string/join seg))))

        (zh-simplified-char? (str (first cs)))
        (let [seg-initials (segment->initials (string/join seg))
              init         (zh-initial (str (first cs)))]
          (recur (rest cs) [] (-> result (into seg-initials) (conj init))))

        :else
        (recur (rest cs) (conj seg (str (first cs))) result)))))
