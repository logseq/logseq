(ns logseq.outliner.page
  "Page-related fns for DB graphs"
  (:require [clojure.string :as string]
            [datascript.core :as d]
            [datascript.impl.entity :as de]
            [logseq.common.config :as common-config]
            [logseq.common.util :as common-util]
            [logseq.common.util.date-time :as date-time-util]
            [logseq.common.util.namespace :as ns-util]
            [logseq.common.uuid :as common-uuid]
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
                          (= (date-time-util/ms->journal-day (js/Date.)) day))
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

(defn- throw-private-create-page-tag
  [tag-title]
  (throw (ex-info (str "New page can't set built-in tags: " (pr-str tag-title))
                  {:type :notification
                   :payload {:message (str "New page can't set built-in tags: " (pr-str tag-title))
                             :i18n-key :page.validation/cant-set-built-in-tags
                             :i18n-args [(pr-str tag-title)]
                             :type :error}})))

(defn- disallowed-private-create-page-tag?
  "Private tags cannot be applied to a new page. #Page is allowed because new
  pages already have it as their type tag."
  [ent]
  (contains? (disj ldb/private-tags :logseq.class/Page) (:db/ident ent)))

(defn- existing-class-for-title
  [db title]
  (when (string? title)
    (some->> (ldb/page-exists? db title #{:logseq.class/Tag})
             first
             (d/entity db))))

(defn- resolve-create-page-tag
  "Resolve a tag passed to page create.

  Ctrl-K `Foo #Tag` parses the tag without a db, so the tag map has a new uuid
  and no :db/ident. Creating a user class from that map would duplicate the
  built-in Tag class and fail graph validation. Look up an existing class by
  uuid or ident first; fall back to title only when ident is missing; reject
  private built-in tags; reuse public classes."
  [db tag]
  (let [v (cond
            (uuid? tag) (d/entity db [:block/uuid tag])
            (keyword? tag) (d/entity db tag)
            :else tag)]
    (cond
      (de/entity? v)
      (do
        (when (disallowed-private-create-page-tag? v)
          (throw-private-create-page-tag (:block/title v)))
        (:db/id v))

      (map? v)
      (let [by-uuid (when (:block/uuid v)
                      (d/entity db [:block/uuid (:block/uuid v)]))
            by-ident (when-let [ident (:db/ident v)]
                       (d/entity db ident))
            existing (or by-uuid
                         by-ident
                         (when (nil? (:db/ident v))
                           (existing-class-for-title db (:block/title v))))]
        (cond
          existing
          (do
            (when (disallowed-private-create-page-tag? existing)
              (throw-private-create-page-tag (:block/title existing)))
            (if by-uuid v (:db/id existing)))

          :else
          ;; Parsed tags from a db-less frontend parse can carry file-graph
          ;; :block/type, which is invalid on a class page.
          (db-class/build-new-class db (dissoc v :block/type))))

      :else
      v)))

(defn- resolved-tag-ident
  [db tag]
  (cond
    (keyword? tag)
    tag

    (integer? tag)
    (:db/ident (d/entity db tag))

    (map? tag)
    (or (:db/ident tag)
        (:db/ident (d/entity db (:db/id tag)))
        (when-let [block-uuid (:block/uuid tag)]
          (:db/ident (d/entity db [:block/uuid block-uuid]))))

    :else
    nil))

(defn- resolve-create-page-tags
  [db tags]
  (let [normalized-tags (cond
                          (nil? tags) []
                          (and (seq tags) (every? uuid? tags))
                          (mapv (fn [id] (d/entity db [:block/uuid id])) tags)
                          :else (vec tags))]
    (mapv #(resolve-create-page-tag db %) normalized-tags)))

(defn- build-page-tx [db properties page {:keys [class? tags class-ident-namespace]}]
  (when (:block/uuid page)
    (let [type-tag (if class? :logseq.class/Tag :logseq.class/Page)
          tags' (if (:block/journal-day page)
                  (or tags [])
                  (conj (vec (or tags [])) type-tag))
          page' (update page :block/tags
                        (fnil into [])
                        tags')
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
  (let [title (-> (string/trim title)
                  (text/page-ref-un-brackets!))
        title (common-util/remove-boundary-slashes title)]
    title))

(defn- get-page-by-parent
  [db parent title]
  (when-let [parent-id (if parent (:db/id parent) (:db/id (ldb/get-library-page db)))]
    (some->>
     (d/q (into '[:find [?b ...] :in $ ?parent ?name :where]
                (if parent
                  '[[?b :block/parent ?parent]
                    [?b :block/name ?name]
                    [?b :block/tags :logseq.class/Page]]
                  '[[?b :block/name ?name]
                    [?b :block/tags :logseq.class/Page]
                    (or-join [?b ?parent]
                             (not [?b :block/parent])
                             [?b :block/parent ?parent])]))
          db parent-id (common-util/page-name-sanity-lc title))
     sort
     first
     (d/entity db))))

(defn- page-with-parent-and-order
  "Apply to namespace pages"
  [db page & {:keys [parent]}]
  (let [library (ldb/get-built-in-page db common-config/library-page-name)]
    (when (nil? library)
      (throw (ex-info "Library page doesn't exist" {})))
    (assoc page
           :block/parent (or parent (:db/id library))
           :block/order (db-order/gen-key))))

(defn- split-namespace-pages
  [db page date-formatter class?]
  (let [{:block/keys [title] block-uuid :block/uuid} page]
    (if (and (or (entity-util/class? page) (entity-util/page? page))
             (ns-util/namespace-page? title))
      (let [parts (->> (string/split title ns-util/parent-re)
                       (map string/trim)
                       (remove string/blank?)
                       vec)]
        (:pages
         (reduce
          (fn [{:keys [pages classes]} part]
            (let [part-name (common-util/page-name-sanity-lc part)
                  existing (if class?
                             (or (ldb/get-page-by-name db part #{:logseq.class/Tag})
                                 (get classes part-name))
                             (get-page-by-parent db (peek pages) part))
                  result (or existing
                             (let [parent-ref (some->> (peek pages) :block/uuid (vector :block/uuid))
                                   node (gp-block/page-name->map
                                         part db true date-formatter
                                         {:page-uuid (when (= (count pages) (dec (count parts))) block-uuid)
                                          :skip-existing-page-check? true
                                          :class? class?})]
                               (if class?
                                 (db-class/build-new-class
                                  db (cond-> node parent-ref (assoc :logseq.property.class/extends parent-ref)))
                                 (page-with-parent-and-order db node {:parent parent-ref}))))]
              {:pages (conj pages result)
               :classes (if class? (assoc classes part-name result) classes)}))
          {:pages [] :classes {}} parts)))
      [page])))

(defn ^:large-vars/cleanup-todo ^:api create
  "Pure function without side effects"
  [db title*
   {uuid' :uuid
    :keys [tags properties persist-op?
           class? journal? today-journal? split-namespace? class-ident-namespace
           encrypted-title? encrypted-name]
    :or   {properties               nil
           persist-op?              true}
    :as options}]
  (let [date-formatter (:logseq.property.journal/title-format (entity-plus/entity-memoized db :logseq.class/Journal))
        resolved-tags (resolve-create-page-tags db tags)
        class? (or class? (some (fn [t] (= :logseq.class/Tag (resolved-tag-ident db t))) resolved-tags))
        class-ident-namespace? (and class? class-ident-namespace (string? class-ident-namespace))
        title (if encrypted-title? title* (sanitize-title title*))
        _ (when-not encrypted-title?
            (outliner-validate/validate-page-title-no-hashtag title {:node {:block/title title}}))
        types (cond class?
                    #{:logseq.class/Tag}
                    (or journal? today-journal?)
                    #{:logseq.class/Journal}
                    (seq resolved-tags)
                    (set (keep #(resolved-tag-ident db %) resolved-tags))
                    :else
                    #{:logseq.class/Page})
        existing-names-page (filter (fn [eid]
                                      (let [entity (d/entity db eid)]
                                        (cond
                                          class? (ldb/class? entity)
                                          (or journal? today-journal?) (ldb/journal? entity)
                                          :else (and (ldb/internal-page? entity)
                                                     (not (or (ldb/class? entity) (ldb/property? entity)))
                                                     (or (nil? (:block/parent entity))
                                                         (ldb/library? (:block/parent entity))
                                                         (ldb/recycled? entity))))))
                                    (ldb/page-exists? db title types))
        journal-page-uuid (when-not class?
                           (:block/uuid (gp-block/page-name->map title db false date-formatter
                                                               {:skip-existing-page-check? true})))
        existing-page-by-journal-uuid (when (uuid? journal-page-uuid)
                                        (d/entity db [:block/uuid journal-page-uuid]))
        existing-page-id (or (when class-ident-namespace?
                              (some->> existing-names-page
                                       (filter #(= class-ident-namespace
                                                    (some-> (d/entity db %) :db/ident namespace)))
                                       sort
                                       first))
                            (some #(when (= title (:block/title (d/entity db %))) %) existing-names-page)
                            (first (sort existing-names-page)))
        existing-page (or (some->> existing-page-id (d/entity db))
                          existing-page-by-journal-uuid)]
    (if (and existing-page
             (or class?
                 (:block/journal-day existing-page)
                 (not (:block/parent existing-page))
                 (ldb/library? (:block/parent existing-page))
                 (ldb/recycled? existing-page)))
      (if (ldb/recycled? existing-page)
        (let [options' (assoc options :uuid (:block/uuid existing-page))
              tx-meta (outliner-tx-meta/ensure-outliner-ops
                       {:persist-op? persist-op?
                        :outliner-op :create-page}
                       [:create-page [title options']])]
          {:tx-meta tx-meta
           :tx-data (outliner-recycle/restore-tx-data db existing-page)
           :page-uuid (:block/uuid existing-page)
           :title (:block/title existing-page)})
        {:page-uuid (:block/uuid existing-page)
         :title (:block/title existing-page)})
      (let [page (cond-> (gp-block/page-name->map title db true date-formatter
                                                {:class? class?
                                                 :page-uuid (when (uuid? uuid') uuid')
                                                 :skip-existing-page-check? true})
                   encrypted-title? (assoc :block/name encrypted-name))
            [page parents'] (if (and (not (:block/journal-day page))
                                     (not encrypted-title?)
                                     (text/namespace-page? title)
                                     split-namespace?)
                              (let [pages (split-namespace-pages db page date-formatter class?)]
                                [(last pages) (butlast pages)])
                              [page nil])]
        (when (and page (or (nil? (:db/ident page))
                            ;; New page creation must not override built-in entities
                            (not (db-malli-schema/internal-ident? (:db/ident page)))))
          ;; Don't validate journal names because they can have '/', nor
          ;; encrypted titles which are opaque ciphertext packages
          (when-not (or encrypted-title?
                        (contains? types :logseq.class/Journal)
                        (contains? (set (:block/tags page)) :logseq.class/Journal))
            (outliner-validate/validate-page-title-characters (str (:block/title page)) {:node page})
            (doseq [parent parents']
              (outliner-validate/validate-page-title-characters (str (:block/title parent)) {:node parent})))

          (let [page-uuid (if-let [journal-day (:block/journal-day page)]
                            (common-uuid/gen-uuid :journal-page-uuid journal-day)
                            (:block/uuid page))
                page (assoc page :block/uuid page-uuid)
                page-txs (build-page-tx db properties page
                                        {:class? class?
                                         :tags resolved-tags
                                         :class-ident-namespace class-ident-namespace})
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
