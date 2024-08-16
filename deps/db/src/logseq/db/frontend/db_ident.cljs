(ns logseq.db.frontend.db-ident
  "Helper fns for class and property :db/ident"
  (:require [datascript.core :as d]
            [clojure.string :as string]
            [clojure.edn :as edn]))

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

(def ^:private nano-char-range "-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
(def ^:private non-int-nano-char-range "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")

(defn- nano-id-char []
  (rand-nth nano-char-range))

(defn- nano-id [length]
  (assert (> length 1))
  (str
   (rand-nth non-int-nano-char-range)
   (->> (repeatedly (dec length) nano-id-char)
        (string/join))))

;; TODO: db ident should obey clojure's rules for keywords
(defn create-db-ident-from-name
  "Creates a :db/ident for a class or property by sanitizing the given name.

   NOTE: Only use this when creating a db-ident for a new class/property. Using
   this in read-only contexts like querying can result in db-ident conflicts"
  [user-namespace name-string]
  {:pre [(string? name-string)]}
  (let [n (-> name-string
              (string/replace #"(^:\s*|\s*:$)" "")
              (string/replace #"\s*:\s*$" "")
              (string/replace-first #"^\d+" "")
              (string/replace " " "-")
              (string/replace "#" "")
              ;; '/' cannot be in name - https://clojure.org/reference/reader
              (string/replace "/" "-")
              (string/trim))]
    (try
      (when-not (seq n)
        (throw (ex-info "name is not empty" {:n n})))
      (let [k (keyword user-namespace n)]
        (when-not (= k (edn/read-string (str k)))
          (throw (ex-info "illegal keyword" {:k k})))
        k)
      (catch :default _e
        (let [n (->> (filter #(re-find #"[0-9a-zA-Z-]{1}" %) (seq n))
                     (apply str))]
          (if (seq n)
            (keyword user-namespace n)
            (keyword user-namespace (nano-id 8))))))))
