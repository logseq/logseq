(ns logseq.db.frontend.class
  "Class related fns for DB graphs and frontend/datascript usage"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.db-ident :as db-ident]))

(def ^:large-vars/data-var built-in-classes
  "Map of built-in classes for db graphs with their :db/ident as keys"
  {:logseq.class/Root {:title "Root tag"}

   :logseq.class/Task
   {:title "Task"
    :schema {:properties [:logseq.task/status :logseq.task/priority :logseq.task/deadline]}}

   :logseq.class/Card {:title "Card"}
   ;; TODO: Add more classes such as :book, :paper, :movie, :music, :project
   })

(defn create-user-class-ident-from-name
  "Creates a class :db/ident for a default user namespace.
   NOTE: Only use this when creating a db-ident for a new class."
  [class-name]
  (db-ident/create-db-ident-from-name "user.class" class-name))

(defn build-new-class
  "Builds a new class with a unique :db/ident. Also throws exception for user
  facing messages when name is invalid"
  [db page-m]
  {:pre [(string? (:block/title page-m))]}
  (let [db-ident (create-user-class-ident-from-name (:block/title page-m))
        db-ident' (db-ident/ensure-unique-db-ident db db-ident)]
    (sqlite-util/build-new-class (assoc page-m :db/ident db-ident'))))