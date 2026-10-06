(ns logseq.outliner.validate
  "Reusable DB graph validations for outliner level and above. Most validations
  throw errors so the user action stops immediately to display a notification"
  (:require [clojure.set :as set]
            [clojure.string :as string]
            [datascript.core :as d]
            [logseq.common.config :as common-config]
            [logseq.common.date :as common-date]
            [logseq.common.util :as common-util]
            [logseq.common.util.namespace :as ns-util]
            [logseq.db :as ldb]
            [logseq.db.frontend.class :as db-class]
            [logseq.db.frontend.entity-util :as entity-util]
            [logseq.db.frontend.malli-schema :as db-malli-schema]
            [logseq.db.frontend.property :as db-property]))

(defn ^:api validate-page-title-no-hashtag
  "Validates a page title doesn't include hashtag character"
  [page-title meta-m]
  (when (string/includes? page-title "#")
    (throw (ex-info "Page name can't include \"#\"."
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't include \"#\"."
                                      :i18n-key :page.validation/name-no-hash
                                      :type :warning}})))))

(defn ^:api validate-page-title-characters
  "Validates characters that must not be in a page title"
  [page-title meta-m]
  (validate-page-title-no-hashtag page-title meta-m)
  (when (and (string/includes? page-title ns-util/parent-char)
             (not (common-date/normalize-date page-title nil)))
    (throw (ex-info "Page name can't include \"/\"."
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't include \"/\"."
                                      :i18n-key :page.validation/name-no-slash
                                      :type :warning}})))))

(defn ^:api validate-page-title
  [page-title meta-m]
  (when (string/blank? page-title)
    (throw (ex-info "Page name can't be blank"
                    (merge meta-m
                           {:type :notification
                            :payload {:message "Page name can't be blank."
                                      :i18n-key :page.validation/name-blank
                                      :type :warning}})))))

(defn- case-sensitive-title?
  "Properties and tags keep exact-title uniqueness. Ordinary pages match create
   via :block/name (page-name-sanity-lc)."
  [entity]
  (or (ldb/property? entity) (ldb/class? entity)))

