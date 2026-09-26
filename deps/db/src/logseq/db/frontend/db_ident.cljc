(ns logseq.db.frontend.db-ident
  "Helper fns for class and property :db/ident"
  (:require [clojure.string :as string]
            [datascript.core :as d]))

(defn ensure-unique-db-ident
  "Ensures the given db-ident is unique. If a db-ident conflicts, it is made
  unique by adding a suffix with a unique number e.g. :db-ident-1 :db-ident-2"
  [db db-ident]
  (if (d/entity db db-ident)
    (let [existing-idents
          (d/q '[:find [?ident ...]
                 :in $ ?ident-name
                 :where
                 [?b :db/ident ?ident]
                 [(str ?ident) ?str-ident]
                 [(clojure.string/starts-with? ?str-ident ?ident-name)]]
               db
               (str db-ident "-"))
          new-ident (if-let [max-num (->> existing-idents
                                          (keep #(parse-long (string/replace-first (str %) (str db-ident "-") "")))
                                          (apply max))]
                      (keyword (namespace db-ident) (str (name db-ident) "-" (inc max-num)))
                      (keyword (namespace db-ident) (str (name db-ident) "-1")))]
      new-ident)
    db-ident))

(def ^:private non-int-char-range "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

(def alphabet
  (mapv str "_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"))

#_:clj-kondo/ignore
(defn- random-bytes
  [size]
  #?(:org.babashka/nbb
     nil
     :default
     (let [seed (js/Uint8Array. size)]
       (.getRandomValues js/crypto seed)
       (array-seq seed))))

(defn nano-id
  "Random id generator"
  ([]
   (nano-id 21))
  ([size]
   (let [mask' 0x3f]
     (loop [bs (random-bytes size)
            id ""]
       (if bs
         (recur (next bs)
                (->> (first bs)
                     (bit-and mask')
                     alphabet
                     (str id)))
         id)))))

(defn- nfc-normalize
  [s]
  #?(:cljs (.normalize s "NFC")
     :clj (java.text.Normalizer/normalize s java.text.Normalizer$Form/NFC)
     :default s))

(def ^:private ident-name-allowed-char-re
  "Characters allowed in a keyword name: the ASCII symbol chars allowed in
  Clojure keywords plus Unicode letters, marks, and numbers so Cyrillic, CJK,
  and other letters survive while whitespace, separators, and control
  characters are still dropped."
  #?(:cljs (js/RegExp. "^[0-9A-Za-z*+!_'?<>=\\p{L}\\p{M}\\p{N}-]$" "u")
     :default #"^[0-9A-Za-z*+!_'?<>=\p{L}\p{M}\p{N}-]$"))

(defn- ident-name-char?
  [ch]
  (boolean (re-find ident-name-allowed-char-re (str ch))))

(defn normalize-ident-name-part
  [name-string]
  (let [normalized (->> (-> name-string
                            nfc-normalize
                            (string/replace-first #"^(\d)" "NUM-$1"))
                        (filter ident-name-char?)
                        (apply str))]
    (if (string/blank? normalized)
      ;; Distinct names must not collapse to one ident
      (str "u-" (Math/abs (hash name-string)))
      normalized)))

(defn normalize-ident-name-part-ascii
  "ASCII-only normalization historically used to create deterministic idents
  e.g. plugin property idents. Since plugin properties resolve a name to its
  ident by recomputing it, this mapping must stay identical to what older
  versions generated."
  [name-string]
  (->> (string/replace-first name-string #"^(\d)" "NUM-$1")
       ;; '-' must go last in char class
       (filter #(re-find #"[0-9a-zA-Z*+!_'?<>=-]{1}" (str %)))
       (apply str)))

(defn create-db-ident-from-name
  "Creates a :db/ident for a class or property by sanitizing the given name.
  The created ident must obey clojure's rules for keywords i.e.
  be a valid symbol per https://clojure.org/reference/reader#_symbols

   NOTE: Only use this when creating a db-ident for a new class/property. Using
   this in read-only contexts like querying can result in db-ident conflicts"
  [user-namespace name-string]
  {:pre [(or (keyword? user-namespace) (string? user-namespace)) (string? name-string)]}
  (assert (not (re-find #"^(logseq|block)(\.|$)" (name user-namespace)))
          "New ident is not allowed to use an internal namespace")
  (if #?(:org.babashka/nbb true
         ;; Use $LOGSEQ_STABLE_IDENTS when we want stable idents e.g. tests
         :cljs             (and (exists? js/process) js/process.env.LOGSEQ_STABLE_IDENTS)
         :default          false)
    (keyword user-namespace (normalize-ident-name-part name-string))
    (let [plugin? (string/starts-with? user-namespace "plugin.class.")
          suffix (str "-"
                      (rand-nth non-int-char-range)
                      (nano-id 7))]
      (keyword user-namespace
               (str
                (normalize-ident-name-part name-string)
                (when-not plugin?
                  suffix))))))

(defn replace-db-ident-random-suffix
  [db-ident-kw new-suffix]
  (assert (keyword? db-ident-kw))
  (assert (and (string? new-suffix) (= 8 (count new-suffix))))
  (keyword (namespace db-ident-kw)
           (string/replace-first (name db-ident-kw) #"-.{8}$" (str "-" new-suffix))))
