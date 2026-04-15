(ns logseq.outliner.op
  "Transact outliner ops"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.util :as common-util]
            [logseq.db :as ldb]
            [logseq.db.sqlite.export :as sqlite-export]
            [logseq.outliner.core :as outliner-core]
            [logseq.outliner.template :as outliner-template]
            [logseq.outliner.page :as outliner-page]
            [logseq.outliner.property :as outliner-property]
            [logseq.outliner.recycle :as outliner-recycle]
            [logseq.outliner.transaction :as outliner-tx]
            [malli.core :as m]
            [logseq.outliner.op.construct :as op-construct]))

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
     [:args [:tuple ::blocks ::block-id ::option]]]]
   [:apply-template
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::block-id ::option]]]]
   [:delete-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::option]]]]
   [:move-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::block-id ::option]]]]
   [:move-blocks-up-down
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids :boolean]]]]
   [:indent-outdent-blocks
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids :boolean ::option]]]]

   ;; properties
   [:upsert-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::maybe-property-id ::schema ::option]]]]
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
   [:batch-delete-property-value
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::property-id ::value]]]]
   [:create-property-text-block
    [:catn
     [:op :keyword]
     [:args [:tuple ::maybe-block-id ::property-id ::value ::option]]]]
   [:collapse-expand-block-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-id ::property-id :boolean]]]]
   [:batch-set-property
    [:catn
     [:op :keyword]
     [:args [:tuple ::block-ids ::property-id ::value ::option]]]]
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
     [:args [:tuple ::property-id ::block-id]]]]
   [:add-existing-values-to-closed-values
    [:catn
     [:op :keyword]
     [:args [:tuple ::property-id ::values]]]]

   [:batch-import-edn
    [:catn
     [:op :keyword]
     [:args [:tuple ::import-edn ::option]]]]

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
     [:args [:tuple ::uuid ::option]]]]

   [:recycle-delete-permanently
    [:catn
     [:op :keyword]
     [:args [:tuple ::uuid]]]]

   [:toggle-reaction
    [:catn
     [:op :keyword]
     [:args [:tuple ::uuid ::emoji-id ::maybe-uuid]]]]])

(def ^:private ops-schema
  [:schema {:registry {::block map?
                       ::schema map?
                       ::block-id uuid?
                       ::maybe-block-id [:maybe ::block-id]
                       ::block-ids [:sequential ::block-id]
                       ::class-id ::block-id
                       ::emoji-id string?
                       ::property-id qualified-keyword?
                       ::maybe-property-id [:maybe ::property-id]
                       ::maybe-uuid [:maybe :uuid]
                       ::value :any
                       ::values [:sequential ::value]
                       ::option [:maybe map?]
                       ::import-edn map?
                       ::blocks [:sequential ::block]
                       ::uuid uuid?
                       ::title string?
                       ::tx-data [:sequential :any]
                       ::tx-meta [:maybe map?]}}
   [:sequential op-schema]])

(def ^:private ops-validator (m/validator ops-schema))

(defn- reaction-user-id
  [reaction]
  (:db/id (:logseq.property/created-by-ref reaction)))

(defn- toggle-reaction!
  [conn target-uuid emoji-id user-uuid]
  (when-let [target (d/entity @conn [:block/uuid target-uuid])]
    (let [user-id (when user-uuid
                    (:db/id (d/entity @conn [:block/uuid user-uuid])))
          reactions (:logseq.property.reaction/_target target)
          match? (fn [reaction]
                   (and (= emoji-id (:logseq.property.reaction/emoji-id reaction))
                        (if user-id
                          (= user-id (reaction-user-id reaction))
                          (nil? (reaction-user-id reaction)))))
          existing (some (fn [reaction] (when (match? reaction) reaction)) reactions)]
      (if existing
        (do
          (ldb/transact! conn [[:db/retractEntity (:db/id existing)]]
                         {:outliner-op :toggle-reaction})
          true)
        (let [now (common-util/time-ms)
              reaction-tx (cond-> {:block/uuid (d/squuid)
                                   :block/created-at now
                                   :logseq.property.reaction/emoji-id emoji-id
                                   :logseq.property.reaction/target (:db/id target)}
                            user-id
                            (assoc :logseq.property/created-by-ref user-id))]
          (ldb/transact! conn [reaction-tx]
                         {:outliner-op :toggle-reaction})
          true)))))

