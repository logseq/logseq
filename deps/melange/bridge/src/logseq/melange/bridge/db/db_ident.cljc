(ns logseq.melange.bridge.db.db-ident
  "Keyword, DataScript, environment, and randomness boundary for typed DB idents."
  (:require [clojure.string]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]
            #?(:cljs ["@logseq/melange-js-api/db" :as db-api])))

#?(:cljs
   (def ^:private db-ident-api (.-DbIdent db-api))
   :clj
   (def ^:private db-ident-api nil))

(defn normalize-ident-name-part
  [name-string]
  ((.-normalizeNamePart db-ident-api) name-string))

(defn create-db-ident-from-name
  "Creates a class or property `:db/ident` from a controlled namespace and user-visible name."
  [user-namespace name-string]
  {:pre [(or (keyword? user-namespace) (string? user-namespace))
         (string? name-string)]}
  #?(:cljs
     (keyword ((.-createGenerated db-ident-api)
               (name user-namespace)
               name-string))
     :clj nil))

(defn ensure-unique-db-ident
  "Returns `db-ident`, or appends the next numeric suffix when that ident already exists."
  [db db-ident]
  ((.-ensureUniqueWith db-ident-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   db-ident))
