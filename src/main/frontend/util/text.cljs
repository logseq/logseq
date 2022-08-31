(ns frontend.util.text
  (:require [clojure.string :as string]
            [goog.string :as gstring]
            [frontend.util :as util]))

(defonce between-re #"\(between ([^\)]+)\)")

(def bilibili-regex #"^((?:https?:)?//)?((?:www).)?((?:bilibili.com))(/(?:video/)?)([\w-]+)(\?p=(\d+))?(\S+)?$")
(def loom-regex #"^((?:https?:)?//)?((?:www).)?((?:loom.com))(/(?:share/|embed/))([\w-]+)(\S+)?$")
(def vimeo-regex #"^((?:https?:)?//)?((?:www).)?((?:player.vimeo.com|vimeo.com))(/(?:video/)?)([\w-]+)(\S+)?$")
(def youtube-regex #"^((?:https?:)?//)?((?:www|m).)?((?:youtube.com|youtu.be|y2u.be|youtube-nocookie.com))(/(?:[\w-]+\?v=|embed/|v/)?)([\w-]+)([\S^\?]+)?$")

(defn get-matched-video
  [url]
  (or (re-find youtube-regex url)
      (re-find loom-regex url)
      (re-find vimeo-regex url)
      (re-find bilibili-regex url)))

(defn build-data-value
  [col]
  (let [items (map (fn [item] (str "\"" item "\"")) col)]
    (gstring/format "[%s]"
                 (string/join ", " items))))

(defn media-link?
  [media-formats s]
  (some (fn [fmt] (util/safe-re-find (re-pattern (str "(?i)\\." fmt "(?:\\?([^#]*))?(?:#(.*))?$")) s)) media-formats))

(defn add-timestamp
  [content key value]
  (let [new-line (str (string/upper-case key) ": " value)
        lines (string/split-lines content)
        new-lines (map (fn [line]
                         (string/trim
                          (if (string/starts-with? (string/lower-case line) key)
                            new-line
                            line)))
                    lines)
        new-lines (if (not= (map string/trim lines) new-lines)
                    new-lines
                    (cons (first new-lines) ;; title
                          (cons
                           new-line
                           (rest new-lines))))]
    (string/join "\n" new-lines)))

(defn remove-timestamp
  [content key]
  (let [lines (string/split-lines content)
        new-lines (filter (fn [line]
                            (not (string/starts-with? (string/lower-case line) key)))
                          lines)]
    (string/join "\n" new-lines)))

(defn get-current-line-by-pos
  [s pos]
  (let [lines (string/split-lines s)
        result (reduce (fn [acc line]
                         (let [new-pos (+ acc (count line))]
                           (if (>= new-pos pos)
                             (reduced {:line line
                                       :start-pos acc})
                             (inc new-pos)))) 0 lines)]
    (when (map? result)
      result)))

(defn surround-by?
  "`pos` must be surrounded by `before` and `end` in string `value`, e.g. ((|))"
  [value pos before end]
  (let [start-pos (if (= :start before) 0 (- pos (count before)))
        end-pos (if (= :end end) (count value) (+ pos (count end)))]
    (when (>= (count value) end-pos)
      (= (cond
           (and (= :end end) (= :start before))
           ""

           (= :end end)
           before

           (= :start before)
           end

           :else
           (str before end))
         (subs value start-pos end-pos)))))

(defn get-string-all-indexes
  "Get all indexes of `value` in the string `s`."
  [s value {:keys [before?] :or {before? true}}]
  (if (= value "")
    (if before? [0] [(count s)]) ;; Hack: this prevents unnecessary work in wrapped-by?
    (loop [acc []
          i 0]
     (if-let [i (string/index-of s value i)]
       (recur (conj acc i) (+ i (count value)))
       acc))))

(defn wrapped-by?
  "`pos` must be wrapped by `before` and `end` in string `value`, e.g. ((a|b))"
  [value pos before end]
  ;; Increment 'before' matches by (length of before string - 0.5) to make them be just before the cursor position they precede.
  ;; Increment 'after' matches by 0.5 to make them be just after the cursor position they follow.
  (let [before-matches (->> (get-string-all-indexes value before {:before? true})
                            (map (fn [i] [(+ i (- (count before) 0.5)) :before])))
        end-matches (->> (get-string-all-indexes value end {:before? false})
                         (map (fn [i] [(+ i 0.5) :end])))
        indexes (sort-by first (concat before-matches end-matches [[pos :between]]))
        ks (map second indexes)
        q [:before :between :end]]
    (true?
     (reduce (fn [acc k]
               (if (= q (conj acc k))
                 (reduced true)
                 (vec (take-last 2 (conj acc k)))))
             []
             ks))))

(defn get-graph-name-from-path
  [path]
  (when (string? path)
    (let [parts (->> (string/split path #"/")
                     (take-last 2))]
      (-> (if (not= (first parts) "0")
            (string/join "/" parts)
            (last parts))
          js/decodeURI))))
