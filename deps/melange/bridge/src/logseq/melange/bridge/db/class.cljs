(ns logseq.melange.bridge.db.class
  "Class related fns for DB graphs and frontend/datascript usage"
  (:require ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private class-read-api (.-ClassRead melange-db))
(def ^:private class-workflow-api (.-ClassWorkflow melange-db))

;; Helper fns
;; ==========
(defn get-structured-children
  "Returns all children of a class"
  [db eid]
  (seq ((.-structuredChildren class-read-api)
        (runtime/runtime-adapter)
        (d/adapter)
        db
        eid)))

(defn get-class-extends
  "Returns all extends of a class"
  [class]
  (seq ((.-extendsEntitiesCheckedWith class-read-api)
        (runtime/runtime-adapter)
        (d/adapter)
        class)))

(defn create-user-class-ident-from-name
  "Creates a class :db/ident for a default user namespace.
   NOTE: Only use this when creating a db-ident for a new class."
  [db class-name & {:as options}]
  ((.-createUserIdent class-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   class-name
   options))

(defn build-new-class
  "Builds a new class with a unique :db/ident. Also throws exception for user
  facing messages when name is invalid"
  [db page-m & {:as options}]
  ((.-buildNew class-workflow-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   #(.now js/Date)
   page-m
   options))

(defn logseq-class?
  "Determines if keyword is a logseq class"
  [kw]
  ((.-logseqClassValueWith class-read-api)
   (runtime/runtime-adapter)
   kw))

(defn user-class-namespace?
  "Determines if namespace string is a user class"
  [s]
  ((.-userClassNamespace class-read-api) s))

(defn get-class-objects
  "Get class objects including children classes'"
  [db class-id]
  (seq ((.-objectsWith class-read-api)
        (runtime/runtime-adapter)
        (d/adapter)
        db
        class-id)))
