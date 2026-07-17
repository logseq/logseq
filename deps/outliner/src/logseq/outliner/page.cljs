(ns logseq.outliner.page
  "Page-related fns for DB graphs"
  (:require [logseq.melange.bridge.common.api :as melange-common]
            [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]

            [logseq.melange.bridge.db.core :as ldb]
            [logseq.melange.bridge.db.entity-plus :as entity-plus]
            [logseq.melange.bridge.db.order :as db-order]
            [logseq.melange.bridge.db.class :as db-class]
            [logseq.melange.bridge.db.content :as db-content]
            [logseq.melange.bridge.db.entity :as entity-util]
            [logseq.melange.bridge.db.validation :as db-validation]
            [logseq.melange.bridge.db.property :as melange-property]
            [logseq.melange.bridge.db.property-build :as melange-property-build]
            [logseq.graph-parser.block :as gp-block]
            [logseq.outliner.recycle :as outliner-recycle]
            [logseq.outliner.tx-meta :as outliner-tx-meta]
            [logseq.outliner.validate :as outliner-validate]))

(defn- page-ref-rewrite-targets
  "Collect entities that reference `page-entity` via node refs and need title rewrite."
  [page-entity]
  (let [refs (->> (:block/_refs page-entity)
                  ;; remove child or self that refed this page
                  (remove (fn [ref]
                            (or (= (:db/id ref) (:db/id page-entity))
                                (= (:db/id (:block/page ref)) (:db/id page-entity))))))
        id-ref->page #(db-content/content-id-ref->page % [page-entity])]
    (->> refs
         (keep (fn [ref]
                 (let [raw-title (:block/raw-title ref)
                       block-uuid (:block/uuid ref)]
                   (when raw-title
                     (let [content' (id-ref->page raw-title)]
                       (when (not= raw-title content')
                         (let [remaining-refs (->> (:block/refs ref)
                                                   (remove (fn [ref']
                                                             (= (:db/id ref') (:db/id page-entity))))
                                                   vec)]
                           {:ref-id (:db/id ref)
                            :ref-uuid block-uuid
                            :title content'
                            :refs remaining-refs})))))))
         seq)))

(defn- db-refs->page
  "Replace [[page name]] with page name."
  [page-entity]
  (let [page-id (:db/id page-entity)]
    (some->> (page-ref-rewrite-targets page-entity)
             (mapcat (fn [{:keys [ref-id title]}]
                       [[:db/retract ref-id :block/refs page-id]
                        {:db/id ref-id
                         :block/title title}])))))

(defn- db-refs->page-save-ops
  [page-entity]
  (some->> (page-ref-rewrite-targets page-entity)
           (keep (fn [{:keys [ref-uuid title refs]}]
                   (when ref-uuid
                     [:save-block [{:block/uuid ref-uuid
                                    :block/title title
                                    :block/refs refs}
                                   {}]])))
           seq
           vec))

(defn ^:api build-page-retract-tx
  "Build cleanup tx-data for deleting a schema page.
   This is pure and can be reused by sync repair."
  [db page & [{:keys [include-page-retract? today-page?]
               :or {include-page-retract? true}}]]
  (let [page-id (:db/id page)
        page-blocks-tx-data (->> (:block/_page page)
                                 (keep (fn [block]
                                         (when (d/entity db [:block/uuid (:block/uuid block)])
                                           [:db/retractEntity [:block/uuid (:block/uuid block)]]))))
        property-pair-tx-data (when (ldb/property? page)
                                (->> (d/datoms db :avet (:db/ident page))
                                     (map (fn [d] [:db/retract (:e d) (:a d) (:v d)]))))
        restore-class-parent-tx (when (ldb/class? page)
                                  (->> (filter ldb/class? (:logseq.property.class/_extends page))
                                       (map (fn [p]
                                              {:db/id (:db/id p)
                                               :logseq.property.class/extends :logseq.class/Root}))))
        page-tx (when (and include-page-retract?
                           (d/entity db page-id))
                  [[:db/retractEntity page-id]])]
    (if today-page?
      page-blocks-tx-data
      (concat page-blocks-tx-data
              property-pair-tx-data
              restore-class-parent-tx
              (db-refs->page page)
              page-tx))))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false.
  Rules:
  1. today page content is truncated but the page itself can't be deleted
  2. properties and tags will be hard retracted
  3. other pages will be moved to Recycle"
  [conn page-uuid & {:keys [persist-op? rename? error-handler deleted-by-uuid now-ms]
                     :or {persist-op? true
                          error-handler (fn [{:keys [msg]}] (js/console.error msg))}}]
  (assert (uuid? page-uuid) (str ::delete! " wrong page-uuid: " (if page-uuid page-uuid "nil")))
  (when page-uuid
    (when-let [page (d/entity @conn [:block/uuid page-uuid])]
      (let [today-page? (when-let [day (:block/journal-day page)]
                          (= (melange-common/journal-day-of-ms (.getTime (js/Date.))) day))
            tx-meta (cond-> (outliner-tx-meta/ensure-outliner-ops
                             {:outliner-op :delete-page
                              :deleted-page (:block/title page)
                              :persist-op? persist-op?}
                             [:delete-page [page-uuid {:deleted-by-uuid deleted-by-uuid
                                                       :now-ms now-ms}]])
                      rename?
                      (assoc :source-outliner-op :rename-page))]
        ;; TODO: maybe we should add $$$favorites to built-in pages?
        (cond
          (or (ldb/built-in? page) (ldb/hidden? page))
          (do
            (error-handler {:msg "Built-in page cannot be deleted"})
            false)

          today-page?
          (let [tx-data (build-page-retract-tx @conn page {:today-page? true})]
            (when (seq tx-data)
              (ldb/transact! conn tx-data tx-meta))
            {:truncated? true})

          (or (ldb/class? page) (ldb/property? page))
          (let [tx-data (build-page-retract-tx @conn page {})]
            (ldb/transact! conn tx-data tx-meta)
            true)

          :else
          (let [ref-rewrite-tx-data (db-refs->page page)
                ref-rewrite-save-ops (db-refs->page-save-ops page)
                tx-data (concat ref-rewrite-tx-data
                                (outliner-recycle/recycle-page-tx-data @conn page {:deleted-by-uuid deleted-by-uuid
                                                                                   :now-ms now-ms}))
                tx-meta' (cond-> tx-meta
                           (seq ref-rewrite-save-ops)
                           (update :outliner-ops (fnil into []) ref-rewrite-save-ops))]
            (when (seq tx-data)
              (ldb/transact! conn tx-data tx-meta'))
            true))))))

(defn- build-page-tx [db properties page {:keys [class? tags class-ident-namespace]}]
  (when (:block/uuid page)
    (let [type-tag (if class? :logseq.class/Tag :logseq.class/Page)
          tags' (if (:block/journal-day page) tags (conj tags type-tag))
          page' (update page :block/tags
                        (fnil into [])
                        (mapv (fn [tag]
                                (let [v (if (uuid? tag)
                                          (d/entity db [:block/uuid tag])
                                          tag)]
                                  (cond (de/entity? v)
                                        (:db/id v)
                                        ;; tx map
                                        (map? v)
                                        ;; Handle adding :db/ident if a new tag
                                        (if (d/entity db [:block/uuid (:block/uuid v)])
                                          v
                                          (db-class/build-new-class db v))
                                        :else
                                        v)))
                              tags'))
          property-vals-tx-m
          ;; Builds property values for built-in properties like logseq.property.pdf/file
          (melange-property-build/build-property-values-tx-m
           page'
           (->> properties
                (keep (fn [[k v]]
                        ;; TODO: Pass in property type in order to support property
                        ;; types other than :default
                        (when (melange-property/built-in-has-ref-value? k)
                          [k v])))
                (into {})))]
      (cond-> (if class?
                [(merge (db-class/build-new-class db page' {:ident-namespace class-ident-namespace})
                        ;; FIXME: new pages shouldn't have db/ident but converting property to tag still relies on this
                        (select-keys page' [:db/ident]))
                 [:db/retract [:block/uuid (:block/uuid page)] :block/tags :logseq.class/Page]]
                [page'])
        (seq property-vals-tx-m)
        (into (vals property-vals-tx-m))
        true
        (conj (merge {:block/uuid (:block/uuid page)}
                     properties
                     (melange-property-build/build-properties-with-ref-values property-vals-tx-m)))))))

;; TODO: Revisit title cleanup as this was copied from file implementation
(defn ^:api sanitize-title
  [title]
  (let [title (-> (string/trim title)
                  (melange-common/get-page-name-or-self))
        title (melange-common/remove-boundary-slashes title)]
    title))

(defn- get-page-by-parent-name
  [db parent-title child-title class?]
  (some->>
   (d/q
    '[:find [?b ...]
      :in $ ?attribute ?parent-name ?child-name
      :where
      [?b ?attribute ?p]
      [?b :block/name ?child-name]
      [?p :block/name ?parent-name]]
    db
    (if class? :logseq.property.class/extends :block/parent)
    (melange-common/page-name-sanity-lower parent-title)
    (melange-common/page-name-sanity-lower child-title))
   first
   (d/entity db)))

(defn- page-with-parent-and-order
  "Apply to namespace pages"
  [db page & {:keys [parent]}]
  (let [library (ldb/get-built-in-page db melange-common/library-page-name)]
    (when (nil? library)
      (throw (ex-info "Library page doesn't exist" {})))
    (assoc page
           :block/parent (or parent (:db/id library))
           :block/order (db-order/gen-key))))

(defn- ^:large-vars/cleanup-todo split-namespace-pages
  [db page date-formatter create-class?]
  (let [{:block/keys [title] block-uuid :block/uuid} page]
    (->>
     (if (and (or (entity-util/class? page)
                  (entity-util/page? page))
              (melange-common/namespace-page? title))
       (let [class? (entity-util/class? page)
             parts (->> (string/split title #"/")
                        (map string/trim)
                        (remove string/blank?))
             pages (map-indexed
                    (fn [idx part]
                      (let [last-part? (= idx (dec (count parts)))
                            page (if (zero? idx)
                                   (ldb/get-page db part)
                                   (get-page-by-parent-name db (nth parts (dec idx)) part create-class?))
                            result (or page
                                       (gp-block/page-name->map part db true date-formatter
                                                                {:page-uuid (when last-part? block-uuid)
                                                                 :skip-existing-page-check? true
                                                                 :class? class?}))]
                        result))
                    parts)]
         (cond
           (and (not class?) (not (every? ldb/internal-page? pages)))
           (throw (ex-info "Cannot create this page unless all parents are pages"
                           {:type :notification
                            :payload {:message "Cannot create this page unless all parents are pages."
                                      :i18n-key :page.validation/parents-must-be-pages
                                      :type :warning}}))

           (and class? (not (every? ldb/class? pages)))
           (throw (ex-info "Cannot create this tag unless all parents are tags"
                           {:type :notification
                            :payload {:message "Cannot create this tag unless all parents are tags."
                                      :i18n-key :class.validation/parents-must-be-tags
                                      :type :warning}}))

           :else
           (map-indexed
            (fn [idx page]
              (let [parent-eid (when (> idx 0)
                                 (when-let [id (:block/uuid (nth pages (dec idx)))]
                                   [:block/uuid id]))]
                (if class?
                  (cond
                    (and (de/entity? page) (ldb/class? page))
                    (assoc page :logseq.property.class/extends parent-eid)

                    (de/entity? page) ; page exists but not a class, avoid converting here because this could be troublesome.
                    nil

                    (zero? idx)
                    (db-class/build-new-class db page)

                    :else
                    (db-class/build-new-class db (assoc page :logseq.property.class/extends parent-eid)))
                  (if (de/entity? page)
                    page
                    (page-with-parent-and-order db page {:parent parent-eid})))))
            pages)))
       [page])
     (remove nil?))))

(defn ^:large-vars/cleanup-todo ^:api create
  "Pure function without side effects"
  [db title*
   {uuid' :uuid
    :keys [tags properties persist-op?
           class? journal? today-journal? split-namespace? class-ident-namespace]
    :or   {properties               nil
           persist-op?              true}
    :as options}]
  (let [date-formatter (:logseq.property.journal/title-format (entity-plus/entity-memoized db :logseq.class/Journal))
        tags (if (every? uuid? tags)
               (map (fn [id] (d/entity db [:block/uuid id])) tags)
               tags)
        class? (or class? (some (fn [t] (= :logseq.class/Tag (:db/ident t))) tags))
        class-ident-namespace? (and class? class-ident-namespace (string? class-ident-namespace))
        title (sanitize-title title*)
        _ (outliner-validate/validate-page-title-no-hashtag title {:node {:block/title title}})
        types (cond class?
                    #{:logseq.class/Tag}
                    (or journal? today-journal?)
                    #{:logseq.class/Journal}
                    (seq tags)
                    (set (map :db/ident tags))
                    :else
                    #{:logseq.class/Page})
        existing-names-page (ldb/page-exists? db title types)
        journal-page-uuid (some-> (gp-block/page-name->map title db false date-formatter
                                                           {:class? class?
                                                            :skip-existing-page-check? true})
                                  :block/uuid)
        existing-page-by-journal-uuid (when (uuid? journal-page-uuid)
                                        (d/entity db [:block/uuid journal-page-uuid]))
        existing-page-id (if class-ident-namespace?
                           (some->> existing-names-page
                                    (filter #(try (when-let [e (d/entity db %)]
                                                    (let [ns' (namespace (:db/ident e))]
                                                      (= (str ns') class-ident-namespace)))
                                                  (catch :default _ false)))
                                    (first))
                           (first existing-names-page))
        existing-page (or (some->> existing-page-id (d/entity db))
                          existing-page-by-journal-uuid)]
    (if (and existing-page
             (or (:block/journal-day existing-page)
                 (not (:block/parent existing-page))
                 (ldb/recycled? existing-page)))
      (let [tx-meta {:persist-op? persist-op?
                     :outliner-op :save-block}]
        (cond
          (and class?
               (not (ldb/class? existing-page))
               (ldb/internal-page? existing-page))
          ;; Convert existing page to class
          (let [tx-data [(merge (db-class/build-new-class db
                                                          (select-keys existing-page [:block/title :block/uuid :block/created-at])
                                                          (when class-ident-namespace?
                                                            {:ident-namespace class-ident-namespace}))
                                (select-keys existing-page [:db/ident]))
                         [:db/retract [:block/uuid (:block/uuid existing-page)] :block/tags :logseq.class/Page]]]
            {:tx-meta tx-meta
             :tx-data tx-data
             :page-uuid (:block/uuid existing-page)
             :title (:block/title existing-page)})

          (ldb/recycled? existing-page)
          (let [options' (assoc options :uuid (:block/uuid existing-page))
                tx-meta' (outliner-tx-meta/ensure-outliner-ops
                          {:persist-op? persist-op?
                           :outliner-op :create-page}
                          [:create-page [title options']])]
            {:tx-meta tx-meta'
             :tx-data (outliner-recycle/restore-tx-data db existing-page)
             :page-uuid (:block/uuid existing-page)
             :title (:block/title existing-page)})

          ;; Just return existing page info
          :else
          {:page-uuid (:block/uuid existing-page)
           :title (:block/title existing-page)}))
      (let [page (gp-block/page-name->map title db true date-formatter
                                          {:class? class?
                                           :page-uuid (when (uuid? uuid') uuid')
                                           :skip-existing-page-check? true})
            [page parents'] (if (and (not (:block/journal-day page))
                                     (melange-common/namespace-page? title)
                                     split-namespace?)
                              (let [pages (split-namespace-pages db page date-formatter class?)]
                                [(last pages) (butlast pages)])
                              [page nil])]
        (when (and page (or (nil? (:db/ident page))
                            ;; New page creation must not override built-in entities
                            (not (db-validation/internal-ident? (:db/ident page)))))
          ;; Don't validate journal names because they can have '/'
          (when-not (or (contains? types :logseq.class/Journal)
                        (contains? (set (:block/tags page)) :logseq.class/Journal))
            (outliner-validate/validate-page-title-characters (str (:block/title page)) {:node page})
            (doseq [parent parents']
              (outliner-validate/validate-page-title-characters (str (:block/title parent)) {:node parent})))

          (let [page-uuid (if-let [journal-day (:block/journal-day page)]
                            (uuid (melange-common/journal-page journal-day))
                            (:block/uuid page))
                page (assoc page :block/uuid page-uuid)
                page-txs (build-page-tx db properties page (select-keys options [:class? :tags :class-ident-namespace]))
                txs (concat
                     ;; transact doesn't support entities
                     (remove de/entity? parents')
                     page-txs)
                tx-meta (cond-> (outliner-tx-meta/ensure-outliner-ops
                                 {:persist-op? persist-op?
                                  :outliner-op :create-page}
                                 [:create-page [title options]])
                          today-journal?
                          (assoc :create-today-journal? true
                                 :today-journal-name title))]
            {:tx-meta tx-meta
             :tx-data txs
             :title title
             :page-uuid page-uuid}))))))

(defn create!
  [conn title opts]
  (let [{:keys [tx-meta tx-data title page-uuid]} (create @conn title opts)]
    (when (seq tx-data)
      (ldb/transact! conn tx-data tx-meta))
    [title page-uuid]))
