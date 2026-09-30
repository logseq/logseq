(ns logseq.db.frontend.query-dsl
  "Pure parsing helpers shared by renderer and worker query DSL code."
  (:require [clojure.string :as string]
            [clojure.walk :as walk]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]
            [logseq.db.frontend.property :as db-property]))

(def ^:private tag-placeholder "~~~tag-placeholder~~~")

(defn- quoted-string-end
  "Exclusive end index of a double-quoted string starting at `start`, or nil
  when the string is unclosed. Honors backslash escapes so titles can contain quotes."
  [s start]
  (let [n (count s)]
    (loop [i (inc start)]
      (cond
        (>= i n)
        nil

        (= \\ (nth s i))
        (recur (+ i 2))

        (= \" (nth s i))
        (inc i)

        :else
        (recur (inc i))))))

(defn- skip-ws
  [s i]
  (let [n (count s)]
    (loop [i i]
      (if (and (< i n)
               (or (= \space (nth s i))
                   (= \tab (nth s i))
                   (= \newline (nth s i))
                   (= \return (nth s i))))
        (recur (inc i))
        i))))

(defn- unmatched-page-ref-close?
  "True when `s` from `start` still contains a `]]` that is not paired with a
  later `[[` in the current list. Stop at a `)` that closes this form so a
  later tag such as `[[bar]]]]` cannot steal an earlier date page-ref."
  [s start]
  (let [n (count s)]
    (loop [i start
           open 0
           paren 0]
      (cond
        (>= i n)
        false

        (= \" (nth s i))
        (if-let [end (quoted-string-end s i)]
          (recur end open paren)
          false)

        (= \( (nth s i))
        (recur (inc i) open (inc paren))

        (= \) (nth s i))
        (if (zero? paren)
          false
          (recur (inc i) open (dec paren)))

        (and (< (inc i) n)
             (= \[ (nth s i))
             (= \[ (nth s (inc i))))
        (recur (+ i 2) (inc open) paren)

        (and (< (inc i) n)
             (= \] (nth s i))
             (= \] (nth s (inc i))))
        (if (zero? open)
          true
          (recur (+ i 2) (dec open) paren))

        :else
        (recur (inc i) open paren)))))

(defn- page-ref-terminator?
  "True when the text after a candidate `]]` is the next DSL token or closer,
  not more title text. A lone `]` is a terminator only inside an EDN vector so
  `(tags [ [[foo]]])` keeps the vector close, while `(tags [ [[foo]]]])` can
  keep a title that ends with `]`. A following symbol such as `tomorrow` is a
  terminator unless the current form still has a dangling `]]`."
  [s i vector-depth]
  (let [i (skip-ws s i)
        n (count s)]
    (cond
      (>= i n)
      true

      (contains? #{\) \, \( \# \"} (nth s i))
      true

      (and (= \[ (nth s i))
           (< (inc i) n)
           (= \[ (nth s (inc i))))
      true

      (and (= \] (nth s i))
           (pos? vector-depth)
           (or (>= (inc i) n)
               (not= \] (nth s (inc i)))))
      true

      (= \] (nth s i))
      false

      :else
      (not (unmatched-page-ref-close? s i)))))

(defn- page-ref-end
  "Exclusive end index of a `[[page-ref]]` starting at `start`, or nil when
  unclosed. Chooses the first `]]` that is followed by a DSL terminator so
  titles may contain `]]` or `[[...]]` before more text."
  [s start vector-depth]
  (let [n (count s)]
    (loop [i (+ start 2)]
      (cond
        (> (+ i 2) n)
        nil

        (and (= \] (nth s i))
             (= \] (nth s (inc i)))
             (page-ref-terminator? s (+ i 2) vector-depth))
        (+ i 2)

        :else
        (recur (inc i))))))

