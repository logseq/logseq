(ns logseq.outliner.op
  "Transact outliner ops"
  (:require [logseq.outliner.transaction :as outliner-tx]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.property :as outliner-property]
            [datascript.core :as d]
            [malli.core :as m]
            [logseq.db :as ldb]
            [clojure.string :as string]))

(def ^:private ^:large-vars/data-var op-schema
  [:multi {:dispatch first}
   ;; blocks
   [:save-block
    [:catn
     [:op :keyword]
     [:args [:tuple ::block ::option]]]]
   [:insert-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::blocks ::id ::option]]]]
   [:delete-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids ::option]]]]
   [:move-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids ::id :boolean]]]]
   [:move-blocks-up-down
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids :boolean]]]]
   [:indent-outdent-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::ids :boolean ::option]]]]

   ;; properties
   [:upsert-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::property-id ::schema ::option]]]]
   [:set-block-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id ::value]]]]
   [:remove-block-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id]]]]
   [:delete-property-value
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id ::value]]]]
   [:create-property-text-block
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id ::value ::option]]]]
   [:collapse-expand-block-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id :boolean]]]]
   [:batch-set-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::property-id ::value]]]]
   [:batch-remove-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::property-id]]]]
   [:class-add-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::class-id ::property-id]]]]
   [:class-remove-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::class-id ::property-id]]]]
   [:upsert-closed-value
    [:catn
     [:op :keyword]
     [:args [:tuple ::property-id ::option]]]]
   [:delete-closed-value
    [:catn
     [:op :keyword]
     [:args [:tuple ::property-id ::value]]]]
   [:add-existing-values-to-closed-values
    [:catn
     [:op :keyword]
     [:args [:tuple ::property-id ::values]]]]

   ;; transact
   [:transact
    [:catn
     [:op :keyword]
     [:args [:tuple ::tx-data ::tx-meta]]]]

   ;; page ops
   [:create-page
    [:catn
     [:op :keyword]
     [:args [:tuple ::title ::option]]]]

   [:rename-page
    [:catn
     [:op :keyword]
     [:args [:tuple ::uuid ::title]]]]

   [:delete-page
    [:catn
     [:op :keyword]
     [:args [:tuple ::uuid]]]]])

(def ^:private ops-schema
  [:schema {:registry {::id int?
                       ::block map?
                       ::schema map?
                       ;; FIXME: use eid integer
                       ::block-id :any
                       ::block-ids [:sequential ::block-id]
                       ::class-id int?
                       ::property-id [:or int? keyword? nil?]
                       ::value :any
                       ::values [:sequential ::value]
                       ::option [:maybe map?]
                       ::blocks [:sequential ::block]
                       ::ids [:sequential ::id]
                       ::uuid uuid?
                       ::title string?
                       ::tx-data [:sequential :any]
                       ::tx-meta [:maybe map?]}}
   [:sequential op-schema]])

(def ^:private ops-validator (m/validator ops-schema))

(defonce ^:private *op-handlers (atom {}))

(defn register-op-handlers!
  [handlers]
  (reset! *op-handlers handlers))

(defn ^:large-vars/cleanup-todo apply-ops!
  [repo conn ops date-formatter opts]
  (assert (ops-validator ops) ops)
  (let [opts' (assoc opts
                     :transact-opts {:conn conn}
                     :local-tx? true)
        *result (atom nil)
        db-based? (ldb/db-based-graph? @conn)]
    (outliner-tx/transact!
     opts'
     (doseq [[op args] ops]
       (when-not db-based?
         (assert (not (or (string/includes? (name op) "property") (string/includes? (name op) "closed-value")))
                 (str "Property related ops are only for db based graphs, ops: " ops)))
       (case op
         ;; blocks
         :save-block
         (apply outliner-core/save-block! repo conn date-formatter args)

         :insert-blocks
         (let [[blocks target-block-id opts] args]
           (when-let [target-block (d/entity @conn target-block-id)]
             (let [result (outliner-core/insert-blocks! repo conn blocks target-block opts)]
               (reset! *result result))))

         :delete-blocks
         (let [[block-ids opts] args
               blocks (keep #(d/entity @conn %) block-ids)]
           (outliner-core/delete-blocks! repo conn date-formatter blocks (merge opts opts')))

         :move-blocks
         (let [[block-ids target-block-id sibling?] args
               blocks (keep #(d/entity @conn %) block-ids)
               target-block (d/entity @conn target-block-id)]
           (when (and target-block (seq blocks))
             (outliner-core/move-blocks! repo conn blocks target-block sibling?)))

         :move-blocks-up-down
         (let [[block-ids up?] args
               blocks (keep #(d/entity @conn %) block-ids)]
           (when (seq blocks)
             (outliner-core/move-blocks-up-down! repo conn blocks up?)))

         :indent-outdent-blocks
         (let [[block-ids indent? opts] args
               blocks (keep #(d/entity @conn %) block-ids)]
           (when (seq blocks)
             (outliner-core/indent-outdent-blocks! repo conn blocks indent? opts)))

         ;; properties
         :upsert-property
         (reset! *result (apply outliner-property/upsert-property! conn args))

         :set-block-property
         (apply outliner-property/set-block-property! conn args)

         :remove-block-property
         (apply outliner-property/remove-block-property! conn args)

         :delete-property-value
         (apply outliner-property/delete-property-value! conn args)

         :create-property-text-block
         (apply outliner-property/create-property-text-block! conn args)

         :batch-set-property
         (apply outliner-property/batch-set-property! conn args)

         :batch-remove-property
         (apply outliner-property/batch-remove-property! conn args)

         :class-add-property
         (apply outliner-property/class-add-property! conn args)

         :class-remove-property
         (apply outliner-property/class-remove-property! conn args)

         :upsert-closed-value
         (apply outliner-property/upsert-closed-value! conn args)

         :delete-closed-value
         (apply outliner-property/delete-closed-value! conn args)

         :add-existing-values-to-closed-values
         (apply outliner-property/add-existing-values-to-closed-values! conn args)

         :transact
         (apply ldb/transact! conn args)

         (when-let [handler (get @*op-handlers op)]
           (reset! *result (handler repo conn args))))))

    @*result))
