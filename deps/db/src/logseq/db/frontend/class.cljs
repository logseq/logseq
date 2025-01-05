(ns logseq.db.frontend.class
  "Class related fns for DB graphs and frontend/datascript usage"
  (:require [logseq.db.sqlite.util :as sqlite-util]
            [logseq.db.frontend.db-ident :as db-ident]
            [clojure.set :as set]
            [flatland.ordered.map :refer [ordered-map]]))

;; Main class vars
;; ===============

(def ^:large-vars/data-var built-in-classes
  "Map of built-in classes for db graphs with their :db/ident as keys"
  (ordered-map
   :logseq.class/Root {:title "Root Tag"}

   :logseq.class/Tag {:title "Tag"}

   :logseq.class/Property {:title "Property"}

   :logseq.class/Page {:title "Page"}

   :logseq.class/Journal
   {:title "Journal"
    :properties {:logseq.property/parent :logseq.class/Page
                 :logseq.property.journal/title-format "MMM do, yyyy"}}

   :logseq.class/Whiteboard
   {:title "Whiteboard"
    :properties {:logseq.property/parent :logseq.class/Page}}

   :logseq.class/Task
   {:title "Task"
    :schema {:properties [:logseq.task/status :logseq.task/priority :logseq.task/deadline]}}

   :logseq.class/Query
   {:title "Query"
    :properties {:logseq.property/icon {:type :tabler-icon :id "search"}}
    :schema {:properties [:logseq.property/query]}}

   :logseq.class/Card
   {:title "Card"
    :schema {:properties [:logseq.property.fsrs/state :logseq.property.fsrs/due]}}

   :logseq.class/Cards
   {:title "Cards"
    :properties {:logseq.property/icon {:type :tabler-icon :id "search"}
                 :logseq.property/parent :logseq.class/Query}}

   :logseq.class/Asset
   {:title "Asset"
    :properties {;; :logseq.property/icon {:type :tabler-icon :id "file"}
                 :logseq.property.class/hide-from-node true
                 :logseq.property.view/type :logseq.property.view/type.gallery}
    :schema {:properties [:logseq.property.asset/type :logseq.property.asset/size :logseq.property.asset/checksum]
             :required-properties [:logseq.property.asset/type :logseq.property.asset/size :logseq.property.asset/checksum]}}

   :logseq.class/Code-block
   {:title "Code"
    :properties {:logseq.property.class/hide-from-node true}
    :schema {:properties [:logseq.property.node/display-type :logseq.property.code/lang]}}

   :logseq.class/Quote-block
   {:title "Quote"
    :properties {:logseq.property.class/hide-from-node true}
    :schema {:properties [:logseq.property.node/display-type]}}

   :logseq.class/Math-block
   {:title "Math"
    :properties {:logseq.property.class/hide-from-node true}
    :schema {:properties [:logseq.property.node/display-type]}}

   :logseq.class/Pdf-annotation
   {:title "PDF Annotation"
    :properties {:logseq.property.class/hide-from-node true}
    :schema {:properties [:logseq.property/ls-type :logseq.property.pdf/hl-color :logseq.property/asset
                          :logseq.property.pdf/hl-page :logseq.property.pdf/hl-value
                          :logseq.property.pdf/hl-type :logseq.property.pdf/hl-image]
             :required-properties [:logseq.property/ls-type :logseq.property.pdf/hl-color :logseq.property/asset
                                   :logseq.property.pdf/hl-page :logseq.property.pdf/hl-value]}}

;; TODO: Add more classes such as :book, :paper, :movie, :music, :project)
   ))

(def page-children-classes
  "Children of :logseq.class/Page"
  (set
   (keep (fn [[class-ident m]]
           (when (= (get-in m [:properties :logseq.property/parent]) :logseq.class/Page) class-ident))
         built-in-classes)))

(def page-classes
  "Built-in classes that behave like a page. Classes should match entity-util/page?"
  (into #{:logseq.class/Page :logseq.class/Tag :logseq.class/Property}
        page-children-classes))

(def internal-tags
  "Built-in classes that are hidden on a node and all pages view"
  #{:logseq.class/Page :logseq.class/Property :logseq.class/Tag :logseq.class/Root
    :logseq.class/Asset})

(def private-tags
  "Built-in classes that are private and should not be used by a user directly.
  These used to be in :block/type"
  (set/union internal-tags
             #{:logseq.class/Journal :logseq.class/Whiteboard}))

(def hidden-tags
  "Built-in classes that are hidden in a few contexts like property values"
  #{:logseq.class/Page :logseq.class/Root :logseq.class/Asset})

;; Helper fns
;; ==========

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
        db-ident' (or (:db/ident page-m)
                      (db-ident/ensure-unique-db-ident db db-ident))]
    (sqlite-util/build-new-class (assoc page-m :db/ident db-ident'))))