(defn- quote-page-ref
  [page-name]
  (let [page-name' (string/replace page-name "#" tag-placeholder)]
    (pr-str (str page-ref/left-brackets page-name' page-ref/right-brackets))))

(defn- quote-page-refs
  "Quote each [[page]] as an EDN string, leaving existing quoted strings
  untouched. Page names are pr-str'd so quotes, backslashes, [[, and ]] stay valid."
  [s]
  (let [n (count s)]
    (loop [i 0
           last-copy 0
           vector-depth 0
           parts (transient [])]
      (cond
        (>= i n)
        (string/join (persistent! (cond-> parts
                                    (< last-copy n)
                                    (conj! (subs s last-copy n)))))

        (= \" (nth s i))
        (if-let [end (quoted-string-end s i)]
          (recur end end vector-depth (conj! parts (subs s last-copy end)))
          (string/join (persistent! (conj! parts (subs s last-copy)))))

        (and (< (inc i) n)
             (= \[ (nth s i))
             (= \[ (nth s (inc i))))
        (if-let [end (page-ref-end s i vector-depth)]
          (recur end end vector-depth
                 (-> parts
                     (conj! (subs s last-copy i))
                     (conj! (quote-page-ref (subs s (+ i 2) (- end 2))))))
          (string/join (persistent! (conj! parts (subs s last-copy)))))

        (= \[ (nth s i))
        (recur (inc i) last-copy (inc vector-depth) parts)

        (= \] (nth s i))
        (recur (inc i) last-copy (max 0 (dec vector-depth)) parts)

        :else
        (recur (inc i) last-copy vector-depth parts)))))

(defn- replace-hash-in-quoted-strings
  [s]
  (let [n (count s)]
    (loop [i 0
           last-copy 0
           parts (transient [])]
      (cond
        (>= i n)
        (string/join (persistent! (cond-> parts
                                    (< last-copy n)
                                    (conj! (subs s last-copy n)))))

        (= \" (nth s i))
        (if-let [end (quoted-string-end s i)]
          (recur end end
                 (-> parts
                     (conj! (subs s last-copy i))
                     (conj! (string/replace (subs s i end) "#" tag-placeholder))))
          (string/join (persistent! (conj! parts (subs s last-copy)))))

        :else
        (recur (inc i) last-copy parts)))))

(defn- transform-between
  [s]
  (string/replace s #"\(between ([^\)]+)\)"
                  (fn [[_ x]]
                    (->> (string/split x #" ")
                         (remove string/blank?)
                         (map (fn [value]
                                (if (or (contains? #{"+" "-"} (first value))
                                        (and (common-util/safe-re-find #"\d" (first value))
                                             (some #(string/ends-with? value %)
                                                   ["y" "m" "d" "h" "min"])))
                                  (keyword (name value))
                                  value)))
                         (string/join " ")
                         (common-util/format "(between %s)")))))

(defn pre-transform
  [s]
  (cond
    (common-util/wrapped-by-quotes? s)
    s

    (string? s)
    (-> s
        quote-page-refs
        transform-between
        replace-hash-in-quoted-strings
        (string/replace " #" " #tag ")
        (string/replace #"^#" "#tag ")
        (string/replace tag-placeholder "#"))

    :else
    s))

(defn simplify-query
  [query]
  (if (string? query)
    query
    (walk/postwalk
     (fn [form]
       (if (and (coll? form)
                (contains? #{'and 'or} (first form))
                (= 2 (count form)))
         (second form)
         form))
     query)))

(defn get-timestamp-property
  [form]
  (let [property-name (second form)]
    (when (or (keyword? property-name)
              (symbol? property-name)
              (string? property-name))
      (let [property (-> property-name
                         name
                         string/lower-case
                         (string/replace "_" "-")
                         keyword)]
        (if (db-property/property? property)
          property
          (case property
            :created-at :block/created-at
            :updated-at :block/updated-at
            nil))))))

(def custom-readers
  {:readers {'tag page-ref/->page-ref}})
