(ns logseq.tasks.util
  "Utils for tasks"
  (:require [clojure.string :as string]
            #?(:clj [babashka.fs :as fs])))

(defn- in-range?
  [code-point [start end]]
  (<= start code-point end))

(def ^:private zero-width-ranges
  [[0x0300 0x036F]
   [0x1AB0 0x1AFF]
   [0x1DC0 0x1DFF]
   [0x200C 0x200F]
   [0x202A 0x202E]
   [0x2060 0x206F]
   [0x20D0 0x20FF]
   [0xFE00 0xFE0F]
   [0xFE20 0xFE2F]])

(def ^:private wide-ranges
  [[0x1100 0x115F]
   [0x2329 0x232A]
   [0x2E80 0xA4CF]
   [0xAC00 0xD7A3]
   [0xF900 0xFAFF]
   [0xFE10 0xFE19]
   [0xFE30 0xFE6F]
   [0xFF00 0xFF60]
   [0xFFE0 0xFFE6]
   [0x1F300 0x1FAFF]
   [0x20000 0x3FFFD]])

(defn- code-point-width
  [code-point]
  (cond
    (or (<= 0x0000 code-point 0x001F)
        (<= 0x007F code-point 0x009F)
        (some #(in-range? code-point %) zero-width-ranges))
    0

    (some #(in-range? code-point %) wide-ranges)
    2

    :else
    1))

(defn display-width
  [value]
  (let [text (str value)]
    (loop [index 0
           width 0]
      (if (< index #?(:clj (.length text) :cljs (.-length text)))
        (let [code-point #?(:clj (.codePointAt text index)
                            :cljs (.codePointAt text index))]
          (recur (+ index #?(:clj (Character/charCount code-point)
                             :cljs (if (> code-point 0xFFFF) 2 1)))
                 (+ width (code-point-width code-point))))
        width))))

(defn- pad-left
  [text width]
  (let [padding (- width (display-width text))]
    (str (apply str (repeat (max 0 padding) " ")) text)))

(defn- column-widths
  [columns rows]
  (reduce
   (fn [widths column]
     (assoc widths
            column
            (apply max
                   (display-width (str column))
                   (map #(display-width (str (get % column ""))) rows))))
   {}
   columns))

(defn- render-separator
  [columns widths]
  (str "|" (string/join "+" (map #(apply str (repeat (+ 2 (get widths %)) "-")) columns)) "|"))

(defn- render-row
  [columns widths row]
  (str "|"
       (string/join "|" (map #(str " "
                                   (pad-left (str (get row % "")) (get widths %))
                                   " ")
                             columns))
       "|"))

(defn render-table
  [rows]
  (when-let [columns (seq (keys (first rows)))]
    (let [rows (vec rows)
          widths (column-widths columns rows)
          header-row (zipmap columns columns)]
      (str (string/join
            "\n"
            (concat [(render-row columns widths header-row)
                     (render-separator columns widths)]
                    (map #(render-row columns widths %) rows)))
           "\n"))))

#?(:clj
   (defn file-modified-later-than?
     [file comparison-instant]
     (pos? (.compareTo (fs/file-time->instant (fs/last-modified-time file))
                       comparison-instant))))

(defn print-usage [arg-str]
  (println (str "Usage: bb "
                #?(:clj (System/getProperty "babashka.task")
                   :cljs "task")
                " "
                arg-str))
  #?(:clj (System/exit 1)
     :cljs (js/process.exit 1)))

(defn print-table
  [rows]
  (when-some [rendered-table (render-table rows)]
    (print rendered-table))
  (println "Total:" (count rows)))
