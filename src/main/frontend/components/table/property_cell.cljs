(ns frontend.components.table.property-cell
  "Property cell display and edit policy for Logseq table views.")

(def system-property-idents
  "System property columns that are not edited from table cells."
  #{:block/created-at :block/updated-at})

(def display-only-property-types
  "Property types that table cells display without an inline editor."
  #{:raw-number :map :entity})

(defn editable?
  "Returns whether `property` can enter edit mode in a table cell.

  Options:

  | key                         | description
  | --------------------------- | -----------
  | `:class-ident`              | Class ident for class object tables
  | `:publishing?`              | Disable editing in publishing mode
  | `:readonly-property-idents` | Additional property idents forced readonly"
  [{:keys [class-ident publishing? readonly-property-idents]} property]
  (let [ident (or (:db/ident property) (:id property))
        type (:logseq.property/type property)]
    (and (not publishing?)
         (not (contains? system-property-idents ident))
         (not (contains? readonly-property-idents ident))
         (not (and (= :logseq.class/Asset class-ident)
                   (= :logseq.property.asset/type ident)))
         (not (contains? display-only-property-types type)))))
