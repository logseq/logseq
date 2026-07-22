(ns logseq.melange.bridge.db.sqlite.create-graph
  "Helper fns for creating a DB graph"
  (:require ["@logseq/melange-js-api/common" :as melange-common]
            ["@logseq/melange-js-api/db" :as melange-db]
            [logseq.melange.bridge.common.uuid :as melange-uuid]
            [logseq.melange.bridge.db.class-catalog :as class-catalog]
            [logseq.melange.bridge.db.order :as db-order]
            [logseq.melange.bridge.db.property-catalog :as property-catalog]
            [logseq.melange.bridge.db.schema :as db-schema]
            [logseq.melange.bridge.runtime :as runtime]))

(def ^:private sqlite-create-api (.-SqliteCreateGraph melange-db))

(defn mark-block-as-built-in [block]
  ((.-markBuiltInWith sqlite-create-api)
   (runtime/runtime-adapter)
   block))

(defn build-properties
  "Given a properties map in the format of property-catalog/built-in-properties, builds their properties tx"
  [built-in-properties]
  ((.-buildProperties sqlite-create-api)
   (runtime/runtime-adapter)
   melange-uuid/gen
   db-order/gen-key
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   built-in-properties
   property-catalog/built-in-properties
   property-catalog/schema-properties-map))

(def built-in-pages-names
  #{(.-libraryPageName (.-Config melange-common))
    (.-quickAddPageName (.-Config melange-common))
    "Contents"})

(defn build-initial-classes*
  [built-in-classes db-ident->properties]
  ((.-buildInitialClassesWith sqlite-create-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   built-in-classes
   db-ident->properties))

(defn build-initial-views
  "Builds initial blocks used for storing views"
  []
  ((.-buildInitialViewsWith sqlite-create-api)
   (runtime/runtime-adapter)
   (fn [] ((.-nowMs (.-DateTime melange-common))))))

(defn build-db-initial-data
  "Builds tx of initial data for a new graph including key values, initial files,
   built-in properties and built-in classes"
  [config-content & {:keys [import-type graph-git-sha creating-remote-graph?]}]
  (assert (string? config-content))
  ((.-buildInitialData sqlite-create-api)
   (runtime/runtime-adapter)
   melange-uuid/gen
   db-order/gen-key
   (fn [] ((.-nowMs (.-DateTime melange-common))))
   (fn [] (js/Date.))
   config-content
   property-catalog/built-in-properties
   property-catalog/schema-properties-map
   class-catalog/built-in-classes
   db-schema/version
   #js {:importType import-type
        :graphGitSha graph-git-sha
        :creatingRemoteGraph (boolean creating-remote-graph?)}))