(defn- import-edn-data
  [conn *result export-map {:keys [tx-meta] :as import-options}]
  (let [{:keys [init-tx block-props-tx misc-tx error] :as _txs}
        (try (sqlite-export/build-import export-map @conn (dissoc import-options :tx-meta))
             (catch :default e
               (js/console.error "Import EDN error: " e)
               {:error "An unexpected error occurred building the import. See the javascript console for details."}))]
    ;; (cljs.pprint/pprint _txs)
    (if error
      (reset! *result {:error error})
      (try
        (ldb/transact! conn (vec (concat init-tx block-props-tx misc-tx))
                       (merge {::sqlite-export/imported-data? true} tx-meta))
        (catch :default e
          (js/console.error "Unexpected Import EDN error:" e)
          (reset! *result {:error (str "Unexpected Import EDN error: " (pr-str (ex-message e)))}))))))

(defn- apply-insert-blocks-op!
  [conn *result [blocks target-block-id opts]]
  (when-let [target-block (d/entity @conn [:block/uuid target-block-id])]
    (let [result (outliner-core/insert-blocks! conn blocks target-block opts)]
      (reset! *result result))))

(defn- template-children-blocks
  [db template-id]
  (when-let [template (d/entity db template-id)]
    (let [template-blocks (some->> (ldb/get-block-and-children db (:block/uuid template)
                                                               {:include-property-block? true})
                                   rest)]
      (when (seq template-blocks)
        (cons (assoc (into {} (first template-blocks))
                     :db/id (:db/id (first template-blocks))
                     :logseq.property/used-template (:db/id template))
              (map (fn [block]
                     (assoc (into {} block) :db/id (:db/id block)))
                   (rest template-blocks)))))))

(defn- apply-template-op!
  [conn *result [template-id target-block-id opts]]
  (when-let [target (d/entity @conn [:block/uuid target-block-id])]
    (let [blocks (or (some-> (:template-blocks opts) seq vec)
                     (template-children-blocks @conn [:block/uuid template-id]))
          blocks (outliner-template/resolve-dynamic-template-blocks @conn target blocks)]
      (when (seq blocks)
        (let [sibling? (:sibling? opts)
              sibling?' (cond
                          (some? sibling?)
                          sibling?

                          (seq (:block/_parent target))
                          false

                          :else
                          true)
              result (outliner-core/insert-blocks! conn blocks target
                                                   (assoc opts
                                                          :sibling? sibling?'
                                                          :insert-template? true
                                                          :outliner-op :insert-template-blocks))]
          (reset! *result result))))))

