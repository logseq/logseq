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

;; TODO: db ident should obey clojure's rules for keywords
(defn create-db-ident-from-name
  "Creates a :db/ident for a class or property by sanitizing the given name.

   NOTE: Only use this when creating a db-ident for a new class/property. Using
   this in read-only contexts like querying can result in db-ident conflicts"
  [user-namespace name-string]
  {:pre [(or (keyword? user-namespace) (string? user-namespace)) (string? name-string)]}
  (if #?(:org.babashka/nbb (some? js/process)
         :cljs (exists? js/process)
         :default false)
    ;; So that we don't have to change :user.{property|class} in our tests
    (keyword user-namespace (-> name-string (string/replace #"/|\s+" "-") (string/replace-first #"^(\d)" "NUM-$1")))
    (keyword user-namespace
             (str
              (->> (filter #(re-find #"[0-9a-zA-Z-]{1}" %) (seq name-string)) (apply str))
              "-"
              (rand-nth non-int-char-range)
              (nano-id 7)))))
