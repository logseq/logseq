(ns logseq.db.frontend.db-ident
  "Helper fns for class and property :db/ident"
  (:require [datascript.core :as d]
            [clojure.string :as string]))

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
              (string/trim))]
    (assert (seq n) "name is not empty")
    (keyword user-namespace n)))