(ns logseq.melange.bridge.db.frontend
  "DB frontend read boundary backed by typed Melange decisions."
  (:require ["@logseq/melange-js-api/common" :as melange-common]
            ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.db.class-catalog :as class-catalog]
            [logseq.melange.bridge.db.entity :as db-entity]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.platform.datascript :as d]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private frontend-api (.-FrontendRead melange-db))

(defn- keyword-text
  [value]
  (subs (str value) 1))

(defn built-in-class-property?
  "Returns whether the property is built into the supplied built-in class."
  [class-entity property-entity]
  ((.-builtInClassProperty frontend-api)
   (db-entity/built-in? class-entity)
   (db-entity/class? class-entity)
   (db-entity/built-in? property-entity)
   (keyword-text (:db/ident property-entity))
   (to-array
    (map keyword-text
         (get-in (class-catalog/built-in-classes (:db/ident class-entity))
                 [:schema :properties])))))

(defn private-built-in-page?
  "Returns whether a built-in page must remain private to DB internals."
  [page]
  ((.-privateBuiltInPage frontend-api)
   (db-entity/property? page)
   (melange-property/public-built-in-property? page)
   (db-entity/class? page)
   (db-entity/internal-page? page)))

(defn get-all-properties
  [db]
  (array-seq
   ((.-allPropertiesWith frontend-api)
    (runtime/runtime-adapter)
    (d/adapter)
    db)))

(defn get-page-parents
  [node]
  (some-> ((.-pageParentsWith frontend-api)
           (runtime/runtime-adapter)
           (d/adapter)
           node)
          array-seq
          vec))

(defn get-class-title-with-extends
  [entity]
  ((.-classTitleWithExtends frontend-api)
   (:block/title entity)
   (to-array
    (map (fn [extend]
           #js {:title (:block/title extend)
                :builtIn (db-entity/built-in? extend)})
         (:logseq.property.class/extends entity)))))

(defn get-title-with-parents
  [entity]
  ((.-titleWithParentsWith frontend-api)
   (runtime/runtime-adapter)
   (d/adapter)
   entity
   (.-libraryPageName (.-Config melange-common))))

(defn get-classes-parents
  "Returns all parents of all supplied classes."
  [tags]
  (set
   (array-seq
    ((.-classesParentsWith frontend-api)
     (runtime/runtime-adapter)
     (d/adapter)
     tags))))

(defn class-instance?
  "Returns whether object is a direct or inherited instance of class."
  [class object]
  ((.-classInstanceWith frontend-api)
   (runtime/runtime-adapter)
   (d/adapter)
   class
   object))

(defn inline-tag?
  [block-raw-title tag]
  (assert (string? block-raw-title) "block-raw-title should be a string")
  ((.-inlineTag frontend-api) block-raw-title (str (:block/uuid tag))))

(def node-display-type-classes
  (set (map keyword (seq (.-nodeDisplayTypeClasses frontend-api)))))

(defn get-class-ident-by-display-type
  [display-type]
  (some-> ((.-classIdentByDisplayType frontend-api) (name display-type)) keyword))

(defn get-display-type-by-class-ident
  [class-ident]
  (some-> ((.-displayTypeByClassIdent frontend-api) (keyword-text class-ident)) keyword))

(defn get-built-in-page
  [db title]
  ((.-builtInPageNullableWith frontend-api)
   (runtime/runtime-adapter)
   (d/adapter)
   db
   title))

(defn library?
  [page]
  ((.-library frontend-api)
   (db-entity/built-in? page)
   (:block/title page)
   (.-libraryPageName (.-Config melange-common))))
