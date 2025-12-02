(ns logseq.outliner.page
  "Page-related fns for DB graphs"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db :as ldb]
            [logseq.db.common.entity-plus :as entity-plus]
            [logseq.db.common.order :as db-order]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.content :as db-content]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]
            [logseq.db.frontend.property.build :as db-property-build]
            [logseq.graph-parser.block :as gp-block]
            [logseq.graph-parser.text :as text]
            [logseq.outliner.validate :as outliner-validate]))

(defn- db-refs->page
  "Replace [[page name]] with page name"
  [page-entity]
  (let [refs (:block/_refs page-entity)
        id-ref->page #(db-content/content-id-ref->page % [page-entity])]
    (when (seq refs)
      (let [tx-data (mapcat (fn [{:block/keys [raw-title] :as ref}]
                              ;; block content
                              (when raw-title
                                (let [content' (id-ref->page raw-title)
                                      content-tx (when (not= raw-title content')
                                                   {:db/id (:db/id ref)
                                                    :block/title content'})
                                      tx content-tx]
                                  (concat
                                   [[:db/retract (:db/id ref) :block/refs (:db/id page-entity)]]
                                   (when tx [tx]))))) refs)]
        tx-data))))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [conn page-uuid & {:keys [persist-op? rename? error-handler]
                     :or {persist-op? true
                          error-handler (fn [{:keys [msg]}] (js/console.error msg))}}]
  (assert (uuid? page-uuid) (str ::delete! " wrong page-uuid: " (if page-uuid page-uuid "nil")))
  (when page-uuid
    (when-let [page (d/entity @conn [:block/uuid page-uuid])]
      (let [blocks (:block/_page page)
            truncate-blocks-tx-data (mapv
                                     (fn [block]
                                       [:db.fn/retractEntity [:block/uuid (:block/uuid block)]])
                                     blocks)]
        ;; TODO: maybe we should add $$$favorites to built-in pages?
        (if (or (ldb/built-in? page) (ldb/hidden? page))
          (do
            (error-handler {:msg "Built-in page cannot be deleted"})
            false)
          (let [delete-property-tx (when (ldb/property? page)
                                     (concat
                                      (let [datoms (d/datoms @conn :avet (:db/ident page))]
                                        (map (fn [d] [:db/retract (:e d) (:a d)]) datoms))
                                      (map (fn [d] [:db/retractEntity (:e d)])
                                           (d/datoms @conn :avet :logseq.property.history/property (:db/ident page)))))
                delete-page-tx (concat (db-refs->page page)
                                       delete-property-tx
                                       [[:db.fn/retractEntity (:db/id page)]])
                restore-class-parent-tx (->> (filter ldb/class? (:logseq.property.class/_extends page))
                                             (map (fn [p]
                                                    {:db/id (:db/id p)
                                                     :logseq.property.class/extends :logseq.class/Root})))
                tx-data (concat truncate-blocks-tx-data
                                restore-class-parent-tx
                                delete-page-tx)]

            (ldb/transact! conn tx-data
                           (cond-> {:outliner-op :delete-page
                                    :deleted-page (str (:block/uuid page))
                                    :persist-op? persist-op?}
                             rename?
                             (assoc :real-outliner-op :rename-page)))
            true))))))

(defn- build-page-tx [db properties page {:keys [whiteboard? class? tags class-ident-namespace]}]
  (when (:block/uuid page)
    (let [type-tag (cond class? :logseq.class/Tag
                         whiteboard? :logseq.class/Whiteboard
                         :else :logseq.class/Page)
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
          (db-property-build/build-property-values-tx-m
           page'
           (->> properties
                (keep (fn [[k v]]
                        ;; TODO: Pass in property type in order to support property
                        ;; types other than :default
                        (when (db-property/built-in-has-ref-value? k)
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
                     (db-property-build/build-properties-with-ref-values property-vals-tx-m)))))))

;; TODO: Revisit title cleanup as this was copied from file implementation
(defn ^:api sanitize-title
  [title]
  (let [title      (-> (string/trim title)
                       (text/page-ref-un-brackets!)
                        ;; remove `#` from tags
                       (string/replace #"^#+" ""))
        title      (common-util/remove-boundary-slashes title)]
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
    (common-util/page-name-sanity-lc parent-title)
    (common-util/page-name-sanity-lc child-title))
   first
   (d/entity db)))

(defn- page-with-parent-and-order
  "Apply to namespace pages"
  [db page & {:keys [parent]}]
  (let [library (ldb/get-built-in-page db common-config/library-page-name)]
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
              (ns-util/namespace-page? title))
       (let [class? (entity-util/class? page)
             parts (->> (string/split title ns-util/parent-re)
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
                            :payload {:message "Cannot create this page unless all parents are pages"
                                      :type :warning}}))

           (and class? (not (every? ldb/class? pages)))
           (throw (ex-info "Cannot create this tag unless all parents are tags"
                           {:type :notification
                            :payload {:message "Cannot create this tag unless all parents are tags"
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
    :keys [tags properties persist-op? whiteboard?
           class? today-journal? split-namespace? class-ident-namespace]
    :or   {properties               nil
           persist-op?              true}
    :as options}]
  (let [date-formatter (:logseq.property.journal/title-format (entity-plus/entity-memoized db :logseq.class/Journal))
        tags (if (every? uuid? tags)
               (map (fn [id] (d/entity db [:block/uuid id])) tags)
               tags)
        class? (or class? (some (fn [t] (= :logseq.class/Tag (:db/ident t))) tags))
        title (sanitize-title title*)
        types (cond class?
                    #{:logseq.class/Tag}
                    whiteboard?
                    #{:logseq.class/Whiteboard}
                    today-journal?
                    #{:logseq.class/Journal}
                    (seq tags)
                    (set (map :db/ident tags))
                    :else
                    #{:logseq.class/Page})
        existing-page-id (first (ldb/page-exists? db title types))
        existing-page (some->> existing-page-id (d/entity db))]
    (if (and existing-page (not (:block/parent existing-page)))
      (let [tx-meta {:persist-op? persist-op?
                     :outliner-op :save-block}]
        (when (and class?
                   (not (ldb/class? existing-page))
                   (ldb/internal-page? existing-page))
          ;; Convert existing page to class
          (let [tx-data [(merge (db-class/build-new-class db
                                                          (select-keys existing-page [:block/title :block/uuid :block/created-at])
                                                          (when (and class? class-ident-namespace (string? class-ident-namespace))
                                                            {:ident-namespace class-ident-namespace}))
                                (select-keys existing-page [:db/ident]))
                         [:db/retract [:block/uuid (:block/uuid existing-page)] :block/tags :logseq.class/Page]]]
            {:tx-meta tx-meta
             :tx-data tx-data
             :page-uuid (:block/uuid existing-page)
             :title (:block/title existing-page)})))
      (let [page           (gp-block/page-name->map title db true date-formatter
                                                    {:class? class?
                                                     :page-uuid (when (uuid? uuid') uuid')
                                                     :skip-existing-page-check? true})
            [page parents'] (if (and (text/namespace-page? title) split-namespace?)
                              (let [pages (split-namespace-pages db page date-formatter class?)]
                                [(last pages) (butlast pages)])
                              [page nil])]
        (when (and page (or (nil? (:db/ident page))
                            ;; New page creation must not override built-in entities
                            (not (db-malli-schema/internal-ident? (:db/ident page)))))
          ;; Don't validate journal names because they can have '/'
          (when-not (or (contains? types :logseq.class/Journal)
                        (contains? (set (:block/tags page)) :logseq.class/Journal))
            (outliner-validate/validate-page-title-characters (str (:block/title page)) {:node page})
            (doseq [parent parents']
              (outliner-validate/validate-page-title-characters (str (:block/title parent)) {:node parent})))

          (let [page-uuid (:block/uuid page)
                page-txs  (build-page-tx db properties page (select-keys options [:whiteboard? :class? :tags :class-ident-namespace]))
                txs      (concat
                          ;; transact doesn't support entities
                          (remove de/entity? parents')
                          page-txs)
                tx-meta (cond-> {:persist-op? persist-op?
                                 :outliner-op :create-page}
                          today-journal?
                          (assoc :create-today-journal? true
                                 :today-journal-name title))]
            {:tx-meta tx-meta
             :tx-data txs
             :title title
             :page-uuid page-uuid}))))))

(defn create!
  [conn title opts]
  (let [{:keys [tx-meta tx-data title' page-uuid]} (create @conn title opts)]
    (when (seq tx-data)
      (ldb/transact! conn tx-data tx-meta)
      [title' page-uuid])))
