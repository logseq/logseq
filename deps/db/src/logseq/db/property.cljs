(ns logseq.db.property
  "Property related fns for DB graphs and frontend/datascript usage"
  (:require [clojure.set :as set]))

;; FIXME: no support for built-in-extended-properties
(def ^:large-vars/data-var built-in-properties
  "Map of built in properties for db graphs. Each property has a config map with
  the following keys:
   * :schema - Property's schema. Required key
   * :original-name - Property's :block/original-name
   * :attribute - Property keyword that is saved to a datascript attribute outside of :block/properties
   * :visible - Boolean to indicate user can see and use this property"
  {:alias {:original-name "Alias"
           :attribute :block/alias
           :visible true
           :schema {:type :page
                    :cardinality :many}}
   :tags {:original-name "Tags"
          :attribute :block/tags
          :visible true
          :schema {:type :page
                   :cardinality :many}}
   :background-color {:schema {:type :default :hide? true}
                      :visible true}
   :background-image {:schema {:type :default :hide? true}
                      :visible true}
   :heading {:schema {:type :any}}      ; number (1-6) or boolean for auto heading
   :query-table {:schema {:type :checkbox}}
   ;; query-properties is a coll of property uuids and keywords where keywords are special frontend keywords
   :query-properties {:schema {:type :coll}}
   ;; query-sort-by is either a property uuid or a keyword where keyword is a special frontend keyword
   :query-sort-by {:schema {:type :any}}
   :query-sort-desc {:schema {:type :checkbox}}
   :ls-type {:schema {:type :keyword}}
   :hl-type {:schema {:type :keyword}}
   :hl-page {:schema {:type :number}}
   :hl-stamp {:schema {:type :number}}
   :hl-color {:schema {:type :default}}
   :logseq.macro-name {:schema {:type :default}}
   :logseq.macro-arguments {:schema {:type :default}}
   :logseq.order-list-type {:schema {:type :default}}
   :logseq.tldraw.page {:schema {:type :map}}
   :logseq.tldraw.shape {:schema {:type :map}}
   ;; color props
   :logseq.color {:schema {:type :default}
                  :visible true}
   ;; table-v2 props
   :logseq.table.version {:schema {:type :number}
                          :visible true}
   :logseq.table.compact {:schema {:type :checkbox}
                          :visible true}
   :logseq.table.headers {:schema {:type :default}
                          :visible true}
   :logseq.table.hover {:schema {:type :default}
                        :visible true}
   :logseq.table.borders {:schema {:type :checkbox}
                          :visible true}
   :logseq.table.stripes {:schema {:type :checkbox}
                          :visible true}
   :logseq.table.max-width {:schema {:type :number}
                            :visible true}

   :icon {:original-name "Icon"
          :schema {:type :default}}
   :public {:schema {:type :checkbox :hide? true}
            :visible true}
   :filters {:schema {:type :map}}
   :exclude-from-graph-view {:schema {:type :checkbox :hide? true}
                             :visible true}
   :created-in-property {:schema {:type :checkbox}}})

(def visible-built-in-properties
  "These are built-in properties that users can see and use"
  (set (keep (fn [[k v]] (when (:visible v) k)) built-in-properties)))

(defonce built-in-properties-keys
  (set (keys built-in-properties)))

(def hidden-built-in-properties
  (set/difference built-in-properties-keys visible-built-in-properties))

(defonce built-in-properties-keys-str
  (set (map name (keys built-in-properties))))

(defn valid-property-name?
  [s]
  {:pre [(string? s)]}
  ;; Disallow tags or page refs as they would create unreferenceable page names
  (not (re-find #"^(#|\[\[)" s)))