(defn- ^:large-vars/cleanup-todo apply-op!
  [conn opts' *result [op args]]
  (case op
    ;; blocks
    :save-block
    (apply outliner-core/save-block! conn args)

    :insert-blocks
    (apply-insert-blocks-op! conn *result args)

    :apply-template
    (apply-template-op! conn *result args)

    :delete-blocks
    (let [[block-ids opts] args
          blocks (keep #(d/entity @conn [:block/uuid %]) block-ids)]
      (outliner-core/delete-blocks! conn blocks (merge opts opts')))

    :move-blocks
    (let [[block-ids target-block-id opts] args
          blocks (keep #(d/entity @conn [:block/uuid %]) block-ids)
          target-block (d/entity @conn [:block/uuid target-block-id])]
      (when (and target-block (seq blocks))
        (outliner-core/move-blocks! conn blocks target-block opts)))

    :move-blocks-up-down
    (let [[block-ids up?] args
          blocks (keep #(d/entity @conn [:block/uuid %]) block-ids)]
      (when (seq blocks)
        (outliner-core/move-blocks-up-down! conn blocks up?)))

    :indent-outdent-blocks
    (let [[block-ids indent? opts] args
          blocks (keep #(d/entity @conn [:block/uuid %]) block-ids)]
      (when (seq blocks)
        (outliner-core/indent-outdent-blocks! conn blocks indent? opts)))

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
    (let [[block-id property-id v opts] args
          block-id' (when block-id [:block/uuid block-id])]
      (outliner-property/create-property-text-block! conn block-id' property-id v opts))

    :batch-set-property
    (apply outliner-property/batch-set-property! conn args)

    :batch-remove-property
    (apply outliner-property/batch-remove-property! conn args)

    :batch-delete-property-value
    (apply outliner-property/batch-delete-property-value! conn args)

    :class-add-property
    (let [[class-id property-id] args]
      (outliner-property/class-add-property! conn [:block/uuid class-id] property-id))

    :class-remove-property
    (let [[class-id property-id] args]
      (outliner-property/class-remove-property! conn [:block/uuid class-id] property-id))

    :upsert-closed-value
    (apply outliner-property/upsert-closed-value! conn args)

    :delete-closed-value
    (let [[property-id value-block-id] args]
      (outliner-property/delete-closed-value! conn property-id [:block/uuid value-block-id]))

    :add-existing-values-to-closed-values
    (apply outliner-property/add-existing-values-to-closed-values! conn args)

    :batch-import-edn
    (apply import-edn-data conn *result args)

    :transact
    (apply ldb/transact! conn args)

    :create-page
    (let [[title options] args]
      (reset! *result (outliner-page/create! conn title (or options {}))))

    :rename-page
    (let [[page-uuid new-title] args]
      (if (string/blank? new-title)
        (throw (ex-info "Page name shouldn't be blank" {:block/uuid page-uuid
                                                        :block/title new-title}))
        (outliner-core/save-block! conn
                                   {:block/uuid page-uuid
                                    :block/title new-title})))

    :delete-page
    (let [[page-uuid opts] args]
      (outliner-page/delete! conn page-uuid (merge opts opts')))

    :recycle-delete-permanently
    (let [[root-uuid] args]
      (outliner-recycle/permanently-delete! conn root-uuid))

    :toggle-reaction
    (reset! *result (apply toggle-reaction! conn args))
    nil))

(defn- apply-single-op!
  [conn ops *result opts' clean-tx-meta]
  (let [db @conn
        op (first ops)
        result (case (ffirst ops)
                 :save-block
                 (apply outliner-core/save-block db (second op))
                 :insert-blocks
                 (let [[blocks target-block-id insert-opts] (second op)]
                   (outliner-core/insert-blocks db blocks
                                                (d/entity db [:block/uuid target-block-id])
                                                insert-opts))
                 :delete-blocks
                 (let [[block-ids opts] (second op)
                       blocks (keep #(d/entity db [:block/uuid %]) block-ids)]
                   (outliner-core/delete-blocks db blocks (merge opts opts'))))
        additional-tx (:additional-tx opts')
        full-tx (concat (:tx-data result) additional-tx)]
    (ldb/transact! conn full-tx clean-tx-meta)
    (reset! *result result)))

(defn- apply-save-followed-by-insert!
  [conn ops *result opts' clean-tx-meta]
  (let [save-block-tx (:tx-data (apply outliner-core/save-block @conn (second (first ops))))
        [blocks target-block-id insert-opts] (second (second ops))
        insert-blocks-result (outliner-core/insert-blocks @conn blocks
                                                          (d/entity @conn [:block/uuid target-block-id])
                                                          insert-opts)
        additional-tx (:additional-tx opts')
        full-tx (concat save-block-tx
                        (:tx-data insert-blocks-result)
                        additional-tx)]
    (ldb/transact! conn full-tx clean-tx-meta)
    (reset! *result insert-blocks-result)))

(defn apply-ops!
  [conn ops opts]
  (assert (ops-validator ops) ops)
  (let [semantic-ops (filter (fn [op] (get op-construct/semantic-outliner-ops (first op))) ops)
        single-op-outliner-op (when (= 1 (count ops))
                                (first (first ops)))
        opts' (cond-> (assoc opts
                             :transact-opts {:conn conn}
                             :local-tx? true
                             :outliner-ops semantic-ops
                             :db-sync/tx-id (or (:db-sync/tx-id opts) (random-uuid)))
                (and single-op-outliner-op
                     (nil? (:outliner-op opts)))
                (assoc :outliner-op single-op-outliner-op))
        *result (atom nil)
        clean-tx-meta (dissoc opts' :additional-tx :transact-opts :current-block)]
    (cond
      (and single-op-outliner-op
           (contains? #{:save-block :insert-blocks :delete-blocks} (ffirst ops)))
      (apply-single-op! conn ops *result opts' clean-tx-meta)

      (and (= 2 (count ops))
           (= :save-block (ffirst ops))
           (= :insert-blocks (first (second ops))))
      (apply-save-followed-by-insert! conn ops *result opts' clean-tx-meta)

      :else
      (outliner-tx/transact!
       opts'
       (doseq [op-entry ops]
         (apply-op! conn opts' *result op-entry))))

    @*result))