(defn- find-other-ids-with-title-and-tags
  "Query that finds other ids given the id to ignore, title or lc name to look up, and tags to consider.
   Properties and tags match by exact :block/title; ordinary pages match by :block/name
   (page-name-sanity-lc, same as page creation). Entities with a parent are scoped to
   that parent; top-level pages only match other top-level pages (no parent, or the
   Library as parent: a namespace root's parent is the Library)."
  [entity library-id]
  (let [case-sensitive? (case-sensitive-title? entity)
        parent-id (:db/id (:block/parent entity))
        top-level? (or (nil? parent-id) (= parent-id library-id))]
    (vec
     (concat
      '[:find [?b ...]
        :in $ ?eid ?title [?tag-id ...]
        :where]
      [(vector '?b (if case-sensitive? :block/title :block/name) '?title)
       '[?b :block/tags ?tag-id]
       '[(not= ?b ?eid)]]
      (cond
        (ldb/property? entity)
        ;; Property names are unique in that they can
        ;; have the same names as built-in property names
        '[[(missing? $ ?b :logseq.property/built-in?)]]
        (not top-level?)
        ;; same parent
        '[[?b :block/parent ?bp]
          [?eid :block/parent ?ep]
          [(= ?bp ?ep)]]
        (not case-sensitive?)
        ;; another top-level page: no parent, or the Library
        [(list 'or
               '[(missing? $ ?b :block/parent)]
               ['?b :block/parent (or library-id -1)])])))))

(defn- throw-duplicate
  [title payload]
  (throw (ex-info title {:type :notification :payload payload})))

(defn- colliding-tag-ids
  "Shared tag idents of the first colliding entity. An entity is exempt when it
   shares the name under different tags e.g. Apple #Company and Apple #Fruit."
  [db entity lookup tags]
  (let [this-tags (set (map :db/ident tags))]
    (some (fn [another-id]
            (let [another-tags (set (map :db/ident (:block/tags (d/entity db another-id))))
                  common-tags (set/intersection this-tags another-tags)]
              (when-not (and (= common-tags #{:logseq.class/Page})
                             (> (count this-tags) 1)
                             (> (count another-tags) 1))
                common-tags)))
          (d/q (find-other-ids-with-title-and-tags
                entity
                (:db/id (ldb/get-built-in-page db common-config/library-page-name)))
               db
               (:db/id entity)
               lookup
               (map :db/id tags)))))

(defn- validate-unique-for-page
  [db new-title {:block/keys [tags] :as entity}]
  (when (seq tags)
    (let [lookup (if (case-sensitive-title? entity)
                   new-title
                   (common-util/page-name-sanity-lc new-title))
          common-tag-ids (colliding-tag-ids db entity lookup tags)]
      (when common-tag-ids
        (cond
          (ldb/property? entity)
          (throw-duplicate "Duplicate property"
                           {:message (str "Another property named " (pr-str new-title) " already exists.")
                            :i18n-key :property.validation/duplicate
                            :i18n-args [new-title]
                            :type :warning})

          (ldb/class? entity)
          (throw-duplicate "Duplicate class"
                           {:message (str "Another tag named " (pr-str new-title) " already exists.")
                            :i18n-key :class.validation/duplicate
                            :i18n-args [new-title]
                            :type :warning})

          (= common-tag-ids #{:logseq.class/Page})
          (throw-duplicate "Duplicate page"
                           {:message (str "Another page named " (pr-str new-title) " already exists.")
                            :i18n-key :page.validation/duplicate-name
                            :i18n-args [new-title]
                            :type :warning})

          :else
          (let [common-tags-str (string/join ", " (map (fn [id] (str "#" (:block/title (d/entity db id))))
                                                       common-tag-ids))]
            (throw-duplicate "Duplicate page"
                             {:message (str "Another page named " (pr-str new-title) " already exists for tags: " common-tags-str)
                              :i18n-key :page.validation/duplicate
                              :i18n-args [new-title common-tags-str]
                              :type :warning})))))))

(defn ^:api validate-unique-by-name-and-tags
  "Validates uniqueness of nodes for the following cases:
   - Ordinary page names are unique by :block/name (case-insensitive) for the same parent or among top-level pages
   - Page names are unique for a tag e.g. their can be Apple #Company and Apple #Fruit
   - Property names are unique with user properties being allowed to have the same name as built-in ones
   - Class names are unique regardless of their extends or if they're built-in"
  [db new-title entity]
  (when (entity-util/page? entity)
    (validate-unique-for-page db new-title entity)))

(defn ^:api validate-disallow-page-with-journal-name
  "Validates a non-journal page renamed to journal format"
  [new-title entity]
  (when (and (entity-util/page? entity) (not (entity-util/journal? entity))
             (common-date/normalize-date new-title nil))
    (throw (ex-info "Page can't be renamed to a journal"
                    {:type :notification
                     :payload {:message "This page can't be changed to a journal page"
                               :i18n-key :journal/page-cant-convert-warning
                               :type :warning}}))))

(defn validate-block-title
  "Validates a block title when it has changed for a entity-util/page? or tagged node"
  [db new-title existing-block-entity]
  (validate-unique-by-name-and-tags db new-title existing-block-entity)
  (validate-disallow-page-with-journal-name new-title existing-block-entity))

(defn validate-property-title
  "Validates a property's title when it has changed"
  ([new-title] (validate-property-title new-title {}))
  ([new-title meta-m]
   (when-not (db-property/valid-property-name? new-title)
     (throw (ex-info "Property name is invalid"
                     (merge meta-m
                            {:type :notification
                             :payload {:message "This is an invalid property name. A property name cannot start with page reference characters '#' or '[['."
                                       :i18n-key :property.validation/invalid-name
                                       :type :error}}))))))

(defn validate-editing-built-in-property
  "Validates if built-in property entity is editable for the given attributes to be updated"
  [entity attribute-map-to-update]
   ;; Update allowed as needed. Keep this as an allowed list to default to safe editing for built-in entities
  (let [allowed-attributes #{:logseq.property/hide-empty-value :logseq.property/description}]
    (when-let [disallowed (and (:logseq.property/built-in? entity)
                               (not-empty (set/difference (set (keys attribute-map-to-update))
                                                          allowed-attributes)))]
      (throw (ex-info "Given built-in property's attributes are not editable"
                      (merge
                       {:type :notification
                        :payload {:message "Can't change the given attributes for a built-in property"
                                  :type :error}}
                       {:property (:db/ident entity)
                        :disallowed-attributes disallowed}))))))

(defn- validate-extends-property-have-correct-type
  "Validates whether given parent and children are classes"
  [parent-ent child-ents]
  (when (or (not (ldb/class? parent-ent))
            (not (every? ldb/class? child-ents)))
    (throw (ex-info "Can't extend this page since either it is not a tag or is extending from a page that is not a tag"
                    {:type :notification
                     :payload {:message "Can't extend this page since either it is not a tag or is extending from a page that is not a tag"
                               :i18n-key :class.validation/invalid-extends-type
                               :type :error}
                     :blocks (map #(select-keys % [:db/id :block/title]) (remove ldb/class? child-ents))}))))

(defn- disallow-built-in-class-extends-change
  [_parent-ent child-ents]
  (when (some #(get db-class/built-in-classes (:db/ident %)) child-ents)
    (throw (ex-info "Can't change the extends of a built-in tag"
                    {:type :notification
                     :payload {:message "Can't change the extends of a built-in tag"
                               :i18n-key :class.validation/built-in-extends-change
                               :type :error}}))))

(defn- disallow-extends-cycle
  [db parent-ent child-ents]
  (doseq [child child-ents]
    (let [children-ids (set (cons (:db/id child)
                                  (db-class/get-structured-children db (:db/id child))))]
      (when (contains? children-ids (:db/id parent-ent))
        (throw (ex-info "Extends cycle"
                        {:type :notification
                         :payload {:message "Tag extends cycle"
                                   :i18n-key :class.validation/extends-cycle
                                   :type :error
                                   :blocks (map #(select-keys % [:db/id :block/title]) [child])}}))))))

(defn validate-extends-property
  [db parent-ent* child-ents & {:keys [built-in?] :or {built-in? true}}]
  (let [parent-ent (if (integer? parent-ent*)
                     (d/entity db parent-ent*)
                     parent-ent*)]
    (when built-in? (disallow-built-in-class-extends-change parent-ent child-ents))
    (disallow-extends-cycle db parent-ent child-ents)
    (validate-extends-property-have-correct-type parent-ent child-ents)))

(defn- disallow-node-cant-tag-with-built-in-non-tags
  [db _block-eids v]
  (let [tag-ent (d/entity db v)]
    (when (and (:logseq.property/built-in? tag-ent)
               (not (ldb/class? tag-ent)))
      (throw (ex-info (str "Can't set tag with built-in page that isn't a tag " (pr-str (:block/title tag-ent)))
                      {:type :notification
                       :payload {:message (str "Can't set tag with built-in page that isn't a tag " (pr-str (:block/title tag-ent)))
                                 :i18n-key :class.validation/tag-with-non-tag
                                 :i18n-args [(:block/title tag-ent)]
                                 :type :error}
                       :property-value v})))))

(defn- disallow-node-cant-tag-with-private-tags
  [db block-eids v & {:keys [delete?]}]
  ;; Skip #Page as it is validated by later fns
  (when (and (contains? (disj ldb/private-tags :logseq.class/Page) (:db/ident (d/entity db v)))
             (not
               ;; Allow assets to be tagged
              (and
               (every? (fn [id] (ldb/asset? (d/entity db id))) block-eids)
               (= :logseq.class/Asset (:db/ident (d/entity db v))))))
    (let [tag-title (:block/title (d/entity db v))]
      (throw (ex-info (str (if delete? "Can't remove tag" "Can't set tag")
                           " with built-in #" tag-title)
                      {:type :notification
                       :payload {:message (str (if delete? "Can't remove tag" "Can't set tag")
                                               " with built-in #" tag-title)
                                 :i18n-key (if delete? :class.validation/cant-remove-tag-built-in :class.validation/cant-set-tag-built-in)
                                 :i18n-args [tag-title]
                                 :type :error}
                       :property-id :block/tags
                       :property-value v})))))

(defn built-in-entity?
  "Returns true when the entity is a built-in. Ideally checking
  :logseq.property/built-in? would be enough but not all built-in nodes have
  that property. Covers:
  - entities marked with :logseq.property/built-in?  (built-in pages, classes, properties)
  - file entities  (logseq/config.edn, custom.css, etc.)
  - entities whose :db/ident belongs to an internal namespace  (KV entries, empty-placeholder)"
  [ent]
  (or (:logseq.property/built-in? ent)
      (:file/path ent)
      (some-> (:db/ident ent) db-malli-schema/internal-ident?)))

(defn- disallow-tagging-a-built-in-entity
  [db block-eids & {:keys [delete?]}]
  (when-let [built-in-ent (some #(when (built-in-entity? %) %)
                                (map #(d/entity db %) block-eids))]
    (throw (ex-info (str (if delete? "Can't remove tag" "Can't add tag")
                         " on built-in " (pr-str (:block/title built-in-ent)))
                    {:type :notification
                     :payload {:message (str (if delete? "Can't remove tag" "Can't add tag")
                                             " on built-in " (pr-str (:block/title built-in-ent)))
                               :i18n-key (if delete? :class.validation/cant-remove-tag-on-built-in :class.validation/cant-add-tag-on-built-in)
                               :i18n-args [(:block/title built-in-ent)]
                               :type :error}}))))

(defn- disallow-removing-page-tag
  "Disallow page->block when
  1. this page doesn't have :block/parent
  2. its parent is Library
  3. it has page child"
  [db eids v]
  (when (= (:db/ident (d/entity db v)) :logseq.class/Page)
    (let [library-page (ldb/get-library-page db)]
      (doseq [eid eids]
        (let [entity (d/entity db eid)]
          (when (ldb/internal-page? entity)
            (cond
              (not (:block/parent entity))
              (throw (ex-info "This page cannot be converted to a block"
                              {:type :notification
                               :payload
                               {:message (str "Page " (pr-str (:block/title entity)) " cannot be converted to a block")
                                :type :error
                                :i18n-key :page.convert/cant-be-block
                                :i18n-args [(:block/title entity)]
                                :entity (into {} entity)
                                :property :block/tags}}))
              (= (:db/id library-page) (:db/id (:block/parent entity)))
              (throw (ex-info "This page cannot be converted to a block"
                              {:type :notification
                               :payload
                               {:message (str "Page " (pr-str (:block/title entity)) " cannot be converted to a block, please move it to another page first")
                                :type :error
                                :i18n-key :page.convert/cant-be-block-move-first
                                :i18n-args [(:block/title entity)]
                                :entity (into {} entity)
                                :property :block/tags}}))
              (some entity-util/page? (:block/_parent entity))
              (throw (ex-info "This page cannot be converted to a block"
                              {:type :notification
                               :payload
                               {:message (str "Page " (pr-str (:block/title entity)) " cannot be converted to a block because it has page children")
                                :type :error
                                :i18n-key :page.convert/cant-be-block-has-children
                                :i18n-args [(:block/title entity)]
                                :entity (into {} entity)
                                :property :block/tags}})))))))))

(defn- validate-block-can-tag-with-page-tag
  "Validates block can convert to page by adding #Page for allowed scenarios"
  [db eids v]
  (when (= (:db/ident (d/entity db v)) :logseq.class/Page)
    (doseq [eid eids]
      (let [block (d/entity db eid)]
        (when (:block/parent block)
          (validate-page-title (:block/title block) {:node block})
          (validate-page-title-characters (:block/title block) {:node block})

          ;; Only allow block to be page when its parent is a page to guard against invalid pages
          ;; in property values or pages being created with blocks as namespace parents
          (when (or (not (entity-util/page? (:block/parent block)))
                    (:logseq.property/created-from-property block))
            (let [message (if (:logseq.property/created-from-property block)
                            "Can't convert property value to page."
                            "Can't convert this block to page since its parent is not a page.")
                  i18n-key (if (:logseq.property/created-from-property block)
                             :page.convert/property-value-to-page
                             :page.convert/block-parent-not-page)]
              (throw (ex-info message
                              {:type :notification
                               :payload {:message message
                                         :i18n-key i18n-key
                                         :type :error
                                         :block (into {} block)}})))))))))

(defn validate-tags-property
  "Validates adding a property value to :block/tags for given blocks"
  [db block-eids v]
  (disallow-tagging-a-built-in-entity db block-eids)
  (disallow-node-cant-tag-with-private-tags db block-eids v)
  (validate-block-can-tag-with-page-tag db block-eids v)
  (disallow-node-cant-tag-with-built-in-non-tags db block-eids v))

(defn validate-tags-property-deletion
  "Validates deleting a property value from :block/tags for given blocks"
  [db block-eids v]
  (disallow-tagging-a-built-in-entity db block-eids {:delete? true})
  (disallow-node-cant-tag-with-private-tags db block-eids v {:delete? true})
  (disallow-removing-page-tag db block-eids v))

(defn validate-page-to-property-conversion
  "Namespaced pages (pages with a parent, including Library-parented
   namespace roots) cannot become properties. Retracting #Page would
   otherwise be treated as page->block and drop :block/name."
  [page]
  (when (and (entity-util/internal-page? page)
             (:block/parent page))
    (throw (ex-info "Namespaced pages can't be properties"
                    {:type :notification
                     :payload {:message "Namespaced pages can't be properties"
                               :i18n-key :page.convert/page-to-property-namespaced
                               :type :error}}))))

(defn disallow-editing-private-built-in-nodes
  "Disallow editing private :built-in nodes. This explicit validation is needed for contexts
   like CLI and API which allow users to edit any built-in entity whereas the app guards this
   by not allowing users to navigate to private built-in nodes"
  [entities]
  (doseq [entity entities]
    (when (and (built-in-entity? entity)
               ;; This also checks private status of non-page ents like ents with :kv/value
               (ldb/private-built-in-page? entity))
      (throw (ex-info "Built-in private nodes can't be modified"
                      {:type :notification
                       :payload {:message "Built-in private nodes can't be modified"
                                 :type :error}})))))
