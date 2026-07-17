(ns logseq.melange.bridge.db.class-catalog
  "CLJS map conversion for the typed Melange built-in class catalog."
  (:require ["@logseq/melange-js-api/db" :as db-api]
            [flatland.ordered.map :refer [ordered-map]]))

(def ^:private class-api (.-ClassCatalog db-api))

(defn- keyword-set
  [values]
  (set (map keyword (seq values))))

(defn- decode-property-value
  [value]
  (case (.-kind value)
    "keyword" (keyword (.-text value))
    "string" (.-text value)
    "bool" (aget value "boolValue")
    "icon" {:type (keyword (.-text value))
            :id (aget value "extra")}
    (throw (js/Error. (str "Unknown built-in class property value: "
                           (.-kind value))))))

(def built-in-classes
  (into
   (ordered-map)
   (map (fn [[ident title properties schema-properties required-properties]]
          [(keyword ident)
           (cond-> {:title title}
             (seq properties)
             (assoc :properties
                    (into {}
                          (map (fn [[property value]]
                                 [(keyword property)
                                  (decode-property-value value)]))
                          (seq properties)))

             (or (seq schema-properties) (seq required-properties))
             (assoc :schema
                    (cond-> {}
                      (seq schema-properties)
                      (assoc :properties
                             (mapv keyword (seq schema-properties)))

                      (seq required-properties)
                      (assoc :required-properties
                             (mapv keyword
                                   (seq required-properties))))))])
        (seq (.-entries class-api)))))

(def page-children-classes
  (keyword-set (.-pageChildrenClasses class-api)))

(def page-classes
  (keyword-set (.-pageClasses class-api)))

(def internal-tags
  (keyword-set (.-internalTags class-api)))

(def private-tags
  (keyword-set (.-privateTags class-api)))

(def block-kind-tags
  (keyword-set (.-blockKindTags class-api)))

(def disallowed-inline-tags
  (keyword-set (.-disallowedInlineTags class-api)))

(def extends-hidden-tags
  (keyword-set (.-extendsHiddenTags class-api)))

(def hidden-tags
  (keyword-set (.-hiddenTags class-api)))
